/**
 * Local skills adapter. CRUD for skill definitions and tool linking.
 * Uses localStorage for persistence; seed data as initial defaults.
 */

import { seedSkillDefinitions, seedSkillToolLinks } from '../../mock/seedData';
import { toolsAdapter } from './tools.adapter';
import type { SkillDefinition, SkillToolLink } from '../../shared/types';

const SKILLS_KEY = 'musaed_skill_definitions';
const LINKS_KEY = 'musaed_skill_tool_links';

function saveSkills(items: SkillDefinition[]): void {
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(items));
  } catch {
    // Quota or private mode
  }
}

function saveLinks(items: SkillToolLink[]): void {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(items));
  } catch {
    // Quota or private mode
  }
}

function loadSkills(): SkillDefinition[] {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    if (!raw) {
      saveSkills([...seedSkillDefinitions]);
      return [...seedSkillDefinitions];
    }
    const parsed = JSON.parse(raw) as SkillDefinition[];
    return Array.isArray(parsed) ? parsed : [...seedSkillDefinitions];
  } catch {
    return [...seedSkillDefinitions];
  }
}

function loadLinks(): SkillToolLink[] {
  try {
    const raw = localStorage.getItem(LINKS_KEY);
    if (!raw) {
      saveLinks([...seedSkillToolLinks]);
      return [...seedSkillToolLinks];
    }
    const parsed = JSON.parse(raw) as SkillToolLink[];
    return Array.isArray(parsed) ? parsed : [...seedSkillToolLinks];
  } catch {
    return [...seedSkillToolLinks];
  }
}

export interface SkillListFilters {
  category?: SkillDefinition['category'];
  scope?: 'platform' | 'tenant';
  tenantId?: string;
}

export const skillsAdapter = {
  /** List skill definitions with optional filters. */
  list(filters?: SkillListFilters): SkillDefinition[] {
    let items = loadSkills();
    if (filters?.category) items = items.filter((s) => s.category === filters.category);
    if (filters?.scope) items = items.filter((s) => s.scope === filters.scope);
    if (filters?.tenantId) items = items.filter((s) => s.tenantId === filters.tenantId);
    return items;
  },

  /** Get a single skill by ID. */
  get(id: string): SkillDefinition | null {
    return loadSkills().find((s) => s.id === id) ?? null;
  },

  /** Create a new skill definition. */
  create(data: Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'>): SkillDefinition {
    const items = loadSkills();
    const now = new Date().toISOString();
    const newSkill: SkillDefinition = {
      ...data,
      id: `sdef_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    items.push(newSkill);
    saveSkills(items);
    return newSkill;
  },

  /** Update an existing skill. */
  update(id: string, patch: Partial<Omit<SkillDefinition, 'id' | 'createdAt'>>): SkillDefinition | null {
    const items = loadSkills();
    const idx = items.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    saveSkills(items);
    return updated;
  },

  /** Toggle isActive. */
  toggleActive(id: string): SkillDefinition | null {
    const skill = this.get(id);
    if (!skill) return null;
    return this.update(id, { isActive: !skill.isActive });
  },

  /** Delete a skill (and its tool links). */
  delete(id: string): boolean {
    const skills = loadSkills().filter((s) => s.id !== id);
    if (skills.length === loadSkills().length) return false;
    saveSkills(skills);
    const links = loadLinks().filter((l) => l.skillId !== id);
    saveLinks(links);
    return true;
  },

  /** Get tools linked to a skill. */
  getLinkedTools(skillId: string): Array<{ link: SkillToolLink; tool: import('../../shared/types').ToolDefinition | null }> {
    const links = loadLinks().filter((l) => l.skillId === skillId);
    return links.map((link) => ({
      link,
      tool: toolsAdapter.get(link.toolId),
    }));
  },

  /** Link a tool to a skill. */
  linkTool(skillId: string, toolId: string, options?: { nodeReference?: string; isRequired?: boolean }): SkillToolLink | null {
    const skill = this.get(skillId);
    const tool = toolsAdapter.get(toolId);
    if (!skill || !tool) return null;
    const links = loadLinks();
    if (links.some((l) => l.skillId === skillId && l.toolId === toolId)) return links.find((l) => l.skillId === skillId && l.toolId === toolId) ?? null;
    const newLink: SkillToolLink = {
      id: `stl_${Date.now()}`,
      skillId,
      toolId,
      nodeReference: options?.nodeReference,
      isRequired: options?.isRequired ?? true,
      createdAt: new Date().toISOString(),
    };
    links.push(newLink);
    saveLinks(links);
    return newLink;
  },

  /** Unlink a tool from a skill. */
  unlinkTool(skillId: string, toolId: string): boolean {
    const links = loadLinks().filter((l) => !(l.skillId === skillId && l.toolId === toolId));
    if (links.length === loadLinks().length) return false;
    saveLinks(links);
    return true;
  },
};

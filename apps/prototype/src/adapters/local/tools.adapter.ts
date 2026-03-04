/**
 * Local tools adapter. CRUD for tool definitions.
 * Uses localStorage for persistence; seed data as initial defaults.
 */

import { seedToolDefinitions } from '../../mock/seedData';
import type { ToolDefinition } from '../../shared/types';

const STORAGE_KEY = 'musaed_tool_definitions';

function saveToStorage(items: ToolDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota or private mode
  }
}

function loadFromStorage(): ToolDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveToStorage([...seedToolDefinitions]);
      return [...seedToolDefinitions];
    }
    const parsed = JSON.parse(raw) as ToolDefinition[];
    return Array.isArray(parsed) ? parsed : [...seedToolDefinitions];
  } catch {
    return [...seedToolDefinitions];
  }
}

export interface ToolListFilters {
  category?: ToolDefinition['category'];
  executionType?: 'internal' | 'external';
  scope?: 'platform' | 'tenant';
  tenantId?: string;
}

export const toolsAdapter = {
  /** List tool definitions with optional filters. */
  list(filters?: ToolListFilters): ToolDefinition[] {
    let items = loadFromStorage();
    if (filters?.category) items = items.filter((t) => t.category === filters.category);
    if (filters?.executionType) items = items.filter((t) => t.executionType === filters.executionType);
    if (filters?.scope) items = items.filter((t) => t.scope === filters.scope);
    if (filters?.tenantId) items = items.filter((t) => t.tenantId === filters.tenantId);
    return items;
  },

  /** Get a single tool by ID. */
  get(id: string): ToolDefinition | null {
    return loadFromStorage().find((t) => t.id === id) ?? null;
  },

  /** Create a new tool definition. */
  create(data: Omit<ToolDefinition, 'id' | 'createdAt' | 'updatedAt'>): ToolDefinition {
    const items = loadFromStorage();
    const now = new Date().toISOString();
    const newTool: ToolDefinition = {
      ...data,
      id: `td_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    items.push(newTool);
    saveToStorage(items);
    return newTool;
  },

  /** Update an existing tool. */
  update(id: string, patch: Partial<Omit<ToolDefinition, 'id' | 'createdAt'>>): ToolDefinition | null {
    const items = loadFromStorage();
    const idx = items.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    saveToStorage(items);
    return updated;
  },

  /** Toggle isActive. */
  toggleActive(id: string): ToolDefinition | null {
    const tool = this.get(id);
    if (!tool) return null;
    return this.update(id, { isActive: !tool.isActive });
  },

  /** Delete a tool (soft: set isActive = false, or hard remove). */
  delete(id: string): boolean {
    const items = loadFromStorage().filter((t) => t.id !== id);
    if (items.length === loadFromStorage().length) return false;
    saveToStorage(items);
    return true;
  },
};

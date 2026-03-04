/**
 * Admin Skills Catalog page. Two-tab layout: Skills and Tools.
 */

import { useState, useMemo, useRef, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Wrench, Plus, Download, Upload } from 'lucide-react';
import { PageHeader, Card, CardBody, Button } from '../../../shared/ui';
import { useAdminSkills } from '../hooks/useAdminSkills';
import { useAdminTools } from '../hooks/useAdminTools';
import { SkillsTable } from '../components/skills/SkillsTable';
import { ToolsTable } from '../components/tools/ToolsTable';
import { SkillDetailDrawer } from '../components/skills/SkillDetailDrawer';
import { ToolDetailDrawer } from '../components/tools/ToolDetailDrawer';
import { CreateSkillModal } from '../components/skills/CreateSkillModal';
import { EditSkillModal } from '../components/skills/EditSkillModal';
import { CreateToolModal } from '../components/tools/CreateToolModal';
import { EditToolModal } from '../components/tools/EditToolModal';
import type { SkillDefinition, ToolDefinition } from '../../../shared/types';
import { cn } from '@/lib/utils';

type Tab = 'skills' | 'tools';

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateSkillDefinition(data: unknown): data is Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.displayName === 'string' &&
    typeof o.category === 'string' &&
    typeof o.flowDefinition === 'object' &&
    o.flowDefinition !== null &&
    typeof o.scope === 'string' &&
    typeof o.isActive === 'boolean' &&
    typeof o.version === 'number'
  );
}

function validateToolDefinition(data: unknown): data is Omit<ToolDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.displayName === 'string' &&
    typeof o.category === 'string' &&
    typeof o.executionType === 'string' &&
    typeof o.parametersSchema === 'object' &&
    o.parametersSchema !== null &&
    typeof o.timeoutMs === 'number' &&
    typeof o.retryOnFail === 'boolean' &&
    typeof o.scope === 'string' &&
    typeof o.isActive === 'boolean' &&
    typeof o.version === 'number'
  );
}

export function AdminSkillsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('skills');
  const skillsHook = useAdminSkills();
  const toolsHook = useAdminTools();

  const [viewSkill, setViewSkill] = useState<SkillDefinition | null>(null);
  const [editSkill, setEditSkill] = useState<SkillDefinition | null>(null);
  const [viewTool, setViewTool] = useState<ToolDefinition | null>(null);
  const [editTool, setEditTool] = useState<ToolDefinition | null>(null);
  const [createSkillOpen, setCreateSkillOpen] = useState(false);
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const importSkillRef = useRef<HTMLInputElement>(null);
  const importToolRef = useRef<HTMLInputElement>(null);

  const toolsCountBySkillId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of skillsHook.skills) {
      counts[s.id] = skillsHook.getLinkedTools(s.id).length;
    }
    return counts;
  }, [skillsHook.skills, skillsHook.getLinkedTools]);

  const handleExportSkills = () => {
    downloadJson(skillsHook.skills, `skills-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportTools = () => {
    downloadJson(toolsHook.tools, `tools-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImportSkills = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        let created = 0;
        for (const item of arr) {
          if (validateSkillDefinition(item)) {
            skillsHook.createSkill(item);
            created++;
          }
        }
        if (created > 0) skillsHook.refetch();
        alert(created > 0 ? `Imported ${created} skill(s).` : 'No valid skills found in file.');
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportTools = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        let created = 0;
        for (const item of arr) {
          if (validateToolDefinition(item)) {
            toolsHook.createTool(item);
            created++;
          }
        }
        if (created > 0) toolsHook.refetch();
        alert(created > 0 ? `Imported ${created} tool(s).` : 'No valid tools found in file.');
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const linkedToolsForView = useMemo(() => {
    if (!viewSkill) return [];
    return skillsHook.getLinkedTools(viewSkill.id);
  }, [viewSkill, skillsHook.skills]);

  const handleTabsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs: Tab[] = ['skills', 'tools'];
    const idx = tabs.indexOf(activeTab);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    setActiveTab(tabs[next]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Catalog"
        description="Manage skill definitions and tool definitions. Browse, create, edit, and link skills to tools."
      />

      <div
        role="tablist"
        aria-label="Skills catalog sections"
        onKeyDown={handleTabsKeyDown}
        className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'skills'}
          aria-controls="skills-panel"
          tabIndex={activeTab === 'skills' ? 0 : -1}
          onClick={() => setActiveTab('skills')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
            activeTab === 'skills'
              ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60'
          )}
        >
          <Zap size={16} aria-hidden className="shrink-0" />
          Skills
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'tools'}
          aria-controls="tools-panel"
          tabIndex={activeTab === 'tools' ? 0 : -1}
          onClick={() => setActiveTab('tools')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
            activeTab === 'tools'
              ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60'
          )}
        >
          <Wrench size={16} aria-hidden className="shrink-0" />
          Tools
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'skills' && (
          <motion.div
            key="skills"
            id="skills-panel"
            role="tabpanel"
            aria-labelledby="skills-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => setCreateSkillOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" aria-hidden />
                      Create Skill
                    </Button>
                    <Button variant="outline" onClick={handleExportSkills}>
                      <Download className="w-4 h-4 mr-1.5" aria-hidden />
                      Export
                    </Button>
                    <input
                      ref={importSkillRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportSkills}
                    />
                    <Button variant="outline" onClick={() => importSkillRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1.5" aria-hidden />
                      Import
                    </Button>
                  </div>
                </div>
                <SkillsTable
                  skills={skillsHook.skills}
                  toolsCountBySkillId={toolsCountBySkillId}
                  onView={setViewSkill}
                  onEdit={setEditSkill}
                />
              </CardBody>
            </Card>
          </motion.div>
        )}
        {activeTab === 'tools' && (
          <motion.div
            key="tools"
            id="tools-panel"
            role="tabpanel"
            aria-labelledby="tools-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => setCreateToolOpen(true)}>
                      <Plus className="w-4 h-4 mr-1.5" aria-hidden />
                      Create Tool
                    </Button>
                    <Button variant="outline" onClick={handleExportTools}>
                      <Download className="w-4 h-4 mr-1.5" aria-hidden />
                      Export
                    </Button>
                    <input
                      ref={importToolRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportTools}
                    />
                    <Button variant="outline" onClick={() => importToolRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1.5" aria-hidden />
                      Import
                    </Button>
                  </div>
                </div>
                <ToolsTable
                  tools={toolsHook.tools}
                  onView={setViewTool}
                  onEdit={setEditTool}
                />
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <SkillDetailDrawer
        skill={viewSkill}
        linkedTools={linkedToolsForView}
        open={!!viewSkill}
        onClose={() => setViewSkill(null)}
        onUnlink={skillsHook.unlinkTool}
      />
      <ToolDetailDrawer tool={viewTool} open={!!viewTool} onClose={() => setViewTool(null)} />

      <CreateSkillModal
        open={createSkillOpen}
        onClose={() => setCreateSkillOpen(false)}
        onSubmit={(data) => {
          skillsHook.createSkill(data);
          setCreateSkillOpen(false);
        }}
      />
      <EditSkillModal
        skill={editSkill}
        open={!!editSkill}
        onClose={() => setEditSkill(null)}
        onSubmit={(id, patch) => {
          skillsHook.updateSkill(id, patch);
          setEditSkill(null);
        }}
      />
      <CreateToolModal
        open={createToolOpen}
        onClose={() => setCreateToolOpen(false)}
        onSubmit={(data) => {
          toolsHook.createTool(data);
          setCreateToolOpen(false);
        }}
      />
      <EditToolModal
        tool={editTool}
        open={!!editTool}
        onClose={() => setEditTool(null)}
        onSubmit={(id, patch) => {
          toolsHook.updateTool(id, patch);
          setEditTool(null);
        }}
      />
    </div>
  );
}

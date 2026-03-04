/**
 * Skill detail drawer. Metadata, flow definition JSON viewer, linked tools.
 */

import { Drawer, DrawerHeader, Button, PillTag } from '../../../../shared/ui';
import { Unlink } from 'lucide-react';
import type { SkillDefinition } from '../../../../shared/types';

interface LinkedToolRow {
  link: { id: string; toolId: string; isRequired: boolean; nodeReference?: string };
  tool: { displayName: string; name: string } | null;
}

interface SkillDetailDrawerProps {
  skill: SkillDefinition | null;
  linkedTools: LinkedToolRow[];
  open: boolean;
  onClose: () => void;
  onUnlink: (skillId: string, toolId: string) => void;
}

export function SkillDetailDrawer({ skill, linkedTools, open, onClose, onUnlink }: SkillDetailDrawerProps) {
  if (!skill) return null;

  const flowJson = JSON.stringify(skill.flowDefinition, null, 2);

  return (
    <Drawer open={open} onClose={onClose} title={skill.displayName} side="right" widthRem={28}>
      <DrawerHeader title={skill.displayName} onClose={onClose} />
      <div className="flex flex-col overflow-y-auto p-5 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Metadata</h3>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">ID</dt>
              <dd className="font-mono">{skill.id}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Name (key)</dt>
              <dd className="font-mono">{skill.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Category</dt>
              <dd><PillTag variant="role">{skill.category}</PillTag></dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Scope</dt>
              <dd><PillTag variant="plan">{skill.scope}</PillTag></dd>
            </div>
            {skill.entryConditions && (
              <div>
                <dt className="text-[var(--text-muted)]">Entry Conditions</dt>
                <dd>{skill.entryConditions}</dd>
              </div>
            )}
          </dl>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Flow Definition</h3>
          <pre className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
            {flowJson}
          </pre>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Linked Tools</h3>
          {linkedTools.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No tools linked.</p>
          ) : (
            <ul className="space-y-2">
              {linkedTools.map(({ link, tool }) => (
                <li
                  key={link.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {tool?.displayName ?? tool?.name ?? link.toolId}
                    </span>
                    {link.isRequired && (
                      <PillTag variant="outcome" className="ml-2">Required</PillTag>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => onUnlink(skill.id, link.toolId)}
                    className="h-8 px-2 min-h-0 text-[var(--error)] hover:bg-[rgba(239,68,68,0.1)]"
                    aria-label="Unlink tool"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

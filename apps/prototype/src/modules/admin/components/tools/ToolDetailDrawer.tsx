/**
 * Tool detail drawer. Metadata, parameters schema, execution config.
 */

import { Drawer, DrawerHeader, PillTag } from '../../../../shared/ui';
import type { ToolDefinition } from '../../../../shared/types';

interface ToolDetailDrawerProps {
  tool: ToolDefinition | null;
  open: boolean;
  onClose: () => void;
}

export function ToolDetailDrawer({ tool, open, onClose }: ToolDetailDrawerProps) {
  if (!tool) return null;

  const paramsJson = JSON.stringify(tool.parametersSchema, null, 2);
  const responseMappingJson = tool.responseMapping ? JSON.stringify(tool.responseMapping, null, 2) : null;

  return (
    <Drawer open={open} onClose={onClose} title={tool.displayName} side="right" widthRem={28}>
      <DrawerHeader title={tool.displayName} onClose={onClose} />
      <div className="flex flex-col overflow-y-auto p-5 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Metadata</h3>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">ID</dt>
              <dd className="font-mono">{tool.id}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Name (key)</dt>
              <dd className="font-mono">{tool.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Category</dt>
              <dd><PillTag variant="role">{tool.category}</PillTag></dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Execution Type</dt>
              <dd><PillTag variant={tool.executionType === 'internal' ? 'status' : 'outcome'}>{tool.executionType}</PillTag></dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Scope</dt>
              <dd><PillTag variant="plan">{tool.scope}</PillTag></dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Description</dt>
              <dd>{tool.description}</dd>
            </div>
          </dl>
        </section>

        {tool.executionType === 'internal' && tool.handlerKey && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Handler</h3>
            <p className="font-mono text-sm">{tool.handlerKey}</p>
          </section>
        )}

        {tool.executionType === 'external' && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Endpoint</h3>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">URL</dt>
                <dd className="font-mono break-all">{tool.endpointUrl ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Method</dt>
                <dd>{tool.httpMethod ?? 'GET'}</dd>
              </div>
            </dl>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Parameters Schema</h3>
          <pre className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
            {paramsJson}
          </pre>
        </section>

        {responseMappingJson && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Response Mapping</h3>
            <pre className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
              {responseMappingJson}
            </pre>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Config</h3>
          <dl className="space-y-1.5 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Timeout</dt>
              <dd>{tool.timeoutMs}ms</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Retry on Fail</dt>
              <dd>{tool.retryOnFail ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </section>
      </div>
    </Drawer>
  );
}

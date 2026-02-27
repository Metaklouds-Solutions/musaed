/**
 * Audit log section. Displays recent admin actions.
 */

import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../../shared/ui';
import { auditAdapter } from '../../../../adapters';
import { tenantsAdapter } from '../../../../adapters';
import { useMemo } from 'react';

function formatAction(action: string): string {
  const map: Record<string, string> = {
    'tenant.created': 'Tenant created',
    'agent.assigned': 'Agent assigned',
    'ticket.assigned': 'Ticket assigned',
  };
  return map[action] ?? action;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuditLogSection() {
  const entries = useMemo(() => auditAdapter.getRecent(50), []);
  const tenantNames = useMemo(() => {
    const m = new Map<string, string>();
    tenantsAdapter.getAllTenants().forEach((t) => m.set(t.id, t.name));
    return m;
  }, []);

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] card-glass p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Audit Log</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">No audit entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
      <div className="p-4 border-b border-[var(--border-subtle)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Audit Log</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Recent admin actions (tenant created, agent assigned, ticket assigned).
        </p>
      </div>
      <DataTable minWidth="min-w-[640px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-[var(--text-secondary)] text-sm whitespace-nowrap">
                  {formatDate(e.timestamp)}
                </TableCell>
                <TableCell>{formatAction(e.action)}</TableCell>
                <TableCell>
                  {e.tenantId ? tenantNames.get(e.tenantId) ?? e.tenantId : '—'}
                </TableCell>
                <TableCell className="text-sm text-[var(--text-muted)] max-w-[200px] truncate">
                  {e.meta ? JSON.stringify(e.meta) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}

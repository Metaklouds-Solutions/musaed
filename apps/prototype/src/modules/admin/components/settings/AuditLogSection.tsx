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
import { useAdminAuditLog } from '../../hooks';

function formatAction(action: string): string {
  const map: Record<string, string> = {
    'tenant.created': 'Tenant created',
    'agent.assigned': 'Agent assigned',
    'ticket.assigned': 'Ticket assigned',
  };
  return map[action] ?? action;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Renders recent admin audit entries with time, action, and metadata fields. */
export function AuditLogSection() {
  const { entries, tenantNames } = useAdminAuditLog();

  if (entries.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] card-glass p-6">
        <h3 className="font-semibold text-[var(--text-primary)]">Audit Log</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">No audit entries yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] card-glass overflow-x-auto">
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

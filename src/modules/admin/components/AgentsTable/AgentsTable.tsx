/**
 * Admin agents table. Name, Retell ID, Voice, Language, Linked Tenant, Status, Last Synced.
 * Responsive with DataTable, StatusDot, PillTag.
 */

import { Link } from 'react-router-dom';
import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ViewButton,
  StatusDot,
  PillTag,
} from '../../../../shared/ui';
import type { AdminAgentRow } from '../../../../shared/types';

interface AgentsTableProps {
  agents: AdminAgentRow[];
  onAssignClick?: (agent: AdminAgentRow) => void;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

export function AgentsTable({ agents, onAssignClick }: AgentsTableProps) {
  if (agents.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No agents found.
      </p>
    );
  }

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Retell ID</TableHead>
            <TableHead>Voice</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Linked Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Synced</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium text-[var(--text-primary)]">
                {a.tenantId ? (
                  <Link to={`/admin/tenants/${a.tenantId}/agents/${a.id}`} className="hover:underline">
                    {a.name}
                  </Link>
                ) : (
                  <span>{a.name}</span>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm text-[var(--text-muted)]">
                {a.externalAgentId}
              </TableCell>
              <TableCell>{a.voice}</TableCell>
              <TableCell>{a.language}</TableCell>
              <TableCell className="min-w-0 max-w-[140px] sm:max-w-[180px]">
                {a.tenantId ? (
                  <Link
                    to={`/admin/tenants/${a.tenantId}`}
                    className="inline-flex max-w-full min-w-0 hover:opacity-80 overflow-hidden"
                  >
                    <PillTag variant="plan" className="truncate min-w-0 max-w-full">
                      {a.tenantName ?? a.tenantId}
                    </PillTag>
                  </Link>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell>
                <StatusDot
                  variant={a.status === 'active' ? 'active' : 'offline'}
                  label={a.status}
                />
              </TableCell>
              <TableCell className="text-sm text-[var(--text-muted)]">
                {a.lastSyncedAt === '—' ? '—' : formatDate(a.lastSyncedAt)}
              </TableCell>
              <TableCell>
                {a.tenantId ? (
                  <ViewButton to={`/admin/tenants/${a.tenantId}/agents/${a.id}`} aria-label="View agent" />
                ) : onAssignClick ? (
                  <button
                    type="button"
                    onClick={() => onAssignClick(a)}
                    className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
                  >
                    Assign
                  </button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}

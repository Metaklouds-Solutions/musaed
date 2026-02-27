/**
 * Admin agents table. Name, Retell ID, Voice, Language, Linked Tenant, Status, Last Synced.
 */

import { Link } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ViewButton,
} from '../../../../shared/ui';
import type { AdminAgentRow } from '../../../../shared/types';

interface AgentsTableProps {
  agents: AdminAgentRow[];
  onAssignClick?: (agent: AdminAgentRow) => void;
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
    <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
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
                <Link to={`/admin/agents/${a.id}`} className="hover:underline">
                  {a.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-[var(--text-muted)]">
                {a.externalAgentId}
              </TableCell>
              <TableCell>{a.voice}</TableCell>
              <TableCell>{a.language}</TableCell>
              <TableCell>
                {a.tenantId ? (
                  <Link to={`/admin/tenants/${a.tenantId}`} className="text-[var(--ds-primary)] hover:underline">
                    {a.tenantName ?? a.tenantId}
                  </Link>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className={`text-sm capitalize ${a.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                  {a.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-[var(--text-muted)]">
                {a.lastSyncedAt === '—' ? '—' : new Date(a.lastSyncedAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {a.tenantId ? (
                  <ViewButton to={`/admin/agents/${a.id}`} aria-label="View agent" />
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
    </div>
  );
}

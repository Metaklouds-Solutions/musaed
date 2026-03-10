/**
 * Admin agents table. Name, Retell ID, Voice, Language, Linked Tenant, Status, Last Synced.
 * Responsive with DataTable, StatusDot, PillTag.
 */

import { Link } from 'react-router-dom';
import { ExternalLink, MoreHorizontal } from 'lucide-react';
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
  Button,
} from '../../../../shared/ui';
import { getRetellAgentUrl } from '../../../../lib/retell';
import type { AdminAgentRow } from '../../../../shared/types';

interface AgentsTableProps {
  agents: AdminAgentRow[];
  onActionsClick?: (agent: AdminAgentRow) => void;
  /** When true, table has no card styling (used inside a card container). */
  embedded?: boolean;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

/** Renders admin agents table with Actions button. */
export function AgentsTable({
  agents,
  onActionsClick,
  embedded = false,
}: AgentsTableProps) {
  if (agents.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No agents found.
      </p>
    );
  }

  return (
    <DataTable
      minWidth="min-w-[640px]"
      className={embedded ? '!bg-transparent !border-0 !shadow-none !rounded-none' : undefined}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Agent ID</TableHead>
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
                <span title={a.id} className="truncate max-w-[100px] inline-block">
                  {a.id}
                </span>
                {a.retellAgentId && (
                  <a
                    href={getRetellAgentUrl(a.retellAgentId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1.5 inline-flex items-center gap-0.5 text-[var(--ds-primary)] hover:underline"
                    aria-label={`Open ${a.name} in Retell`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                    Retell
                  </a>
                )}
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
                <div className="flex items-center gap-2">
                  {a.tenantId && (
                    <ViewButton to={`/admin/tenants/${a.tenantId}/agents/${a.id}`} aria-label="View agent" />
                  )}
                  {onActionsClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onActionsClick(a)}
                      aria-label="Agent actions"
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <MoreHorizontal size={18} aria-hidden />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}

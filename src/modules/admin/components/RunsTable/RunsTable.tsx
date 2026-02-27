/**
 * Admin runs table. Cross-tenant, cost view.
 * Responsive with DataTable.
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
} from '../../../../shared/ui';
import type { AdminRunRow } from '../../../../adapters/local/runs.adapter';

interface RunsTableProps {
  runs: AdminRunRow[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function RunsTable({ runs }: RunsTableProps) {
  if (runs.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No runs found.
      </p>
    );
  }

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Run ID</TableHead>
            <TableHead>Call</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Tokens</TableHead>
            <TableHead>Started</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-sm text-[var(--text-primary)]">
                <Link to={`/admin/runs/${r.id}`} className="hover:underline">
                  {r.id}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/admin/calls/${r.callId}`} className="text-[var(--ds-primary)] hover:underline font-mono text-sm">
                  {r.callId}
                </Link>
              </TableCell>
              <TableCell>
                <Link to={`/admin/tenants/${r.tenantId}`} className="text-[var(--text-primary)] hover:underline">
                  {r.tenantName}
                </Link>
              </TableCell>
              <TableCell className="font-medium tabular-nums">
                {formatCost(r.cost)}
              </TableCell>
              <TableCell className="text-[var(--text-muted)] tabular-nums">
                {r.tokens != null ? r.tokens.toLocaleString() : '—'}
              </TableCell>
              <TableCell className="text-sm text-[var(--text-muted)]">
                {formatDate(r.startedAt)}
              </TableCell>
              <TableCell>
                <ViewButton to={`/admin/runs/${r.id}`} aria-label="View run events" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}

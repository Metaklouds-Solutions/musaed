/**
 * Admin billing: table of tenants with plan, usage, cost.
 * Responsive with DataTable, PillTag for plans.
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
  PillTag,
} from '../../../../shared/ui';
import type { AdminBillingRow } from '../../../../shared/types';

interface BillingTenantPlansProps {
  rows: AdminBillingRow[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function BillingTenantPlans({ rows }: BillingTenantPlansProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-(--text-muted) py-8 text-center">
        No tenants with billing data.
      </p>
    );
  }

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>MRR</TableHead>
            <TableHead>Minutes Used</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Usage Cost</TableHead>
            <TableHead className="w-[80px] min-w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.tenantId}>
              <TableCell>
                <Link
                  to={`/admin/tenants/${r.tenantId}`}
                  className="font-medium text-(--text-primary) hover:underline"
                >
                  {r.tenantName}
                </Link>
              </TableCell>
              <TableCell>
                <PillTag variant="plan">{r.plan}</PillTag>
              </TableCell>
              <TableCell className="tabular-nums font-medium">
                {formatCurrency(r.mrr)}
              </TableCell>
              <TableCell className="tabular-nums text-(--text-muted)">
                {r.minutesUsed.toLocaleString()}
              </TableCell>
              <TableCell className="tabular-nums text-(--text-muted)">
                {r.creditBalance.toLocaleString()}
              </TableCell>
              <TableCell className="tabular-nums font-medium">
                {formatCurrency(r.usageCostUsd)}
              </TableCell>
              <TableCell>
                <ViewButton
                  to={`/admin/tenants/${r.tenantId}`}
                  aria-label="View tenant"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}

/**
 * Admin tenants list (Module 9). Layout only; data from useAdminTenants (adapter).
 */

import { PageHeader, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../shared/ui';
import { useAdminTenants } from '../hooks';

export function AdminTenantsPage() {
  const { tenants } = useAdminTenants();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Platform tenant list and plan"
      />
      {tenants.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No tenants.</p>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm text-[var(--text-secondary)]">{t.id}</TableCell>
                  <TableCell className="font-medium text-[var(--text-primary)]">{t.name}</TableCell>
                  <TableCell>{t.plan}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

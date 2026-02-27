/**
 * Admin tenants list. Table with View button. Add Tenant opens modal.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { PageHeader, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, ViewButton } from '../../../shared/ui';
import { useAdminTenants } from '../hooks';
import { AddTenantModal } from '../components/AddTenantModal';

export function AdminTenantsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { tenants } = useAdminTenants(refreshKey);
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddSuccess = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleView = useCallback(
    (id: string) => () => navigate(`/admin/tenants/${id}`),
    [navigate]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Tenants"
          description="Platform tenant list and plan"
        />
        <Button onClick={() => setAddModalOpen(true)} className="shrink-0">
          <UserPlus className="w-4 h-4" aria-hidden />
          Add Tenant
        </Button>
      </div>

      {tenants.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No tenants.</p>
      ) : (
        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm text-[var(--text-secondary)]">{t.id}</TableCell>
                  <TableCell className="font-medium text-[var(--text-primary)]">{t.name}</TableCell>
                  <TableCell>{t.plan}</TableCell>
                  <TableCell>
                    <ViewButton onClick={handleView(t.id)} aria-label="View tenant" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddTenantModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}

/**
 * Customers list page. Layout only; data from useCustomersList hook.
 */

import { useMemo } from 'react';
import { PageHeader, EmptyState, TableSkeleton, UnifiedFilterBar } from '../../../shared/ui';
import { useCustomersList } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { CustomersTable } from '../components/CustomersTable';
import { Users } from 'lucide-react';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useUrlQueryState } from '../../../shared/hooks/useUrlQueryState';

export function CustomersPage() {
  const ready = useDelayedReady();
  const { user, customers } = useCustomersList();
  const { state, patchState, resetState } = useUrlQueryState({ q: '' });
  const search = state.q;
  const { saved, saveCurrent, apply, deleteFilter } = useSavedFilters({
    pageKey: 'tenant-customers',
    currentFilters: { q: search },
    onApply: (filters) => patchState({ q: typeof filters.q === 'string' ? filters.q : '' }),
  });

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    );
  }, [customers, search]);

  if (!user) {
    return (
      <EmptyState
        icon={Users}
        title="Sign in to view customers"
        description="Select a role on the login page to see customers."
      />
    );
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <PageHeader title="Customers" description="Customer list and interaction history." />
        <TableSkeleton rows={6} cols={3} />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Customers will appear when data is available from the adapter."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Customer list and interaction history."
      />
      <UnifiedFilterBar
        query={search}
        onQueryChange={(q) => patchState({ q })}
        searchPlaceholder="Search by name or email..."
        savedFilters={saved}
        onSaveFilter={saveCurrent}
        onApplyFilter={apply}
        onDeleteFilter={deleteFilter}
        onReset={resetState}
      />
      <CustomersTable customers={filteredCustomers} />
    </div>
  );
}

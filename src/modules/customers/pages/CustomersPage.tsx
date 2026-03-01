/**
 * Customers list page. Layout only; data from useCustomersList hook.
 */

import { useMemo, useState } from 'react';
import { PageHeader, EmptyState, TableFilters, TableSkeleton } from '../../../shared/ui';
import { useCustomersList } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { CustomersTable } from '../components/CustomersTable';
import { Users } from 'lucide-react';

export function CustomersPage() {
  const ready = useDelayedReady();
  const { user, customers } = useCustomersList();
  const [search, setSearch] = useState('');

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
      <TableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email…"
      />
      <CustomersTable customers={filteredCustomers} />
    </div>
  );
}

/**
 * Customers list page. Layout only; data from useCustomersList hook.
 */

import { PageHeader, EmptyState } from '../../../shared/ui';
import { useCustomersList } from '../hooks';
import { CustomersTable } from '../components/CustomersTable';
import { Users } from 'lucide-react';

export function CustomersPage() {
  const { user, customers } = useCustomersList();

  if (!user) {
    return (
      <EmptyState
        icon={Users}
        title="Sign in to view customers"
        description="Select a role on the login page to see customers."
      />
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
    <>
      <PageHeader
        title="Customers"
        description="Customer list and interaction history."
      />
      <CustomersTable customers={customers} />
    </>
  );
}

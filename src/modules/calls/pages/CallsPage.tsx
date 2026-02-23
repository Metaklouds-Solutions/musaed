/**
 * Calls list page. Layout only; data from useCallsList hook.
 */

import { PageHeader, EmptyState } from '../../../shared/ui';
import { useCallsList } from '../hooks';
import { CallsTable } from '../components/CallsTable';
import { Phone } from 'lucide-react';

export function CallsPage() {
  const { user, calls, customerMap } = useCallsList();

  if (!user) {
    return (
      <EmptyState
        icon={Phone}
        title="Sign in to view calls"
        description="Select a role on the login page to see call logs."
      />
    );
  }

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Call logs will appear when data is available from the adapter."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Calls"
        description="AI call logs and conversion."
      />
      <CallsTable
        calls={calls}
        getCustomerName={(id) => customerMap.get(id) ?? id}
      />
    </>
  );
}

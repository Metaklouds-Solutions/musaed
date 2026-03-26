/**
 * Calls list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { callsAdapter, customersAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { DateRangeFilter } from '../../../adapters/local/calls.adapter';
import type { Customer, Call } from '../../../shared/types';

export function useCallsList(dateRange?: DateRangeFilter) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: calls, loading, error, refetch } = useAsyncData(
    () => callsAdapter.getCalls(tenantId, dateRange),
    [tenantId, dateRange],
    [] as Call[],
  );

  const { data: customers } = useAsyncData(
    () => customersAdapter.getCustomers(tenantId),
    [tenantId],
    [] as Customer[],
  );
  
  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customers]);

  return { user, calls, customerMap, isLoading: loading, error, refresh: refetch };
}

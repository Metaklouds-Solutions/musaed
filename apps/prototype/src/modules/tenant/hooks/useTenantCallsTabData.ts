import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { callsAdapter, customersAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Customer, Call } from '../../../shared/types';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
})();

/** Tenant calls tab data hook. Keeps adapter access outside the view component. */
export function useTenantCallsTabData() {
  const { id } = useParams<{ id: string }>();
  const tenantId = id ?? undefined;

  const { data: calls, loading: callsLoading } = useAsyncData(
    () => callsAdapter.getCalls(tenantId, DEFAULT_RANGE),
    [tenantId],
    [] as Call[],
  );
  const { data: customers } = useAsyncData(
    () => customersAdapter.getCustomers(tenantId),
    [tenantId],
    [] as Customer[],
  );
  const getCustomerName = useCallback(
    (customerId: string) => customers.find((c) => c.id === customerId)?.name ?? customerId,
    [customers]
  );

  return { calls, callsLoading, getCustomerName };
}

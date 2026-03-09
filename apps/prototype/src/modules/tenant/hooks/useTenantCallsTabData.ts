import { useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { callsAdapter, customersAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Customer } from '../../../shared/types';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
})();

/** Tenant calls tab data hook. Keeps adapter access outside the view component. */
export function useTenantCallsTabData() {
  const { id } = useParams<{ id: string }>();

  const calls = useMemo(() => callsAdapter.getCalls(id ?? undefined, DEFAULT_RANGE), [id]);
  const { data: customers } = useAsyncData(
    () => customersAdapter.getCustomers(id ?? undefined),
    [id],
    [] as Customer[],
  );
  const getCustomerName = useCallback(
    (customerId: string) => customers.find((c) => c.id === customerId)?.name ?? customerId,
    [customers]
  );

  return { calls, getCustomerName };
}

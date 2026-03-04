import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { callsAdapter, customersAdapter } from '../../../adapters';

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
  const getCustomerName = useMemo(
    () => (customerId: string) => customersAdapter.getCustomerById(customerId, id ?? undefined)?.name ?? customerId,
    [id]
  );

  return { calls, getCustomerName };
}

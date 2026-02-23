/**
 * Calls list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { callsAdapter, customersAdapter } from '../../../adapters';

export function useCallsList() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const calls = useMemo(() => callsAdapter.getCalls(tenantId), [tenantId]);
  const customers = useMemo(() => customersAdapter.getCustomers(tenantId), [tenantId]);
  const customerMap = useMemo(() => {
    const m = new Map<string, string>();
    customers.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [customers]);

  return { user, calls, customerMap };
}

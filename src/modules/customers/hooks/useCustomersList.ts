/**
 * Customers list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { customersAdapter } from '../../../adapters';

export function useCustomersList() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const customers = useMemo(() => customersAdapter.getCustomers(tenantId), [tenantId]);
  return { user, customers };
}

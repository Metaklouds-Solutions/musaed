/**
 * Customers list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { customersAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Customer } from '../../../shared/types';

export function useCustomersList() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: customers, loading, refetch } = useAsyncData(
    () => customersAdapter.getCustomers(tenantId),
    [tenantId],
    [] as Customer[],
  );
  return { user, customers, loading, refetch };
}

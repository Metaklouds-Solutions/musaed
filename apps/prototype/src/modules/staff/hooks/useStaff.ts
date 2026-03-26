/**
 * Tenant staff hook. Fetches from the centralized adapter (local or API).
 */

import { useState, useCallback, useEffect } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { staffAdapter } from '../../../adapters';
import type { StaffRow } from '../../../shared/types';

export function useStaff() {
  const { user } = useSession();
  const tenantId = user?.tenantId ?? null;
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!tenantId) {
      setStaff([]);
      return;
    }
    setLoading(true);
    try {
      const result = staffAdapter.list(tenantId);
      const data = result instanceof Promise ? await result : result;
      setStaff(data ?? []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return { staff, tenantId, refetch: fetchStaff, loading };
}

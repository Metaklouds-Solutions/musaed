/**
 * Admin system health. Adapter only; platform-wide.
 */

import { useMemo } from 'react';
import { adminAdapter } from '../../../adapters';

export function useAdminSystem() {
  const systemHealth = useMemo(() => adminAdapter.getSystemHealth(), []);
  return useMemo(() => ({ systemHealth }), [systemHealth]);
}

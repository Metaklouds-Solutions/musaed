/**
 * API calls adapter (placeholder). Replace with real API when backend exists.
 */

import type { Call } from '../../shared/types';

export const callsAdapter = {
  getCalls(_tenantId: string | undefined): Call[] {
    return [];
  },
  getCallById(_id: string, _tenantId: string | undefined): Call | undefined {
    return undefined;
  },
};

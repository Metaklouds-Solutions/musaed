/**
 * API calls adapter. Calls data from backend (future: when call recording is wired).
 * Currently returns cached data. Refresh triggers backend fetch.
 */

import type { Call } from '../../shared/types';

let cachedCalls: Call[] = [];

export const callsAdapter = {
  getCalls(_tenantId: string | undefined): Call[] {
    return cachedCalls;
  },

  getCallById(id: string, _tenantId: string | undefined): Call | undefined {
    return cachedCalls.find((c) => c.id === id);
  },

  async refresh(): Promise<void> {
    // Calls endpoint not yet implemented in backend; placeholder
    cachedCalls = [];
  },
};

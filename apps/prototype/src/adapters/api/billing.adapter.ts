/**
 * API billing adapter. Fetches billing data from backend.
 */

import { api } from '../../lib/apiClient';
import type { BillingOverview } from '../../shared/types';

export const billingAdapter = {
  async getBillingOverview(tenantId: string | undefined): Promise<BillingOverview | undefined> {
    try {
      const qs = tenantId ? `?tenantId=${tenantId}` : '';
      const raw = await api.get<any>(`/tenant/billing${qs}`);
      if (!raw) return undefined;
      const plan = raw.plan?.name ?? raw.plan ?? '—';
      return {
        plan: typeof plan === 'string' ? plan : '—',
        minutesUsed: typeof raw.minutesUsed === 'number' ? raw.minutesUsed : 0,
        creditBalance: typeof raw.creditBalance === 'number' ? raw.creditBalance : 0,
        estimatedSavings: typeof raw.estimatedSavings === 'number' ? raw.estimatedSavings : 0,
        netROI: typeof raw.netROI === 'number' ? raw.netROI : 0,
      };
    } catch {
      return undefined;
    }
  },

  buyCredits(_tenantId: string | undefined): void {
    // Stripe checkout handled by backend
  },
};

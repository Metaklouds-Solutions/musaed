/**
 * API billing adapter. Fetches billing data from backend.
 */

import { api } from '../../lib/apiClient';
import type { BillingOverview } from '../../shared/types';

let cachedBilling: BillingOverview | undefined;

export const billingAdapter = {
  getBillingOverview(_tenantId: string | undefined): BillingOverview | undefined {
    return cachedBilling;
  },

  buyCredits(_tenantId: string | undefined): void {
    // Stripe checkout will be handled by backend
  },

  async refresh(): Promise<void> {
    try {
      cachedBilling = await api.get<BillingOverview>('/tenant/billing');
    } catch {
      // keep cache as-is
    }
  },
};

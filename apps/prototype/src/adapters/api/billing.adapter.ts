/**
 * API billing adapter (placeholder). Replace with real API when backend exists.
 */

import type { BillingOverview } from '../../shared/types';

export const billingAdapter = {
  getBillingOverview(_tenantId: string | undefined): BillingOverview | undefined {
    return undefined;
  },

  buyCredits(_tenantId: string | undefined): void {
    // no-op until API exists
  },
};

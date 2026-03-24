/**
 * A/B test UI config stored in tenant.settings.abTest.
 */

import { api } from '../../lib/apiClient';
import type { ABTestConfig } from '../local/abTest.adapter';
import { getCachedAbTest, setCachedAbTest } from './tenantSettingsCache';

export const abTestAdapter = {
  getConfig(tenantId: string): ABTestConfig {
    return { ...getCachedAbTest(tenantId) };
  },

  setConfig(tenantId: string, config: Partial<ABTestConfig>): void {
    const current = this.getConfig(tenantId);
    const next: ABTestConfig = {
      ...current,
      ...config,
      splitPercentA: Math.max(
        0,
        Math.min(100, config.splitPercentA ?? current.splitPercentA),
      ),
    };
    setCachedAbTest(tenantId, next);
    void api.patch('/tenant/settings', { abTest: next }).catch(() => {});
  },
};

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

  async setConfig(
    tenantId: string,
    config: Partial<ABTestConfig>,
  ): Promise<void> {
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
    await api.patch('/tenant/settings', { abTest: next });
  },
};

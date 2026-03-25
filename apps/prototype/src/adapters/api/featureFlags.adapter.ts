/**
 * API-backed tenant feature flags via PATCH /tenant/settings (settings.featureFlags).
 */

import { api } from '../../lib/apiClient';
import type { FeatureFlags, FeatureFlagKey } from '../local/featureFlags.adapter';
import { getCachedFeatureFlags, setCachedFeatureFlags } from './tenantSettingsCache';

export const FEATURE_FLAGS_CHANGED = 'clinic-crm-feature-flags-changed';

function dispatchChanged(tenantId: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(FEATURE_FLAGS_CHANGED, { detail: { tenantId } }),
      );
    }
  } catch {
    /* ignore */
  }
}

export const featureFlagsAdapter = {
  /**
   * Returns flags from cache (primed by session/settings load). Defaults all-on.
   */
  getFeatureFlags(tenantId: string): FeatureFlags {
    return { ...getCachedFeatureFlags(tenantId) };
  },

  async setFeatureFlag(
    tenantId: string,
    key: FeatureFlagKey,
    value: boolean,
  ): Promise<void> {
    const current = this.getFeatureFlags(tenantId);
    const next: FeatureFlags = { ...current, [key]: value };
    setCachedFeatureFlags(tenantId, next);
    dispatchChanged(tenantId);
    await api.patch('/tenant/settings', {
      featureFlags: { [key]: value },
    });
  },

  async setFeatureFlags(
    tenantId: string,
    flags: Partial<FeatureFlags>,
  ): Promise<void> {
    const current = this.getFeatureFlags(tenantId);
    const next: FeatureFlags = { ...current, ...flags };
    setCachedFeatureFlags(tenantId, next);
    dispatchChanged(tenantId);
    await api.patch('/tenant/settings', { featureFlags: next });
  },
};

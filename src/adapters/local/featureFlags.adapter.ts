/**
 * Feature flags per tenant. Toggle Reports, Calendar, etc.
 */

import { seedTenantFeatureFlags } from '../../mock/seedData';

const FEATURE_FLAGS_KEY = 'clinic-crm-feature-flags';

export type FeatureFlagKey = 'enableReports' | 'enableCalendar';

export interface FeatureFlags {
  enableReports: boolean;
  enableCalendar: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableReports: true,
  enableCalendar: true,
};

function load(tenantId: string): FeatureFlags | null {
  try {
    const stored = localStorage.getItem(`${FEATURE_FLAGS_KEY}-${tenantId}`);
    return stored ? (JSON.parse(stored) as FeatureFlags) : null;
  } catch {
    return null;
  }
}

export const FEATURE_FLAGS_CHANGED = 'clinic-crm-feature-flags-changed';

function save(tenantId: string, flags: FeatureFlags): void {
  try {
    localStorage.setItem(`${FEATURE_FLAGS_KEY}-${tenantId}`, JSON.stringify(flags));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FEATURE_FLAGS_CHANGED, { detail: { tenantId } }));
    }
  } catch {
    // ignore
  }
}

export const featureFlagsAdapter = {
  /** Get feature flags for a tenant. Merges with seed when no stored override. */
  getFeatureFlags(tenantId: string): FeatureFlags {
    const stored = load(tenantId);
    if (stored) return stored;
    const seed = seedTenantFeatureFlags.find((s) => s.tenantId === tenantId);
    return {
      ...DEFAULT_FLAGS,
      ...(seed?.featureFlags ?? {}),
    };
  },

  /** Set a single feature flag. */
  setFeatureFlag(tenantId: string, key: FeatureFlagKey, value: boolean): void {
    const current = this.getFeatureFlags(tenantId);
    const next = { ...current, [key]: value };
    save(tenantId, next);
  },

  /** Set all feature flags. */
  setFeatureFlags(tenantId: string, flags: Partial<FeatureFlags>): void {
    const current = this.getFeatureFlags(tenantId);
    const next = { ...current, ...flags };
    save(tenantId, next);
  },
};

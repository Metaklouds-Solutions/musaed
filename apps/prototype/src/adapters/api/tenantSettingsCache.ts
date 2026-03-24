/**
 * In-memory caches for tenant settings fields that power sync adapters in API mode.
 * Populated from GET /tenant/settings (Session bootstrap + settings page).
 */

import type { FeatureFlags } from '../local/featureFlags.adapter';
import type { ABTestConfig } from '../local/abTest.adapter';
import type { PmsConnectionConfig } from '../local/pms.adapter';
import type { Location } from '../../shared/types/entities';

const DEFAULT_FLAGS: FeatureFlags = {
  enableReports: true,
  enableCalendar: true,
};

const DEFAULT_AB: ABTestConfig = {
  enabled: false,
  splitPercentA: 50,
  versionALabel: 'Version A',
  versionBLabel: 'Version B',
};

function coerceBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

const featureFlagsByTenant: Record<string, FeatureFlags> = {};
const abTestByTenant: Record<string, ABTestConfig> = {};
const pmsByTenant: Record<string, PmsConnectionConfig | null> = {};
const locationsByTenant: Record<string, Location[]> = {};
const providerAvailabilityByTenant: Record<string, Record<string, unknown>> = {};

/**
 * Hydrates all tenant-scoped caches from a /tenant/settings API response body.
 */
export function primeTenantSettingsCaches(
  tenantId: string,
  body: unknown,
): void {
  if (!isRecord(body)) return;
  const settings = body.settings;
  if (!isRecord(settings)) return;

  const ff = settings.featureFlags;
  if (isRecord(ff)) {
    featureFlagsByTenant[tenantId] = {
      enableReports: coerceBool(ff.enableReports, DEFAULT_FLAGS.enableReports),
      enableCalendar: coerceBool(ff.enableCalendar, DEFAULT_FLAGS.enableCalendar),
    };
  }

  const ab = settings.abTest;
  if (isRecord(ab)) {
    abTestByTenant[tenantId] = {
      enabled: coerceBool(ab.enabled, DEFAULT_AB.enabled),
      splitPercentA:
        typeof ab.splitPercentA === 'number' && !Number.isNaN(ab.splitPercentA)
          ? Math.max(0, Math.min(100, ab.splitPercentA))
          : DEFAULT_AB.splitPercentA,
      versionALabel: typeof ab.versionALabel === 'string' ? ab.versionALabel : DEFAULT_AB.versionALabel,
      versionBLabel: typeof ab.versionBLabel === 'string' ? ab.versionBLabel : DEFAULT_AB.versionBLabel,
    };
  }

  const pms = settings.pms;
  if (isRecord(pms) && typeof pms.provider === 'string') {
    const status = pms.status === 'connected' || pms.status === 'disconnected' ? pms.status : 'disconnected';
    pmsByTenant[tenantId] = {
      provider: pms.provider as PmsConnectionConfig['provider'],
      status,
      lastSyncAt: typeof pms.lastSyncAt === 'string' ? pms.lastSyncAt : undefined,
    };
  }

  const locs = settings.locations;
  if (Array.isArray(locs)) {
    const mapped: Location[] = [];
    for (const row of locs) {
      if (!isRecord(row)) continue;
      const id = typeof row.id === 'string' ? row.id : '';
      const name = typeof row.name === 'string' ? row.name : '';
      if (!id || !name) continue;
      mapped.push({
        id,
        tenantId,
        name,
        address: typeof row.address === 'string' ? row.address : undefined,
        phone: typeof row.phone === 'string' ? row.phone : undefined,
        hours: typeof row.hours === 'string' ? row.hours : undefined,
      });
    }
    locationsByTenant[tenantId] = mapped;
  }

  const pa = settings.providerAvailability;
  if (isRecord(pa)) {
    providerAvailabilityByTenant[tenantId] = { ...pa };
  }
}

export function getCachedFeatureFlags(tenantId: string): FeatureFlags {
  return featureFlagsByTenant[tenantId] ?? { ...DEFAULT_FLAGS };
}

export function setCachedFeatureFlags(tenantId: string, flags: FeatureFlags): void {
  featureFlagsByTenant[tenantId] = { ...flags };
}

export function getCachedAbTest(tenantId: string): ABTestConfig {
  return abTestByTenant[tenantId] ?? { ...DEFAULT_AB };
}

export function setCachedAbTest(tenantId: string, config: ABTestConfig): void {
  abTestByTenant[tenantId] = { ...config };
}

export function getCachedPms(tenantId: string): PmsConnectionConfig | null {
  return pmsByTenant[tenantId] ?? null;
}

export function setCachedPms(tenantId: string, config: PmsConnectionConfig | null): void {
  pmsByTenant[tenantId] = config;
}

export function getCachedLocations(tenantId: string): Location[] {
  return locationsByTenant[tenantId] ?? [];
}

export function setCachedLocations(tenantId: string, locations: Location[]): void {
  locationsByTenant[tenantId] = locations;
}

export function getCachedProviderAvailability(
  tenantId: string,
): Record<string, unknown> {
  return providerAvailabilityByTenant[tenantId] ?? {};
}

export function setCachedProviderAvailability(
  tenantId: string,
  pa: Record<string, unknown>,
): void {
  providerAvailabilityByTenant[tenantId] = { ...pa };
}

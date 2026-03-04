/**
 * A/B testing adapter for agent versions. Split traffic config and comparison data.
 */

const AB_TEST_CONFIG_KEY = 'clinic-crm-ab-test-config';

export interface ABTestConfig {
  /** Whether A/B testing is enabled for this tenant. */
  enabled: boolean;
  /** Traffic split: percentage for version A (0–100). B gets remainder. */
  splitPercentA: number;
  /** Version A label (e.g. "Current", "v1"). */
  versionALabel: string;
  /** Version B label (e.g. "New", "v2"). */
  versionBLabel: string;
}

const DEFAULT_CONFIG: ABTestConfig = {
  enabled: false,
  splitPercentA: 50,
  versionALabel: 'Version A',
  versionBLabel: 'Version B',
};

function isABTestConfig(x: unknown): x is ABTestConfig {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.enabled === 'boolean' &&
    typeof o.splitPercentA === 'number' &&
    typeof o.versionALabel === 'string' &&
    typeof o.versionBLabel === 'string'
  );
}

function parseABTestConfig(raw: string): ABTestConfig | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isABTestConfig(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function load(tenantId: string): ABTestConfig | null {
  const stored = localStorage.getItem(`${AB_TEST_CONFIG_KEY}-${tenantId}`);
  return stored ? parseABTestConfig(stored) : null;
}

function save(tenantId: string, config: ABTestConfig): void {
  try {
    localStorage.setItem(`${AB_TEST_CONFIG_KEY}-${tenantId}`, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const abTestAdapter = {
  /** Get A/B test config for a tenant. */
  getConfig(tenantId: string): ABTestConfig {
    const stored = load(tenantId);
    return stored ? { ...DEFAULT_CONFIG, ...stored } : { ...DEFAULT_CONFIG };
  },

  /** Save A/B test config. */
  setConfig(tenantId: string, config: Partial<ABTestConfig>): void {
    const current = this.getConfig(tenantId);
    const next: ABTestConfig = {
      ...current,
      ...config,
      splitPercentA: Math.max(0, Math.min(100, config.splitPercentA ?? current.splitPercentA)),
    };
    save(tenantId, next);
  },
};

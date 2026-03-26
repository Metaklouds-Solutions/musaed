/**
 * Public webhook URLs (no `/api` prefix — matches Nest global prefix exclusion).
 */

function getApiOrigin(): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';
  try {
    return new URL(base).origin;
  } catch {
    return 'http://localhost:3001';
  }
}

/**
 * Base origin for inbound webhooks (same host as API, paths under `/webhooks/*`).
 */
export function getWebhookPublicOrigin(): string {
  return getApiOrigin();
}

export const WEBHOOK_INBOUND_PATHS = {
  retell: '/webhooks/retell',
  stripe: '/webhooks/stripe',
  calcom: '/webhooks/calcom',
} as const;

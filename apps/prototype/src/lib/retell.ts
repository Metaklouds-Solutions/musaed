/**
 * Retell dashboard URL for linking to agents.
 * @see https://app.retellai.com/dashboard
 */
export const RETELL_DASHBOARD_BASE = 'https://app.retellai.com';

/** Opens the Retell dashboard agent page for the given Retell agent ID. */
export function getRetellAgentUrl(retellAgentId: string): string {
  return `${RETELL_DASHBOARD_BASE}/agents/${retellAgentId}`;
}

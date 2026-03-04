/**
 * Tenant agent overview types.
 */

export interface TenantAgentDetail {
  id: string;
  voice: string;
  language: string;
  status: 'active' | 'paused' | 'archived';
  lastSyncedAt: string;
  enabledSkills: { id: string; name: string; priority: number }[];
}

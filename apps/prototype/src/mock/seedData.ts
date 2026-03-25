/**
 * Seed data for local adapter (VITE_DATA_MODE=local).
 * Empty by default — use real API (VITE_DATA_MODE=api) for production data.
 * No component may directly access this; use adapters only.
 */

import type {
  Tenant,
  Agent,
  Customer,
  Call,
  Booking,
  Alert,
  Credits,
  SupportTicket,
  TicketMessage,
  VoiceAgent,
  AgentRun,
  RunEvent,
  StaffProfile,
  Skill,
  ToolDefinition,
  SkillDefinition,
  SkillToolLink,
} from '../shared/types/entities';
import type { TenantListRow } from '../shared/types/admin';

export const seedTenants: Tenant[] = [];
export const seedTenantExtended: { tenantId: string; status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'; createdAt: string; onboardingStep: number }[] = [];
export const seedTenantSettings: { tenantId: string; timezone: string; locale: string; businessHours: string }[] = [];
export const seedTenantFeatureFlags: { tenantId: string; featureFlags: { enableReports?: boolean; enableCalendar?: boolean } }[] = [];
export const seedAgents: Agent[] = [];
export const seedCustomers: Customer[] = [];
export const seedCalls: Call[] = [];
export const seedBookings: Booking[] = [];
export const seedAlerts: Alert[] = [];
export const seedCredits: Credits[] = [];
export const seedTenantPlans: { tenantId: string; plan: string; mrr: number }[] = [];
export const seedCreditsRevenue = 0;
export const seedPaymentFailures: { id: string; tenantId: string; amount: number; failedAt: string }[] = [];
export const seedUsageAnomalies: { id: string; tenantId: string; description: string; severity: 'low' | 'medium' | 'high'; detectedAt: string }[] = [];
export const seedChurnRisk: { tenantId: string; reason: string; score: number }[] = [];
export const seedPlatformAgents: { id: string; name: string; voice: string; language: string }[] = [];
export const seedSkills: Skill[] = [];
export const seedAgentSkills: { agentId: string; skillId: string; priority: number }[] = [];

export const seedToolDefinitions: ToolDefinition[] = [];
export const seedSkillDefinitions: SkillDefinition[] = [];
export const seedSkillToolLinks: SkillToolLink[] = [];
export const seedVoiceAgents: VoiceAgent[] = [];
export const seedStaffUsers: { userId: string; name: string; email: string }[] = [];
export const seedStaffProfiles: StaffProfile[] = [];
export const seedTenantMemberships: { userId: string; tenantId: string; roleSlug: string; status: string }[] = [];
export const seedSupportTickets: SupportTicket[] = [];
export const seedTicketMessages: TicketMessage[] = [];
export const seedAgentRuns: AgentRun[] = [];
export const seedRunEvents: RunEvent[] = [];
export const seedWebhookEvents: { id: string; endpoint: string; eventType: string; status: 'success' | 'failed' | 'pending'; statusCode?: number; attemptedAt: string; retryCount: number; lastError?: string }[] = [];
export const seedAuditLog: { id: string; action: string; userId: string; tenantId?: string; meta?: Record<string, unknown>; timestamp: string }[] = [];
export const seedTenantListRows: TenantListRow[] = [];

/**
 * Entity types for adapters. Every entity includes tenantId for tenant isolation.
 */

export interface Tenant {
  id: string;
  name: string;
  /** Tenant lifecycle status. */
  status?: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  /** Onboarding progress step (0–4). */
  onboardingStep?: number;
  /** Whether onboarding is complete. */
  onboardingComplete?: boolean;
}

export interface Agent {
  id: string;
  tenantId: string;
  name: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
}

export interface Call {
  id: string;
  /** Retell call ID (distinct from MongoDB _id). Used for run lookup. */
  callId?: string;
  tenantId: string;
  customerId: string;
  duration: number;
  /** Cost in USD from Retell. Optional until enriched. */
  callCost?: number | null;
  sentimentScore: number;
  transcript: string;
  escalationFlag: boolean;
  bookingCreated: boolean;
  bookingId?: string;
  createdAt: string;
  /** A/B test version (e.g. 'A' | 'B') when agent A/B testing is enabled. */
  agentVersion?: string;
  recordingUrl?: string;
  summary?: string;
  /** Backend outcome: booked | escalated | failed | info_only | unknown. Set by API adapter. */
  outcome?: string;
  /** Agent instance ID. Set by API adapter for filtering. */
  agentId?: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  callId?: string;
  customerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  tenantId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

export interface Credits {
  tenantId: string;
  balance: number;
  minutesUsed: number;
}

// --- New entities for MUSAED multi-tenant platform ---

/** Links user to tenant with role and status. */
export interface TenantMembership {
  userId: string;
  tenantId: string;
  roleSlug: string;
  status: 'active' | 'disabled';
  appointedAt: string;
}

/** Doctor-specific metadata (availability, specialties). */
export interface StaffProfile {
  userId: string;
  tenantId: string;
  /** Doctor availability slots (e.g. { day: 'mon', start: '09:00', end: '17:00' }). */
  availability?: Array<{ day: string; start: string; end: string }>;
  specialties?: string[];
}

/** Retell voice agent linked to tenant. */
export interface VoiceAgent {
  id: string;
  tenantId: string;
  externalAgentId: string;
  voice: string;
  language: string;
  status: 'active' | 'paused' | 'archived';
  lastSyncedAt: string;
}

/** Support ticket from tenant. */
export interface SupportTicket {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  /** Admin user ID when assigned. */
  assignedTo?: string;
}

/** Message in a support ticket thread. */
export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** AI run execution (cost, usage). */
export interface AgentRun {
  id: string;
  callId: string;
  tenantId: string;
  usage: { cost?: number; tokens?: number };
  startedAt: string;
  /** A/B test version (e.g. 'A' | 'B') when agent A/B testing is enabled. */
  agentVersion?: string;
}

/** Run event for debugging. */
export interface RunEvent {
  id: string;
  runId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/** Tool category (matches ERD). */
export type ToolCategory =
  | 'booking'
  | 'patient'
  | 'communication'
  | 'clinic_info'
  | 'escalation'
  | 'custom';

/** Skill category (matches ERD). */
export type SkillCategory = 'core' | 'specialty' | 'custom';

/** Retell sync status for skill definitions. */
export type RetellSyncStatus = 'draft' | 'synced' | 'out_of_sync';

/** Tool definition (definition-driven, admin-editable). */
export interface ToolDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  executionType: 'internal' | 'external';
  handlerKey?: string;
  endpointUrl?: string;
  httpMethod?: string;
  parametersSchema: Record<string, unknown>;
  responseMapping?: Record<string, unknown>;
  timeoutMs: number;
  retryOnFail: boolean;
  scope: 'platform' | 'tenant';
  tenantId?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Skill definition (definition-driven, admin-editable). */
export interface SkillDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: SkillCategory;
  flowDefinition: Record<string, unknown>;
  entryConditions?: string;
  retellComponentId?: string;
  retellSyncStatus: RetellSyncStatus;
  lastSyncedAt?: string;
  scope: 'platform' | 'tenant';
  tenantId?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Link between skill and tool (N:M). */
export interface SkillToolLink {
  id: string;
  skillId: string;
  toolId: string;
  nodeReference?: string;
  isRequired: boolean;
  createdAt: string;
}

/** Global skill (can be enabled per agent). */
export interface Skill {
  id: string;
  name: string;
  description: string;
  deprecated: boolean;
}

/** Clinic location (branch). [PHASE-7-MULTI-LOCATION] */
export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  phone?: string;
  /** Override business hours for this location. */
  hours?: string;
}

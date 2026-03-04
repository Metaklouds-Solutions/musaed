/**
 * Domain types for the Clinic CRM application.
 * Centralizes all shared interfaces and enums for tenants, users, sessions, and related entities.
 */

// ---------------------------------------------------------------------------
// Enums & role/status types
// ---------------------------------------------------------------------------

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT_VIEWER';
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

// ---------------------------------------------------------------------------
// User & tenant membership
// ---------------------------------------------------------------------------

/** Logged-in user (platform admin or tenant manager). */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Set for MANAGER: the clinic (tenant) this user manages. Omitted for ADMIN. */
  tenantId?: string;
}

/** Member of a tenant organization with an assigned role. */
export interface TenantMember {
  id: string;
  email: string;
  role: Role;
}

// ---------------------------------------------------------------------------
// Tenant configuration
// ---------------------------------------------------------------------------

/** AI agent persona and behavior for a tenant. */
export interface AgentProfile {
  name: string;
  persona: string;
  language: string;
  defaultBehaviors: string[];
}

/** Tenant policies (PII, retention, channels). */
export interface Policies {
  piiMasking: boolean;
  retentionDays: number;
  allowedChannels: string[];
}

/** Usage limits for a tenant. */
export interface Quotas {
  callsPerDay: number;
  concurrentSessions: number;
  tokensPerMin: number;
}

/** Tool available to the agent (enabled/disabled per tenant). */
export interface Tool {
  key: string;
  name: string;
  enabled: boolean;
}

/** External integration (e.g. Twilio, CRM) connection status. */
export interface Integration {
  type: string;
  status: IntegrationStatus;
  config?: Record<string, string>;
}

/** A clinic/organization using the platform (multi-tenant). */
export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  plan: Plan;
  timezone: string;
  locale: string;
  createdAt: string;
  onboarding: { step: number; complete: boolean };
  members: TenantMember[];
  agentProfile: AgentProfile;
  policies: Policies;
  quotas: Quotas;
  tools: Tool[];
  integrations: Integration[];
}

// ---------------------------------------------------------------------------
// Session & audit (agent runtime)
// ---------------------------------------------------------------------------

/** Single event within an agent session. */
export interface SessionEvent {
  ts: string;
  type: string;
  payload?: unknown;
  tool?: string;
}

/** Run within a session (cost/status). */
export interface Run {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  start: string;
  end?: string;
  costSummary: { usd: number };
}

/** Full agent session (internal model; CallSession is the UI-facing call record). */
export interface Session {
  id: string;
  tenantId: string;
  externalSessionId: string;
  channel: 'phone' | 'web' | 'kiosk';
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string;
  runs: Run[];
  events: SessionEvent[];
}

/** Audit log entry for tenant/platform actions. */
export interface AuditLog {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  tenantId: string;
  metadata?: unknown;
}

// ---------------------------------------------------------------------------
// Patient & booking (clinic domain)
// ---------------------------------------------------------------------------

/** Patient record for a clinic. */
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob?: string;
  insurance?: string;
  tags: string[];
  createdAt: string;
}

/** Appointment/booking created from a call or manually. */
export interface Booking {
  id: string;
  tenantId: string;
  patientId: string;
  type: 'NEW_PATIENT' | 'FOLLOW_UP' | 'LAB' | 'TELEHEALTH';
  reason: string;
  provider: string;
  location: string;
  preferredWindow: string;
  scheduledAt?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  sourceCallId: string;
  createdAt: string;
}

/** Call session record (outcome, transcript, summary) shown in UI. */
export interface CallSession {
  id: string;
  tenantId: string;
  callerPhone: string;
  patientId?: string;
  intent: 'BOOKING' | 'RESCHEDULE' | 'CANCEL' | 'BILLING' | 'OTHER';
  outcome: 'BOOKED' | 'PENDING' | 'ESCALATED' | 'DROPPED' | 'FAILED';
  duration: number;
  agentVersion: string;
  aiFlags: string[];
  transcript: { speaker: 'AGENT' | 'USER'; text: string; ts: string }[];
  summary: string[];
  entities: { name?: string; email?: string; bookingType?: string; date?: string; provider?: string };
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string;
}

// ---------------------------------------------------------------------------
// App state (persisted to localStorage)
// ---------------------------------------------------------------------------

/** Full persisted application state. */
export interface AppState {
  me: User | null;
  tenants: Tenant[];
  sessions: CallSession[];
  auditLogs: AuditLog[];
  patients: Patient[];
  bookings: Booking[];
}

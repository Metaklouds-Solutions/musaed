export type Role = 'ADMIN' | 'MANAGER' | 'AGENT_VIEWER';
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface TenantMember {
  id: string;
  email: string;
  role: Role;
}

export interface AgentProfile {
  name: string;
  persona: string;
  language: string;
  defaultBehaviors: string[];
}

export interface Policies {
  piiMasking: boolean;
  retentionDays: number;
  allowedChannels: string[];
}

export interface Quotas {
  callsPerDay: number;
  concurrentSessions: number;
  tokensPerMin: number;
}

export interface Tool {
  key: string;
  name: string;
  enabled: boolean;
}

export interface Integration {
  type: string;
  status: IntegrationStatus;
  config?: Record<string, string>;
}

export interface Tenant {
  id: string;
  name: string;
  status: TenantStatus;
  plan: Plan;
  timezone: string;
  locale: string;
  createdAt: string;
  onboarding: {
    step: number;
    complete: boolean;
  };
  members: TenantMember[];
  agentProfile: AgentProfile;
  policies: Policies;
  quotas: Quotas;
  tools: Tool[];
  integrations: Integration[];
}

export interface SessionEvent {
  ts: string;
  type: string;
  payload?: any;
  tool?: string;
}

export interface Run {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  start: string;
  end?: string;
  costSummary: {
    usd: number;
  };
}

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

export interface AuditLog {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  tenantId: string;
  metadata?: any;
}

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

export interface CallSession {
  id: string;
  tenantId: string;
  callerPhone: string;
  patientId?: string;
  intent: 'BOOKING' | 'RESCHEDULE' | 'CANCEL' | 'BILLING' | 'OTHER';
  outcome: 'BOOKED' | 'PENDING' | 'ESCALATED' | 'DROPPED' | 'FAILED';
  duration: number; // in seconds
  agentVersion: string;
  aiFlags: string[];
  transcript: { speaker: 'AGENT' | 'USER'; text: string; ts: string }[];
  summary: string[];
  entities: { name?: string; email?: string; bookingType?: string; date?: string; provider?: string };
  status: 'ACTIVE' | 'ENDED';
  startedAt: string;
  endedAt?: string;
}

export interface AppState {
  me: User | null;
  tenants: Tenant[];
  sessions: CallSession[];
  auditLogs: AuditLog[];
  patients: Patient[];
  bookings: Booking[];
}

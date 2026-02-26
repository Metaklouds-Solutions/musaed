/**
 * Realistic seed data for local adapter. Every entity includes tenantId where applicable.
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
  VoiceAgent,
} from '../shared/types/entities';

export const seedTenants: Tenant[] = [
  { id: 't_001', name: 'Sunrise Clinic' },
  { id: 't_002', name: 'Metro Dental Group' },
];

/** Extended tenant data for admin dashboard (status, onboarding). */
export const seedTenantExtended: { tenantId: string; status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED'; createdAt: string; onboardingStep: number }[] = [
  { tenantId: 't_001', status: 'ACTIVE', createdAt: '2026-01-15T08:00:00Z', onboardingStep: 4 },
  { tenantId: 't_002', status: 'TRIAL', createdAt: '2026-02-10T14:30:00Z', onboardingStep: 2 },
];

export const seedAgents: Agent[] = [
  { id: 'a_001', tenantId: 't_001', name: 'Agent Sarah' },
  { id: 'a_002', tenantId: 't_001', name: 'Agent Mike' },
  { id: 'a_003', tenantId: 't_002', name: 'Agent Jane' },
];

export const seedCustomers: Customer[] = [
  { id: 'c_001', tenantId: 't_001', name: 'Alice Wong', email: 'alice@example.com' },
  { id: 'c_002', tenantId: 't_001', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'c_003', tenantId: 't_001', name: 'Carol Lee', email: 'carol@example.com' },
  { id: 'c_004', tenantId: 't_002', name: 'David Brown', email: 'david@example.com' },
  { id: 'c_005', tenantId: 't_002', name: 'Eve Davis', email: 'eve@example.com' },
];

export const seedCalls: Call[] = [
  {
    id: 'call_001',
    tenantId: 't_001',
    customerId: 'c_001',
    duration: 245,
    sentimentScore: 0.92,
    transcript: 'Patient: I need to book a follow-up. Agent: I can help with that. When works for you? Patient: Next Tuesday afternoon. Agent: We have 2pm and 4pm. Patient: 2pm please. Agent: Done, you’re booked for Tuesday at 2pm.',
    escalationFlag: false,
    bookingCreated: true,
    bookingId: 'b_001',
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'call_002',
    tenantId: 't_001',
    customerId: 'c_002',
    duration: 180,
    sentimentScore: 0.78,
    transcript: 'Patient: I have a billing question. Agent: Sure, what’s the issue? Patient: I was charged twice. Agent: I’ll escalate to billing to fix that. Patient: Thanks.',
    escalationFlag: true,
    bookingCreated: false,
    createdAt: '2026-02-20T11:30:00Z',
  },
  {
    id: 'call_003',
    tenantId: 't_001',
    customerId: 'c_003',
    duration: 320,
    sentimentScore: 0.85,
    transcript: 'Patient: Need to reschedule my appointment. Agent: No problem. Which date? Patient: Next Friday. Agent: 9am or 3pm? Patient: 9am. Agent: Rescheduled for Friday 9am.',
    escalationFlag: false,
    bookingCreated: true,
    bookingId: 'b_002',
    createdAt: '2026-02-21T09:15:00Z',
  },
  {
    id: 'call_004',
    tenantId: 't_002',
    customerId: 'c_004',
    duration: 195,
    sentimentScore: 0.88,
    transcript: 'Patient: Booking a checkup. Agent: I’ll find a slot. How about Thursday 11am? Patient: Perfect. Agent: Booked for Thursday 11am.',
    escalationFlag: false,
    bookingCreated: true,
    bookingId: 'b_003',
    createdAt: '2026-02-21T14:00:00Z',
  },
  {
    id: 'call_005',
    tenantId: 't_002',
    customerId: 'c_005',
    duration: 90,
    sentimentScore: 0.65,
    transcript: 'Patient: Very upset about the wait time last visit. Agent: I’m sorry. I can note this and have the manager call you. Patient: Yes please.',
    escalationFlag: true,
    bookingCreated: false,
    createdAt: '2026-02-22T08:45:00Z',
  },
];

export const seedBookings: Booking[] = [
  { id: 'b_001', tenantId: 't_001', callId: 'call_001', customerId: 'c_001', amount: 120, status: 'confirmed', createdAt: '2026-02-20T10:05:00Z' },
  { id: 'b_002', tenantId: 't_001', callId: 'call_003', customerId: 'c_003', amount: 95, status: 'confirmed', createdAt: '2026-02-21T09:20:00Z' },
  { id: 'b_003', tenantId: 't_002', callId: 'call_004', customerId: 'c_004', amount: 150, status: 'confirmed', createdAt: '2026-02-21T14:02:00Z' },
];

export const seedAlerts: Alert[] = [
  { id: 'al_001', tenantId: 't_001', severity: 'medium', title: 'Credit balance low', message: 'Credits below 500. Consider topping up.', resolved: false, createdAt: '2026-02-22T07:00:00Z' },
  { id: 'al_002', tenantId: 't_001', severity: 'low', title: 'Scheduled maintenance', message: 'System maintenance tonight 2–4am.', resolved: true, createdAt: '2026-02-21T12:00:00Z' },
  { id: 'al_003', tenantId: 't_002', severity: 'high', title: 'Booking drop', message: 'Unusual drop in booking conversion in last 24h.', resolved: false, createdAt: '2026-02-22T09:00:00Z' },
];

export const seedCredits: Credits[] = [
  { tenantId: 't_001', balance: 420, minutesUsed: 1580 },
  { tenantId: 't_002', balance: 1200, minutesUsed: 800 },
];

/** Admin-only: tenant subscription plans and MRR (platform revenue). */
export const seedTenantPlans: { tenantId: string; plan: string; mrr: number }[] = [
  { tenantId: 't_001', plan: 'PRO', mrr: 299 },
  { tenantId: 't_002', plan: 'ENTERPRISE', mrr: 799 },
];

/** Admin-only: credits top-up revenue (platform revenue). */
export const seedCreditsRevenue = 1240;

/** Admin-only: recent payment failures. */
export const seedPaymentFailures: { id: string; tenantId: string; amount: number; failedAt: string }[] = [
  { id: 'pf_001', tenantId: 't_001', amount: 299, failedAt: '2026-02-21T08:00:00Z' },
];

/** Admin-only: usage anomalies (e.g. from alerts or usage spikes). */
export const seedUsageAnomalies: { id: string; tenantId: string; description: string; severity: 'low' | 'medium' | 'high'; detectedAt: string }[] = [
  { id: 'ua_001', tenantId: 't_001', description: 'Credit balance low', severity: 'medium', detectedAt: '2026-02-22T07:00:00Z' },
  { id: 'ua_002', tenantId: 't_002', description: 'Booking conversion drop', severity: 'high', detectedAt: '2026-02-22T09:00:00Z' },
];

/** Admin-only: churn risk indicators. */
export const seedChurnRisk: { tenantId: string; reason: string; score: number }[] = [
  { tenantId: 't_001', reason: 'Low credit balance + payment failure', score: 72 },
];

/** Voice agents (Retell) per tenant for agent status card. */
export const seedVoiceAgents: VoiceAgent[] = [
  { id: 'va_001', tenantId: 't_001', externalAgentId: 'retell_abc', voice: 'Sarah', language: 'en-US', status: 'active', lastSyncedAt: '2026-02-27T10:00:00Z' },
  { id: 'va_002', tenantId: 't_002', externalAgentId: 'retell_def', voice: 'James', language: 'en-GB', status: 'active', lastSyncedAt: '2026-02-27T09:30:00Z' },
];

/** Tenant memberships for staff counts by role. */
export const seedTenantMemberships: { userId: string; tenantId: string; roleSlug: string; status: string }[] = [
  { userId: 'u1', tenantId: 't_001', roleSlug: 'tenant_owner', status: 'active' },
  { userId: 'u2', tenantId: 't_001', roleSlug: 'doctor', status: 'active' },
  { userId: 'u3', tenantId: 't_001', roleSlug: 'receptionist', status: 'active' },
  { userId: 'u4', tenantId: 't_001', roleSlug: 'receptionist', status: 'active' },
  { userId: 'u5', tenantId: 't_002', roleSlug: 'tenant_owner', status: 'active' },
  { userId: 'u6', tenantId: 't_002', roleSlug: 'doctor', status: 'active' },
];

/** Support tickets for admin dashboard snapshot and help center. */
export const seedSupportTickets: SupportTicket[] = [
  { id: 'st_001', tenantId: 't_001', title: 'Billing discrepancy', category: 'billing', status: 'open', priority: 'high', createdAt: '2026-02-25T09:00:00Z' },
  { id: 'st_002', tenantId: 't_001', title: 'Agent not responding', category: 'technical', status: 'in_progress', priority: 'critical', createdAt: '2026-02-24T14:30:00Z' },
  { id: 'st_003', tenantId: 't_002', title: 'Feature request', category: 'general', status: 'open', priority: 'low', createdAt: '2026-02-26T11:00:00Z' },
  { id: 'st_004', tenantId: 't_002', title: 'Integration setup help', category: 'technical', status: 'resolved', priority: 'medium', createdAt: '2026-02-23T08:00:00Z' },
];

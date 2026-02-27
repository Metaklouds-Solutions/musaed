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
  TicketMessage,
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

/** Tenant settings (timezone, locale, business hours). */
export const seedTenantSettings: { tenantId: string; timezone: string; locale: string; businessHours: string }[] = [
  { tenantId: 't_001', timezone: 'America/New_York', locale: 'en-US', businessHours: 'Mon–Fri 9am–5pm' },
  { tenantId: 't_002', timezone: 'Europe/London', locale: 'en-GB', businessHours: 'Mon–Sat 8am–6pm' },
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

/** Platform agents (Retell catalog) available for deployment to tenants. */
export const seedPlatformAgents: { id: string; name: string; voice: string; language: string }[] = [
  { id: 'pa_001', name: 'Clinic Assistant', voice: 'Sarah', language: 'en-US' },
  { id: 'pa_002', name: 'Reception Bot', voice: 'James', language: 'en-GB' },
  { id: 'pa_003', name: 'Arabic Assistant', voice: 'Layla', language: 'ar-SA' },
];

/** Skills catalog (can be enabled per agent). */
export const seedSkills: { id: string; name: string; description: string }[] = [
  { id: 'sk_001', name: 'Appointment Booking', description: 'Book and reschedule appointments' },
  { id: 'sk_002', name: 'Billing Inquiry', description: 'Answer billing questions' },
  { id: 'sk_003', name: 'Prescription Refill', description: 'Handle refill requests' },
  { id: 'sk_004', name: 'Office Hours', description: 'Provide office hours info' },
];

/** Agent-to-skill mapping: voiceAgentId -> [{ skillId, priority }]. */
export const seedAgentSkills: { agentId: string; skillId: string; priority: number }[] = [
  { agentId: 'va_001', skillId: 'sk_001', priority: 1 },
  { agentId: 'va_001', skillId: 'sk_002', priority: 2 },
  { agentId: 'va_001', skillId: 'sk_004', priority: 3 },
  { agentId: 'va_002', skillId: 'sk_001', priority: 1 },
  { agentId: 'va_002', skillId: 'sk_004', priority: 2 },
];

/** Voice agents (Retell) per tenant for agent status card. */
export const seedVoiceAgents: VoiceAgent[] = [
  { id: 'va_001', tenantId: 't_001', externalAgentId: 'retell_abc', voice: 'Sarah', language: 'en-US', status: 'active', lastSyncedAt: '2026-02-27T10:00:00Z' },
  { id: 'va_002', tenantId: 't_002', externalAgentId: 'retell_def', voice: 'James', language: 'en-GB', status: 'active', lastSyncedAt: '2026-02-27T09:30:00Z' },
];

/** Staff user profiles (name, email) for staff list. */
export const seedStaffUsers: { userId: string; name: string; email: string }[] = [
  { userId: 'u1', name: 'Dr. Sarah Chen', email: 'sarah@sunrise.com' },
  { userId: 'u2', name: 'Dr. Mike Johnson', email: 'mike@sunrise.com' },
  { userId: 'u3', name: 'Emma Wilson', email: 'emma@sunrise.com' },
  { userId: 'u4', name: 'Lisa Brown', email: 'lisa@sunrise.com' },
  { userId: 'u5', name: 'Dr. David Lee', email: 'david@metro.com' },
  { userId: 'u6', name: 'Dr. Anna Park', email: 'anna@metro.com' },
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

/** Ticket messages for chat thread. authorId = userId from seedStaffUsers or 'admin'. */
export const seedTicketMessages: TicketMessage[] = [
  { id: 'tm_001', ticketId: 'st_001', authorId: 'u1', body: 'We were charged twice for last month. Can you please look into this?', createdAt: '2026-02-25T09:00:00Z' },
  { id: 'tm_002', ticketId: 'st_001', authorId: 'admin', body: 'Thanks for reaching out. I\'ve forwarded this to our billing team. They will respond within 24 hours.', createdAt: '2026-02-25T10:30:00Z' },
  { id: 'tm_003', ticketId: 'st_002', authorId: 'u2', body: 'Our agent stopped responding to calls this morning. Status shows active but no inbound.', createdAt: '2026-02-24T14:30:00Z' },
  { id: 'tm_004', ticketId: 'st_002', authorId: 'admin', body: 'Investigating. We\'ve restarted the agent instance. Please try again in 5 minutes.', createdAt: '2026-02-24T15:00:00Z' },
  { id: 'tm_005', ticketId: 'st_003', authorId: 'u5', body: 'Would love to see bulk export of call transcripts. Is this on the roadmap?', createdAt: '2026-02-26T11:00:00Z' },
  { id: 'tm_006', ticketId: 'st_004', authorId: 'u5', body: 'Need help connecting our calendar to the booking flow.', createdAt: '2026-02-23T08:00:00Z' },
  { id: 'tm_007', ticketId: 'st_004', authorId: 'admin', body: 'Here\'s the integration guide: [link]. Let me know if you hit any issues.', createdAt: '2026-02-23T09:15:00Z' },
  { id: 'tm_008', ticketId: 'st_004', authorId: 'u5', body: 'All set, thanks!', createdAt: '2026-02-23T14:00:00Z' },
];

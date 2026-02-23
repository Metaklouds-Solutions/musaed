/**
 * Realistic seed data for local adapter. Every entity includes tenantId where applicable.
 * No component may directly access this; use adapters only.
 */

import type { Tenant, Agent, Customer, Call, Booking, Alert, Credits } from '../shared/types/entities';

export const seedTenants: Tenant[] = [
  { id: 't_001', name: 'Sunrise Clinic' },
  { id: 't_002', name: 'Metro Dental Group' },
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

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
  AgentRun,
  RunEvent,
  StaffProfile,
  Skill,
  ToolDefinition,
  SkillDefinition,
  SkillToolLink,
} from '../shared/types/entities';
import type { TenantListRow, TenantDetailFull, AgentDetailFull } from '../shared/types/admin';

export const seedTenants: Tenant[] = [
  { id: 't_001', name: 'Sunrise Clinic', status: 'ACTIVE', onboardingStep: 4, onboardingComplete: true },
  { id: 't_002', name: 'Metro Dental Group', status: 'TRIAL', onboardingStep: 2, onboardingComplete: false },
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

/** Tenant feature flags. Per-tenant toggles for Reports, Calendar, etc. */
export const seedTenantFeatureFlags: { tenantId: string; featureFlags: { enableReports?: boolean; enableCalendar?: boolean } }[] = [
  { tenantId: 't_001', featureFlags: { enableReports: true, enableCalendar: true } },
  { tenantId: 't_002', featureFlags: { enableReports: true, enableCalendar: false } },
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
    agentVersion: 'A',
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
    agentVersion: 'B',
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
    agentVersion: 'A',
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
    agentVersion: 'B',
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
    agentVersion: 'A',
  },
  { id: 'call_006', tenantId: 't_001', customerId: 'c_001', duration: 156, sentimentScore: 0.91, transcript: 'Patient: Book appointment. Agent: When? Patient: Tomorrow 10am. Agent: Done.', escalationFlag: false, bookingCreated: true, bookingId: 'b_004', createdAt: '2026-02-23T09:00:00Z', agentVersion: 'A' },
  { id: 'call_007', tenantId: 't_001', customerId: 'c_002', duration: 210, sentimentScore: 0.72, transcript: 'Patient: Reschedule. Agent: Which date? Patient: Next week. Agent: Booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_005', createdAt: '2026-02-23T14:30:00Z', agentVersion: 'B' },
  { id: 'call_008', tenantId: 't_001', customerId: 'c_003', duration: 95, sentimentScore: 0.58, transcript: 'Patient: Billing dispute. Agent: Escalating.', escalationFlag: true, bookingCreated: false, createdAt: '2026-02-24T10:15:00Z', agentVersion: 'A' },
  { id: 'call_009', tenantId: 't_001', customerId: 'c_001', duration: 180, sentimentScore: 0.88, transcript: 'Patient: Annual checkup. Agent: Thursday 2pm? Patient: Yes. Agent: Booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_006', createdAt: '2026-02-25T11:00:00Z', agentVersion: 'A' },
  { id: 'call_010', tenantId: 't_001', customerId: 'c_002', duration: 142, sentimentScore: 0.82, transcript: 'Patient: Cancel appointment. Agent: Cancelled. Patient: Thanks.', escalationFlag: false, bookingCreated: false, createdAt: '2026-02-25T15:45:00Z', agentVersion: 'B' },
  { id: 'call_011', tenantId: 't_001', customerId: 'c_003', duration: 268, sentimentScore: 0.94, transcript: 'Patient: Book for family. Agent: How many? Patient: 3. Agent: All booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_007', createdAt: '2026-02-26T09:30:00Z', agentVersion: 'A' },
  { id: 'call_012', tenantId: 't_001', customerId: 'c_001', duration: 120, sentimentScore: 0.76, transcript: 'Patient: Prescription refill. Agent: Sent to doctor. Patient: Ok.', escalationFlag: false, bookingCreated: false, createdAt: '2026-02-27T08:00:00Z', agentVersion: 'A' },
  { id: 'call_013', tenantId: 't_001', customerId: 'c_002', duration: 195, sentimentScore: 0.89, transcript: 'Patient: New patient booking. Agent: We have slots. Patient: Monday. Agent: 9am booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_008', createdAt: '2026-02-27T13:20:00Z', agentVersion: 'B' },
  { id: 'call_014', tenantId: 't_001', customerId: 'c_003', duration: 88, sentimentScore: 0.62, transcript: 'Patient: Complaint about wait. Agent: Escalating to manager.', escalationFlag: true, bookingCreated: false, createdAt: '2026-02-28T10:00:00Z', agentVersion: 'A' },
  { id: 'call_015', tenantId: 't_002', customerId: 'c_004', duration: 165, sentimentScore: 0.85, transcript: 'Patient: Dental checkup. Agent: Friday 11am? Patient: Perfect.', escalationFlag: false, bookingCreated: true, bookingId: 'b_009', createdAt: '2026-02-23T10:30:00Z', agentVersion: 'B' },
  { id: 'call_016', tenantId: 't_002', customerId: 'c_005', duration: 132, sentimentScore: 0.79, transcript: 'Patient: Cleaning appointment. Agent: Next week? Patient: Tuesday. Agent: Done.', escalationFlag: false, bookingCreated: true, bookingId: 'b_010', createdAt: '2026-02-24T14:00:00Z', agentVersion: 'A' },
  { id: 'call_017', tenantId: 't_002', customerId: 'c_004', duration: 98, sentimentScore: 0.55, transcript: 'Patient: Billing issue. Agent: Escalating.', escalationFlag: true, bookingCreated: false, createdAt: '2026-02-25T09:15:00Z', agentVersion: 'B' },
  { id: 'call_018', tenantId: 't_002', customerId: 'c_005', duration: 220, sentimentScore: 0.92, transcript: 'Patient: Orthodontics consult. Agent: We have Dr. Park. Patient: Next month. Agent: Booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_011', createdAt: '2026-02-26T11:45:00Z', agentVersion: 'A' },
  { id: 'call_019', tenantId: 't_002', customerId: 'c_004', duration: 145, sentimentScore: 0.81, transcript: 'Patient: Reschedule cleaning. Agent: New date? Patient: March 5. Agent: Rescheduled.', escalationFlag: false, bookingCreated: true, bookingId: 'b_012', createdAt: '2026-02-27T16:00:00Z', agentVersion: 'B' },
  { id: 'call_020', tenantId: 't_002', customerId: 'c_005', duration: 175, sentimentScore: 0.87, transcript: 'Patient: Emergency appointment. Agent: We have 3pm today. Patient: Yes. Agent: Booked.', escalationFlag: false, bookingCreated: true, bookingId: 'b_013', createdAt: '2026-02-28T08:30:00Z', agentVersion: 'A' },
];

export const seedBookings: Booking[] = [
  { id: 'b_001', tenantId: 't_001', callId: 'call_001', customerId: 'c_001', amount: 120, status: 'confirmed', createdAt: '2026-02-20T10:05:00Z' },
  { id: 'b_002', tenantId: 't_001', callId: 'call_003', customerId: 'c_003', amount: 95, status: 'confirmed', createdAt: '2026-02-21T09:20:00Z' },
  { id: 'b_003', tenantId: 't_002', callId: 'call_004', customerId: 'c_004', amount: 150, status: 'confirmed', createdAt: '2026-02-21T14:02:00Z' },
  { id: 'b_004', tenantId: 't_001', callId: 'call_006', customerId: 'c_001', amount: 85, status: 'confirmed', createdAt: '2026-02-23T09:05:00Z' },
  { id: 'b_005', tenantId: 't_001', callId: 'call_007', customerId: 'c_002', amount: 110, status: 'confirmed', createdAt: '2026-02-23T14:35:00Z' },
  { id: 'b_006', tenantId: 't_001', callId: 'call_009', customerId: 'c_001', amount: 120, status: 'confirmed', createdAt: '2026-02-25T11:05:00Z' },
  { id: 'b_007', tenantId: 't_001', callId: 'call_011', customerId: 'c_003', amount: 285, status: 'confirmed', createdAt: '2026-02-26T09:35:00Z' },
  { id: 'b_008', tenantId: 't_001', callId: 'call_013', customerId: 'c_002', amount: 95, status: 'confirmed', createdAt: '2026-02-27T13:25:00Z' },
  { id: 'b_009', tenantId: 't_002', callId: 'call_015', customerId: 'c_004', amount: 180, status: 'confirmed', createdAt: '2026-02-23T10:35:00Z' },
  { id: 'b_010', tenantId: 't_002', callId: 'call_016', customerId: 'c_005', amount: 95, status: 'confirmed', createdAt: '2026-02-24T14:05:00Z' },
  { id: 'b_011', tenantId: 't_002', callId: 'call_018', customerId: 'c_005', amount: 250, status: 'confirmed', createdAt: '2026-02-26T11:50:00Z' },
  { id: 'b_012', tenantId: 't_002', callId: 'call_019', customerId: 'c_004', amount: 95, status: 'confirmed', createdAt: '2026-02-27T16:05:00Z' },
  { id: 'b_013', tenantId: 't_002', callId: 'call_020', customerId: 'c_005', amount: 150, status: 'confirmed', createdAt: '2026-02-28T08:35:00Z' },
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
export const seedSkills: Skill[] = [
  { id: 'sk_001', name: 'Appointment Booking', description: 'Book and reschedule appointments', deprecated: false },
  { id: 'sk_002', name: 'Billing Inquiry', description: 'Answer billing questions', deprecated: false },
  { id: 'sk_003', name: 'Prescription Refill', description: 'Handle refill requests', deprecated: false },
  { id: 'sk_004', name: 'Office Hours', description: 'Provide office hours info', deprecated: false },
];

/** Agent-to-skill mapping: voiceAgentId -> [{ skillId, priority }]. */
export const seedAgentSkills: { agentId: string; skillId: string; priority: number }[] = [
  { agentId: 'va_001', skillId: 'sk_001', priority: 1 },
  { agentId: 'va_001', skillId: 'sk_002', priority: 2 },
  { agentId: 'va_001', skillId: 'sk_004', priority: 3 },
  { agentId: 'va_002', skillId: 'sk_001', priority: 1 },
  { agentId: 'va_002', skillId: 'sk_004', priority: 2 },
];

const now = () => new Date().toISOString();

/** Tool definitions (definition-driven, platform tools). */
export const seedToolDefinitions: ToolDefinition[] = [
  { id: 'td_001', name: 'check_availability', displayName: 'Check Appointment Availability', description: 'Query open slots by date, doctor, location', category: 'booking', executionType: 'internal', handlerKey: 'query_bookings', parametersSchema: { type: 'object', properties: { date: { type: 'string' }, doctorId: { type: 'string' }, locationId: { type: 'string' } } }, timeoutMs: 5000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_002', name: 'book_appointment', displayName: 'Book Appointment', description: 'Create a booking record for a patient', category: 'booking', executionType: 'internal', handlerKey: 'create_booking', parametersSchema: { type: 'object', properties: { patientId: { type: 'string' }, slot: { type: 'string' }, doctorId: { type: 'string' } } }, timeoutMs: 5000, retryOnFail: true, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_003', name: 'cancel_appointment', displayName: 'Cancel Appointment', description: 'Cancel an existing booking', category: 'booking', executionType: 'internal', handlerKey: 'cancel_booking', parametersSchema: { type: 'object', properties: { bookingId: { type: 'string' } } }, timeoutMs: 3000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_004', name: 'reschedule_appointment', displayName: 'Reschedule Appointment', description: 'Cancel old booking and create new one', category: 'booking', executionType: 'internal', handlerKey: 'reschedule_booking', parametersSchema: { type: 'object', properties: { bookingId: { type: 'string' }, newSlot: { type: 'string' } } }, timeoutMs: 5000, retryOnFail: true, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_005', name: 'get_patient_info', displayName: 'Get Patient Info', description: 'Look up patient by phone or name', category: 'patient', executionType: 'internal', handlerKey: 'lookup_patient', parametersSchema: { type: 'object', properties: { phone: { type: 'string' }, name: { type: 'string' } } }, timeoutMs: 3000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_006', name: 'register_patient', displayName: 'Register New Patient', description: 'Create new patient record', category: 'patient', executionType: 'internal', handlerKey: 'create_patient', parametersSchema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' } } }, timeoutMs: 3000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_007', name: 'get_business_hours', displayName: 'Get Business Hours', description: 'Return clinic operating hours', category: 'clinic_info', executionType: 'internal', handlerKey: 'get_business_hours', parametersSchema: { type: 'object' }, timeoutMs: 1000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_008', name: 'get_clinic_services', displayName: 'Get Clinic Services', description: 'Return services offered by the clinic', category: 'clinic_info', executionType: 'internal', handlerKey: 'get_services', parametersSchema: { type: 'object' }, timeoutMs: 1000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_009', name: 'transfer_to_human', displayName: 'Transfer to Human', description: 'Initiate call transfer to on-duty staff', category: 'escalation', executionType: 'internal', handlerKey: 'transfer_call', parametersSchema: { type: 'object', properties: { reason: { type: 'string' } } }, timeoutMs: 5000, retryOnFail: true, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_010', name: 'send_confirmation_sms', displayName: 'Send Confirmation SMS', description: 'Send booking confirmation via SMS', category: 'communication', executionType: 'internal', handlerKey: 'send_sms', parametersSchema: { type: 'object', properties: { phone: { type: 'string' }, message: { type: 'string' } } }, timeoutMs: 5000, retryOnFail: true, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'td_011', name: 'submit_support_request', displayName: 'Submit Support Request', description: 'Log complaint or issue as support ticket', category: 'custom', executionType: 'internal', handlerKey: 'create_ticket', parametersSchema: { type: 'object', properties: { subject: { type: 'string' }, message: { type: 'string' } } }, timeoutMs: 3000, retryOnFail: false, scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
];

/** Skill definitions (definition-driven, platform skills). */
export const seedSkillDefinitions: SkillDefinition[] = [
  { id: 'sdef_001', name: 'appointment_booking', displayName: 'Appointment Booking', description: 'Full flow: ask date, check availability, patient picks slot, book, confirm', category: 'core', flowDefinition: { nodes: [], entry_prompt: 'Help the user book an appointment' }, entryConditions: 'patient mentions booking, appointment, schedule', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'sdef_002', name: 'appointment_management', displayName: 'Appointment Management', description: 'Cancel, reschedule, or check status of existing appointment', category: 'core', flowDefinition: { nodes: [], entry_prompt: 'Help with cancelling or rescheduling' }, entryConditions: 'patient mentions cancel, reschedule, change appointment', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'sdef_003', name: 'patient_identification', displayName: 'Patient Identification', description: 'Verify returning patient and pull up their record', category: 'core', flowDefinition: { nodes: [], entry_prompt: 'Verify patient identity' }, entryConditions: 'patient provides name or phone', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'sdef_004', name: 'faq_clinic_info', displayName: 'FAQ / Clinic Info', description: 'Answer questions about hours, services, location, parking', category: 'core', flowDefinition: { nodes: [], entry_prompt: 'Provide clinic information' }, entryConditions: 'patient asks about hours, services, address', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'sdef_005', name: 'human_escalation', displayName: 'Human Escalation', description: 'Detect frustration or complex question, transfer to human', category: 'core', flowDefinition: { nodes: [], entry_prompt: 'Transfer to staff when needed' }, entryConditions: 'patient requests human, says emergency, or expresses frustration', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
  { id: 'sdef_006', name: 'complaint_support', displayName: 'Complaint / Support', description: 'Patient has an issue, log it as support ticket', category: 'specialty', flowDefinition: { nodes: [], entry_prompt: 'Record and escalate the complaint' }, entryConditions: 'patient mentions complaint, issue, problem', retellSyncStatus: 'draft', scope: 'platform', isActive: true, version: 1, createdAt: now(), updatedAt: now() },
];

/** Skill-to-tool links (N:M). */
export const seedSkillToolLinks: SkillToolLink[] = [
  { id: 'stl_001', skillId: 'sdef_001', toolId: 'td_001', nodeReference: 'check_slot', isRequired: true, createdAt: now() },
  { id: 'stl_002', skillId: 'sdef_001', toolId: 'td_002', nodeReference: 'book_slot', isRequired: true, createdAt: now() },
  { id: 'stl_003', skillId: 'sdef_001', toolId: 'td_010', nodeReference: 'confirm', isRequired: false, createdAt: now() },
  { id: 'stl_004', skillId: 'sdef_002', toolId: 'td_003', nodeReference: 'cancel', isRequired: false, createdAt: now() },
  { id: 'stl_005', skillId: 'sdef_002', toolId: 'td_004', nodeReference: 'reschedule', isRequired: false, createdAt: now() },
  { id: 'stl_006', skillId: 'sdef_002', toolId: 'td_001', nodeReference: 'check_slot', isRequired: false, createdAt: now() },
  { id: 'stl_007', skillId: 'sdef_003', toolId: 'td_005', nodeReference: 'lookup', isRequired: true, createdAt: now() },
  { id: 'stl_008', skillId: 'sdef_004', toolId: 'td_007', nodeReference: 'hours', isRequired: false, createdAt: now() },
  { id: 'stl_009', skillId: 'sdef_004', toolId: 'td_008', nodeReference: 'services', isRequired: false, createdAt: now() },
  { id: 'stl_010', skillId: 'sdef_005', toolId: 'td_009', nodeReference: 'transfer', isRequired: true, createdAt: now() },
  { id: 'stl_011', skillId: 'sdef_006', toolId: 'td_011', nodeReference: 'create_ticket', isRequired: true, createdAt: now() },
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

/** Staff profiles (doctor availability, specialties). */
export const seedStaffProfiles: StaffProfile[] = [
  { userId: 'u1', tenantId: 't_001', availability: [{ day: 'mon', start: '09:00', end: '17:00' }, { day: 'tue', start: '09:00', end: '17:00' }, { day: 'wed', start: '09:00', end: '17:00' }], specialties: ['General Practice'] },
  { userId: 'u2', tenantId: 't_001', availability: [{ day: 'thu', start: '10:00', end: '18:00' }, { day: 'fri', start: '10:00', end: '18:00' }], specialties: ['Pediatrics'] },
  { userId: 'u5', tenantId: 't_002', availability: [{ day: 'mon', start: '08:00', end: '16:00' }, { day: 'wed', start: '08:00', end: '16:00' }], specialties: ['Dental'] },
  { userId: 'u6', tenantId: 't_002', availability: [{ day: 'tue', start: '09:00', end: '17:00' }, { day: 'thu', start: '09:00', end: '17:00' }], specialties: ['Orthodontics'] },
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

/** Agent runs (AI execution per call). */
export const seedAgentRuns: AgentRun[] = [
  { id: 'run_001', callId: 'call_001', tenantId: 't_001', usage: { cost: 0.12, tokens: 2400 }, startedAt: '2026-02-20T10:00:00Z', agentVersion: 'A' },
  { id: 'run_002', callId: 'call_002', tenantId: 't_001', usage: { cost: 0.09, tokens: 1800 }, startedAt: '2026-02-20T11:30:00Z', agentVersion: 'B' },
  { id: 'run_003', callId: 'call_003', tenantId: 't_001', usage: { cost: 0.15, tokens: 3200 }, startedAt: '2026-02-21T09:15:00Z', agentVersion: 'A' },
  { id: 'run_004', callId: 'call_004', tenantId: 't_002', usage: { cost: 0.10, tokens: 1950 }, startedAt: '2026-02-21T14:00:00Z', agentVersion: 'B' },
  { id: 'run_005', callId: 'call_005', tenantId: 't_002', usage: { cost: 0.05, tokens: 900 }, startedAt: '2026-02-22T08:45:00Z', agentVersion: 'A' },
  { id: 'run_006', callId: 'call_006', tenantId: 't_001', usage: { cost: 0.08, tokens: 1560 }, startedAt: '2026-02-23T09:00:00Z', agentVersion: 'A' },
  { id: 'run_007', callId: 'call_007', tenantId: 't_001', usage: { cost: 0.11, tokens: 2100 }, startedAt: '2026-02-23T14:30:00Z', agentVersion: 'B' },
  { id: 'run_008', callId: 'call_008', tenantId: 't_001', usage: { cost: 0.05, tokens: 950 }, startedAt: '2026-02-24T10:15:00Z', agentVersion: 'A' },
  { id: 'run_009', callId: 'call_009', tenantId: 't_001', usage: { cost: 0.09, tokens: 1800 }, startedAt: '2026-02-25T11:00:00Z', agentVersion: 'A' },
  { id: 'run_010', callId: 'call_010', tenantId: 't_001', usage: { cost: 0.07, tokens: 1420 }, startedAt: '2026-02-25T15:45:00Z', agentVersion: 'B' },
  { id: 'run_011', callId: 'call_011', tenantId: 't_001', usage: { cost: 0.14, tokens: 2680 }, startedAt: '2026-02-26T09:30:00Z', agentVersion: 'A' },
  { id: 'run_012', callId: 'call_012', tenantId: 't_001', usage: { cost: 0.06, tokens: 1200 }, startedAt: '2026-02-27T08:00:00Z', agentVersion: 'A' },
  { id: 'run_013', callId: 'call_013', tenantId: 't_001', usage: { cost: 0.10, tokens: 1950 }, startedAt: '2026-02-27T13:20:00Z', agentVersion: 'B' },
  { id: 'run_014', callId: 'call_014', tenantId: 't_001', usage: { cost: 0.04, tokens: 880 }, startedAt: '2026-02-28T10:00:00Z', agentVersion: 'A' },
  { id: 'run_015', callId: 'call_015', tenantId: 't_002', usage: { cost: 0.08, tokens: 1650 }, startedAt: '2026-02-23T10:30:00Z', agentVersion: 'B' },
  { id: 'run_016', callId: 'call_016', tenantId: 't_002', usage: { cost: 0.07, tokens: 1320 }, startedAt: '2026-02-24T14:00:00Z', agentVersion: 'A' },
  { id: 'run_017', callId: 'call_017', tenantId: 't_002', usage: { cost: 0.05, tokens: 980 }, startedAt: '2026-02-25T09:15:00Z', agentVersion: 'B' },
  { id: 'run_018', callId: 'call_018', tenantId: 't_002', usage: { cost: 0.11, tokens: 2200 }, startedAt: '2026-02-26T11:45:00Z', agentVersion: 'A' },
  { id: 'run_019', callId: 'call_019', tenantId: 't_002', usage: { cost: 0.07, tokens: 1450 }, startedAt: '2026-02-27T16:00:00Z', agentVersion: 'B' },
  { id: 'run_020', callId: 'call_020', tenantId: 't_002', usage: { cost: 0.09, tokens: 1750 }, startedAt: '2026-02-28T08:30:00Z', agentVersion: 'A' },
];

/** Run events for debugging (step-by-step execution). */
export const seedRunEvents: RunEvent[] = [
  { id: 'ev_001', runId: 'run_001', eventType: 'call_started', payload: { callId: 'call_001', agentId: 'va_001' }, timestamp: '2026-02-20T10:00:00.100Z' },
  { id: 'ev_002', runId: 'run_001', eventType: 'intent_detected', payload: { intent: 'book_appointment', confidence: 0.95 }, timestamp: '2026-02-20T10:00:05.200Z' },
  { id: 'ev_003', runId: 'run_001', eventType: 'skill_invoked', payload: { skillId: 'sk_001', skillName: 'Appointment Booking' }, timestamp: '2026-02-20T10:00:06.100Z' },
  { id: 'ev_004', runId: 'run_001', eventType: 'booking_created', payload: { slot: '2026-02-25T14:00:00Z', patientId: 'c_001' }, timestamp: '2026-02-20T10:04:05.500Z' },
  { id: 'ev_005', runId: 'run_001', eventType: 'call_ended', payload: { outcome: 'booked', duration: 245 }, timestamp: '2026-02-20T10:04:05.800Z' },
  { id: 'ev_006', runId: 'run_002', eventType: 'call_started', payload: { callId: 'call_002', agentId: 'va_001' }, timestamp: '2026-02-20T11:30:00.050Z' },
  { id: 'ev_007', runId: 'run_002', eventType: 'intent_detected', payload: { intent: 'billing_inquiry', confidence: 0.88 }, timestamp: '2026-02-20T11:30:03.100Z' },
  { id: 'ev_008', runId: 'run_002', eventType: 'escalation_triggered', payload: { reason: 'billing_dispute', targetRole: 'receptionist' }, timestamp: '2026-02-20T11:32:45.200Z' },
  { id: 'ev_009', runId: 'run_002', eventType: 'call_ended', payload: { outcome: 'escalated', duration: 180 }, timestamp: '2026-02-20T11:33:00.100Z' },
  { id: 'ev_010', runId: 'run_003', eventType: 'call_started', payload: { callId: 'call_003', agentId: 'va_001' }, timestamp: '2026-02-21T09:15:00.000Z' },
  { id: 'ev_011', runId: 'run_003', eventType: 'call_ended', payload: { outcome: 'booked', duration: 320 }, timestamp: '2026-02-21T09:20:20.000Z' },
];

/** Audit log entries (admin actions). */
/** Webhook event log for Admin Settings > Integrations. */
export const seedWebhookEvents: { id: string; endpoint: string; eventType: string; status: 'success' | 'failed' | 'pending'; statusCode?: number; attemptedAt: string; retryCount: number; lastError?: string }[] = [
  { id: 'wh_001', endpoint: 'https://api.example.com/webhooks/call-ended', eventType: 'call.ended', status: 'success', statusCode: 200, attemptedAt: '2026-02-27T14:30:00Z', retryCount: 0 },
  { id: 'wh_002', endpoint: 'https://api.example.com/webhooks/booking-created', eventType: 'booking.created', status: 'success', statusCode: 200, attemptedAt: '2026-02-27T14:25:00Z', retryCount: 0 },
  { id: 'wh_003', endpoint: 'https://api.example.com/webhooks/call-ended', eventType: 'call.ended', status: 'failed', statusCode: 504, attemptedAt: '2026-02-27T14:20:00Z', retryCount: 2, lastError: 'Gateway timeout' },
  { id: 'wh_004', endpoint: 'https://hooks.tenant.com/events', eventType: 'call.ended', status: 'failed', statusCode: 401, attemptedAt: '2026-02-27T14:15:00Z', retryCount: 1, lastError: 'Unauthorized' },
  { id: 'wh_005', endpoint: 'https://api.example.com/webhooks/booking-created', eventType: 'booking.created', status: 'pending', attemptedAt: '2026-02-27T14:10:00Z', retryCount: 0 },
];

export const seedAuditLog: { id: string; action: string; userId: string; tenantId?: string; meta?: Record<string, unknown>; timestamp: string }[] = [
  { id: 'audit_001', action: 'tenant.created', userId: 'admin', tenantId: 't_001', meta: { name: 'Sunrise Clinic', plan: 'PRO' }, timestamp: '2026-01-15T08:00:00Z' },
  { id: 'audit_002', action: 'agent.assigned', userId: 'admin', tenantId: 't_001', meta: { agentId: 'a_001', agentName: 'Agent Sarah' }, timestamp: '2026-01-15T08:05:00Z' },
  { id: 'audit_003', action: 'tenant.created', userId: 'admin', tenantId: 't_002', meta: { name: 'Metro Dental Group', plan: 'ENTERPRISE' }, timestamp: '2026-02-10T14:30:00Z' },
  { id: 'audit_004', action: 'ticket.assigned', userId: 'admin', meta: { ticketId: 'st_002', tenantId: 't_001' }, timestamp: '2026-02-24T15:00:00Z' },
];

/** Tenant list rows for AdminTenantsPage (7 tenants per MUSAED spec). */
export const seedTenantListRows: TenantListRow[] = [
  { id: 't_001', name: 'Sunrise Medical Clinic', plan: 'Pro', status: 'ACTIVE', agentCount: 2, mrr: 299, callsThisMonth: 847, onboardingStatus: 'Complete', createdAt: '2025-01-12T08:00:00Z' },
  { id: 't_002', name: 'Al Noor Dental Center', plan: 'Starter', status: 'ACTIVE', agentCount: 1, mrr: 99, callsThisMonth: 234, onboardingStatus: 'Complete', createdAt: '2025-02-03T14:30:00Z' },
  { id: 't_003', name: 'HealthFirst Physiotherapy', plan: 'Pro', status: 'TRIAL', agentCount: 1, mrr: 0, callsThisMonth: 56, onboardingStatus: 'Step 2/4', createdAt: '2025-03-01T09:00:00Z' },
  { id: 't_004', name: 'City Eye Specialists', plan: 'Enterprise', status: 'ACTIVE', agentCount: 3, mrr: 599, callsThisMonth: 1203, onboardingStatus: 'Complete', createdAt: '2024-11-20T10:00:00Z' },
  { id: 't_005', name: 'Greenway Family Practice', plan: 'Starter', status: 'SUSPENDED', agentCount: 1, mrr: 0, callsThisMonth: 0, onboardingStatus: 'Complete', createdAt: '2024-10-05T08:00:00Z' },
  { id: 't_006', name: 'Prime Cardiology Center', plan: 'Pro', status: 'ACTIVE', agentCount: 2, mrr: 299, callsThisMonth: 612, onboardingStatus: 'Complete', createdAt: '2024-12-14T11:00:00Z' },
  { id: 't_007', name: 'Al Shifa Pediatric Clinic', plan: 'Starter', status: 'TRIAL', agentCount: 1, mrr: 0, callsThisMonth: 89, onboardingStatus: 'Step 1/4', createdAt: '2025-03-10T09:00:00Z' },
];

/** Full tenant detail for t_001 (Sunrise Medical Clinic) per MUSAED spec. */
export const seedTenantDetail: TenantDetailFull = {
  id: 't_001',
  profile: {
    clinicName: 'Sunrise Medical Clinic',
    owner: 'Dr. Sarah Al-Rashidi',
    email: 'sarah@sunrisemedical.com',
    phone: '+966 50 123 4567',
    address: 'King Fahd Road, Riyadh, SA',
    timezone: 'Asia/Riyadh (UTC+3)',
    locale: 'en-SA',
    plan: 'Pro',
    status: 'ACTIVE',
    mrr: 299,
    createdAt: 'January 12, 2025',
    lastActive: 'March 2, 2025',
  },
  onboarding: [
    { step: 1, title: 'Clinic Info Submitted', done: true },
    { step: 2, title: 'Agent Deployed', done: true },
    { step: 3, title: 'First Call Received', done: true },
    { step: 4, title: 'Billing Activated', done: true },
  ],
  quickStats: {
    totalCalls: 847,
    bookingsCreated: 612,
    escalations: 43,
    conversionRate: 72.3,
    avgCallDuration: '2m 14s',
    creditsUsed: 1694,
    creditsRemaining: 306,
  },
  members: [
    { name: 'Dr. Sarah Al-Rashidi', role: 'Tenant Owner', status: 'active', joined: 'Jan 12, 2025' },
    { name: 'Mohammed Al-Harbi', role: 'Receptionist', status: 'active', joined: 'Jan 15, 2025' },
    { name: 'Dr. Layla Hassan', role: 'Doctor', status: 'active', joined: 'Jan 15, 2025' },
    { name: 'Dr. Omar Khalid', role: 'Doctor', status: 'invited', joined: 'Feb 20, 2025' },
    { name: 'Fatima Noor', role: 'Auditor', status: 'active', joined: 'Feb 1, 2025' },
  ],
  agents: [
    { id: 'va_001', name: 'Sunrise Voice Agent', channel: 'voice', status: 'Active', voice: 'Aria (Female)', language: 'English', lastSynced: '2 min ago' },
    { id: 'va_chat_001', name: 'Sunrise Chat Agent', channel: 'chat', status: 'Active', voice: '—', language: 'English + Arabic', lastSynced: '5 min ago' },
  ],
  tickets: [
    { id: '#1042', title: 'Agent not booking correctly', priority: 'High', status: 'Open', createdAt: 'Mar 1, 2025' },
    { id: '#1038', title: 'Arabic responses broken', priority: 'Medium', status: 'In Progress', createdAt: 'Feb 26, 2025' },
    { id: '#1031', title: 'Billing invoice missing', priority: 'Low', status: 'Resolved', createdAt: 'Feb 20, 2025' },
  ],
  billing: {
    currentPlan: 'Pro — $299/month',
    nextBillingDate: 'April 1, 2025',
    lastPayment: '$299 — March 1, 2025',
    paymentMethod: 'Visa ending 4242',
    creditsBalance: 306,
    overageRate: '$0.08/min',
  },
  settings: {
    businessHours: 'Sun–Thu, 8:00 AM – 6:00 PM',
    afterHoursBehavior: 'Voicemail + Callback',
    notifications: 'Email + SMS',
    featureFlags: { enableReports: true, enableCalendar: true, enableABTesting: true },
    pmsIntegration: 'Nabbra (Connected)',
  },
};

/** Full agent detail for va_001 (Sunrise Voice Agent) per MUSAED spec. */
export const seedAgentDetail: AgentDetailFull = {
  id: 'va_001',
  name: 'Sunrise Voice Agent',
  retellAgentId: 'agent_4f8a2b1c9d3e7f0a',
  tenantId: 't_001',
  tenantName: 'Sunrise Medical Clinic',
  channel: 'voice',
  createdAt: 'January 14, 2025',
  lastSynced: 'March 3, 2025 — 10:42 AM',
  syncStatus: 'In Sync',
  voiceConfig: {
    voiceId: 'retell_voice_aria_en_female',
    voiceName: 'Aria',
    gender: 'Female',
    accent: 'Neutral English',
    speakingRate: 1,
    stability: 0.75,
    similarityBoost: 0.85,
    fillerWords: true,
    interruptionSensitivity: 'Medium',
    ambientSound: false,
  },
  chatConfig: {
    status: 'Active',
    channel: 'Web Chat Widget',
    widgetEmbed: '<script src="musaed.ai/widget/abc123">',
    languages: ['English', 'Arabic'],
    fallbackBehavior: 'Escalate to receptionist',
    typingIndicator: true,
    responseDelay: 800,
  },
  emailConfig: {
    status: 'Not Configured',
    inboundEmail: '—',
    autoReply: '—',
    note: 'Available on Enterprise plan',
  },
  llmConfig: {
    model: 'GPT-4o (via Retell)',
    systemPrompt: 'You are a helpful medical receptionist for Sunrise Medical Clinic...',
    temperature: 0.7,
    maxTokens: 1024,
    customPromptEnabled: true,
    languageDetection: 'Auto',
    fallbackLanguage: 'English',
  },
  skills: [
    { id: 'sk_001', name: 'Appointment Booking', enabled: true, priority: 1 },
    { id: 'sk_002', name: 'Appointment Rescheduling', enabled: true, priority: 2 },
    { id: 'sk_003', name: 'Appointment Cancellation', enabled: true, priority: 3 },
    { id: 'sk_004', name: 'FAQ Answering', enabled: true, priority: 4 },
    { id: 'sk_005', name: 'Insurance Verification', enabled: false, priority: 0 },
    { id: 'sk_006', name: 'Prescription Refill', enabled: false, priority: 0 },
    { id: 'sk_007', name: 'Emergency Escalation', enabled: true, priority: 5 },
    { id: 'sk_008', name: 'Callback Scheduling', enabled: true, priority: 6 },
  ],
  performance: {
    totalCalls: 847,
    avgHandleTime: '2m 14s',
    successfulBookings: 612,
    escalations: 43,
    avgSentimentScore: 0.81,
    firstCallResolution: 89,
    interruptionRate: 4.2,
    silenceRate: 1.8,
  },
  abTest: {
    status: 'Active Test',
    versionA: 'Aria voice, Temp 0.7 (50% traffic)',
    versionB: 'Nova voice, Temp 0.5 (50% traffic)',
    splitPercent: 50,
    started: 'Feb 15, 2025',
    winnerSoFar: 'Version A (+8% conversion)',
  },
  recentRuns: [
    { runId: 'run_9a3f', callId: 'call_7c2d', started: 'Mar 3, 10:41 AM', duration: '2m 18s', tokensUsed: 834, status: 'Success' },
    { runId: 'run_8b1e', callId: 'call_6b1c', started: 'Mar 3, 10:38 AM', duration: '1m 52s', tokensUsed: 712, status: 'Success' },
    { runId: 'run_7d4a', callId: 'call_5a0b', started: 'Mar 3, 10:31 AM', duration: '3m 05s', tokensUsed: 1102, status: 'Escalated' },
    { runId: 'run_6c9f', callId: 'call_4f9a', started: 'Mar 3, 10:22 AM', duration: '0m 44s', tokensUsed: 298, status: 'Dropped' },
  ],
  syncInfo: {
    webhookUrl: 'https://api.musaed.ai/webhooks/retell',
    lastWebhookEvent: 'call.ended — Mar 3, 10:41 AM',
    webhookStatus: 'Healthy',
    autoSync: 'Every 5 minutes',
  },
};

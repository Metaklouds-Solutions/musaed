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
import type { TenantListRow, TenantDetailFull, AgentDetailFull } from '../shared/types/admin';

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

const now = () => new Date().toISOString();

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

export const seedTenantDetail: TenantDetailFull = {
  id: '',
  profile: {
    clinicName: '',
    owner: '',
    email: '',
    phone: '',
    address: '',
    timezone: '',
    locale: '',
    plan: '',
    status: 'ACTIVE',
    mrr: 0,
    createdAt: '',
    lastActive: '',
  },
  onboarding: [],
  quickStats: {
    totalCalls: 0,
    bookingsCreated: 0,
    escalations: 0,
    conversionRate: 0,
    avgCallDuration: '—',
    creditsUsed: 0,
    creditsRemaining: 0,
  },
  members: [],
  agents: [],
  tickets: [],
  billing: {
    currentPlan: '',
    nextBillingDate: '',
    lastPayment: '',
    paymentMethod: '',
    creditsBalance: 0,
    overageRate: '',
  },
  settings: {
    businessHours: '',
    afterHoursBehavior: '',
    notifications: '',
    featureFlags: {},
    pmsIntegration: '',
  },
};

export const seedAgentDetail: AgentDetailFull = {
  id: '',
  name: '',
  retellAgentId: '',
  tenantId: '',
  tenantName: '',
  channel: 'voice',
  createdAt: '',
  lastSynced: '',
  syncStatus: '',
  voiceConfig: {
    voiceId: '',
    voiceName: '—',
    gender: '',
    accent: '',
    speakingRate: 1,
    stability: 0.75,
    similarityBoost: 0.85,
    fillerWords: true,
    interruptionSensitivity: 'Medium',
    ambientSound: false,
  },
  chatConfig: {
    status: 'Not Configured',
    channel: '',
    widgetEmbed: '',
    languages: [],
    fallbackBehavior: '',
    typingIndicator: false,
    responseDelay: 0,
  },
  emailConfig: {
    status: 'Not Configured',
    inboundEmail: '—',
    autoReply: '—',
    note: '',
  },
  llmConfig: {
    model: 'GPT-4o',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1024,
    customPromptEnabled: false,
    languageDetection: 'Auto',
    fallbackLanguage: 'English',
  },
  skills: [],
  performance: {
    totalCalls: 0,
    avgHandleTime: '—',
    successfulBookings: 0,
    escalations: 0,
    avgSentimentScore: 0,
    firstCallResolution: 0,
    interruptionRate: 0,
    silenceRate: 0,
  },
  abTest: {
    status: 'Inactive',
    versionA: '',
    versionB: '',
    splitPercent: 50,
    started: '',
    winnerSoFar: '',
  },
  recentRuns: [],
  syncInfo: {
    webhookUrl: '',
    lastWebhookEvent: '',
    webhookStatus: '—',
    autoSync: '—',
  },
};

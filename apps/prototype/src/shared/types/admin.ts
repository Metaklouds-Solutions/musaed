/**
 * Admin (platform) metrics. Used by admin adapter and admin module only.
 */

export interface TenantPlan {
  tenantId: string;
  plan: string;
  mrr: number;
}

/** Admin agent row for agents table. */
export interface AdminAgentRow {
  id: string;
  baseAgentInstanceId?: string | null;
  linkedTenantCount?: number;
  name: string;
  externalAgentId: string;
  voice: string;
  language: string;
  tenantId: string | null;
  tenantName: string | null;
  status: string;
  lastSyncedAt: string;
  /** Retell agent ID for linking to Retell dashboard. */
  retellAgentId?: string | null;
}

/** Admin agent detail for agent detail page. */
export interface AdminAgentDetail {
  id: string;
  name: string;
  externalAgentId: string;
  voice: string;
  language: string;
  tenantId: string | null;
  tenantName: string | null;
  status: string;
  lastSyncedAt: string;
  enabledSkills: { id: string; name: string; priority: number }[];
}

/** Admin tenant row for tenant list page. */
export interface AdminTenantRow {
  id: string;
  name: string;
  plan: string;
  status?: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ONBOARDING';
  inviteSetupUrl?: string;
}

/** Template option used by onboarding step for agent deployment. */
export interface AgentTemplateOption {
  id: string;
  name: string;
  voice: string;
  language: string;
  channels: Array<'voice' | 'chat' | 'email'>;
  capabilityLevel: string;
}

/** Tenant/admin-facing summary of an agent instance. */
export interface AgentInstanceSummary {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  name: string;
  status: string;
  channel: 'voice' | 'chat' | 'email';
  channelsEnabled: Array<'voice' | 'chat' | 'email'>;
  deployedAt: string | null;
  lastSyncedAt: string | null;
}

/** Per-channel deployment row shown in deployment history views. */
export interface ChannelDeploymentSummary {
  id: string;
  channel: 'voice' | 'chat' | 'email';
  provider: string;
  status: 'pending' | 'active' | 'failed';
  retellAgentId: string | null;
  retellConversationFlowId: string | null;
  error: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Tenant list row for AdminTenantsPage with extended metrics. */
export interface TenantListRow {
  id: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'ONBOARDING';
  agentCount: number;
  mrr: number;
  callsThisMonth: number;
  onboardingStatus: string;
  createdAt: string;
}

/** Tenant profile for detail page. */
export interface TenantProfile {
  clinicName: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  locale: string;
  plan: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  mrr: number;
  createdAt: string;
  lastActive: string;
}

/** Onboarding step. */
export interface OnboardingStep {
  step: number;
  title: string;
  done: boolean;
}

/** Quick stats for tenant detail. */
export interface TenantQuickStats {
  totalCalls: number;
  bookingsCreated: number;
  escalations: number;
  conversionRate: number;
  avgCallDuration: string;
  creditsUsed: number;
  creditsRemaining: number;
}

/** Tenant member row. */
export interface TenantMemberRow {
  name: string;
  role: string;
  status: 'active' | 'invited';
  joined: string;
}

/** Assigned agent row for tenant Agents tab. */
export interface TenantAgentRow {
  id: string;
  name: string;
  channel: 'voice' | 'chat' | 'email';
  status: string;
  voice: string;
  language: string;
  lastSynced: string;
  /** Retell agent ID for linking to Retell dashboard. */
  retellAgentId?: string | null;
}

/** Tenant support ticket row. */
export interface TenantTicketRow {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
}

/** Tenant billing summary. */
export interface TenantBillingSummary {
  currentPlan: string;
  nextBillingDate: string;
  lastPayment: string;
  paymentMethod: string;
  creditsBalance: number;
  overageRate: string;
}

/** Tenant settings for detail page. */
export interface TenantSettingsSummary {
  businessHours: string;
  afterHoursBehavior: string;
  notifications: string;
  featureFlags: Record<string, boolean>;
  pmsIntegration: string;
}

/** Full tenant detail for TenantDetailPage. */
export interface TenantDetailFull {
  id: string;
  profile: TenantProfile;
  onboarding: OnboardingStep[];
  quickStats: TenantQuickStats;
  members: TenantMemberRow[];
  agents: TenantAgentRow[];
  tickets: TenantTicketRow[];
  billing: TenantBillingSummary;
  settings: TenantSettingsSummary;
}

/** Agent voice config (Retell). */
export interface AgentVoiceConfig {
  voiceId: string;
  voiceName: string;
  gender: string;
  accent: string;
  speakingRate: number;
  stability: number;
  similarityBoost: number;
  fillerWords: boolean;
  interruptionSensitivity: string;
  ambientSound: boolean;
  language?: string;
}

/** Agent chat config. */
export interface AgentChatConfig {
  status: string;
  channel: string;
  widgetEmbed: string;
  languages: string[];
  fallbackBehavior: string;
  typingIndicator: boolean;
  responseDelay: number;
}

/** Agent email config. */
export interface AgentEmailConfig {
  status: string;
  inboundEmail: string;
  autoReply: string;
  note: string;
}

/** Agent LLM config. */
export interface AgentLlmConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  customPromptEnabled: boolean;
  languageDetection: string;
  fallbackLanguage: string;
  provider?: string;
}

/** Agent skill with enabled/priority. */
export interface AgentSkillRow {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
}

/** Agent performance metrics. */
export interface AgentPerformanceMetrics {
  totalCalls: number;
  avgHandleTime: string;
  successfulBookings: number;
  escalations: number;
  avgSentimentScore: number;
  firstCallResolution: number;
  interruptionRate: number;
  silenceRate: number;
}

/** Agent A/B test config. */
export interface AgentAbTest {
  status: string;
  versionA: string;
  versionB: string;
  splitPercent: number;
  started: string;
  winnerSoFar: string;
}

/** Agent run row for Recent Runs. */
export interface AgentRunRow {
  runId: string;
  callId: string;
  started: string;
  duration: string;
  tokensUsed: number;
  status: string;
}

/** Agent sync info. */
export interface AgentSyncInfo {
  webhookUrl: string;
  lastWebhookEvent: string;
  webhookStatus: string;
  autoSync: string;
  lastSync?: string;
  status?: string;
  message?: string;
}

/** Full agent detail for AgentDetailPage. */
export interface AgentDetailFull {
  id: string;
  name: string;
  retellAgentId: string;
  tenantId: string;
  tenantName: string;
  channel: 'voice' | 'chat' | 'email';
  createdAt: string;
  lastSynced: string;
  syncStatus: string;
  voiceConfig: AgentVoiceConfig;
  chatConfig: AgentChatConfig;
  emailConfig: AgentEmailConfig;
  llmConfig: AgentLlmConfig;
  skills: AgentSkillRow[];
  performance: AgentPerformanceMetrics;
  abTest: AgentAbTest;
  recentRuns: AgentRunRow[];
  syncInfo: AgentSyncInfo;
}

/** System health for admin system page. */
export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  integrations: { name: string; status: 'ok' | 'degraded' | 'error' }[];
}

/** Admin dashboard platform pulse KPIs (8 cards, real data only). */
export interface AdminPulseKpis {
  activeTenants: number;
  activeAgents: number;
  callsToday: number;
  calls7d: number;
  bookedPercent: number;
  escalationPercent: number;
  aiMinutesUsed: number;
  estimatedCostUsd: number;
}

/** Admin dashboard health (Retell, webhooks, uptime). */
export interface AdminHealth {
  retellSync: 'ok' | 'degraded' | 'error';
  webhooks: 'ok' | 'degraded' | 'error';
  uptimeSeconds: number;
}

/** Recent tenant row for admin dashboard. */
export interface AdminRecentTenant {
  id: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  createdAt: string;
  onboardingProgress: number;
}

/** Support inbox snapshot for admin dashboard. */
export interface AdminSupportSnapshot {
  openCount: number;
  criticalCount: number;
  oldestWaitingDays: number;
}

/** Recent call row for admin dashboard (cross-tenant). */
export interface AdminRecentCall {
  id: string;
  tenantId: string;
  tenantName: string;
  agentName: string;
  outcome: 'booked' | 'escalated' | 'failed' | 'pending';
  duration: number;
  startedAt: string;
}

/** Admin billing: tenant plans + usage for cross-tenant billing overview. */
export interface AdminBillingRow {
  tenantId: string;
  tenantName: string;
  plan: string;
  mrr: number;
  minutesUsed: number;
  creditBalance: number;
  usageCostUsd: number;
}

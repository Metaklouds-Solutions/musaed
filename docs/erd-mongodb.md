# Musaed MongoDB ERD

MongoDB document-model conversion of the relational ERD. Uses **references** (ObjectId) for most relationships; **embedded documents** only where data is always read together and stays small.

**Conventions:**
- `_id`: ObjectId (or UUID string if cross-DB compatibility needed)
- `→` = reference (ObjectId)
- `⊂` = embedded subdocument
- Indexes noted where critical for queries

---

## Domain 1: Identity & Tenancy

### Collection: `users`

```javascript
{
  _id: ObjectId,
  email: String,           // unique index
  passwordHash: String,
  name: String,
  role: String,            // 'ADMIN' | 'TENANT_OWNER' | 'STAFF'
  avatarUrl: String,
  totpSecret: String,
  totpEnabled: Boolean,    // default: false
  lastLoginAt: Date,
  createdAt: Date,
  deletedAt: Date          // soft delete (GDPR)
}
```

**Indexes:** `{ email: 1 }` unique, `{ deletedAt: 1 }` sparse

---

### Collection: `tenants`

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,            // unique index
  status: String,          // 'ONBOARDING' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CHURNED'
  ownerId: ObjectId,       // → users
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  planId: ObjectId,        // → subscription_plans
  timezone: String,        // default: 'Asia/Riyadh'
  locale: String,         // default: 'ar'
  onboardingStep: Number, // default: 0
  onboardingComplete: Boolean, // default: false
  settings: {              // embedded
    businessHours: Object,
    notifications: Object,
    featureFlags: Object,
    locations: Array
  },
  createdAt: Date,
  deletedAt: Date
}
```

**Indexes:** `{ slug: 1 }` unique, `{ ownerId: 1 }`, `{ status: 1 }`

---

### Collection: `tenant_memberships`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,        // → users
  tenantId: ObjectId,       // → tenants
  roleSlug: String,        // 'clinic_admin' | 'receptionist' | 'doctor' | 'auditor' | 'tenant_staff'
  status: String,          // 'active' | 'invited' | 'disabled'
  invitedAt: Date,
  joinedAt: Date
}
```

**Indexes:** `{ userId: 1, tenantId: 1 }` unique, `{ tenantId: 1 }`

---

## Domain 2: Tool & Skill Definitions

### Collection: `tool_definitions`

```javascript
{
  _id: ObjectId,
  name: String,
  displayName: String,
  description: String,
  category: String,        // 'booking' | 'patient' | 'communication' | 'clinic_info' | 'escalation' | 'custom'
  executionType: String,  // 'internal' | 'external',
  // internal
  handlerKey: String,      // 'query_bookings', 'create_booking', etc.
  // external
  endpointUrl: String,
  httpMethod: String,
  authConfig: Object,
  headers: Object,
  // shared
  parametersSchema: Object,  // JSON Schema
  responseMapping: Object,
  timeoutMs: Number,       // default: 5000
  retryOnFail: Boolean,   // default: false
  scope: String,          // 'platform' | 'tenant'
  tenantId: ObjectId,     // null = platform-wide
  createdBy: ObjectId,    // → users
  isActive: Boolean,      // default: true
  version: Number,        // default: 1
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ scope: 1, tenantId: 1 }`, `{ name: 1, tenantId: 1 }`

---

### Collection: `skill_definitions`

```javascript
{
  _id: ObjectId,
  name: String,
  displayName: String,
  description: String,
  category: String,       // 'core' | 'specialty' | 'custom'
  flowDefinition: Object, // nodes, prompts, transitions, conditions
  entryConditions: String,
  retellComponentId: String,
  retellSyncStatus: String, // 'draft' | 'synced' | 'out_of_sync'
  lastSyncedAt: Date,
  scope: String,
  tenantId: ObjectId,
  createdBy: ObjectId,
  isActive: Boolean,
  version: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ scope: 1, tenantId: 1 }`, `{ name: 1, tenantId: 1 }`

---

### Collection: `skill_tool_links`

```javascript
{
  _id: ObjectId,
  skillId: ObjectId,      // → skill_definitions
  toolId: ObjectId,       // → tool_definitions
  nodeReference: String,
  isRequired: Boolean,    // default: true
  createdAt: Date
}
```

**Indexes:** `{ skillId: 1 }`, `{ toolId: 1 }`, `{ skillId: 1, toolId: 1 }` unique

---

## Domain 3: Agent Templates & Deployments

### Collection: `agent_templates`

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  channel: String,        // 'voice' | 'chat' | 'email'
  voiceConfig: Object,
  chatConfig: Object,
  emailConfig: Object,
  llmConfig: Object,
  basePrompt: String,
  webhookUrl: String,
  mcpServerUrl: String,
  templateVariables: Object,
  isDefault: Boolean,
  tags: [String],
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  // embedded: skills (denormalized for fast reads)
  skills: [
    { skillId: ObjectId, sortOrder: Number, isEnabled: Boolean }
  ]
}
```

**Indexes:** `{ channel: 1 }`, `{ isDefault: 1 }`

---

### Collection: `agent_deployments`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,      // → tenants
  templateId: ObjectId,   // → agent_templates (nullable)
  channel: String,
  retellAgentId: String,
  retellLlmId: String,
  retellAgentVersion: Number,
  phoneNumberId: ObjectId, // → phone_numbers (voice only)
  emailAddress: String,    // email only
  status: String,         // 'deploying' | 'active' | 'paused' | 'failed' | 'deleted'
  configSnapshot: Object,
  customPrompts: Object,
  resolvedVariables: Object,
  lastSyncedAt: Date,
  deployedAt: Date,
  createdAt: Date,
  // embedded overrides (1:few, always read with deployment)
  skillOverrides: [
    { skillId: ObjectId, isEnabled: Boolean, promptOverride: String, customConfig: Object }
  ],
  toolOverrides: [
    { toolId: ObjectId, isEnabled: Boolean, endpointOverride: String, authOverride: Object, paramsOverride: Object }
  ]
}
```

**Indexes:** `{ tenantId: 1 }`, `{ status: 1 }`, `{ retellAgentId: 1 }`, `{ phoneNumberId: 1 }`

---

### Collection: `phone_numbers`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,     // → tenants
  retellNumberId: String,
  number: String,         // E.164
  country: String,
  type: String,           // 'local' | 'toll_free'
  inboundDeploymentId: ObjectId,
  outboundDeploymentId: ObjectId,
  monthlyCostCents: Number,
  status: String,        // 'active' | 'released'
  createdAt: Date
}
```

**Indexes:** `{ tenantId: 1 }`, `{ number: 1 }` unique

---

## Domain 4: Billing & Credits

### Collection: `subscription_plans`

```javascript
{
  _id: ObjectId,
  name: String,
  stripeProductId: String,
  stripePriceId: String,
  monthlyPriceCents: Number,
  monthlyCredits: Number,
  maxVoiceAgents: Number,
  maxChatAgents: Number,
  maxEmailAgents: Number,
  maxStaff: Number,
  features: Object,
  isActive: Boolean,
  createdAt: Date
}
```

---

### Collection: `topup_packages`

```javascript
{
  _id: ObjectId,
  name: String,
  stripeProductId: String,
  stripePriceId: String,
  priceCents: Number,
  credits: Number,
  isActive: Boolean
}
```

---

### Collection: `credit_accounts`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,     // → tenants (unique)
  balance: Number,       // default: 0
  lifetimePurchased: Number,
  lifetimeConsumed: Number,
  lowBalanceThreshold: Number, // default: 50
  updatedAt: Date
}
```

**Indexes:** `{ tenantId: 1 }` unique

---

### Collection: `credit_transactions`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  type: String,          // 'subscription_grant' | 'topup_purchase' | 'usage_deduct' | 'refund' | 'adjustment' | 'expiry'
  amount: Number,        // +N or -N
  balanceAfter: Number,
  referenceType: String,
  referenceId: String,
  description: String,
  createdAt: Date
}
```

**Indexes:** `{ tenantId: 1, createdAt: -1 }`

---

## Domain 5: Calls, Customers & Bookings

### Collection: `calls`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  deploymentId: ObjectId,  // → agent_deployments
  retellCallId: String,    // unique
  channel: String,        // 'voice' | 'chat' | 'email'
  direction: String,      // 'inbound' | 'outbound'
  fromNumber: String,
  toNumber: String,
  customerId: ObjectId,   // → customers (nullable)
  status: String,         // 'in_progress' | 'completed' | 'failed' | 'transferred'
  outcome: String,       // 'booked' | 'escalated' | 'info_provided' | 'failed' | 'cancelled'
  durationSeconds: Number,
  creditsConsumed: Number,
  sentimentScore: Number,
  transcript: Object,
  analysis: Object,
  recordingUrl: String,
  metadata: Object,
  startedAt: Date,
  endedAt: Date,
  analyzedAt: Date,
  // embedded: tool execution logs (1:many, always read with call)
  toolExecutions: [
    {
      toolId: ObjectId,
      toolName: String,
      requestParams: Object,
      responseBody: Object,
      executionType: String,
      handlerKey: String,
      endpointCalled: String,
      status: String,
      durationMs: Number,
      errorMessage: String,
      executedAt: Date
    }
  ]
}
```

**Indexes:** `{ tenantId: 1, startedAt: -1 }`, `{ retellCallId: 1 }` unique, `{ deploymentId: 1 }`, `{ customerId: 1 }`

---

### Collection: `customers`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  email: String,
  phone: String,         // E.164 (encrypted at rest)
  dateOfBirth: Date,
  source: String,        // 'call' | 'chat' | 'email' | 'manual'
  tags: [String],
  metadata: Object,
  totalCalls: Number,    // default: 0, denormalized
  totalBookings: Number, // default: 0
  createdAt: Date,
  deletedAt: Date
}
```

**Indexes:** `{ tenantId: 1 }`, `{ tenantId: 1, phone: 1 }`, `{ tenantId: 1, email: 1 }`

---

### Collection: `bookings`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  customerId: ObjectId,   // → customers
  callId: ObjectId,      // → calls (nullable)
  providerId: ObjectId,  // → tenant_memberships (nullable)
  locationId: String,
  serviceType: String,
  date: Date,
  timeSlot: String,
  durationMinutes: Number, // default: 30
  status: String,       // 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes: String,
  reminderSent: Boolean,
  reminderAt: Date,
  createdAt: Date
}
```

**Indexes:** `{ tenantId: 1, date: 1 }`, `{ customerId: 1 }`, `{ callId: 1 }`

---

## Domain 6: Support, Audit & Webhooks

### Collection: `support_tickets`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  title: String,
  category: String,      // 'billing' | 'technical' | 'agent' | 'general'
  status: String,       // 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: String,     // 'low' | 'medium' | 'high' | 'critical'
  assignedTo: ObjectId, // → users (nullable)
  createdBy: ObjectId,   // → users
  createdAt: Date,
  closedAt: Date,
  // embedded: messages (1:few, always read with ticket)
  messages: [
    { authorId: ObjectId, body: String, createdAt: Date }
  ]
}
```

**Indexes:** `{ tenantId: 1 }`, `{ status: 1 }`, `{ createdBy: 1 }`

---

### Collection: `audit_logs`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  userId: ObjectId,
  action: String,       // 'tenant.created', 'agent.deployed', 'booking.created', etc.
  entityType: String,
  entityId: ObjectId,
  metadata: Object,
  ipAddress: String,
  createdAt: Date
}
```

**Indexes:** `{ tenantId: 1, createdAt: -1 }`, `{ entityType: 1, entityId: 1 }`

---

### Collection: `webhook_events`

```javascript
{
  _id: ObjectId,
  source: String,       // 'retell' | 'stripe' | 'sendgrid'
  eventType: String,
  payload: Object,
  status: String,       // 'received' | 'processed' | 'failed' | 'retrying'
  errorMessage: String,
  attempts: Number,     // default: 1
  processedAt: Date,
  receivedAt: Date
}
```

**Indexes:** `{ source: 1, receivedAt: -1 }`, `{ status: 1 }`

---

## Relationship Diagram (MongoDB)

```
users ◀──ref── tenant_memberships ──ref──▶ tenants
                                              │
                                    ┌─────────┼──────────┐
                                    │         │          │
                                    ▼         ▼          ▼
                          credit_accounts  agent_deployments  phone_numbers
                                    │         │
                                    │         ├── skillOverrides[] (embed)
                                    │         └── toolOverrides[] (embed)
                                    ▼         │
                          credit_transactions  ▼
                                            calls
                                              │
                                              ├── toolExecutions[] (embed)
                                              ├── bookings (ref)
                                              └── customers (ref)


tool_definitions ◀──ref── skill_tool_links ──ref──▶ skill_definitions
                                                         │
                                                         ▼
                                              agent_templates
                                                skills[] (embed)


support_tickets
  messages[] (embed)
```

---

## Embed vs Reference Summary

| Relationship | Strategy | Reason |
|--------------|----------|--------|
| tenant_memberships ↔ users/tenants | Reference | Many memberships, independent access |
| skill_tool_links | Reference | N:M, both sides queried independently |
| agent_templates.skills | Embed | 1:few, always read with template |
| agent_deployments.skillOverrides | Embed | 1:few, always with deployment |
| agent_deployments.toolOverrides | Embed | 1:few, always with deployment |
| calls.toolExecutions | Embed | 1:many but bounded, always with call |
| support_tickets.messages | Embed | 1:few, always with ticket |
| tenants.settings | Embed | 1:1, always with tenant |
| All other 1:N | Reference | Large cardinality or independent access |

---

## Collection Count

| Domain | Collections |
|--------|-------------|
| Identity & Tenancy | 3 |
| Tool & Skill Definitions | 3 |
| Agent Config & Deployments | 3 (templates, deployments, phone_numbers) |
| Billing | 4 |
| Calls, Customers, Bookings | 3 |
| Support, Audit, Webhooks | 3 |
| **Total** | **19 collections** |

Junction/override tables are embedded where appropriate, reducing collection count from 24 (relational) to 19.

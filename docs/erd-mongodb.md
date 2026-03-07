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

### Collection: `tenant_staff`

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

## Domain 2: Agent Templates & Instances

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
  updatedAt: Date
}
```

**Indexes:** `{ channel: 1 }`, `{ isDefault: 1 }`

---

### Collection: `agent_instances`

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,      // → tenants
  templateId: ObjectId,   // → agent_templates (nullable)
  channel: String,
  retellAgentId: String,
  retellLlmId: String,
  retellAgentVersion: Number,
  emailAddress: String,    // email channel only
  status: String,         // 'deploying' | 'active' | 'paused' | 'failed' | 'deleted'
  configSnapshot: Object,
  customPrompts: Object,
  resolvedVariables: Object,
  lastSyncedAt: Date,
  deployedAt: Date,
  createdAt: Date
}
```

**Indexes:** `{ tenantId: 1 }`, `{ status: 1 }`, `{ retellAgentId: 1 }`

---

## Domain 3: Billing

### Collection: `subscription_plans`

```javascript
{
  _id: ObjectId,
  name: String,
  stripeProductId: String,
  stripePriceId: String,
  monthlyPriceCents: Number,
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

## Domain 4: Customers & Bookings

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
  providerId: ObjectId,  // → tenant_staff (nullable)
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

**Indexes:** `{ tenantId: 1, date: 1 }`, `{ customerId: 1 }`

---

## Domain 5: Support

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

## Relationship Diagram (MongoDB)

```
users ◀──ref── tenant_staff ──ref──▶ tenants
                                              │
                                    ┌─────────┴──────────┐
                                    │                   │
                                    ▼                   ▼
                          subscription_plans      agent_instances
                                    │
                                    │         customers ◀──ref── bookings
                                    │                   (tenantId)


agent_templates
       │
       └── agent_instances (ref)


support_tickets
  messages[] (embed)
```

---

## Embed vs Reference Summary

| Relationship | Strategy | Reason |
|--------------|----------|--------|
| tenant_staff ↔ users/tenants | Reference | Many memberships, independent access |
| agent_templates ↔ agent_instances | Reference | 1:N, instances per template |
| support_tickets.messages | Embed | 1:few, always with ticket |
| tenants.settings | Embed | 1:1, always with tenant |
| All other 1:N | Reference | Large cardinality or independent access |

---

## Collection Count

| Domain | Collections |
|--------|-------------|
| Identity & Tenancy | 3 |
| Agent Templates & Instances | 2 (templates, instances) |
| Billing | 1 |
| Customers & Bookings | 2 (customers, bookings) |
| Support | 1 |
| **Total** | **9 collections** |

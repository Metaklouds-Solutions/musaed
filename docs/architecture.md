Now I have a clear picture of Retell AI's API surface, Stripe's credit-based billing model, and the prototype's current state. Here's the full backend architecture.

---

## MUSAED Backend Architecture

---

### 1. High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                        │
│   React SPA (Tenant Portal)    React SPA (Admin Portal)    Mobile (PWA) │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTPS / WSS
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / EDGE                                │
│   Rate Limiting · JWT Validation · Tenant Resolution · CORS · Logging   │
└──────────┬──────────────────────────────────┬────────────────────────────┘
           │                                  │
     ┌─────▼─────┐                    ┌───────▼────────┐
     │  REST API  │                    │  Webhook       │
     │  (App)     │                    │  Receiver      │
     └─────┬──────┘                    │  (Retell +     │
           │                           │   Stripe)      │
           ▼                           └───────┬────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                     │
│                                                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Auth        │ │ Tenant       │ │ Agent        │ │ Template       │  │
│  │ Service     │ │ Service      │ │ Orchestrator │ │ Service        │  │
│  └─────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ Billing     │ │ Call         │ │ Booking      │ │ Support        │  │
│  │ Service     │ │ Service      │ │ Service      │ │ Service        │  │
│  └─────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │
│                                                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐                     │
│  │ Notification│ │ Analytics    │ │ Audit        │                     │
│  │ Service     │ │ Service      │ │ Service      │                     │
│  └─────────────┘ └──────────────┘ └──────────────┘                     │
└──────────┬──────────────┬───────────────┬────────────────────────────────┘
           │              │               │
     ┌─────▼─────┐ ┌─────▼─────┐  ┌──────▼──────┐
     │ PostgreSQL │ │   Redis   │  │ Object      │
     │ (Primary)  │ │ (Cache +  │  │ Storage     │
     │            │ │  Queue +  │  │ (S3/R2)     │
     │            │ │  Sessions)│  │ Templates,  │
     └────────────┘ └───────────┘  │ Recordings  │
                                   └─────────────┘
           │                              │
     ┌─────▼──────────────────────────────▼────────────────────────────────┐
     │                     EXTERNAL SERVICES                               │
     │                                                                     │
     │  ┌─────────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
     │  │ Retell AI   │  │ Stripe    │  │ SendGrid │  │ WhatsApp      │  │
     │  │ Voice +Chat │  │ Billing   │  │ Email    │  │ Business API  │  │
     │  │ Agents      │  │           │  │ Agent +  │  │ (Future)      │  │
     │  │ Phone #s    │  │           │  │ Transact │  │               │  │
     │  └─────────────┘  └───────────┘  └──────────┘  └───────────────┘  │
     └─────────────────────────────────────────────────────────────────────┘
```

---

### 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js + TypeScript | Matches Retell SDK (official TS SDK), same language as frontend |
| **Framework** | Hono or Fastify | Lightweight, fast, great TypeScript support. Hono if deploying to edge (Cloudflare Workers), Fastify if traditional server. |
| **Database** | PostgreSQL 16 | Multi-tenant with RLS (Row-Level Security), JSONB for flexible configs |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great migration story |
| **Cache / Queue** | Redis (Upstash if serverless) | Session store, credit balance cache, webhook event queue |
| **Job Queue** | BullMQ (on Redis) | Async jobs: agent deployment, email sending, report generation, webhook retries |
| **Object Storage** | S3 / Cloudflare R2 | Agent templates, call recordings (mirrored from Retell), CSV exports |
| **Auth** | Custom JWT + Refresh tokens | Multi-tenant aware; 2FA via TOTP (otplib) |
| **Email** | SendGrid | Transactional emails + email agent channel |
| **Monitoring** | Sentry + Axiom/Logtail | Error tracking + structured logging |
| **Deployment** | Docker -> Railway / Fly.io / AWS ECS | Containerized, horizontal scaling |

---

### 3. Multi-Tenancy Strategy

**Approach: Shared database, row-level isolation.**

Every table that holds tenant data has a `tenant_id` column. PostgreSQL Row-Level Security (RLS) policies enforce that queries can only access rows matching the current tenant context.

```
┌─────────────────────────────────────────────┐
│              API Request                     │
│  Authorization: Bearer <JWT>                 │
│  JWT payload: { userId, tenantId, role }     │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│         Tenant Middleware                     │
│  1. Extract tenantId from JWT                │
│  2. SET app.current_tenant = tenantId (PG)   │
│  3. RLS policies filter all queries          │
└─────────────────────────────────────────────┘
```

**Admin queries** bypass RLS using a service-level connection (for cross-tenant views like admin dashboard, billing overview).

---

### 4. Data Model (Core Tables)

#### Identity & Tenancy

```
users
  id              UUID PK
  email           TEXT UNIQUE
  password_hash   TEXT
  name            TEXT
  role            ENUM('ADMIN', 'TENANT_OWNER', 'STAFF')
  totp_secret     TEXT NULL        -- 2FA
  totp_enabled    BOOLEAN DEFAULT FALSE
  created_at      TIMESTAMPTZ

tenants
  id              UUID PK
  name            TEXT             -- Clinic name
  slug            TEXT UNIQUE      -- URL-safe identifier
  status          ENUM('ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED')
  plan_id         TEXT             -- Stripe product ID reference
  stripe_customer_id   TEXT
  stripe_subscription_id TEXT
  timezone        TEXT DEFAULT 'Asia/Riyadh'
  locale          TEXT DEFAULT 'ar'
  onboarding_step INTEGER DEFAULT 0
  onboarding_complete BOOLEAN DEFAULT FALSE
  settings        JSONB            -- Business hours, notifications, feature flags
  created_at      TIMESTAMPTZ

tenant_memberships
  id              UUID PK
  user_id         UUID FK → users
  tenant_id       UUID FK → tenants
  role_slug       ENUM('clinic_admin', 'receptionist', 'doctor', 'auditor', 'tenant_staff')
  status          ENUM('active', 'invited', 'disabled')
  invited_at      TIMESTAMPTZ
  joined_at       TIMESTAMPTZ NULL
```

#### Agent Layer (Retell Proxy)

```
agent_templates
  id              UUID PK
  name            TEXT
  description     TEXT
  channel         ENUM('voice', 'chat', 'email')
  version         INTEGER DEFAULT 1
  config_json     JSONB            -- Full Retell create-agent payload
  created_by      UUID FK → users  -- Admin who created it
  is_default      BOOLEAN DEFAULT FALSE
  tags            TEXT[]
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

agent_deployments
  id              UUID PK
  tenant_id       UUID FK → tenants
  channel         ENUM('voice', 'chat', 'email')
  template_id     UUID FK → agent_templates NULL
  retell_agent_id TEXT NULL        -- Retell's agent_id (voice/chat)
  retell_llm_id   TEXT NULL        -- Retell's LLM response engine ID
  phone_number_id TEXT NULL        -- Retell phone number ID (voice only)
  phone_number    TEXT NULL        -- E.164 format
  email_address   TEXT NULL        -- For email channel
  status          ENUM('deploying', 'active', 'paused', 'failed', 'deleted')
  config_snapshot JSONB            -- Config at time of deploy
  custom_prompts  JSONB            -- Tenant-specific prompt overrides
  last_synced_at  TIMESTAMPTZ
  created_at      TIMESTAMPTZ

phone_numbers
  id              UUID PK
  tenant_id       UUID FK → tenants
  retell_number_id TEXT            -- Retell's phone number resource ID
  number          TEXT             -- E.164
  country         TEXT
  type            ENUM('local', 'toll_free')
  inbound_agent_deployment_id  UUID FK → agent_deployments NULL
  outbound_agent_deployment_id UUID FK → agent_deployments NULL
  monthly_cost_cents INTEGER
  status          ENUM('active', 'released')
  created_at      TIMESTAMPTZ
```

#### Billing & Credits

```
credit_accounts
  id              UUID PK
  tenant_id       UUID FK → tenants UNIQUE
  balance         INTEGER DEFAULT 0   -- Current credit balance
  lifetime_purchased  INTEGER DEFAULT 0
  lifetime_consumed   INTEGER DEFAULT 0
  updated_at      TIMESTAMPTZ

credit_transactions
  id              UUID PK
  tenant_id       UUID FK → tenants
  type            ENUM('subscription_grant', 'topup_purchase', 'usage_deduct',
                       'refund', 'adjustment', 'expiry')
  amount          INTEGER              -- Positive = add, negative = deduct
  balance_after   INTEGER              -- Running balance
  reference_type  TEXT NULL             -- 'call', 'chat_session', 'stripe_invoice', etc.
  reference_id    TEXT NULL             -- call_id, invoice_id, etc.
  description     TEXT
  created_at      TIMESTAMPTZ

subscription_plans  (mirrors Stripe Products — cached locally)
  id              TEXT PK              -- Stripe product ID
  name            TEXT                 -- 'Starter', 'Professional', 'Enterprise'
  monthly_price_cents  INTEGER
  monthly_credits INTEGER              -- 500, 2000, 6000
  features        JSONB                -- { maxAgents: 1, maxStaff: 5, ... }
  stripe_price_id TEXT                 -- Stripe recurring price ID
  active          BOOLEAN DEFAULT TRUE

topup_packages  (mirrors Stripe one-time Products)
  id              TEXT PK
  name            TEXT                 -- '$100 Top-Up'
  price_cents     INTEGER              -- 10000, 50000, 100000
  credits         INTEGER              -- Credits granted
  stripe_price_id TEXT
  active          BOOLEAN DEFAULT TRUE
```

#### Calls & Bookings

```
calls
  id              UUID PK
  tenant_id       UUID FK → tenants
  agent_deployment_id UUID FK → agent_deployments
  retell_call_id  TEXT UNIQUE      -- From Retell webhook
  channel         ENUM('voice', 'chat', 'email')
  direction       ENUM('inbound', 'outbound')
  from_number     TEXT NULL
  to_number       TEXT NULL
  customer_id     UUID FK → customers NULL
  status          ENUM('in_progress', 'completed', 'failed', 'transferred')
  outcome         ENUM('booked', 'escalated', 'info_provided', 'failed', 'cancelled') NULL
  duration_seconds INTEGER NULL
  credits_consumed INTEGER NULL
  sentiment_score  FLOAT NULL
  transcript      JSONB NULL       -- From Retell call_analyzed webhook
  analysis        JSONB NULL       -- Entities, intent, summary from Retell
  recording_url   TEXT NULL
  metadata        JSONB NULL
  started_at      TIMESTAMPTZ
  ended_at        TIMESTAMPTZ NULL
  analyzed_at     TIMESTAMPTZ NULL

customers
  id              UUID PK
  tenant_id       UUID FK → tenants
  name            TEXT
  email           TEXT NULL
  phone           TEXT NULL        -- E.164
  source          ENUM('call', 'chat', 'email', 'manual')
  metadata        JSONB            -- Extracted from conversations
  created_at      TIMESTAMPTZ
  deleted_at      TIMESTAMPTZ NULL -- Soft delete (GDPR)

bookings
  id              UUID PK
  tenant_id       UUID FK → tenants
  customer_id     UUID FK → customers
  call_id         UUID FK → calls NULL
  provider_id     UUID FK → tenant_memberships NULL  -- Doctor
  location_id     UUID NULL
  date            DATE
  time_slot       TEXT
  status          ENUM('confirmed', 'cancelled', 'completed', 'no_show')
  notes           TEXT NULL
  reminder_sent   BOOLEAN DEFAULT FALSE
  created_at      TIMESTAMPTZ
```

#### Support & Audit

```
support_tickets
  id, tenant_id, title, category, status, priority, assigned_to, created_by, created_at, closed_at

ticket_messages
  id, ticket_id, author_id, body, created_at

audit_logs
  id, tenant_id (nullable for admin), user_id, action, entity_type, entity_id, metadata JSONB, ip, created_at
```

---

### 5. Service Layer Detail

#### 5A. Agent Orchestrator Service

This is the heart of MUSAED. It **does not own agents** -- it orchestrates Retell AI APIs and maintains a mapping layer.

```
Agent Orchestrator
│
├── deployVoiceAgent(tenantId, templateId, overrides?)
│   1. Load template config_json from agent_templates
│   2. Merge tenant-specific overrides (custom prompts, dynamic variables)
│   3. POST Retell /create-retell-llm  → get llm_id
│   4. POST Retell /create-agent { response_engine: { llm_id }, voice_id, ... }  → get agent_id
│   5. POST Retell /create-phone-number { inbound_agent_id: agent_id }  → get number
│   6. INSERT agent_deployments { retell_agent_id, retell_llm_id, phone_number, ... }
│   7. Return deployment record
│
├── deployChatAgent(tenantId, templateId, overrides?)
│   1. Load template
│   2. POST Retell /create-retell-llm  → llm_id
│   3. POST Retell /create-chat-agent { response_engine: { llm_id } }  → agent_id
│   4. INSERT agent_deployments { retell_agent_id, channel: 'chat', ... }
│   5. Return deployment + widget embed code
│
├── deployEmailAgent(tenantId, templateId, overrides?)
│   1. Load template (email-specific: tone, response rules, signature)
│   2. Provision inbound email address (SendGrid Inbound Parse or custom domain)
│   3. INSERT agent_deployments { channel: 'email', email_address, config_snapshot }
│   (Email agent uses same LLM but triggered by inbound email webhook,
│    not Retell — Retell doesn't do email)
│
├── syncAgent(deploymentId)
│   1. GET Retell /get-agent/{retell_agent_id}
│   2. Update local config_snapshot + last_synced_at
│
├── updateAgentConfig(deploymentId, patch)
│   1. PATCH Retell /update-agent/{retell_agent_id} with patch
│   2. Update local record
│
└── teardownAgent(deploymentId)
    1. DELETE Retell /delete-agent/{retell_agent_id}
    2. Release phone number if voice
    3. Soft-delete local deployment record
```

**Important design note:** Retell doesn't have an email agent product. The email channel is a **custom implementation** -- inbound emails parsed via SendGrid Inbound Parse, routed to the same LLM prompt engine (via OpenAI/Anthropic API directly or Retell LLM), response sent back via SendGrid. The template for email agents would include tone, signature, allowed actions, and escalation rules.

#### 5B. Template Service

```
Template Service
│
├── create(name, channel, configJson, tags)    -- Admin creates template
├── update(templateId, patch)                   -- Edit config JSON
├── get(templateId)                             -- View template
├── list(filters: { channel, tags })            -- Browse templates
├── export(templateId) → JSON file download     -- Download as .json
├── import(file) → validate + create            -- Upload .json
├── clone(templateId, newName)                  -- Duplicate for editing
└── getDefaults()                               -- Default templates per channel
```

**Template JSON structure** (for a voice agent):
```json
{
  "schema_version": "1.0",
  "channel": "voice",
  "name": "Clinic Receptionist - Arabic",
  "description": "Standard Arabic-speaking receptionist for dental/medical clinics",
  "retell_config": {
    "agent_name": "{{clinic_name}} Receptionist",
    "voice_id": "retell_voice_id_here",
    "language": "ar",
    "response_engine": {
      "type": "retell-llm",
      "llm_config": {
        "model": "gpt-4o",
        "general_prompt": "You are a clinic receptionist for {{clinic_name}}...",
        "general_tools": [
          { "type": "custom_function", "name": "book_appointment", ... },
          { "type": "custom_function", "name": "check_availability", ... },
          { "type": "transfer_call", ... }
        ],
        "states": [ ... ]
      }
    },
    "webhook_url": "{{platform_webhook_base}}/retell/events",
    "ambient_sound": "off",
    "interruption_sensitivity": 0.8,
    "responsiveness": 0.7
  },
  "email_config": null,
  "variables": {
    "clinic_name": { "type": "string", "required": true },
    "business_hours": { "type": "string", "required": true },
    "booking_api_url": { "type": "string", "required": false }
  }
}
```

The `{{variables}}` are resolved at deploy time using tenant-specific data. This makes templates reusable across clinics.

#### 5C. Billing Service

```
Billing Service
│
├── STRIPE SUBSCRIPTIONS
│   ├── createSubscription(tenantId, planId)
│   │   1. Create Stripe Customer (if not exists)
│   │   2. Create Stripe Subscription with plan's stripe_price_id
│   │   3. Store stripe_customer_id + stripe_subscription_id on tenant
│   │   4. Grant monthly_credits to credit_account
│   │
│   ├── changeSubscription(tenantId, newPlanId)
│   │   1. Stripe proration
│   │   2. Adjust credit grant on next cycle
│   │
│   └── cancelSubscription(tenantId)
│       1. Stripe cancel at period end
│       2. Mark tenant status → CHURNED after period
│
├── CREDIT TOP-UPS
│   ├── purchaseCredits(tenantId, packageId)
│   │   1. Create Stripe Checkout Session (one-time) with topup stripe_price_id
│   │   2. On success webhook → add credits to credit_account
│   │   3. INSERT credit_transaction { type: 'topup_purchase' }
│   │
│   └── getPackages() → list of topup_packages
│
├── CREDIT CONSUMPTION (called by Call Service)
│   ├── consumeCredits(tenantId, amount, referenceType, referenceId)
│   │   1. Check balance ≥ amount
│   │   2. Decrement credit_account.balance (atomic UPDATE with WHERE balance >= amount)
│   │   3. INSERT credit_transaction { type: 'usage_deduct', amount: -N }
│   │   4. If balance < threshold → emit LOW_CREDITS event → notification
│   │   5. If balance = 0 → pause agent? or allow overage?
│   │
│   └── getBalance(tenantId) → current balance + usage stats
│
└── STRIPE WEBHOOKS
    ├── invoice.payment_succeeded → Grant monthly credits (for subscription renewal)
    ├── invoice.payment_failed → Notify tenant, retry, suspend after 3 failures
    ├── checkout.session.completed → Grant top-up credits
    └── customer.subscription.deleted → Update tenant status
```

**Credit Rates:**

| Usage | Credits |
|-------|---------|
| 1 voice call minute | 1 credit |
| 1 chat session (up to 10 messages) | 0.5 credits |
| 1 email response | 0.25 credits |

**Plans:**

| Plan | Price | Monthly Credits | Max Agents | Max Staff |
|------|-------|----------------|------------|-----------|
| Starter | $49/mo | 500 | 1 voice + 1 chat | 5 |
| Professional | $149/mo | 2,000 | 3 voice + 2 chat + 1 email | 20 |
| Enterprise | $399/mo | 6,000 | Unlimited | Unlimited |

**Top-ups:**

| Package | Price | Credits |
|---------|-------|---------|
| Small | $100 | 600 |
| Medium | $500 | 3,500 |
| Large | $1,000 | 8,000 |

(Volume discount on larger packages.)

#### 5D. Webhook Receiver (Retell Events)

This is the **real-time data pipeline** -- every call event flows through here.

```
POST /webhooks/retell
│
├── call_started
│   1. Lookup agent_deployment by retell_agent_id
│   2. INSERT calls { status: 'in_progress', started_at }
│   3. Emit real-time event via SSE/WebSocket to dashboard
│
├── call_ended
│   1. UPDATE calls { status: 'completed', duration_seconds, ended_at }
│   2. Calculate credits = ceil(duration_seconds / 60)
│   3. billingService.consumeCredits(tenantId, credits, 'call', callId)
│
├── call_analyzed
│   1. UPDATE calls { transcript, analysis, sentiment_score, outcome }
│   2. If outcome = 'booked' → bookingService.createFromCall(...)
│   3. If outcome = 'escalated' → notificationService.alertStaff(...)
│   4. Extract customer info → upsert customers table
│
├── transcript_updated (streaming)
│   1. Emit to frontend via WebSocket (live transcript view)
│
└── transfer_call_started / transfer_call_ended
    1. Log escalation event
    2. Notify receiving staff member
```

---

### 6. Tenant Onboarding Flow (End-to-End)

This is the critical flow that ties everything together:

```
ADMIN INITIATES                     SYSTEM                          RETELL / STRIPE
      │                                │                                  │
      │  1. Create Tenant              │                                  │
      │  (name, owner email,           │                                  │
      │   plan, timezone)              │                                  │
      ├───────────────────────────────▶│                                  │
      │                                │  2. Create Stripe Customer       │
      │                                ├─────────────────────────────────▶│
      │                                │  3. Create Subscription          │
      │                                ├─────────────────────────────────▶│
      │                                │  4. Grant initial credits        │
      │                                │  5. Send invite email to owner   │
      │                                │                                  │
      │  6. Select Voice Template      │                                  │
      ├───────────────────────────────▶│                                  │
      │                                │  7. Create Retell LLM            │
      │                                │     (with template prompt +      │
      │                                │      tenant variables)           │
      │                                ├─────────────────────────────────▶│
      │                                │  8. Create Retell Voice Agent    │
      │                                ├─────────────────────────────────▶│
      │                                │  9. Purchase Phone Number        │
      │                                │     (bind to agent)              │
      │                                ├─────────────────────────────────▶│
      │                                │                                  │
      │  10. Select Chat Template      │                                  │
      ├───────────────────────────────▶│                                  │
      │                                │  11. Create Retell Chat Agent    │
      │                                ├─────────────────────────────────▶│
      │                                │                                  │
      │  12. Configure Email Agent     │                                  │
      ├───────────────────────────────▶│                                  │
      │                                │  13. Provision email address     │
      │                                │      (SendGrid Inbound Parse)    │
      │                                ├─────────────────────────────────▶│ (SendGrid)
      │                                │                                  │
      │                                │  14. Store all deployments       │
      │                                │  15. Mark onboarding complete    │
      │                                │  16. Tenant is LIVE              │
      │                                │                                  │
      │◀───────────── DONE ───────────│                                  │
```

**Steps 6-15 run as a BullMQ job** so the admin doesn't wait. The UI polls or subscribes via WebSocket for status updates on each step.

---

### 7. API Route Structure

```
/api/v1
│
├── /auth
│   ├── POST   /login              -- Email + password → JWT + refresh token
│   ├── POST   /refresh            -- Refresh token → new JWT
│   ├── POST   /2fa/setup          -- Generate TOTP secret + QR
│   ├── POST   /2fa/verify         -- Verify TOTP code
│   └── POST   /logout             -- Revoke refresh token
│
├── /admin                          -- AdminGuard middleware
│   ├── /tenants
│   │   ├── GET    /               -- List all tenants (paginated, filterable)
│   │   ├── POST   /               -- Create tenant (starts onboarding job)
│   │   ├── GET    /:id            -- Tenant detail
│   │   ├── PATCH  /:id            -- Update tenant
│   │   ├── POST   /:id/suspend    -- Suspend tenant
│   │   └── GET    /:id/deployments -- Agent deployments for tenant
│   │
│   ├── /templates
│   │   ├── GET    /               -- List templates
│   │   ├── POST   /               -- Create template
│   │   ├── GET    /:id            -- Get template (view JSON)
│   │   ├── PATCH  /:id            -- Update template JSON
│   │   ├── DELETE /:id            -- Archive template
│   │   ├── GET    /:id/export     -- Download as .json file
│   │   ├── POST   /import         -- Upload .json file
│   │   └── POST   /:id/clone      -- Clone template
│   │
│   ├── /agents                     -- Cross-tenant agent view
│   │   ├── GET    /               -- All deployments across tenants
│   │   └── GET    /:id            -- Deployment detail (synced from Retell)
│   │
│   ├── /billing
│   │   ├── GET    /overview       -- Revenue, MRR, credit consumption
│   │   ├── GET    /plans          -- Subscription plans
│   │   └── GET    /transactions   -- Cross-tenant credit transactions
│   │
│   ├── /support                    -- All tickets across tenants
│   ├── /staff                      -- All staff across tenants
│   ├── /calls                      -- All calls across tenants
│   ├── /system                     -- Health, maintenance mode
│   └── /audit-log                  -- Audit trail
│
├── /tenant                         -- TenantGuard middleware (tenantId from JWT)
│   ├── /dashboard
│   │   └── GET    /metrics        -- KPIs, trends (date range param)
│   │
│   ├── /agents
│   │   ├── GET    /               -- My agent deployments
│   │   ├── GET    /:id            -- Agent detail (synced)
│   │   ├── PATCH  /:id/prompts    -- Update custom prompts
│   │   └── POST   /:id/sync      -- Force sync from Retell
│   │
│   ├── /calls
│   │   ├── GET    /               -- My calls (paginated, filterable)
│   │   └── GET    /:id            -- Call detail + transcript
│   │
│   ├── /customers
│   │   ├── GET    /               -- Customer list
│   │   ├── GET    /:id            -- Customer detail + history
│   │   ├── POST   /:id/export    -- GDPR export
│   │   └── DELETE /:id            -- GDPR soft delete
│   │
│   ├── /bookings
│   │   ├── GET    /               -- Bookings list / calendar data
│   │   └── PATCH  /:id            -- Update booking status
│   │
│   ├── /staff
│   │   ├── GET    /               -- Staff list
│   │   ├── POST   /               -- Invite staff member
│   │   └── PATCH  /:id            -- Update role / disable
│   │
│   ├── /billing
│   │   ├── GET    /               -- My credits, plan, usage
│   │   ├── POST   /topup          -- Purchase credit top-up → Stripe Checkout
│   │   └── GET    /transactions   -- Credit transaction history
│   │
│   ├── /reports
│   │   ├── GET    /outcomes       -- Outcome breakdown
│   │   ├── GET    /performance    -- Performance metrics
│   │   ├── GET    /sentiment      -- Sentiment distribution
│   │   └── GET    /peak-hours     -- Call volume by hour
│   │
│   ├── /support
│   │   ├── GET    /tickets        -- My tickets
│   │   ├── POST   /tickets        -- Create ticket
│   │   ├── GET    /tickets/:id    -- Ticket detail + messages
│   │   └── POST   /tickets/:id/messages -- Reply
│   │
│   └── /settings
│       ├── GET    /               -- Clinic settings
│       └── PATCH  /               -- Update settings
│
└── /webhooks                       -- No auth (verified by signature)
    ├── POST  /retell              -- Retell call events
    ├── POST  /stripe              -- Stripe billing events
    └── POST  /email/inbound       -- SendGrid Inbound Parse (email agent)
```

---

### 8. Real-Time Layer

```
┌─────────────┐     SSE / WebSocket     ┌──────────────┐
│   Frontend   │◀───────────────────────│   API Server  │
│   (React)    │                         │               │
└─────────────┘                         └───────┬───────┘
                                                │
                                          Redis Pub/Sub
                                                │
                                    ┌───────────┴───────────┐
                                    │  Webhook Receiver      │
                                    │  (Retell events        │
                                    │   → publish to Redis   │
                                    │   → SSE to frontend)   │
                                    └────────────────────────┘
```

**Events pushed to frontend:**
- Live transcript streaming (during active calls)
- Call completed notification
- New booking created
- Credit balance low warning
- Agent deployment status updates (during onboarding)
- New support ticket reply

---

### 9. Email Agent Architecture (Custom -- Not Retell)

Since Retell doesn't offer email agents, this is a custom channel:

```
Inbound Email (patient replies / new inquiries)
│
│  SendGrid Inbound Parse
│  POST /webhooks/email/inbound
│
▼
┌─────────────────────────────────────────┐
│  Email Agent Service                     │
│                                          │
│  1. Parse sender, subject, body          │
│  2. Lookup tenant by recipient address   │
│  3. Lookup/create customer by sender     │
│  4. Load agent_deployment config         │
│     (email template: tone, rules,        │
│      allowed actions, escalation)        │
│  5. Call LLM (OpenAI / same model as     │
│     voice) with system prompt +          │
│     email body as user message           │
│  6. LLM responds with:                  │
│     - reply text                         │
│     - actions: book? escalate? info?     │
│  7. If action = book → bookingService    │
│  8. If action = escalate → notify staff  │
│  9. Send reply via SendGrid              │
│  10. Log as call { channel: 'email' }    │
│  11. Deduct credits                      │
└──────────────────────────────────────────┘
```

---

### 10. Security Considerations

| Concern | Approach |
|---------|----------|
| **Tenant isolation** | PostgreSQL RLS, tenant_id in JWT, middleware enforcement |
| **API auth** | Short-lived JWT (15 min) + HttpOnly refresh token (7 days) |
| **Webhook verification** | Retell: HMAC signature verification. Stripe: `stripe.webhooks.constructEvent()` |
| **PII at rest** | Encrypt sensitive fields (phone, email) using application-level encryption (AES-256-GCM) |
| **PII in transit** | TLS everywhere, no PII in query params or logs |
| **GDPR** | Soft delete + data export endpoint + 30-day hard purge job |
| **Rate limiting** | Per-tenant rate limits (e.g., 100 req/min for tenant, 1000 req/min for admin) |
| **Retell API key** | Single platform key stored in secrets manager, never exposed to tenants |
| **Audit trail** | Every write operation logged to `audit_logs` with user, action, entity, IP |

---

### 11. Infrastructure / Deployment

```
┌──────────────────────────────────────────────────────────────────┐
│                        Production                                 │
│                                                                   │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌─────────────┐ │
│  │ CDN      │   │ API      │   │ Worker    │   │ Cron        │ │
│  │ (Vercel/ │   │ Server   │   │ (BullMQ)  │   │ Jobs        │ │
│  │  CF)     │   │ x2-4     │   │ x1-2      │   │ x1          │ │
│  │ [SPA]    │   │ [Hono/   │   │ [Agent    │   │ [Credit     │ │
│  │          │   │  Fastify]│   │  deploy,  │   │  grant,     │ │
│  │          │   │          │   │  email,   │   │  reminders, │ │
│  │          │   │          │   │  reports] │   │  cleanup]   │ │
│  └──────────┘   └────┬─────┘   └─────┬─────┘   └──────┬──────┘ │
│                      │               │                 │         │
│              ┌───────▼───────────────▼─────────────────▼───┐     │
│              │          Managed PostgreSQL                   │     │
│              │          (Neon / Supabase / RDS)             │     │
│              └──────────────────────────────────────────────┘     │
│              ┌─────────────────────────────────────┐             │
│              │     Redis (Upstash / ElastiCache)    │             │
│              └─────────────────────────────────────┘             │
│              ┌─────────────────────────────────────┐             │
│              │     Object Storage (S3 / R2)         │             │
│              └─────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

**Cron Jobs:**
- `monthly-credit-grant` -- On subscription renewal (backup to Stripe webhook)
- `appointment-reminders` -- Send reminders 24h / 1h before
- `credit-expiry` -- Expire unused top-up credits after 12 months
- `gdpr-hard-purge` -- Permanently delete soft-deleted records after 30 days
- `agent-sync` -- Periodically sync agent status from Retell (backup to webhooks)
- `analytics-rollup` -- Pre-compute daily/weekly metrics for fast dashboard queries

---

### 12. What You Should Build First (Priority Order)

| Priority | What | Why |
|----------|------|-----|
| **P0** | Auth + Tenant CRUD + DB schema | Foundation -- nothing works without this |
| **P0** | Retell integration (create voice agent, receive webhooks) | Core value prop |
| **P0** | Stripe subscription + credit ledger | Revenue -- can't onboard paying tenants without it |
| **P1** | Agent Template CRUD (admin) | Enables repeatable tenant onboarding |
| **P1** | Tenant onboarding flow (end-to-end) | The critical path: template → deploy → live |
| **P1** | Call webhook pipeline (call_ended → credits → transcript) | Makes the product real |
| **P2** | Chat agent deployment | Second channel |
| **P2** | Booking creation from call outcome | Closes the loop for clinics |
| **P2** | Credit top-up via Stripe Checkout | Monetization beyond subscription |
| **P3** | Email agent (custom) | Third channel, more complex |
| **P3** | Reports / analytics API | Dashboard data |
| **P3** | Support ticket system | Internal tooling |
| **P4** | WhatsApp Business channel | High value for MENA, but requires Meta Business approval process |

---

This architecture keeps MUSAED as a **thin orchestration and billing layer** on top of Retell AI, which is exactly the right posture -- you don't want to own voice/LLM infrastructure. The value you own is: **multi-tenancy, billing, templates, analytics, and the patient journey glue.**
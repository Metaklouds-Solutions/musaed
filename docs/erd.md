Here's the revised ERD incorporating the definition-driven tools/skills model, everything from the architecture doc, and all the discussion we've had.

---

## Revised ERD -- Full Schema

I'm organizing this by domain. Relationships are marked with arrows.

---

### Domain 1: Identity & Tenancy

```
┌─────────────────────────────────┐
│             users                │
├─────────────────────────────────┤
│ id              UUID PK         │
│ email           TEXT UNIQUE     │
│ password_hash   TEXT            │
│ name            TEXT            │
│ role            ENUM            │──── 'ADMIN' | 'TENANT_OWNER' | 'STAFF'
│ avatar_url      TEXT NULL       │
│ totp_secret     TEXT NULL       │
│ totp_enabled    BOOLEAN = false │
│ last_login_at   TIMESTAMPTZ    │
│ created_at      TIMESTAMPTZ    │
│ deleted_at      TIMESTAMPTZ    │──── Soft delete (GDPR)
└──────────┬──────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│      tenant_memberships          │        │           tenants                │
├─────────────────────────────────┤        ├─────────────────────────────────┤
│ id              UUID PK         │        │ id              UUID PK         │
│ user_id         UUID FK → users │        │ name            TEXT            │
│ tenant_id       UUID FK → ten.  │───────▶│ slug            TEXT UNIQUE     │
│ role_slug       ENUM            │        │ status          ENUM            │── ONBOARDING | ACTIVE | TRIAL
│    'clinic_admin'               │        │                                 │   SUSPENDED | CHURNED
│    'receptionist'               │        │ owner_id        UUID FK → users │
│    'doctor'                     │        │ stripe_customer_id    TEXT NULL  │
│    'auditor'                    │        │ stripe_subscription_id TEXT NULL │
│    'tenant_staff'               │        │ plan_id         UUID FK → sub.  │
│ status          ENUM            │        │ timezone        TEXT = 'Asia/   │
│    'active' | 'invited'        │        │                  Riyadh'        │
│    'disabled'                   │        │ locale          TEXT = 'ar'     │
│ invited_at      TIMESTAMPTZ    │        │ onboarding_step INT = 0         │
│ joined_at       TIMESTAMPTZ    │        │ onboarding_complete BOOL = false│
└─────────────────────────────────┘        │ settings        JSONB           │
                                           │   { business_hours, notifs,     │
                                           │     feature_flags, locations }  │
                                           │ created_at      TIMESTAMPTZ    │
                                           │ deleted_at      TIMESTAMPTZ    │
                                           └─────────────────────────────────┘
```

---

### Domain 2: Tool & Skill Definitions (NEW -- Definition-Driven)

This is the core change. Tools and skills are **data**, not code.

```
┌──────────────────────────────────────┐
│          tool_definitions             │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ name             TEXT                │──── e.g. 'check_availability'
│ display_name     TEXT                │──── e.g. 'Check Appointment Availability'
│ description      TEXT                │──── Shown to LLM so it knows when to call it
│ category         ENUM               │──── 'booking' | 'patient' | 'communication'
│                                      │     'clinic_info' | 'escalation' | 'custom'
│ execution_type   ENUM               │──── 'internal' | 'external'
│                                      │
│ ── INTERNAL (runs your DB logic) ── │
│ handler_key      TEXT NULL           │──── 'query_bookings', 'create_booking',
│                                      │     'lookup_patient', 'send_sms', etc.
│                                      │     Maps to a finite set of backend handlers.
│                                      │
│ ── EXTERNAL (proxy to tenant API) ── │
│ endpoint_url     TEXT NULL           │──── 'https://their-emr.com/api/patients'
│ http_method      TEXT NULL           │──── 'GET' | 'POST' | 'PATCH'
│ auth_config      JSONB NULL          │──── { type: 'bearer', token_ref: '...' }
│ headers          JSONB NULL          │──── { 'X-Custom': 'value' }
│                                      │
│ ── SHARED CONFIG ──                  │
│ parameters_schema JSONB              │──── JSON Schema for input params
│ response_mapping  JSONB NULL         │──── Which fields become Retell dynamic vars
│ timeout_ms       INT = 5000          │
│ retry_on_fail    BOOLEAN = false     │
│                                      │
│ ── SCOPING ──                        │
│ scope            ENUM               │──── 'platform' | 'tenant'
│ tenant_id        UUID FK → ten. NULL│──── NULL = platform-wide, set = tenant-only
│ created_by       UUID FK → users    │
│ is_active        BOOLEAN = true      │
│ version          INT = 1             │
│ created_at       TIMESTAMPTZ        │
│ updated_at       TIMESTAMPTZ        │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│          skill_definitions            │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ name             TEXT                │──── e.g. 'appointment_booking'
│ display_name     TEXT                │──── e.g. 'Appointment Booking'
│ description      TEXT                │──── What this skill enables the agent to do
│ category         ENUM               │──── 'core' | 'specialty' | 'custom'
│                                      │
│ ── CONVERSATION FLOW ──              │
│ flow_definition  JSONB              │──── Nodes, prompts, transitions, conditions.
│                                      │     This is the "recipe" that gets pushed
│                                      │     to Retell as a Component.
│                                      │     Contains: entry_prompt, nodes[],
│                                      │     exit_conditions, variable_extractions
│                                      │
│ entry_conditions TEXT NULL           │──── When should agent activate this skill
│                                      │     e.g. 'patient mentions booking/appt'
│                                      │
│ ── RETELL SYNC ──                    │
│ retell_component_id TEXT NULL        │──── Retell's component ID after sync
│ retell_sync_status  ENUM = 'draft'  │──── 'draft' | 'synced' | 'out_of_sync'
│ last_synced_at   TIMESTAMPTZ NULL   │
│                                      │
│ ── SCOPING ──                        │
│ scope            ENUM               │──── 'platform' | 'tenant'
│ tenant_id        UUID FK → ten. NULL│──── NULL = platform-wide
│ created_by       UUID FK → users    │
│ is_active        BOOLEAN = true      │
│ version          INT = 1             │
│ created_at       TIMESTAMPTZ        │
│ updated_at       TIMESTAMPTZ        │
└──────────────┬───────────────────────┘
               │
               │ N:M
               ▼
┌──────────────────────────────────────┐
│        skill_tool_links               │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ skill_id         UUID FK → skill_d. │──── Which skill
│ tool_id          UUID FK → tool_d.  │──── Uses which tool
│ node_reference   TEXT NULL           │──── Which node in the flow uses this tool
│ is_required      BOOLEAN = true      │──── Can the skill work without this tool?
│ created_at       TIMESTAMPTZ        │
└──────────────────────────────────────┘
```

**Relationships:**
- `tool_definitions` → scoped to platform (tenant_id = NULL) or a specific tenant
- `skill_definitions` → scoped to platform or specific tenant
- `skill_tool_links` → many-to-many linking skills to the tools they use

---

### Domain 3: Agent Templates & Deployments

```
┌──────────────────────────────────────┐
│         agent_templates               │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ name             TEXT                │──── e.g. 'Clinic Receptionist - Arabic'
│ description      TEXT                │
│ channel          ENUM               │──── 'voice' | 'chat' | 'email'
│                                      │
│ ── RETELL CONFIG ──                  │
│ voice_config     JSONB NULL          │──── { voice_id, language, speed, ... }
│ chat_config      JSONB NULL          │──── { auto_close_timeout, ... }
│ email_config     JSONB NULL          │──── { tone, signature, rules }
│ llm_config       JSONB               │──── { model, temperature, max_tokens }
│ base_prompt      TEXT                │──── System prompt with {{variables}}
│ webhook_url      TEXT                │──── '{{platform_base}}/webhooks/retell'
│ mcp_server_url   TEXT NULL           │──── '{{platform_base}}/mcp'
│                                      │
│ ── VARIABLES ──                      │
│ template_variables JSONB             │──── { clinic_name: { type, required },
│                                      │       business_hours: { type, required } }
│                                      │
│ ── METADATA ──                       │
│ is_default       BOOLEAN = false     │
│ tags             TEXT[]              │
│ version          INT = 1             │
│ created_by       UUID FK → users    │
│ created_at       TIMESTAMPTZ        │
│ updated_at       TIMESTAMPTZ        │
└──────────────┬───────────────────────┘
               │
               │ N:M
               ▼
┌──────────────────────────────────────┐
│      agent_template_skills            │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ template_id      UUID FK → templ.   │
│ skill_id         UUID FK → skill_d. │
│ sort_order       INT                │──── Priority/order in the flow
│ is_enabled       BOOLEAN = true      │──── Toggle skill on/off in template
└──────────────────────────────────────┘


┌─────────────────────────────────────────┐
│          agent_deployments               │
├─────────────────────────────────────────┤
│ id                UUID PK               │
│ tenant_id         UUID FK → tenants     │
│ template_id       UUID FK → templ. NULL │──── Template it was created from
│ channel           ENUM                  │──── 'voice' | 'chat' | 'email'
│                                          │
│ ── RETELL REFERENCES ──                  │
│ retell_agent_id   TEXT NULL             │──── Retell's agent_id
│ retell_llm_id     TEXT NULL             │──── Retell's LLM response engine ID
│ retell_agent_version INT NULL           │
│                                          │
│ ── PHONE (voice only) ──                 │
│ phone_number_id   UUID FK → phone. NULL │
│                                          │
│ ── EMAIL (email only) ──                 │
│ email_address     TEXT NULL             │
│                                          │
│ ── STATE ──                              │
│ status            ENUM                  │──── 'deploying' | 'active' | 'paused'
│                                          │     'failed' | 'deleted'
│ config_snapshot   JSONB                 │──── Full config at time of deploy
│ custom_prompts    JSONB NULL            │──── Tenant-specific prompt overrides
│ resolved_variables JSONB NULL           │──── Template vars resolved with tenant data
│ last_synced_at    TIMESTAMPTZ NULL      │
│ deployed_at       TIMESTAMPTZ NULL      │
│ created_at        TIMESTAMPTZ           │
└──────────────┬──────────────────────────┘
               │
               │ 1:N
               ▼
┌─────────────────────────────────────────┐
│     deployment_skill_overrides           │
├─────────────────────────────────────────┤
│ id                UUID PK               │──── Per-deployment skill customization
│ deployment_id     UUID FK → depl.       │
│ skill_id          UUID FK → skill_d.    │
│ is_enabled        BOOLEAN = true        │──── Tenant can disable a skill
│ prompt_override   TEXT NULL             │──── Tenant-specific prompt for this skill
│ custom_config     JSONB NULL            │──── Any skill-level overrides
└─────────────────────────────────────────┘


┌─────────────────────────────────────────┐
│      deployment_tool_overrides           │
├─────────────────────────────────────────┤
│ id                UUID PK               │──── Per-deployment tool customization
│ deployment_id     UUID FK → depl.       │
│ tool_id           UUID FK → tool_d.     │
│ is_enabled        BOOLEAN = true        │
│ endpoint_override TEXT NULL             │──── Tenant provides their own endpoint
│ auth_override     JSONB NULL            │──── Tenant's API credentials
│ params_override   JSONB NULL            │──── Extra default params for this tenant
└─────────────────────────────────────────┘


┌─────────────────────────────────────────┐
│          phone_numbers                   │
├─────────────────────────────────────────┤
│ id                UUID PK               │
│ tenant_id         UUID FK → tenants     │
│ retell_number_id  TEXT                  │
│ number            TEXT                  │──── E.164 format
│ country           TEXT                  │
│ type              ENUM                  │──── 'local' | 'toll_free'
│ inbound_deployment_id  UUID FK NULL     │
│ outbound_deployment_id UUID FK NULL     │
│ monthly_cost_cents INT                  │
│ status            ENUM                  │──── 'active' | 'released'
│ created_at        TIMESTAMPTZ           │
└─────────────────────────────────────────┘
```

---

### Domain 4: Billing & Credits

```
┌───────────────────────────────────┐
│       subscription_plans           │
├───────────────────────────────────┤
│ id              UUID PK           │
│ name            TEXT              │──── 'Starter' | 'Professional' | 'Enterprise'
│ stripe_product_id TEXT            │
│ stripe_price_id   TEXT            │
│ monthly_price_cents INT           │
│ monthly_credits   INT             │
│ max_voice_agents  INT NULL        │──── NULL = unlimited
│ max_chat_agents   INT NULL        │
│ max_email_agents  INT NULL        │
│ max_staff         INT NULL        │
│ features          JSONB           │──── { reports, calendar, customSkills, etc. }
│ is_active         BOOLEAN = true  │
│ created_at        TIMESTAMPTZ     │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│         topup_packages             │
├───────────────────────────────────┤
│ id              UUID PK           │
│ name            TEXT              │──── '$100 Top-Up'
│ stripe_product_id TEXT            │
│ stripe_price_id   TEXT            │
│ price_cents       INT             │──── 10000 | 50000 | 100000
│ credits           INT             │──── 600 | 3500 | 8000
│ is_active         BOOLEAN = true  │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│        credit_accounts             │
├───────────────────────────────────┤
│ id              UUID PK           │
│ tenant_id       UUID FK UNIQUE    │──── One per tenant
│ balance         INT = 0           │
│ lifetime_purchased INT = 0        │
│ lifetime_consumed  INT = 0        │
│ low_balance_threshold INT = 50    │
│ updated_at      TIMESTAMPTZ       │
└───────────────────────────────────┘

┌───────────────────────────────────┐
│      credit_transactions           │
├───────────────────────────────────┤
│ id              UUID PK           │
│ tenant_id       UUID FK           │
│ type            ENUM              │──── 'subscription_grant' | 'topup_purchase'
│                                   │     'usage_deduct' | 'refund'
│                                   │     'adjustment' | 'expiry'
│ amount          INT               │──── +N or -N
│ balance_after   INT               │
│ reference_type  TEXT NULL         │──── 'call' | 'chat' | 'email' | 'invoice'
│ reference_id    TEXT NULL         │
│ description     TEXT              │
│ created_at      TIMESTAMPTZ       │
└───────────────────────────────────┘
```

---

### Domain 5: Calls, Customers & Bookings

```
┌──────────────────────────────────────┐
│              calls                    │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ tenant_id        UUID FK            │
│ deployment_id    UUID FK → depl.    │
│ retell_call_id   TEXT UNIQUE NULL   │
│ channel          ENUM               │──── 'voice' | 'chat' | 'email'
│ direction        ENUM               │──── 'inbound' | 'outbound'
│ from_number      TEXT NULL          │
│ to_number        TEXT NULL          │
│ customer_id      UUID FK NULL       │
│ status           ENUM               │──── 'in_progress' | 'completed'
│                                      │     'failed' | 'transferred'
│ outcome          ENUM NULL          │──── 'booked' | 'escalated'
│                                      │     'info_provided' | 'failed'
│                                      │     'cancelled'
│ duration_seconds INT NULL           │
│ credits_consumed INT NULL           │
│ sentiment_score  FLOAT NULL         │
│ transcript       JSONB NULL         │
│ analysis         JSONB NULL         │──── Entities, intent, summary
│ recording_url    TEXT NULL          │
│ metadata         JSONB NULL         │
│ started_at       TIMESTAMPTZ       │
│ ended_at         TIMESTAMPTZ NULL   │
│ analyzed_at      TIMESTAMPTZ NULL   │
└──────────────┬───────────────────────┘
               │
               │ 1:N
               ▼
┌──────────────────────────────────────┐
│       tool_execution_logs             │
├──────────────────────────────────────┤
│ id               UUID PK            │──── Every tool call during a conversation
│ call_id          UUID FK → calls    │
│ tenant_id        UUID FK            │
│ tool_id          UUID FK → tool_d.  │
│ tool_name        TEXT               │──── Denormalized for fast queries
│ request_params   JSONB              │──── What Retell sent
│ response_body    JSONB NULL         │──── What we returned
│ execution_type   ENUM               │──── 'internal' | 'external'
│ handler_key      TEXT NULL          │──── Which handler ran (internal)
│ endpoint_called  TEXT NULL          │──── Which URL (external)
│ status           ENUM               │──── 'success' | 'error' | 'timeout'
│ duration_ms      INT                │
│ error_message    TEXT NULL          │
│ executed_at      TIMESTAMPTZ       │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│            customers                  │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ tenant_id        UUID FK            │
│ name             TEXT               │
│ email            TEXT NULL          │
│ phone            TEXT NULL          │──── E.164 (encrypted at rest)
│ date_of_birth    DATE NULL          │
│ source           ENUM               │──── 'call' | 'chat' | 'email' | 'manual'
│ tags             TEXT[]             │
│ metadata         JSONB              │──── Extracted from conversations
│ total_calls      INT = 0            │──── Denormalized counter
│ total_bookings   INT = 0            │
│ created_at       TIMESTAMPTZ       │
│ deleted_at       TIMESTAMPTZ NULL  │──── Soft delete (GDPR)
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│            bookings                   │
├──────────────────────────────────────┤
│ id               UUID PK            │
│ tenant_id        UUID FK            │
│ customer_id      UUID FK            │
│ call_id          UUID FK NULL       │──── Which call created this booking
│ provider_id      UUID FK → memb. NULL│──── Doctor / provider
│ location_id      TEXT NULL          │
│ service_type     TEXT NULL          │──── 'cleaning', 'consultation', etc.
│ date             DATE               │
│ time_slot        TEXT               │
│ duration_minutes INT = 30           │
│ status           ENUM               │──── 'confirmed' | 'cancelled'
│                                      │     'completed' | 'no_show'
│ notes            TEXT NULL          │
│ reminder_sent    BOOLEAN = false    │
│ reminder_at      TIMESTAMPTZ NULL  │
│ created_at       TIMESTAMPTZ       │
└──────────────────────────────────────┘
```

---

### Domain 6: Support, Audit & Webhooks

```
┌───────────────────────────────────┐     ┌───────────────────────────────────┐
│       support_tickets              │     │       ticket_messages              │
├───────────────────────────────────┤     ├───────────────────────────────────┤
│ id             UUID PK            │     │ id             UUID PK            │
│ tenant_id      UUID FK            │◀────│ ticket_id      UUID FK            │
│ title          TEXT               │     │ author_id      UUID FK → users    │
│ category       ENUM               │     │ body           TEXT               │
│  'billing' | 'technical'         │     │ created_at     TIMESTAMPTZ        │
│  'agent' | 'general'             │     └───────────────────────────────────┘
│ status         ENUM               │
│  'open' | 'in_progress'          │
│  'resolved' | 'closed'           │
│ priority       ENUM               │
│  'low' | 'medium'                │
│  'high' | 'critical'             │
│ assigned_to    UUID FK NULL       │
│ created_by     UUID FK            │
│ created_at     TIMESTAMPTZ        │
│ closed_at      TIMESTAMPTZ NULL   │
└───────────────────────────────────┘

┌───────────────────────────────────┐     ┌───────────────────────────────────┐
│         audit_logs                 │     │       webhook_events               │
├───────────────────────────────────┤     ├───────────────────────────────────┤
│ id             UUID PK            │     │ id             UUID PK            │
│ tenant_id      UUID FK NULL       │     │ source         ENUM               │
│ user_id        UUID FK NULL       │     │  'retell' | 'stripe' | 'sendgrid'│
│ action         TEXT               │     │ event_type     TEXT               │
│  'tenant.created'                 │     │  'call_ended', 'invoice.paid'...  │
│  'agent.deployed'                 │     │ payload        JSONB              │
│  'booking.created'                │     │ status         ENUM               │
│  'tool.executed'                  │     │  'received' | 'processed'         │
│  'skill.updated' etc.            │     │  'failed' | 'retrying'            │
│ entity_type    TEXT               │     │ error_message  TEXT NULL           │
│ entity_id      UUID NULL          │     │ attempts       INT = 1            │
│ metadata       JSONB              │     │ processed_at   TIMESTAMPTZ NULL   │
│ ip_address     TEXT NULL          │     │ received_at    TIMESTAMPTZ        │
│ created_at     TIMESTAMPTZ        │     └───────────────────────────────────┘
└───────────────────────────────────┘
```

---

### Relationship Map (Simplified)

```
users ──1:N──▶ tenant_memberships ◀──N:1── tenants
                                              │
                                    ┌─────────┼──────────┐
                                    │         │          │
                                    ▼         ▼          ▼
                              credit_acc   agent_depl  phone_numbers
                                    │         │
                                    │         ├──▶ deployment_skill_overrides
                                    │         ├──▶ deployment_tool_overrides
                                    │         │
                                    ▼         ▼
                              credit_txns   calls
                                              │
                                              ├──▶ tool_execution_logs
                                              ├──▶ bookings
                                              └──▶ customers


tool_definitions ◀──N:M──▶ skill_definitions    (via skill_tool_links)
                                │
                                ▼
                        skill_definitions ◀──N:M──▶ agent_templates
                                                    (via agent_template_skills)
                                                          │
                                                          ▼
                                                    agent_deployments
```

---

### Table Count Summary

| Domain | Tables | New vs Original |
|--------|--------|-----------------|
| Identity & Tenancy | 3 | Same |
| Tool & Skill Definitions | 3 | **All new** |
| Agent Config & Deployments | 6 | **3 new** (template_skills, deployment_skill_overrides, deployment_tool_overrides) |
| Billing | 4 | Same |
| Calls, Customers, Bookings | 4 | **1 new** (tool_execution_logs) |
| Support, Audit, Webhooks | 4 | **1 new** (webhook_events) |
| **Total** | **24 tables** | **8 new** vs original 16 |

The 8 new tables are the cost of making tools and skills definition-driven. That's a reasonable trade-off for a system that doesn't require code deploys when you add a new capability.
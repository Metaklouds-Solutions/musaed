# MUSAED Architecture

Backend architecture derived from `erd-mongodb.md`. Defines data model, services, and API for the clinic CRM.

---

## 1. References

| Document | Purpose |
|----------|---------|
| `docs/erd-mongodb.md` | Entity structure (9 collections), indexes, relationships |
| `docs/BACKEND-IMPLEMENTATION-GUIDE.md` | Step-by-step backend implementation guide |

---

## 2. High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                         │
│   React SPA (Tenant Portal)    React SPA (Admin Portal)    PWA (Mobile)  │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        REST API (NestJS)                                 │
│   /api/v1  ·  Auth  ·  Admin  ·  Tenant  ·  Webhooks                     │
└──────────┬──────────────────────────────────┬────────────────────────────┘
           │                                  │
     ┌─────▼─────┐                    ┌───────▼────────┐
     │  REST     │                    │  Webhooks       │
     │  Controllers                   │  (Stripe,       │
     │  (Auth, Tenant, Agent, etc.)  │   Retell)       │
     └─────┬─────┘                    └───────┬────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                      │
│  Auth · Tenant · Staff · Agent · Billing · Customer · Booking · Support  │
└──────────┬───────────────────────────────────────────────────────────────┘
           │
     ┌─────▼─────┐
     │ MongoDB   │  9 collections (users, tenants, tenant_staff, etc.)
     │ Mongoose  │
     └───────────┘
           │
     ┌─────▼──────────────────────────────────────────────────────────────┐
     │  EXTERNAL: Retell AI · Stripe · SendGrid                            │
     └─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology |
|-------|-------------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | NestJS |
| Database | MongoDB |
| ODM | Mongoose |
| Cache / Queue | Redis (Upstash if serverless) |
| Job Queue | BullMQ |
| Auth | JWT + Refresh tokens |
| Email | SendGrid |
| Billing | Stripe |
| Voice/Chat Agents | Retell AI |

---

## 4. Data Model (from erd-mongodb.md)

### 4.1 Identity & Tenancy

**users**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| email | String | unique |
| passwordHash | String | |
| name | String | |
| role | String | 'ADMIN' \| 'TENANT_OWNER' \| 'STAFF' |
| avatarUrl | String | |
| lastLoginAt | Date | |
| createdAt | Date | |
| deletedAt | Date | soft delete (GDPR) |

**Indexes:** `{ email: 1 }` unique, `{ deletedAt: 1 }` sparse

---

**tenants**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | |
| slug | String | unique |
| status | String | 'ONBOARDING' \| 'ACTIVE' \| 'TRIAL' \| 'SUSPENDED' \| 'CHURNED' |
| ownerId | ObjectId | → users |
| stripeCustomerId | String | |
| stripeSubscriptionId | String | |
| planId | ObjectId | → subscription_plans |
| timezone | String | default 'Asia/Riyadh' |
| locale | String | default 'ar' |
| onboardingStep | Number | |
| onboardingComplete | Boolean | |
| settings | Embedded | businessHours, notifications, featureFlags, locations |
| createdAt | Date | |
| deletedAt | Date | |

**Indexes:** `{ slug: 1 }` unique, `{ ownerId: 1 }`, `{ status: 1 }`

---

**tenant_staff**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| userId | ObjectId | → users |
| tenantId | ObjectId | → tenants |
| roleSlug | String | 'clinic_admin' \| 'receptionist' \| 'doctor' \| 'auditor' \| 'tenant_staff' |
| status | String | 'active' \| 'invited' \| 'disabled' |
| invitedAt | Date | |
| joinedAt | Date | |

**Indexes:** `{ userId: 1, tenantId: 1 }` unique, `{ tenantId: 1 }`

---

### 4.2 Agent Templates & Instances

**agent_templates**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | |
| description | String | |
| channel | String | 'voice' \| 'chat' \| 'email' |
| voiceConfig | Object | |
| chatConfig | Object | |
| emailConfig | Object | |
| llmConfig | Object | |
| basePrompt | String | |
| webhookUrl | String | |
| mcpServerUrl | String | |
| templateVariables | Object | |
| isDefault | Boolean | |
| tags | [String] | |
| version | Number | |
| createdBy | ObjectId | → users |
| createdAt, updatedAt | Date | |

**Indexes:** `{ channel: 1 }`, `{ isDefault: 1 }`

---

**agent_instances**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| tenantId | ObjectId | → tenants |
| templateId | ObjectId | → agent_templates (nullable) |
| channel | String | |
| retellAgentId | String | |
| retellLlmId | String | |
| retellAgentVersion | Number | |
| emailAddress | String | email channel only |
| status | String | 'deploying' \| 'active' \| 'paused' \| 'failed' \| 'deleted' |
| configSnapshot | Object | |
| customPrompts | Object | |
| resolvedVariables | Object | |
| lastSyncedAt | Date | |
| deployedAt | Date | |
| createdAt | Date | |

**Indexes:** `{ tenantId: 1 }`, `{ status: 1 }`, `{ retellAgentId: 1 }`

---

### 4.3 Billing

**subscription_plans**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | |
| stripeProductId | String | |
| stripePriceId | String | |
| monthlyPriceCents | Number | |
| maxVoiceAgents | Number | |
| maxChatAgents | Number | |
| maxEmailAgents | Number | |
| maxStaff | Number | |
| features | Object | |
| isActive | Boolean | |
| createdAt | Date | |

---

### 4.4 Customers & Bookings

**customers**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| tenantId | ObjectId | → tenants |
| name | String | |
| email | String | |
| phone | String | E.164 |
| dateOfBirth | Date | |
| source | String | 'call' \| 'chat' \| 'email' \| 'manual' |
| tags | [String] | |
| metadata | Object | |
| totalBookings | Number | default 0 |
| createdAt | Date | |
| deletedAt | Date | |

**Indexes:** `{ tenantId: 1 }`, `{ tenantId: 1, phone: 1 }`, `{ tenantId: 1, email: 1 }`

---

**bookings**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| tenantId | ObjectId | → tenants |
| customerId | ObjectId | → customers |
| providerId | ObjectId | → tenant_staff (nullable) |
| locationId | String | |
| serviceType | String | |
| date | Date | |
| timeSlot | String | |
| durationMinutes | Number | default 30 |
| status | String | 'confirmed' \| 'cancelled' \| 'completed' \| 'no_show' |
| notes | String | |
| reminderSent | Boolean | |
| reminderAt | Date | |
| createdAt | Date | |

**Indexes:** `{ tenantId: 1, date: 1 }`, `{ customerId: 1 }`

---

### 4.5 Support

**support_tickets**
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| tenantId | ObjectId | → tenants |
| title | String | |
| category | String | 'billing' \| 'technical' \| 'agent' \| 'general' |
| status | String | 'open' \| 'in_progress' \| 'resolved' \| 'closed' |
| priority | String | 'low' \| 'medium' \| 'high' \| 'critical' |
| assignedTo | ObjectId | → users (nullable) |
| createdBy | ObjectId | → users |
| createdAt | Date | |
| closedAt | Date | |
| messages | Embedded | [{ authorId, body, createdAt }] |

**Indexes:** `{ tenantId: 1 }`, `{ status: 1 }`, `{ createdBy: 1 }`

---

## 5. Relationship Diagram

```
users ◀──ref── tenant_staff ──ref──▶ tenants
                                              │
                                    ┌─────────┴──────────┐
                                    │                    │
                                    ▼                    ▼
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

## 6. Embed vs Reference

| Relationship | Strategy | Reason |
|--------------|----------|--------|
| tenant_staff ↔ users/tenants | Reference | Many memberships, independent access |
| agent_templates ↔ agent_instances | Reference | 1:N, instances per template |
| support_tickets.messages | Embed | 1:few, always with ticket |
| tenants.settings | Embed | 1:1, always with tenant |
| All other 1:N | Reference | Large cardinality or independent access |

---

## 7. Multi-Tenancy

**Approach:** Shared database, tenant-scoped queries.

- Every tenant-scoped document has `tenantId`.
- JWT payload: `{ userId, tenantId?, role, tenantRole? }`.
- **TenantGuard:** Extract `tenantId` from JWT, apply to all tenant routes.
- **AdminGuard:** Require `role === 'ADMIN'` for admin routes.

---

## 8. API Route Structure

```
/api/v1
│
├── /auth
│   ├── POST   /login       -- Email + password → JWT + refresh token
│   ├── POST   /refresh     -- Refresh token → new JWT
│   └── POST   /logout     -- Revoke refresh token
│
├── /admin                    -- AdminGuard
│   ├── /tenants
│   │   ├── GET    /         -- List tenants (paginated)
│   │   ├── POST   /         -- Create tenant
│   │   ├── GET    /:id      -- Tenant detail
│   │   ├── PATCH  /:id      -- Update tenant
│   │   ├── POST   /:id/suspend
│   │   └── GET    /:id/instances
│   │
│   ├── /templates
│   │   ├── GET    /         -- List templates
│   │   ├── POST   /         -- Create template
│   │   ├── GET    /:id
│   │   ├── PATCH  /:id
│   │   └── DELETE /:id
│   │
│   ├── /billing
│   │   ├── GET    /overview
│   │   └── GET    /plans
│   │
│   ├── /support
│   ├── /staff
│   └── /system
│
├── /tenant                   -- TenantGuard (tenantId from JWT)
│   ├── /dashboard
│   │   └── GET    /metrics
│   │
│   ├── /agents
│   │   ├── GET    /
│   │   ├── GET    /:id
│   │   ├── PATCH  /:id/prompts
│   │   └── POST   /:id/sync
│   │
│   ├── /customers
│   │   ├── GET    /
│   │   ├── GET    /:id
│   │   ├── POST   /:id/export
│   │   └── DELETE /:id
│   │
│   ├── /bookings
│   │   ├── GET    /
│   │   └── PATCH  /:id
│   │
│   ├── /staff
│   │   ├── GET    /
│   │   ├── POST   /
│   │   └── PATCH  /:id
│   │
│   ├── /billing
│   │   └── GET    /
│   │
│   ├── /support
│   │   ├── GET    /tickets
│   │   ├── POST   /tickets
│   │   ├── GET    /tickets/:id
│   │   └── POST   /tickets/:id/messages
│   │
│   ├── /reports
│   │   └── GET    /performance
│   │
│   └── /settings
│       ├── GET    /
│       └── PATCH  /
│
└── /webhooks
    ├── POST  /stripe
    └── POST  /retell
```

---

## 9. Service Layer

| Service | Responsibility |
|---------|----------------|
| **AuthService** | Login, JWT, refresh, logout |
| **TenantsService** | Tenant CRUD, onboarding |
| **StaffService** | Tenant staff CRUD, invites |
| **TemplatesService** | Agent template CRUD |
| **AgentsService** | Agent instance CRUD, Retell sync |
| **BillingService** | Stripe subscription, plan lookup |
| **CustomersService** | Customer CRUD, GDPR export |
| **BookingsService** | Booking CRUD |
| **SupportService** | Ticket CRUD, messages |

---

## 10. External Integrations

| Service | Purpose |
|---------|---------|
| **Retell AI** | Voice and chat agents |
| **Stripe** | Subscriptions, billing |
| **SendGrid** | Transactional email, email agent channel |

---

## 11. Collection Summary

| Domain | Collections |
|--------|-------------|
| Identity & Tenancy | users, tenants, tenant_staff |
| Agent Templates & Instances | agent_templates, agent_instances |
| Billing | subscription_plans |
| Customers & Bookings | customers, bookings |
| Support | support_tickets |
| **Total** | **9 collections** |

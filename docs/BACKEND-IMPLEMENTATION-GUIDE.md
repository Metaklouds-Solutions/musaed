# MUSAED Backend Implementation Guide

Step-by-step guide for building the backend API. Aligned with `architecture.md` and `erd-mongodb.md`.

---

## References

| Document | Purpose |
|----------|---------|
| `docs/architecture.md` | Backend architecture, services, API routes, data model |
| `docs/erd-mongodb.md` | Entity structure (9 collections), indexes, relationships |
| `docs/IMPLEMENTATION-GUIDE.md` | Frontend prototype (adapters, modules) |

---

## Project Summary

### What We're Building

- **Backend API** (`apps/backend`): NestJS REST API serving Admin and Tenant portals
- **Database**: MongoDB — Mongoose models map ERD collections
- **Frontend Integration**: Prototype adapters switch from `seedData` to real API when `VITE_DATA_MODE=api`

### Entity Mapping (ERD → MongoDB)

| ERD Collection | MongoDB Collection | Notes |
|----------------|---------------------|-------|
| users | users | |
| tenants | tenants | settings embedded |
| tenant_staff | tenant_staff | |
| agent_templates | agent_templates | voiceConfig, chatConfig, etc. |
| agent_instances | agent_instances | configSnapshot, customPrompts |
| subscription_plans | subscription_plans | |
| customers | customers | metadata |
| bookings | bookings | |
| support_tickets | support_tickets | messages embedded |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
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

---

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Project setup, Mongoose schemas, seed | ✅ DONE |
| **Phase 2** | Auth service (login, JWT, refresh) | ✅ DONE |
| **Phase 3** | Tenant & Staff (CRUD, multi-tenancy) | ✅ DONE |
| **Phase 4** | Agent Templates & Instances (Retell) | ✅ DONE |
| **Phase 5** | Billing (Stripe, subscription_plans) | ✅ DONE |
| **Phase 6** | Customers & Bookings | ✅ DONE |
| **Phase 7** | Support tickets | ✅ DONE |
| **Phase 8** | Admin routes, dashboard, system | ✅ DONE |
| **Phase 9** | Webhooks (Stripe, Retell) | ✅ DONE |
| **Phase 10** | Frontend adapter wiring | ✅ DONE |

---

## Tag Format

Tags: `[BACKEND-PHASE-X-MODULE]` e.g. `[BACKEND-PHASE-1-SETUP]`

When done: `[BACKEND-PHASE-1-SETUP] ✅ DONE`

**Workflow:** After each module, show MODULE COMPLETE. User says "Start next module" to continue.

---

# PHASE 1: Project Setup & Database Schema ✅

## [BACKEND-PHASE-1-SETUP] Create Backend Package ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/package.json`
- `apps/backend/tsconfig.json`
- `apps/backend/nest-cli.json`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/.env.example`

**Root scripts:** `pnpm dev:backend`, `pnpm build:backend`

**Review checkpoint:** `pnpm dev:backend` starts NestJS server, responds to GET /health.

---

## [BACKEND-PHASE-1-SCHEMA] Mongoose Schemas ✅

**Status:** ✅ DONE

**Files:** `apps/backend/src/*/schemas/*.schema.ts`

All 9 collections defined per `erd-mongodb.md`:
- users, tenants, tenant_staff
- agent_templates, agent_instances
- subscription_plans
- customers, bookings
- support_tickets

---

## [BACKEND-PHASE-1-SEED] Initial Seed Data ✅

**Status:** ✅ DONE

**Tasks:**
- `apps/backend/src/db/seed.ts` — subscription_plans (Starter, Professional, Enterprise), 1 admin user
- Run: `cd apps/backend && pnpm run seed`
- Admin: `admin@musaed.com` / `Admin123!`

---

> **PHASE 1 COMPLETE** — Project setup and schema done. Say **"Start Phase 2"** to continue.

---

# PHASE 2: Auth Service ✅

## [BACKEND-PHASE-2-AUTH] Auth Routes & JWT ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/auth.service.ts`
- `apps/backend/src/auth/guards/jwt-auth.guard.ts`

**Tasks:**
1. POST /auth/login — email, password → validate, return { accessToken, refreshToken, user }
2. POST /auth/refresh — refreshToken → new accessToken
3. POST /auth/logout — invalidate refresh token (Redis blocklist or DB)
4. JWT payload: { userId, tenantId?, role, tenantRole? }
5. Middleware: extract Bearer token, verify, set ctx.user

**Review checkpoint:** Login returns tokens. Protected route rejects invalid token.

---

> **PHASE 2 COMPLETE** — Auth done. Say **"Start Phase 3"** to continue.

---

# PHASE 3: Tenant & Staff ✅

## [BACKEND-PHASE-3-MIDDLEWARE] Tenant Middleware & Guards ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/common/guards/tenant.guard.ts`
- `apps/backend/src/common/guards/admin.guard.ts`

**Tasks:**
1. TenantGuard: extract tenantId from JWT, set ctx.tenantId
2. AdminGuard: require role === 'ADMIN'
3. Apply TenantGuard to all /tenant/* routes
4. Apply AdminGuard to all /admin/* routes

---

## [BACKEND-PHASE-3-TENANTS] Tenant CRUD (Admin) ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/tenants/tenants.controller.ts` (admin routes)
- `apps/backend/src/tenants/tenants.service.ts`

**Tasks:**
1. GET /admin/tenants — list (paginated, filter by status)
2. POST /admin/tenants — create tenant
3. GET /admin/tenants/:id — tenant detail
4. PATCH /admin/tenants/:id — update
5. POST /admin/tenants/:id/suspend — set status SUSPENDED
6. GET /admin/tenants/:id/instances — agent instances for tenant

---

## [BACKEND-PHASE-3-STAFF] Tenant Staff CRUD ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/staff/staff.controller.ts`
- `apps/backend/src/staff/staff.service.ts`

**Tasks:**
1. GET /tenant/staff — list staff for current tenant
2. POST /tenant/staff — invite staff member
3. PATCH /tenant/staff/:id — update role / disable

---

> **PHASE 3 COMPLETE** — Tenant & Staff done. Say **"Start Phase 4"** to continue.

---

# PHASE 4: Agent Templates & Instances ✅

## [BACKEND-PHASE-4-TEMPLATES] Agent Templates (Admin) ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/templates/templates.controller.ts`
- `apps/backend/src/templates/templates.service.ts`

**Tasks:**
1. GET /admin/templates — list
2. POST /admin/templates — create
3. GET /admin/templates/:id — get
4. PATCH /admin/templates/:id — update
5. DELETE /admin/templates/:id — archive

---

## [BACKEND-PHASE-4-AGENTS] Agent Instances (Retell) ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/agents/agents.controller.ts`
- `apps/backend/src/agents/agents.service.ts`
- `apps/backend/src/agents/agent-orchestrator.service.ts`

**Tasks:**
1. GET /tenant/agents — list instances for tenant
2. GET /tenant/agents/:id — instance detail
3. PATCH /tenant/agents/:id/prompts — update custom prompts
4. POST /tenant/agents/:id/sync — force sync from Retell
5. Integrate Retell API for create/update/delete agents

---

> **PHASE 4 COMPLETE** — Agents done. Say **"Start Phase 5"** to continue.

---

# PHASE 5: Billing ✅

## [BACKEND-PHASE-5-BILLING] Stripe & Plans ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/billing/billing.controller.ts`
- `apps/backend/src/billing/billing.service.ts`
- `apps/backend/src/webhooks/stripe.webhook.controller.ts`

**Tasks:**
1. GET /admin/billing/overview — revenue, MRR
2. GET /admin/billing/plans — subscription plans
3. GET /tenant/billing — tenant plan, subscription status
4. Stripe webhook: invoice.payment_succeeded, customer.subscription.deleted

---

> **PHASE 5 COMPLETE** — Billing done. Say **"Start Phase 6"** to continue.

---

# PHASE 6: Customers & Bookings ✅

## [BACKEND-PHASE-6-CUSTOMERS] Customer CRUD ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/customers/customers.controller.ts`
- `apps/backend/src/customers/customers.service.ts`

**Tasks:**
1. GET /tenant/customers — list (paginated)
2. GET /tenant/customers/:id — detail + history
3. POST /tenant/customers/:id/export — GDPR export
4. DELETE /tenant/customers/:id — soft delete

---

## [BACKEND-PHASE-6-BOOKINGS] Booking CRUD ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/bookings/bookings.controller.ts`
- `apps/backend/src/bookings/bookings.service.ts`

**Tasks:**
1. GET /tenant/bookings — list / calendar data
2. PATCH /tenant/bookings/:id — update status

---

> **PHASE 6 COMPLETE** — Customers & Bookings done. Say **"Start Phase 7"** to continue.

---

# PHASE 7: Support Tickets

## [BACKEND-PHASE-7-SUPPORT] Support CRUD

**Status:** ⬜ TODO

**Files:**
- `apps/backend/src/support/support.controller.ts`
- `apps/backend/src/support/support.service.ts`

**Tasks:**
1. GET /tenant/support/tickets — list
2. POST /tenant/support/tickets — create
3. GET /tenant/support/tickets/:id — detail + messages
4. POST /tenant/support/tickets/:id/messages — reply

---

> **PHASE 7 COMPLETE** — Support done. Say **"Start Phase 8"** to continue.

---

# PHASE 8: Admin & Dashboard ✅

## [BACKEND-PHASE-8-ADMIN] Admin Routes ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/admin/admin.controller.ts`
- `apps/backend/src/dashboard/dashboard.controller.ts`
- `apps/backend/src/reports/reports.controller.ts`

**Tasks:**
1. Admin dashboard metrics
2. GET /tenant/dashboard/metrics — KPIs
3. GET /tenant/reports/performance — performance metrics
4. GET /admin/support — all tickets
5. GET /admin/staff — all staff
6. GET /admin/system — health, maintenance

---

> **PHASE 8 COMPLETE** — Admin done. Say **"Start Phase 9"** to continue.

---

# PHASE 9: Webhooks ✅

## [BACKEND-PHASE-9-WEBHOOKS] Stripe & Retell ✅

**Status:** ✅ DONE

**Files:**
- `apps/backend/src/webhooks/stripe.webhook.controller.ts`
- `apps/backend/src/webhooks/retell.webhook.controller.ts`

**Tasks:**
1. POST /webhooks/stripe — verify signature, handle events
2. POST /webhooks/retell — call events (if applicable)

---

> **PHASE 9 COMPLETE** — Webhooks done. Say **"Start Phase 10"** to continue.

---

# PHASE 10: Frontend Integration ✅

## [BACKEND-PHASE-10-ADAPTERS] Wire Prototype to API ✅

**Status:** ✅ DONE

**Tasks:**
1. Set `VITE_API_URL` in prototype env
2. Switch adapters from `local` to `api` when `VITE_DATA_MODE=api`
3. Add auth token to API requests
4. Test full flow: login → tenant dashboard → agents, customers, bookings

---

> **PHASE 10 COMPLETE** — Backend implementation done.

---

# Checklist Before Starting

- [ ] MongoDB running (local or Atlas)
- [ ] Redis running (local or Upstash) — for Phase 2+ (refresh tokens)
- [ ] Stripe account (test mode) — for Phase 5
- [ ] SendGrid account — for Phase 2+ (invite emails)
- [ ] Retell API key — for Phase 4

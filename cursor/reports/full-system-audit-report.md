# Full System Audit Report

**Date:** 2026-03-09  
**Platform:** Multi-tenant AI Voice Operations (MUSAED)  
**Stack:** React + Vite / NestJS + Express / MongoDB / BullMQ + Redis / Retell  

---

## SECTION 1 — Codebase Structure

### Backend Architecture

28 modules following controller → service → schema pattern. Exceptions are acceptable utility modules (`queue`, `retell`, `users`, `subscription-plans`).

**Files exceeding 300 lines (violates component size rule):**

| File | Lines |
|------|-------|
| `agent-deployments/agent-deployment.service.ts` | ~631 |
| `agent-tools/agent-tools.service.ts` | ~416 |
| `auth/auth.service.ts` | ~412 |
| `webhooks/webhooks.service.ts` | ~370 |
| `calls/calls.service.ts` | ~370 |

**Duplicated logic:**

1. **Pagination parsing** — `page ? parseInt(page, 10) : undefined` repeated in 10+ controllers
2. **Retell sync** — `syncAgent` and `syncAgentAdmin` in agents.service share near-identical logic
3. **Agent Tools** — URL parsing repeated in flow-processor and template-transform

**No circular dependencies found.**

### Frontend Architecture

Clean module structure with 16 feature modules. Adapter pattern separates data access (api vs local) via `VITE_DATA_MODE`.

**Components exceeding 200 lines:**

| File | Lines |
|------|-------|
| `admin/pages/AdminTenantsPage.tsx` | ~510 |
| `admin/components/AgentActionsModal.tsx` | ~407 |
| `admin/components/TenantActionsModal.tsx` | ~399 |
| `admin/components/CreateAgentModal.tsx` | ~340 |
| `tenant/components/TenantAgentsTab.tsx` | ~326 |
| `billing/pages/BillingPage.tsx` | ~287 |

---

## SECTION 2 — Package Audit

### Backend (`apps/backend/package.json`)

| Concern | Details |
|---------|---------|
| Core dependencies | NestJS 10-11, Mongoose 8.8, BullMQ 5.70, Stripe 17.7, retell-sdk 5.8 |
| Security packages | helmet 8.1, @sentry/node 8.47, prom-client 15.1 |
| SendGrid | Listed in `.env.example` but not wired into EmailService |

### Frontend (`apps/prototype/package.json`)

| Concern | Details |
|---------|---------|
| Potentially unused | `three` (3D library), `@google/genai` — confirm if used |
| Unusual for frontend | `better-sqlite3`, `express` — used for local dev server |
| Duplicate icon libs | Both `lucide-react` and `react-icons` installed |
| No lazy loading | All routes eagerly loaded despite `vite-plugin-pwa` being installed |

**Run `npm audit` locally for vulnerability scan.**

---

## SECTION 3 — Backend API Audit

### Endpoints missing input validation

| Endpoint | Issue |
|----------|-------|
| `GET /auth/verify-token` | Raw `@Query('token')` — no DTO |
| `PATCH /admin/settings/retention` | Inline body type — no DTO |
| `PATCH /admin/settings/integrations` | Inline body type — no DTO |
| `PATCH /admin/settings/scheduled-reports` | Inline body type — no DTO |
| `POST /tenant/agents/chats/:chatId/messages` | `{ messages: unknown[] }` — no DTO |
| `PATCH /admin/maintenance` | Inline body type — no DTO |

### Tenant Isolation Issues (CRITICAL)

| Location | Issue | Severity |
|----------|-------|----------|
| `agents.controller.ts` (tenant) | `GET :id/analytics` and `GET :id/health` — no tenant ownership check on `agentInstanceId` | **HIGH** |
| `agent-health.service.ts` | `getAnalytics()` and `getHealth()` query by `agentInstanceId` only; no `tenantId` filter | **HIGH** |
| `agents.controller.ts` (tenant) | `getChat(chatId)` and `sendChatMessage(chatId)` — no tenant validation | **HIGH** |
| `agents.service.ts` | `getChat` and `sendChatMessage` call Retell directly without tenant check | **HIGH** |

**A tenant user with a valid JWT could access another tenant's agent analytics, health, or chats by guessing the ID.**

### Error Handling

- Most services rely on NestJS/Mongoose exceptions rather than explicit try/catch
- Workers have try/catch with Sentry integration
- No swallowed errors found (empty catch blocks are intentional for non-critical paths)

---

## SECTION 4 — Queue System Audit

### Queue Configuration

| Queue | Processor | Concurrency | Retry | Backoff | DLQ Handler | Sentry |
|-------|-----------|-------------|-------|---------|-------------|--------|
| webhooks | WebhookProcessor | 2 | 3 | exponential 1s | Yes | Yes |
| email | EmailProcessor | 3 | 3 | exponential 1s | Yes | No |
| notifications | NotificationsProcessor | 2 | 3 | exponential 1s | **No** | In catch only |

### Job Idempotency

| Queue | Job ID | Idempotent? |
|-------|--------|-------------|
| Webhooks | `eventId` | Yes |
| Email | `${type}:${to}:${Date.now()}` | **No** |
| Notifications | `fanout:${type}:${Date.now()}:${count}` | **No** |

### Queue Risks

1. **NotificationsProcessor** — missing `@OnWorkerEvent('failed')` handler
2. **Email/Notification job IDs** — `Date.now()` prevents dedup
3. **agent-deployment** queue not included in QueueDepthLogger
4. **Notification fanout** — sequential per-user inserts; no batching

---

## SECTION 5 — Database Schema Audit

### 21 schemas inspected. Key findings:

**Missing indexes:**

| Collection | Missing Index | Query Pattern |
|------------|---------------|---------------|
| `tenants` | `{ stripeCustomerId: 1 }` sparse | Webhook lookup by Stripe customer |
| `bookings` | `{ tenantId: 1, status: 1, reminderSent: 1, date: 1 }` | Reminders processor query |
| `agent_templates` | `{ deletedAt: 1 }` sparse | Soft-delete filter queries |
| `alerts` | `{ tenantId: 1, createdAt: -1 }` | Alert listing with sort |
| `notifications` | `{ tenantId: 1 }` | Tenant-scoped notification queries |
| `maintenance` | `{ key: 1 }` | Lookup by key: 'default' |
| `admin_config` | `{ key: 1 }` | Lookup by key: 'default' |

**Schema issue:**
- `AgentInstance` uses `status: 'deleted'` for soft-delete but no `deletedAt` field
- `AgentHealthService` queries `{ deletedAt: null }` on AgentInstance — this field doesn't exist on the schema

**Performance risks — queries without `.lean()`:**

| Service | Query |
|---------|-------|
| dashboard.service | Recent calls with populate |
| staff.service | Staff list with double populate |
| calls.service | Paginated calls with populate |
| bookings.service | Paginated bookings with populate |
| tenants.service | Paginated tenants with populate |
| agents.service | Agent list with populate |
| support.service | Tickets with populate |

**Unbounded queries (no limit):**

| Service | Query |
|---------|-------|
| agent-deployments.service | Deployments per agent |
| staff.service | All staff per tenant |
| report-aggregation.service | All call sessions per tenant/day |
| calls.service:312 | Agents for sync |

---

## SECTION 6 — Retell Integration Audit

### Critical Issue: Webhook Raw Body Path Mismatch

**`main.ts` lines 28-29:**
```
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/retell', express.raw({ type: 'application/json' }));
```

**`main.ts` line 53-54:**
```
app.setGlobalPrefix('api', {
  exclude: ['health', 'metrics', 'webhooks/stripe', 'webhooks/retell'],
});
```

Webhook routes are **excluded** from the `/api` prefix, so actual paths are `/webhooks/retell` and `/webhooks/stripe`. But `express.raw()` is mounted on `/api/webhooks/*` — which doesn't match. The raw body middleware **never runs**. Request body is parsed by `express.json()` instead.

**Impact:** `req.body` is a parsed JS object, not a Buffer. Signature verification falls through to `JSON.stringify(req.body)`, which may not reproduce the exact original body. Signature verification may fail with real production webhooks.

**Severity: CRITICAL — must fix before production.**

### Event Flow (when working)

1. Controller: signature check → dedup → queue/sync → 202/200
2. Worker: dedup recheck → handler → record processed event
3. State ordering: `RETELL_STATUS_ORDER` prevents downgrades
4. Timestamp validation: older timestamps ignored

### Event Types Handled

| Event | Handler | Status |
|-------|---------|--------|
| `call_started` | `handleRetellCallStarted` | Implemented |
| `call_ended` | `handleRetellCallEnded` | Implemented |
| `call_analyzed` | `handleRetellCallAnalyzed` | Implemented |
| `alert_triggered` | `handleRetellAlertTriggered` | Partial — metadata only, no alerts/notifications |

---

## SECTION 7 — Agent Feature Audit

| Feature | Status |
|---------|--------|
| Agent creation | Implemented (admin + tenant) |
| Agent deployment | Implemented (BullMQ, multi-channel) |
| Agent assignment | Implemented (admin only) |
| Agent analytics | Implemented (`AgentHealthService.getAnalytics`) |
| Agent health | Implemented (`AgentHealthService.getHealth`, hourly cron) |
| Retell deep link | Implemented (`getRetellAgentUrl` → `app.retellai.com`) |
| Open in Retell button | Present in AdminAgentsTable + TenantAgentsTab |
| **Tenant isolation on analytics/health** | **MISSING** |

---

## SECTION 8 — Analytics and Reporting

| Metric | Status | Service |
|--------|--------|---------|
| Total calls | Implemented | dashboard, reports, calls |
| Success rate (booking conversion) | Implemented | reports |
| Failure rate | Implemented | agent-health |
| Average duration | Implemented | dashboard, reports, agent-health |
| Sentiment distribution | Implemented | reports |
| Peak hours | Implemented | reports |
| Intent distribution | Implemented | reports |
| Outcomes by day | Implemented | reports |
| Outcomes by version | Implemented | reports |
| Tenant comparison | Implemented | reports |

**Performance concern:** Report aggregation runs sequentially per tenant (N+1 pattern). At scale, this becomes slow.

---

## SECTION 9 — Security Audit

| Area | Status | Notes |
|------|--------|-------|
| JWT auth | OK | `config.getOrThrow('JWT_SECRET')`, bcrypt |
| Token expiry | OK | Access: configurable, Refresh: 7d with TTL |
| Password hash in responses | OK | Stripped by `toJSON` transform |
| CORS | OK | Configurable via `ALLOWED_ORIGINS` |
| HSTS | OK | Production only |
| Helmet | OK | Enabled |
| Rate limiting (auth) | Partial | Login 5/min, forgot-password 3/min; refresh/logout not throttled |
| Webhook signatures | OK but broken path | `express.raw()` path mismatch (see Section 6) |
| Secret rotation | OK | Legacy secret support for Retell + Stripe |
| Tenant isolation | **BROKEN** | Agent analytics/health/chat endpoints |
| `any` usage | Violations | `auth.service.ts`, `agents.service.ts`, `calls.service.ts` |

---

## SECTION 10 — Observability

| Component | Status |
|-----------|--------|
| Sentry init | OK (`main.ts`) |
| Sentry 5xx capture | OK (GlobalExceptionFilter) |
| Structured logs | OK (requestId, tenantId, userId) |
| Prometheus metrics | OK (5 custom + defaults) |
| `/metrics` protection | OK (MetricsAuthGuard) |
| Queue depth logging | OK (3/4 queues, every 5min) |
| Worker Sentry | Partial — email `onFailed` doesn't call Sentry |
| **Health check omits Redis** | Missing |
| **No graceful shutdown hooks** | Missing |

---

## SECTION 11 — Frontend Architecture Audit

### Issues Found

| Issue | Severity | Location |
|-------|----------|----------|
| **BookingsPage runtime bug** | CRITICAL | Imports `useDelayedReady` but never calls it; references undefined `ready` |
| No error boundaries | HIGH | No `<ErrorBoundary>` anywhere in the app |
| No lazy loading | MEDIUM | All route components eagerly loaded |
| `any` usage in adapters | MEDIUM | calls, admin, customers, staff, support, bookings, agents adapters |
| Missing loading states | MEDIUM | ReportsPage, BillingPage, HelpCenterPage, AlertsPage |
| Direct API calls outside adapters | LOW | Auth pages, AccountPage use `api` directly |
| Large components | LOW | 6 components exceed 200-line guideline |

### State Management

- React Context only (SessionProvider, AccountModalProvider)
- No Redux/Zustand — appropriate for current scale
- Heavy state in TenantActionsModal, AgentActionsModal could use `useReducer`

---

## SECTION 12 — UI/UX Review

### User Flow Issues

| Flow | Issue |
|------|-------|
| Reports page | No loading indicator; charts appear to hang |
| Billing page | No loading state; content pops in |
| Bookings page | **Runtime crash** due to `ready` being undefined |
| Help center | No loading feedback |
| Error recovery | No error boundaries; any component crash white-screens the app |
| Page transitions | No route-level loading (no Suspense/lazy) |

### Positive Patterns

- Skip-to-content link for accessibility
- Responsive sidebar collapse on mobile
- DataTable with horizontal scroll
- aria-labels on interactive elements
- Consistent use of Tailwind + Radix UI primitives

---

## SECTION 13 — Performance Audit

### Database Performance

| Risk | Impact | Fix |
|------|--------|-----|
| Queries without `.lean()` | Medium — full Mongoose documents hydrated | Add `.lean()` to read-only queries |
| Unbounded queries | Medium — no limit on deployments, staff, sessions | Add limits |
| N+1 in report aggregation | High at scale — sequential per-tenant | Batch or parallelize |
| N+1 in notification fanout | Medium — sequential per-user inserts | Batch `insertMany` |
| Missing `stripeCustomerId` index | Low-medium — table scan on webhook | Add sparse index |
| Missing reminders compound index | Low — full scan on reminders cron | Add compound index |

### Frontend Performance

| Risk | Impact | Fix |
|------|--------|-----|
| No lazy loading | High — entire app bundle loaded upfront | `React.lazy` + `Suspense` |
| Potentially unused `three` | Medium — large bundle size | Verify or remove |
| No code splitting | Medium — single chunk | Vite dynamic imports |

---

## SECTION 14 — Production Readiness

| Area | Status | Notes |
|------|--------|-------|
| Environment config | OK | All vars in `.env.example` |
| Secret management | OK | `ConfigService`, no hardcoded values |
| Queue resilience | OK | Fail-fast in production, retry/backoff |
| MongoDB connection | OK | Pool config, retry, connection logging |
| **Graceful shutdown** | **MISSING** | No `enableShutdownHooks()` in `main.ts` |
| **Redis health check** | **MISSING** | Not in `/health` endpoint |
| **Webhook raw body** | **BROKEN** | Path mismatch — critical |
| Horizontal scaling | Partial | MongoDB pool tuned; email rate-limit is in-memory |

---

## SECTION 15 — Automated Testing Coverage

### Test inventory: 10 spec files, ~34 tests

| Module | Tests | Coverage |
|--------|-------|----------|
| Email service | 6 | Queue, direct, rate limit |
| Email queue service | 2 | Enable/disable |
| Email worker | 3 | Send, retry, failure |
| Webhooks service | 6+ | Events, ordering, dedup |
| Retell webhook controller | 4 | Signature, legacy, missing |
| Retell client | 4 | API calls, errors |
| Agent deployment | 4 | Deploy, missing template, chat |
| Flow processor | 2 | Placeholders |
| App controller | 1 | Health check |

### Modules with ZERO tests

- `auth` (login, refresh, password flows)
- `billing`
- `bookings`
- `calls`
- `customers`
- `dashboard`
- `notifications`
- `reports`
- `tenants`
- `staff`
- `agent-instances` (except deployments)
- `agent-templates`
- `agent-tools`
- `alerts`
- `audit`
- `stripe.webhook.controller`
- `webhook.processor`
- Entire frontend (0 test files)

**Estimated test coverage: ~10-15% of backend, 0% of frontend.**

---

## TOP 20 IMPROVEMENTS TO IMPLEMENT

### Critical (must fix before production)

| # | Item | Risk |
|---|------|------|
| 1 | **Fix webhook raw body path mismatch** — change `express.raw()` from `/api/webhooks/*` to `/webhooks/*` | Webhook signatures will fail in production |
| 2 | **Fix tenant isolation** — add tenantId check to agent analytics, health, and chat endpoints | Data leak across tenants |
| 3 | **Fix BookingsPage crash** — call `useDelayedReady()` or remove the import | Runtime crash |
| 4 | **Fix AgentHealthService schema mismatch** — AgentInstance has no `deletedAt` field; query uses `deletedAt: null` | Health check may return wrong agents |

### High Priority

| # | Item | Risk |
|---|------|------|
| 5 | Add error boundaries to all route-level components | White-screen on any component error |
| 6 | Add React.lazy + Suspense for route code splitting | Large initial bundle |
| 7 | Add graceful shutdown hooks (`app.enableShutdownHooks()`) | Ungraceful process termination |
| 8 | Add Redis to health check endpoint | Blind to queue system failures |
| 9 | Add `.lean()` to read-only DB queries | Unnecessary memory/CPU overhead |
| 10 | Add missing DB indexes (stripeCustomerId, reminders, templates deletedAt) | Slow queries at scale |

### Medium Priority

| # | Item | Risk |
|---|------|------|
| 11 | Add `@OnWorkerEvent('failed')` to NotificationsProcessor | Silent failures |
| 12 | Add DTOs for admin-settings and maintenance PATCH endpoints | Missing input validation |
| 13 | Add loading states to ReportsPage, BillingPage, AlertsPage | Poor UX |
| 14 | Batch notification inserts in worker (use `insertMany`) | Slow fanout for large user sets |
| 15 | Add auth service tests (login, refresh, password reset) | Core flow untested |

### Low Priority (improvements)

| # | Item | Risk |
|---|------|------|
| 16 | Extract pagination helper to eliminate repeated `parseInt` in controllers | Code duplication |
| 17 | Add deterministic job IDs for email/notification queues | Possible duplicate sends on retry |
| 18 | Add limits to unbounded queries (deployments, staff, agent sync) | Memory risk at scale |
| 19 | Remove or verify unused packages (`three`, `@google/genai`, SendGrid) | Bundle bloat |
| 20 | Add Sentry to email worker `onFailed` handler | Inconsistent error reporting |

---

## Score Summary

| Section | Score | Notes |
|---------|-------|-------|
| Backend Architecture | 8/10 | Clean modules; large files need splitting |
| Package Management | 7/10 | Some unused deps; no vulnerabilities found |
| API Quality | 7/10 | Good guards; tenant isolation gaps |
| Queue System | 8/10 | Solid; missing notification DLQ handler |
| Database Schemas | 7/10 | Good indexes; missing some for scale |
| Retell Integration | 6/10 | Raw body path broken; event handling solid |
| Agent Features | 8/10 | Complete lifecycle; tenant isolation gap |
| Analytics | 9/10 | Comprehensive metrics and reporting |
| Security | 7/10 | Strong auth; tenant leak + webhook path |
| Observability | 8/10 | Sentry + Prometheus + structured logs |
| Frontend Architecture | 7/10 | Clean adapter pattern; missing error boundaries |
| UI/UX | 7/10 | Good patterns; missing loading states |
| Performance | 6/10 | Many unbounded queries; no lazy loading |
| Production Readiness | 6/10 | Critical webhook issue; no graceful shutdown |
| Testing | 3/10 | ~15% coverage; core flows untested |
| **Overall** | **6.9/10** | **Fix items 1-4 before any production deployment** |

# Production Hardening Implementation Plan

**Platform:** MUSAED Clinic CRM (Internal MVP → Production)  
**Stack:** React + Vite, NestJS (Express), MongoDB, Retell SDK  
**Date:** March 2025

---

## Executive Summary

This plan upgrades the platform from Internal MVP to production-ready without rewriting the architecture. It is organized into six phases, each additive and incremental. Phases can be executed sequentially or partially in parallel where dependencies allow.

---

## Phase 1 — Security Hardening

### Goals

- Eliminate timing attacks on webhook signature verification
- Add replay protection and timestamp validation for webhooks
- Introduce fine-grained RBAC (beyond single admin role)
- Harden secret rotation and CORS configuration

### Modules to Modify


| Module                    | Path                                                                 | Changes                                     |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| Retell webhook controller | `apps/backend/src/webhooks/retell.webhook.controller.ts`             | Constant-time compare, timestamp validation |
| Stripe webhook controller | `apps/backend/src/webhooks/stripe.webhook.controller.ts` (if exists) | Same hardening                              |
| Webhooks service          | `apps/backend/src/webhooks/webhooks.service.ts`                      | Replay window, secret rotation support      |
| Auth module               | `apps/backend/src/auth/`                                             | RBAC permissions model                      |
| Guards                    | `apps/backend/src/common/guards/`                                    | Permission-based guards                     |
| Main app                  | `apps/backend/src/main.ts`                                           | CORS allowlist, helmet config               |


### Implementation Steps

1. **Constant-time signature comparison**
  - Replace `signature !== expected` with `crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))`
  - Ensure both buffers are same length before compare (pad or reject mismatched lengths)
2. **Webhook timestamp and replay protection**
  - Add optional `x-retell-timestamp` header (or use payload `timestamp` if Retell provides it)
  - Reject requests older than 5 minutes (configurable)
  - Store recent event IDs with TTL for replay detection (extend `ProcessedEvent` or use Redis)
3. **Secret rotation support**
  - Support `RETELL_WEBHOOK_SECRET` and `RETELL_WEBHOOK_SECRET_LEGACY` for zero-downtime rotation
  - Try current secret first; on failure, retry with legacy secret
  - Log rotation events for audit
4. **RBAC foundation**
  - Add `Permission` enum and `User.permissions: string[]` (or `TenantStaff.permissions`)
  - Create `@RequirePermissions('calls:read', 'bookings:write')` decorator
  - Implement `PermissionsGuard` that checks `request.user.permissions`
  - Migrate existing `AdminGuard` / `TenantGuard` to use permission checks where applicable
5. **CORS and security headers**
  - Replace `origin: '*'` with `origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173']`
  - Ensure `helmet()` is applied with sensible defaults
  - Add `Strict-Transport-Security` in production

### Migration Risks


| Risk                                                | Mitigation                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| Timestamp validation rejects valid delayed webhooks | Use 5–10 min window; monitor rejections; make window configurable           |
| RBAC breaks existing flows                          | Roll out permissions incrementally; default to permissive during transition |
| Secret rotation causes brief 401s                   | Use dual-secret support; rotate during low-traffic window                   |


---

## Phase 2 — Queue Infrastructure

### Goals

- Move webhook processing off the request path into a queue
- Add retry and dead-letter handling for failed events
- Ensure idempotency after processing, not before (avoid event loss)
- Queue email and reminder jobs instead of inline execution

### Modules to Modify


| Module                | Path                                               | Changes                           |
| --------------------- | -------------------------------------------------- | --------------------------------- |
| Webhooks              | `apps/backend/src/webhooks/`                       | Enqueue events; process in worker |
| BullMQ / Queue module | `apps/backend/src/queue/` (new)                    | Queue config, workers             |
| Email service         | `apps/backend/src/email/email.service.ts`          | Enqueue send; worker executes     |
| Bookings reminders    | `apps/backend/src/bookings/reminders.processor.ts` | Already uses BullMQ; ensure DLQ   |
| Agent deployments     | `apps/backend/src/agent-deployments/`              | Verify queue config, DLQ          |
| App module            | `apps/backend/src/app.module.ts`                   | Register queue module             |


### Implementation Steps

1. **Create queue infrastructure**
  - Add `QueueModule` with BullMQ, Redis connection from `REDIS_URL`
  - Define queues: `webhooks`, `email`, `reminders`, `deployments`
  - Configure `attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`
  - Add `failed` queue or DLQ for manual inspection
2. **Webhook flow refactor**
  - In controller: verify signature, parse body, validate timestamp
  - Enqueue payload to `webhooks` queue with `jobId = eventId` (idempotency key)
  - Return `202 Accepted` immediately
  - Worker: process event; on success, record in `ProcessedEvent`; on failure, retry
  - Move deduplication to worker: check `ProcessedEvent` before processing; if duplicate, ack and skip
3. **Idempotency model change**
  - Current: record in `ProcessedEvent` before processing → event loss if processing fails
  - New: process first; on success, upsert `ProcessedEvent`; use BullMQ `jobId` to prevent duplicate jobs
  - Keep `ProcessedEvent` for cross-restart deduplication (e.g. if worker crashes after process, before ack)
4. **Email queue**
  - Add `EmailQueueService` that pushes to `email` queue
  - `EmailService.send()` becomes internal; public API is `enqueueEmail(type, payload)`
  - Worker calls `EmailService.send()` with retries
  - Log failures to DLQ for manual retry or alerting
5. **Reminders and deployments**
  - Ensure `reminders.processor` and deployment processor use same retry/DLQ pattern
  - Add `failed` job handler to log and optionally alert

### Migration Risks


| Risk                                  | Mitigation                                                              |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Redis unavailable at startup          | Make queue optional in dev; fail fast in production                     |
| Webhook timeout from Retell           | Return 202 quickly; processing is async                                 |
| Duplicate processing during migration | Use BullMQ `jobId` + `ProcessedEvent`; run both paths briefly if needed |
| Email delay                           | Set reasonable visibility timeout; document SLA                         |


---

## Phase 3 — Email Infrastructure

### Goals

- Add retry, failover, and observability for email delivery
- Support multiple transports (primary + fallback SMTP)
- Track delivery status and bounces (where supported)
- Use queue from Phase 2 for all email sends

### Modules to Modify


| Module        | Path                                      | Changes                             |
| ------------- | ----------------------------------------- | ----------------------------------- |
| Email service | `apps/backend/src/email/email.service.ts` | Multi-transport, retry logic        |
| Email module  | `apps/backend/src/email/email.module.ts`  | Queue integration                   |
| Config        | `apps/backend/.env.example`               | `SMTP_PRIMARY_`*, `SMTP_FALLBACK_*` |


### Implementation Steps

1. **Multi-transport configuration**
  - Support `SMTP_PRIMARY_`* and `SMTP_FALLBACK_*` (or single `SMTP_*` for backward compatibility)
  - Create primary and optional fallback `nodemailer` transporters
  - On send failure, attempt fallback before failing job
2. **Queue integration**
  - All `send`* methods enqueue via `EmailQueueService`
  - Worker invokes `EmailService.sendInternal(msg)` with retries
  - On final failure, move to DLQ and optionally create support ticket or alert
3. **Observability**
  - Log send attempts, successes, failures with correlation ID
  - Add metrics: `email_sent_total`, `email_failed_total` (if metrics exist)
  - Optional: store send attempts in `EmailLog` collection for debugging
4. **Template and rate limiting**
  - Ensure templates are validated (no injection)
  - Add per-tenant or per-recipient rate limits to prevent abuse

### Migration Risks


| Risk                           | Mitigation                                                        |
| ------------------------------ | ----------------------------------------------------------------- |
| Fallback SMTP misconfiguration | Validate on startup; log warning if fallback fails                |
| Increased latency              | Acceptable for transactional email; document in SLA               |
| Bounce handling                | Phase 3.5: add webhook for bounce/complaint if using SES/SendGrid |


---

## Phase 4 — Frontend Truthfulness

### Goals

- Replace placeholder adapter methods with real API calls
- Add missing backend endpoints for funnel, trend, ROI, agent status, recent calls
- Add missing reports endpoints: outcomes by version, performance by period, sentiment, peak hours, intent distribution
- Ensure frontend never shows fake data; degrade gracefully on API failure

### Modules to Modify


| Module               | Path                                                   | Changes                                                |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Dashboard service    | `apps/backend/src/dashboard/dashboard.service.ts`      | Add funnel, trend, ROI, agent status, recent calls     |
| Dashboard controller | `apps/backend/src/dashboard/dashboard.controller.ts`   | Expose new endpoints                                   |
| Reports service      | `apps/backend/src/reports/reports.service.ts`          | Add outcomes by version, sentiment, peak hours, intent |
| Reports controller   | `apps/backend/src/reports/reports.controller.ts`       | Expose new endpoints                                   |
| Dashboard adapter    | `apps/prototype/src/adapters/api/dashboard.adapter.ts` | Call real endpoints                                    |
| Reports adapter      | `apps/prototype/src/adapters/api/reports.adapter.ts`   | Call real endpoints                                    |
| Shared types         | `apps/prototype/src/shared/types/`                     | Align with API response shapes                         |


### Implementation Steps

1. **Backend: Dashboard extensions**
  - `getFunnel`: aggregate calls by outcome stage (e.g. started → ended → analyzed → booked/escalated/failed)
  - `getTrend`: time-series of calls/bookings per day for date range
  - `getRoiMetrics`: revenue (from bookings), AI cost (from Retell or config), cost saved, ROI %
  - `getTenantAgentStatus`: list agents with status, last call, health
  - `getTenantRecentCalls`: paginated recent calls with outcome, duration, date
2. **Backend: Reports extensions**
  - `getOutcomesByVersion`: group by agent version/template version if available
  - `getPerformanceForPeriod`: pre-defined periods (thisWeek, lastWeek, thisMonth, lastMonth)
  - `getSentimentDistribution`: aggregate `CallSession.sentiment` into buckets
  - `getPeakHours`: aggregate calls by hour of day
  - `getIntentDistribution`: aggregate by detected intent if stored in call metadata
3. **Frontend: Adapter wiring**
  - Replace `return []` and `return null` with `api.get(...)` calls
  - Add proper error handling: on 4xx/5xx, return empty/default and optionally surface toast
  - Ensure `tenantId` and `dateRange` are passed as query params
4. **Data integrity**
  - Ensure `CallSession` has `sentiment`, `outcome`, `createdAt` for aggregations
  - Add indexes: `{ tenantId: 1, createdAt: -1 }`, `{ tenantId: 1, outcome: 1 }`, `{ tenantId: 1, 'metadata.intent': 1 }`

### Migration Risks


| Risk                          | Mitigation                                                             |
| ----------------------------- | ---------------------------------------------------------------------- |
| New endpoints slow under load | Add indexes; use aggregation pipelines; consider caching for dashboard |
| Missing data (e.g. sentiment) | Return empty buckets; backfill historical data if needed               |
| Frontend breaks on API change | Version API; maintain backward compatibility for 1 release             |


---

## Phase 5 — Observability

### Goals

- Add structured logging with correlation IDs
- Integrate external error tracking (e.g. Sentry)
- Add metrics export (Prometheus or cloud provider)
- Add distributed tracing (optional, for queue/cross-service flows)

### Modules to Modify


| Module           | Path                                                | Changes                              |
| ---------------- | --------------------------------------------------- | ------------------------------------ |
| Main             | `apps/backend/src/main.ts`                          | Request ID middleware, logger config |
| Logger           | `apps/backend/src/common/logger/` (new or existing) | Structured JSON logger               |
| Exception filter | `apps/backend/src/common/filters/`                  | Report to Sentry                     |
| Metrics          | `apps/backend/src/metrics/` (new)                   | Prometheus or OpenTelemetry          |
| Queue workers    | `apps/backend/src/*/` processors                    | Propagate correlation ID             |


### Implementation Steps

1. **Correlation ID**
  - Middleware: generate or read `x-request-id`; attach to `req.id` and `Logger` context
  - Include in all log lines and error reports
  - Pass to queue jobs; workers set context for their logs
2. **Error tracking**
  - Install `@sentry/node` (or equivalent)
  - Initialize in `main.ts` with `dsn`, `environment`, `release`
  - Global exception filter: capture 5xx and unhandled errors; add user/tenant context
  - Do not capture 4xx client errors (or sample lightly)
3. **Metrics**
  - Add `prom-client` or OpenTelemetry metrics
  - Expose `/metrics` endpoint (or use cloud provider agent)
  - Key metrics: `http_requests_total`, `http_request_duration_seconds`, `queue_jobs_total`, `queue_job_duration_seconds`, `db_operations_total`
  - Custom: `webhooks_received_total`, `emails_sent_total`, `calls_processed_total`
4. **Structured logging**
  - Use `Logger` with context: `{ requestId, tenantId, userId }`
  - Log format: JSON in production, readable in development
  - Log levels: `error` for failures, `warn` for recoverable, `log` for business events, `debug` for development
5. **Tracing (optional)**
  - Add OpenTelemetry SDK; trace HTTP, MongoDB, Redis, queue jobs
  - Export to Jaeger, Zipkin, or cloud trace service

### Migration Risks


| Risk                | Mitigation                                    |
| ------------------- | --------------------------------------------- |
| Log volume increase | Use log level and sampling; avoid logging PII |
| Sentry quota        | Set sample rate; filter noisy errors          |
| Metrics overhead    | Use pull model; limit cardinality of labels   |


---

## Phase 6 — Scalability Preparation

### Goals

- Make notifications asynchronous (no synchronous fanout)
- Add compound indexes for tickets, bookings, customers
- Introduce pre-aggregation or materialized views for reports (optional)
- Add call session state-ordering rules to prevent out-of-order downgrades
- Prepare for horizontal scaling (stateless app, external Redis, connection pooling)

### Modules to Modify


| Module               | Path                                                      | Changes                    |
| -------------------- | --------------------------------------------------------- | -------------------------- |
| Notifications        | `apps/backend/src/notifications/notifications.service.ts` | Async fanout via queue     |
| Call session updates | `apps/backend/src/webhooks/webhooks.service.ts`           | State machine for status   |
| Schemas              | `apps/backend/src/*/schemas/`                             | Compound indexes           |
| Reports              | `apps/backend/src/reports/`                               | Pre-aggregation (optional) |
| Config               | `apps/backend/`                                           | Connection pool, Redis URL |


### Implementation Steps

1. **Call session state ordering**
  - Define order: `created` < `started` < `ended` < `analyzed`
  - In `upsertCallSession`, only `$set` status if new status is "greater" than current
  - Use `$max` or conditional update: `{ $cond: [{ $gt: ['$statusOrder', currentOrder] }, newStatus, '$status'] }`
  - Simpler: fetch current doc, compare status order, skip update if downgrade
2. **Notifications async fanout**
  - `createForUsers` / `createForAdmins`: enqueue single job "notify users X with payload Y"
  - Worker: load user list if needed, loop create notifications, emit WebSocket in batch or per-user
  - Reduces request latency; avoids timeout when notifying many admins
3. **Compound indexes**
  - `SupportTicket`: `{ tenantId: 1, status: 1, createdAt: -1 }`, `{ tenantId: 1, priority: 1 }`
  - `Booking`: `{ tenantId: 1, date: 1, status: 1 }`, `{ tenantId: 1, createdAt: -1 }`
  - `Customer`: `{ tenantId: 1, deletedAt: 1 }`, `{ tenantId: 1, createdAt: -1 }`
  - `CallSession`: `{ tenantId: 1, createdAt: -1 }`, `{ tenantId: 1, outcome: 1 }`, `{ callId: 1 }` (unique)
  - Add via schema `@Schema({ ... index: [...] })` or migration script
4. **Reports pre-aggregation (optional)**
  - Daily cron: aggregate call outcomes, bookings, sentiment by tenant and day
  - Store in `ReportSnapshot` or similar
  - Dashboard reads from snapshot; real-time for "today" only
  - Enables fast dashboard for 1000+ tenants
5. **Horizontal scaling readiness**
  - Ensure no in-memory state (sessions in Redis or JWT)
  - Use `REDIS_URL` for BullMQ and session store if applicable
  - MongoDB connection pool: `maxPoolSize` from env
  - Document deployment: multiple app instances behind load balancer

### Migration Risks


| Risk                     | Mitigation                                                                |
| ------------------------ | ------------------------------------------------------------------------- |
| State machine bug        | Unit test all transitions; add integration test for out-of-order webhooks |
| Index creation blocks DB | Create in background; use `createIndex` with `background: true`           |
| Pre-aggregation stale    | Define SLA (e.g. 15 min delay); document in UI                            |
| Notification delay       | Acceptable for non-critical; critical alerts can use sync path initially  |


---

## Phase Summary


| Phase | Focus                 | Est. Effort | Dependencies         |
| ----- | --------------------- | ----------- | -------------------- |
| 1     | Security              | 1–2 weeks   | None                 |
| 2     | Queue infrastructure  | 2–3 weeks   | Redis                |
| 3     | Email                 | 1 week      | Phase 2              |
| 4     | Frontend truthfulness | 2 weeks     | None                 |
| 5     | Observability         | 1–2 weeks   | Sentry/OTEL accounts |
| 6     | Scalability           | 2–3 weeks   | Phase 2              |


---

## Complexity Estimate & Implementation Sequence

This section provides per-phase complexity analysis, exact file lists, migration requirements, and a risk-minimizing implementation order.

---

### Phase 1 — Security Hardening

#### Exact Files to Change


| File                                                                  | Change Type                                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/backend/src/webhooks/retell.webhook.controller.ts`              | Modify                                                                                             |
| `apps/backend/src/webhooks/stripe.webhook.controller.ts`              | Modify (Stripe uses `constructEvent` — already constant-time; add timestamp if Stripe provides it) |
| `apps/backend/src/webhooks/webhooks.service.ts`                       | Modify                                                                                             |
| `apps/backend/src/auth/auth.module.ts`                                | Modify                                                                                             |
| `apps/backend/src/auth/strategies/jwt.strategy.ts`                    | Modify (attach permissions to user)                                                                |
| `apps/backend/src/users/schemas/user.schema.ts`                       | Modify (add `permissions?: string[]`)                                                              |
| `apps/backend/src/tenants/schemas/tenant-staff.schema.ts`             | Modify (add `permissions?: string[]`)                                                              |
| `apps/backend/src/common/guards/admin.guard.ts`                       | Modify                                                                                             |
| `apps/backend/src/common/guards/tenant.guard.ts`                      | Modify                                                                                             |
| `apps/backend/src/common/guards/permissions.guard.ts`                 | **Create**                                                                                         |
| `apps/backend/src/common/decorators/require-permissions.decorator.ts` | **Create**                                                                                         |
| `apps/backend/src/main.ts`                                            | Modify (CORS already uses `CORS_ORIGIN`; add HSTS if missing)                                      |


#### Risk Level: **Medium**

- Webhook changes: **Low** — additive; constant-time compare is a drop-in replacement
- RBAC: **Medium** — touches auth flow; incorrect permission mapping can lock users out
- CORS/HSTS: **Low** — main.ts already uses env-based CORS

#### Migrations Required


| Type         | Details                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database** | Optional migration: add `permissions` to `users` and `tenant_staff`; default `[]` or derive from role                                                          |
| **Queue**    | None                                                                                                                                                           |
| **Env vars** | `RETELL_WEBHOOK_SECRET_LEGACY` (optional), `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` (optional, default 300), `ALLOWED_ORIGINS` (optional; `CORS_ORIGIN` already exists) |


#### Can Existing Functionality Break?


| Area     | Risk   | Notes                                                                                                                 |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Webhooks | Low    | Constant-time compare is behaviorally identical; timestamp validation may reject delayed events if window too tight   |
| Auth     | Medium | RBAC rollout must default to permissive (e.g. `AdminGuard` = admin OR has permission) until permissions are populated |
| CORS     | Low    | Already env-driven; no change if `CORS_ORIGIN` is set                                                                 |


#### Safest Implementation Order (Phase 1)

1. **Constant-time signature** (Retell) — single file, no deps
2. **Timestamp/replay** (Retell) — optional; make it configurable and default OFF initially
3. **Secret rotation** — additive; no behavior change
4. **CORS/HSTS** — verify helmet config; add HSTS for production only
5. **RBAC foundation** — add schema fields with defaults; create `PermissionsGuard` and decorator
6. **RBAC migration** — wire `PermissionsGuard` behind feature flag; keep `AdminGuard`/`TenantGuard` as primary until validated

---

### Phase 2 — Queue Infrastructure

#### Exact Files to Change


| File                                                             | Change Type                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/backend/src/queue/queue.module.ts`                         | **Create**                                                                                 |
| `apps/backend/src/queue/queue.config.ts`                         | **Create**                                                                                 |
| `apps/backend/src/queue/processors/webhook.processor.ts`         | **Create**                                                                                 |
| `apps/backend/src/queue/processors/email.processor.ts`           | **Create**                                                                                 |
| `apps/backend/src/webhooks/retell.webhook.controller.ts`         | Modify                                                                                     |
| `apps/backend/src/webhooks/stripe.webhook.controller.ts`         | Modify                                                                                     |
| `apps/backend/src/webhooks/webhooks.service.ts`                  | Modify                                                                                     |
| `apps/backend/src/webhooks/webhooks.module.ts`                   | Modify                                                                                     |
| `apps/backend/src/email/email.service.ts`                        | Modify                                                                                     |
| `apps/backend/src/email/email.module.ts`                         | Modify                                                                                     |
| `apps/backend/src/email/email-queue.service.ts`                  | **Create**                                                                                 |
| `apps/backend/src/bookings/reminders.processor.ts`               | Modify (currently uses Cron, not BullMQ; add queue-based reminders or keep Cron + add DLQ) |
| `apps/backend/src/agent-deployments/agent-deployment.service.ts` | Modify (add DLQ config)                                                                    |
| `apps/backend/src/app.module.ts`                                 | Modify                                                                                     |
| `apps/backend/src/main.ts`                                       | Modify (ensure raw body for webhooks only on webhook routes)                               |


#### Risk Level: **High**

- Webhook flow change: **High** — moves from sync to async; Retell/Stripe may retry on non-2xx; must return 202 quickly
- Email queue: **Medium** — callers expect fire-and-forget; queue adds delay
- Redis dependency: **Medium** — app must start without Redis in dev or fail fast in prod

#### Migrations Required


| Type         | Details                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Database** | None (ProcessedEvent schema unchanged)                                                                                     |
| **Queue**    | New BullMQ queues: `webhooks`, `email`; Redis required                                                                     |
| **Env vars** | `REDIS_URL` (already in .env.example), `QUEUE_WEBHOOKS_ENABLED` (optional, default true), `QUEUE_EMAIL_ENABLED` (optional) |


#### Can Existing Functionality Break?


| Area      | Risk   | Notes                                                                                                                                |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Webhooks  | High   | Retell/Stripe retry on 5xx; 202 must be returned before processing; duplicate processing if worker crashes after process, before ack |
| Email     | Medium | Invites, password reset: slight delay; ensure no caller assumes synchronous delivery                                                 |
| Reminders | Low    | RemindersProcessor uses Cron; can keep as-is or migrate to queue later                                                               |


#### Safest Implementation Order (Phase 2)

1. **Queue module** — create `QueueModule` with Redis connection; make queues optional when `REDIS_URL` unset
2. **Webhook queue** — add `webhook.processor`; keep controller sync path behind `QUEUE_WEBHOOKS_ENABLED=false`
3. **Webhook migration** — flip `QUEUE_WEBHOOKS_ENABLED=true`; controller enqueues and returns 202
4. **Email queue** — add `EmailQueueService` and `email.processor`; `EmailService` keeps sync `send()` as fallback
5. **Email migration** — switch callers to `enqueueEmail`; keep sync path for dev when Redis unavailable
6. **Agent deployment DLQ** — add failed job handler to existing deployment queue

---

### Phase 3 — Email Infrastructure

#### Exact Files to Change


| File                                      | Change Type |
| ----------------------------------------- | ----------- |
| `apps/backend/src/email/email.service.ts` | Modify      |
| `apps/backend/src/email/email.module.ts`  | Modify      |
| `apps/backend/.env.example`               | Modify      |


#### Risk Level: **Low**

- Depends on Phase 2 queue; multi-transport and failover are additive

#### Migrations Required


| Type         | Details                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Database** | None                                                                                     |
| **Queue**    | Uses Phase 2 email queue                                                                 |
| **Env vars** | `SMTP_PRIMARY_`*, `SMTP_FALLBACK_*` (optional); keep `SMTP_*` for backward compatibility |


#### Can Existing Functionality Break?


| Area           | Risk | Notes                                                                      |
| -------------- | ---- | -------------------------------------------------------------------------- |
| Email delivery | Low  | Fallback only used on primary failure; misconfig causes warning at startup |


#### Safest Implementation Order (Phase 3)

1. Add fallback SMTP config (optional)
2. In `send()`, try primary; on failure, try fallback
3. Add logging for send attempts and failures

---

### Phase 4 — Frontend Truthfulness

#### Exact Files to Change


| File                                                         | Change Type                                        |
| ------------------------------------------------------------ | -------------------------------------------------- |
| `apps/backend/src/dashboard/dashboard.service.ts`            | Modify                                             |
| `apps/backend/src/dashboard/dashboard.controller.ts`         | Modify                                             |
| `apps/backend/src/reports/reports.service.ts`                | Modify                                             |
| `apps/backend/src/reports/reports.controller.ts`             | Modify                                             |
| `apps/backend/src/reports/admin-reports.controller.ts`       | Modify (if needed)                                 |
| `apps/prototype/src/adapters/api/dashboard.adapter.ts`       | Modify                                             |
| `apps/prototype/src/adapters/api/reports.adapter.ts`         | Modify                                             |
| `apps/prototype/src/shared/types/index.ts`                   | Modify                                             |
| `apps/prototype/src/shared/types/reports.ts`                 | Modify                                             |
| `apps/prototype/src/modules/dashboard/hooks/useDashboard.ts` | Modify (if needed)                                 |
| `apps/prototype/src/modules/reports/hooks/useReports.ts`     | Modify (if needed)                                 |
| `apps/backend/src/calls/schemas/call-session.schema.ts`      | Modify (add index for `metadata.intent` if needed) |


#### Risk Level: **Medium**

- Backend: **Low** — new endpoints only; existing behavior unchanged  
- Frontend: **Medium** — adapter changes can break UI if API shape mismatches

#### Migrations Required


| Type         | Details                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Database** | Add compound indexes: `CallSession.{ tenantId, outcome }`, `CallSession.{ tenantId, 'metadata.intent' }` (if intent stored) |
| **Queue**    | None                                                                                                                        |
| **Env vars** | None                                                                                                                        |


#### Can Existing Functionality Break?


| Area        | Risk   | Notes                                                                                           |
| ----------- | ------ | ----------------------------------------------------------------------------------------------- |
| Dashboard   | Medium | Placeholders return `[]`; real API may return different shape; frontend must handle empty/error |
| Reports     | Medium | Same as dashboard                                                                               |
| Performance | Low    | New aggregations; add indexes to avoid slow queries                                             |


#### Safest Implementation Order (Phase 4)

1. **Backend: Dashboard** — add `getFunnel`, `getTrend`, `getRoiMetrics`, `getTenantAgentStatus`, `getTenantRecentCalls` to service and controller
2. **Backend: Reports** — add `getOutcomesByVersion`, `getPerformanceForPeriod`, `getSentimentDistribution`, `getPeakHours`, `getIntentDistribution`
3. **Database indexes** — add compound indexes for new reports queries
4. **Frontend: Dashboard adapter** — wire `getFunnel`, `getTrend`, etc. to new endpoints; keep fallback to empty on error
5. **Frontend: Reports adapter** — wire new report methods
6. **Integration test** — verify dashboard and reports pages render with real data

---

### Phase 5 — Observability

#### Exact Files to Change


| File                                                              | Change Type                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/backend/src/main.ts`                                        | Modify                                                               |
| `apps/backend/src/common/middleware/request-logger.middleware.ts` | Modify (already has correlation ID; use `x-request-id` consistently) |
| `apps/backend/src/common/filters/http-exception.filter.ts`        | Modify                                                               |
| `apps/backend/src/metrics/metrics.module.ts`                      | **Create**                                                           |
| `apps/backend/src/metrics/metrics.service.ts`                     | **Create**                                                           |
| `apps/backend/src/app.module.ts`                                  | Modify                                                               |
| `apps/backend/package.json`                                       | Modify (add `@sentry/node`, `prom-client` or OpenTelemetry)          |


#### Risk Level: **Low**

- Additive; no impact on business logic

#### Migrations Required


| Type         | Details                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Database** | None                                                             |
| **Queue**    | None                                                             |
| **Env vars** | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `METRICS_ENABLED` (optional) |


#### Can Existing Functionality Break?


| Area           | Risk | Notes                                                     |
| -------------- | ---- | --------------------------------------------------------- |
| Logging        | Low  | Correlation ID already exists; ensure no PII in logs      |
| Error tracking | Low  | Sentry captures 5xx; ensure no sensitive data in context  |
| Metrics        | Low  | Additive; `/metrics` endpoint may need auth in production |


#### Safest Implementation Order (Phase 5)

1. **Sentry** — install, init in main.ts; add to exception filter for 5xx
2. **Correlation ID** — standardize on `x-request-id`; ensure it flows to queue jobs
3. **Metrics module** — add `prom-client`; expose `/metrics`; add basic HTTP metrics
4. **Custom metrics** — add `webhooks_received_total`, `emails_sent_total` if queues exist
5. **Structured logging** — optional; enhance JSON logging for production

---

### Phase 6 — Scalability Preparation

#### Exact Files to Change


| File                                                          | Change Type                |
| ------------------------------------------------------------- | -------------------------- |
| `apps/backend/src/webhooks/webhooks.service.ts`               | Modify                     |
| `apps/backend/src/notifications/notifications.service.ts`     | Modify                     |
| `apps/backend/src/notifications/notifications.module.ts`      | Modify                     |
| `apps/backend/src/support/schemas/support-ticket.schema.ts`   | Modify                     |
| `apps/backend/src/bookings/schemas/booking.schema.ts`         | Modify                     |
| `apps/backend/src/customers/schemas/customer.schema.ts`       | Modify                     |
| `apps/backend/src/calls/schemas/call-session.schema.ts`       | Modify                     |
| `apps/backend/src/queue/processors/notification.processor.ts` | **Create** (if queue used) |


#### Risk Level: **Medium**

- State machine: **Medium** — incorrect ordering can cause wrong call status  
- Indexes: **Low** — additive; background creation  
- Notifications: **Medium** — async fanout changes latency for `createForAdmins`

#### Migrations Required


| Type         | Details                                                                                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database** | Add compound indexes: `SupportTicket.{ tenantId, status, createdAt }`, `Booking.{ tenantId, date, status }`, `Customer.{ tenantId, deletedAt }`; `CallSession` already has `{ tenantId, createdAt }` |
| **Queue**    | New `notifications` queue (if Phase 2 queue exists)                                                                                                                                                  |
| **Env vars** | None                                                                                                                                                                                                 |


#### Can Existing Functionality Break?


| Area                | Risk   | Notes                                                            |
| ------------------- | ------ | ---------------------------------------------------------------- |
| Call session status | Medium | Out-of-order downgrade fix; must ensure state machine is correct |
| Notifications       | Low    | Async adds delay; WebSocket delivery may be slightly delayed     |
| Index creation      | Low    | Use `background: true`; avoid blocking                           |


#### Safest Implementation Order (Phase 6)

1. **Call session state ordering** — add `getStatusOrder()` helper; in `upsertCallSession`, only update if new status > current
2. **Compound indexes** — add via schema or migration script; run during low-traffic window
3. **Notifications queue** — add `notification.processor`; `createForUsers`/`createForAdmins` enqueue
4. **Pre-aggregation** (optional) — defer if not needed for current scale

---

## Recommended Overall Implementation Sequence

To minimize production risk, implement in this order:


| Step | Phase | Task                                     | Rationale                                                   |
| ---- | ----- | ---------------------------------------- | ----------------------------------------------------------- |
| 1    | 1     | Constant-time webhook signature (Retell) | Low risk, high security value                               |
| 2    | 1     | CORS/HSTS verification                   | Already in place; quick validation                          |
| 3    | 5     | Sentry integration                       | Observability before major changes; catch regressions early |
| 4    | 4     | Backend dashboard + reports endpoints    | Additive; no behavior change                                |
| 5    | 4     | Frontend adapter wiring                  | Depends on step 4; enables real data                        |
| 6    | 1     | RBAC foundation (schema + guard)         | Additive; default permissive                                |
| 7    | 2     | Queue module + webhook queue             | Enables async processing                                    |
| 8    | 2     | Email queue                              | Depends on step 7                                           |
| 9    | 3     | Email multi-transport                    | Depends on step 8                                           |
| 10   | 6     | Call session state ordering              | Fixes data integrity; independent                           |
| 11   | 6     | Compound indexes                         | Improves query performance                                  |
| 12   | 6     | Notifications async                      | Depends on step 7                                           |
| 13   | 1     | Webhook timestamp + replay               | Optional; enable after monitoring                           |
| 14   | 1     | RBAC migration                           | Final; enable after permissions populated                   |


**Parallel tracks** (after step 7): Phase 2 (queue), Phase 3 (email), Phase 6 (state ordering, indexes) can proceed in parallel.

---

## Appendix: Key File References

- Webhook controller: `apps/backend/src/webhooks/retell.webhook.controller.ts`
- Webhook service: `apps/backend/src/webhooks/webhooks.service.ts`
- Processed event schema: `apps/backend/src/webhooks/schemas/processed-event.schema.ts`
- Email service: `apps/backend/src/email/email.service.ts`
- Dashboard adapter: `apps/prototype/src/adapters/api/dashboard.adapter.ts`
- Reports adapter: `apps/prototype/src/adapters/api/reports.adapter.ts`
- Dashboard service: `apps/backend/src/dashboard/dashboard.service.ts`
- Reports service: `apps/backend/src/reports/reports.service.ts`
- Notifications service: `apps/backend/src/notifications/notifications.service.ts`


# Full System Audit — Phases 1–6 Production Hardening

**Date:** 2026-03-09  
**Scope:** Backend (`apps/backend/src/`)  
**Verdict:** Implementation is solid across all six phases. 4 security items require action before production; remaining findings are improvements.

---

## 1. Webhook Security

### 1.1 Constant-time Signature Verification

| Provider | Method | File |
|----------|--------|------|
| Retell | `timingSafeEqualHex()` → `crypto.timingSafeEqual` | `webhooks/retell.webhook.controller.ts:29-37` |
| Stripe | `stripe.webhooks.constructEvent()` (uses constant-time internally) | `webhooks/stripe.webhook.controller.ts:55-60` |

**Status: PASS**

### 1.2 Secret Rotation Support

| Provider | Primary | Legacy | Log rotation |
|----------|---------|--------|--------------|
| Retell | `RETELL_WEBHOOK_SECRET` | `RETELL_WEBHOOK_SECRET_LEGACY` | Yes |
| Stripe | `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET_LEGACY` | Yes |

Both iterate primary → legacy, log when legacy matches. **Status: PASS**

### 1.3 Timestamp Validation Toggle

- Retell: `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` env var, default `0` (disabled). When > 0, checks `x-retell-timestamp` header age.
- Stripe: Stripe SDK enforces its own 5-minute tolerance (not configurable externally). Acceptable.

**Status: PASS**

### 1.4 Replay Protection

- Schema: `ProcessedEvent` with `eventId` (unique), `source`, `eventType`, 30-day TTL via `expires`.
- `isDuplicateEvent(eventId, source)` called in both controllers before processing/enqueueing.
- `recordProcessedEvent()` called after successful processing.
- Worker also re-checks `isDuplicateEvent` for race conditions.
- MongoDB duplicate-key (11000) errors are caught gracefully.

**Status: PASS** — see Issue P-1 below for index concern.

---

## 2. Queue Infrastructure

### 2.1 Queue Definitions

| Queue | Constant | BullModule registered |
|-------|----------|-----------------------|
| `webhooks` | `QUEUE_NAMES.WEBHOOKS` | Yes (`queue.module.ts`) |
| `email` | `QUEUE_NAMES.EMAIL` | Yes |
| `notifications` | `QUEUE_NAMES.NOTIFICATIONS` | Yes |
| `agent-deployment` | Inline string | No — standalone `Queue`/`Worker` |

**Status: PASS** — `agent-deployment` is separate but functional.

### 2.2 Redis Connection

- `queue.config.ts` → `getRedisConnectionOptions(redisUrl)` parses `REDIS_URL`.
- Production (`NODE_ENV=production`): throws if `REDIS_URL` missing (fail-fast).
- Development: falls back to `localhost:6379`.

**Status: PASS**

### 2.3 Workers / Processors

| Worker | File | Queue | Concurrency |
|--------|------|-------|-------------|
| WebhookProcessor | `queue/webhook.processor.ts` | webhooks | 2 |
| EmailProcessor | `email/workers/email.worker.ts` | email | 3 |
| NotificationsProcessor | `notifications/workers/notifications.worker.ts` | notifications | 2 |
| Agent deployment | `agent-deployments/agent-deployment.service.ts` | agent-deployment | 2 |

**Status: PASS**

### 2.4 jobId for Idempotency

| Queue | jobId | Idempotent? |
|-------|-------|-------------|
| Webhooks | `eventId` | **Yes** |
| Email | `${type}:${to}:${Date.now()}` | **No** |
| Notifications | `fanout:${type}:${Date.now()}:${count}` | **No** |
| Agent-deployment | None | **No** |

**Status: PARTIAL** — see Issue I-1.

### 2.5 Retry and Backoff

Shared `DEFAULT_JOB_OPTIONS`: `attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`, `removeOnComplete: 100`, `removeOnFail: 500`. Used by all queue services.

**Status: PASS**

### 2.6 Dead-Letter Behavior

| Worker | `@OnWorkerEvent('failed')` | Sentry |
|--------|---------------------------|--------|
| WebhookProcessor | Yes — logs "DLQ" | Yes |
| EmailProcessor | Yes — logs "DLQ" | In `process()` catch only |
| NotificationsProcessor | **No** | In `process()` catch only |
| Agent deployment | Yes (`worker.on('failed')`) | Yes |

**Status: PARTIAL** — see Issue I-2.

---

## 3. Event Ordering Protection

### 3.1 Status Order Map

`RETELL_STATUS_ORDER` in `webhooks.service.ts:12-17`: `created: 0`, `started: 1`, `ended: 2`, `analyzed: 3`.

**Status: PASS**

### 3.2 Status Downgrade Prevention

In `upsertCallSession()`: if `incomingOrder <= currentOrder`, the update is skipped and a debug log is emitted.

**Status: PASS**

### 3.3 Duplicate Events

Duplicate events are ignored via `isDuplicateEvent()` in controllers and re-checked in the worker. MongoDB duplicate-key errors are caught.

**Status: PASS**

### 3.4 Timestamp Validation

When `incomingTimestamp <= lastEventTs`, the update is skipped. This prevents processing of older events even if they have distinct event IDs.

**Status: PASS**

---

## 4. Email Infrastructure

### 4.1 Queue Integration

`enqueueOrSend()` in `email.service.ts` checks `emailQueue?.isEnabled()`. If enabled and enqueue succeeds, the job is queued. Otherwise, `sendInternal()` is called directly.

Controlled by `QUEUE_EMAIL_ENABLED` env var.

**Status: PASS**

### 4.2 Fallback SMTP

- Primary: `SMTP_PRIMARY_USER` / `SMTP_PRIMARY_PASS` (falls back to `SMTP_USER` / `SMTP_PASS`).
- Fallback: `SMTP_FALLBACK_USER` / `SMTP_FALLBACK_PASS` (only when different from primary).
- `sendInternal()` tries primary, catches, retries on fallback.
- `verifyFallbackTransport()` runs on startup.

**Status: PASS**

### 4.3 `sendInternal()` Usage

Used by both the worker (via `sendInternalFromJob()`) and the direct path (when queue is disabled or enqueue fails). This is acceptable — direct sending is the development fallback.

**Status: PASS**

### 4.4 Rate Limiting

`EMAIL_RATE_LIMIT_PER_RECIPIENT` (default 10/hour). Sliding window per recipient. Applied in `sendInternal()`, so both queued and direct sends respect it.

**Status: PASS**

### 4.5 Email Metrics

`email_sent_total{type}` and `email_failed_total{type}` counters exist. Worker records on success/failure. Direct path records when `type` is passed. No double-counting.

**Status: PASS**

---

## 5. Notification Queue

### 5.1 Fanout via Queue

`createForUsers()` checks `notificationsQueue?.isEnabled()`. If enabled, calls `enqueueFanout()`. Worker loops users and calls `createFromQueue()` → `create()`.

**Status: PASS**

### 5.2 WebSocket Emission

`create()` calls `gateway.emitToUser(userId, 'notification', payload)`. This happens inside `createFromQueue()` called by the worker, so WebSocket events are emitted during queue processing.

**Status: PASS**

### 5.3 Retry Configuration

Uses shared `DEFAULT_JOB_OPTIONS` (3 attempts, exponential backoff).

**Status: PASS**

---

## 6. Observability

### 6.1 Sentry

- Init in `main.ts:10-19` when `SENTRY_DSN` is set.
- `GlobalExceptionFilter` captures 5xx with tags: `path`, `method`, `status`, `requestId`, `tenantId`, user context.
- Workers (`WebhookProcessor`, `EmailProcessor`, `NotificationsProcessor`) capture failures to Sentry.

**Status: PASS**

### 6.2 Structured Logging

`RequestLoggerMiddleware` emits JSON: `{ event, requestId, method, path, statusCode, durationMs, tenantId, userId }`. Correlation ID is generated or propagated from `x-request-id` / `x-correlation-id`.

**Status: PASS**

### 6.3 Prometheus Metrics

| Metric | Labels |
|--------|--------|
| `http_requests_total` | method, path, status |
| `http_request_duration_seconds` | method, path, status |
| `email_sent_total` | type |
| `email_failed_total` | type |
| `webhooks_received_total` | source |
| `process_*` (default) | — |

Exposed at `/metrics` (excluded from `/api` prefix). Request logger skips `/metrics` to avoid inflating counts.

**Status: PASS**

---

## 7. Database Indexes

### SupportTicket

| Index | Status |
|-------|--------|
| `{ tenantId: 1 }` | Present |
| `{ status: 1 }` | Present |
| `{ createdBy: 1 }` | Present |
| `{ tenantId: 1, status: 1, createdAt: -1 }` | Present |
| `{ tenantId: 1, priority: 1 }` | Present |

### Booking

| Index | Status |
|-------|--------|
| `{ tenantId: 1, date: 1 }` | Present |
| `{ tenantId: 1, date: 1, status: 1 }` | Present |
| `{ tenantId: 1, createdAt: -1 }` | Present |
| `{ customerId: 1 }` | Present |

### Customer

| Index | Status |
|-------|--------|
| `{ tenantId: 1 }` | Present |
| `{ tenantId: 1, phone: 1 }` | Present |
| `{ tenantId: 1, email: 1 }` | Present |
| `{ tenantId: 1, deletedAt: 1 }` | Present |
| `{ tenantId: 1, createdAt: -1 }` | Present |

### CallSession

| Index | Status |
|-------|--------|
| `{ callId: 1 }` (unique) | Present |
| `{ tenantId: 1, createdAt: -1 }` | Present |
| `{ tenantId: 1, outcome: 1 }` | Present |
| `{ tenantId: 1, 'metadata.intent': 1 }` | Present |
| `{ agentInstanceId: 1, createdAt: -1 }` | Present |

### ReportSnapshot

| Index | Status |
|-------|--------|
| `{ tenantId: 1, snapshotDate: -1 }` (unique) | Present |
| `{ snapshotDate: -1 }` | Present |

**Status: PASS** — All planned indexes exist.

---

## 8. Worker Isolation

### Controllers audited:

| Controller | Validates | Enqueues | Processes inline? |
|------------|-----------|----------|--------------------|
| RetellWebhookController | Signature, timestamp, dedup | Yes (when queue enabled) | Fallback when queue disabled |
| StripeWebhookController | Signature, dedup | Yes (when queue enabled) | Fallback when queue disabled |

When the queue is enabled, controllers validate input, enqueue, and return `202 Accepted`. Heavy processing (DB writes, call session upserts, tenant status transitions) happens in `WebhookProcessor`.

When the queue is disabled (development), controllers process inline — acceptable for local dev.

**Status: PASS**

---

## 9. Queue Health Monitoring

`QueueDepthLogger` runs every 5 minutes (via `@Cron`), logs depths for webhooks, email, and notifications queues when `QUEUE_DEPTH_LOGGING_ENABLED=true`.

Each queue service has `getQueueDepth()` returning `waiting + delayed`.

**Status: PASS** — see Issue I-3 for gaps.

---

## 10. Environment Variables

All new env vars are documented in `.env.example` with explanatory comments. Cross-referenced against `ConfigService` usage. See Issues I-4 and I-5 for gaps found.

**Status: PASS with notes**

---

## Issues Found

### Priority: MUST FIX before production

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| **S-1** | `main.ts` | **CRITICAL** | 4 debug `fetch()` calls to `http://127.0.0.1:7773/ingest/...` with hardcoded session/run IDs. These are agent debug telemetry left from a debugging session. They fire on every bootstrap and will cause connection-refused errors in production. **Remove all 4 fetch blocks** (lines 22-24, 68-70, 74-76, 79-81). |
| **S-2** | `db/seed.ts` | **HIGH** | Fallback passwords `Admin123!` and `Owner123!` when `ADMIN_SEED_PASSWORD` / `OWNER_SEED_PASSWORD` are unset. If the seed script runs in production without these env vars, accounts get weak passwords. **Require env vars or throw outside dev.** |
| **S-3** | `.env.example` | **MEDIUM** | `ADMIN_SEED_PASSWORD` and `OWNER_SEED_PASSWORD` are used in `db/seed.ts` but not documented in `.env.example`. Add them. |
| **S-4** | Processed events | **MEDIUM** | `ProcessedEvent` schema has `unique: true` on `eventId` alone, but deduplication checks `{ eventId, source }`. If Retell and Stripe ever produce the same event ID, one would fail to insert. **Change to compound unique index `{ eventId: 1, source: 1 }`.** |

### Priority: SHOULD FIX (improvements)

| ID | Area | Severity | Description |
|----|------|----------|-------------|
| **I-1** | Email/Notification queues | **LOW** | `jobId` uses `Date.now()`, making it non-idempotent. If the same email or notification fanout is enqueued twice (e.g. retry at caller level), duplicates can occur. Consider using a deterministic ID (e.g. hash of type + recipients + data). |
| **I-2** | NotificationsProcessor | **LOW** | Missing `@OnWorkerEvent('failed')` handler. After max retries, failures are only caught by `process()` catch block but there's no dedicated DLQ-style log like the other workers have. Add one for consistency. |
| **I-3** | Queue health | **LOW** | `agent-deployment` queue is not included in `QueueDepthLogger`. Queue depth is not exported as a Prometheus metric. |
| **I-4** | `.env.example` | **LOW** | `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` are documented but not wired into `EmailService`. Either remove from `.env.example` or mark as "unused / future". |
| **I-5** | Email transport | **LOW** | Both primary and fallback SMTP use `service: 'gmail'`. No generic SMTP host/port configuration for non-Gmail providers. Fine for current use but limits flexibility. |
| **I-6** | Notification metrics | **LOW** | Unlike email, there are no `notification_sent_total` / `notification_failed_total` Prometheus counters. |
| **I-7** | Email DLQ Sentry | **LOW** | `EmailProcessor.onFailed()` logs but does not call `Sentry.captureException`. Sentry only fires in the `process()` catch. This means final failures after all retries may only have the Sentry from the last attempt, not a dedicated "permanently failed" capture. |

---

## Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Notification fanout for large user sets (all admins + staff) processes sequentially in worker | Low | Medium | Current user counts are small; if scale increases, batch DB inserts instead of per-user `create()` |
| MongoDB index creation on startup blocks writes if collection is large | Low | High | Mongoose uses `background: true` by default since v6; verify this holds for all indexes |
| Email rate-limit map is in-memory (`Map<string, number[]>`) | Medium | Low | Works for single-instance; in multi-instance deployment, rate limits are per-instance, not global. Consider Redis-based rate limiting. |
| `QueueDepthLogger` only logs to console — no alerting | Medium | Medium | Add Prometheus gauge for queue depth and alert on thresholds |

---

## Security Risks

| Risk | Likelihood | Impact | Status |
|------|-----------|--------|--------|
| Debug fetch calls in `main.ts` | Certain (if deployed) | Low (connection refused, no data leak) | **FIX: S-1** |
| Weak seed passwords | Low (seed rarely runs in prod) | High (if it does) | **FIX: S-2** |
| Single-field unique index on `ProcessedEvent.eventId` | Very low | Medium | **FIX: S-4** |
| No auth on `/metrics` endpoint | Medium | Low (read-only metrics) | Document; consider basic auth or IP restriction in production |
| CORS defaults to `localhost:5173` | Low | Low | Overridden by `ALLOWED_ORIGINS` in production; documented |
| `WEBHOOK_TIMESTAMP_MAX_AGE_SEC=0` by default | Low | Low | Documented; intentionally disabled by default for dev |

---

## Missing Tests

| Area | What's missing |
|------|----------------|
| Webhook timestamp validation | No test for expired/future timestamps being rejected |
| Webhook legacy secret rotation | No test verifying fallback to legacy secret |
| Email queue path | No integration test for email → queue → worker → SMTP |
| Notification fanout via queue | No test for `createForUsers` → queue → worker → WebSocket |
| Event ordering | No test for status downgrade rejection in `upsertCallSession` |
| Queue depth logger | No test for `QueueDepthLogger` cron behavior |
| Rate limiting | No test for `EMAIL_RATE_LIMIT_PER_RECIPIENT` enforcement |

---

## Recommended Improvements (Post-Launch)

1. **Remove debug telemetry** — Delete the 4 `fetch('http://127.0.0.1:7773/...')` blocks in `main.ts` immediately.
2. **Compound unique index** — Change `ProcessedEvent` from `{ eventId: unique }` to `{ eventId: 1, source: 1, unique: true }`.
3. **Notification metrics** — Add `notification_sent_total` and `notification_failed_total` counters.
4. **Queue depth as Prometheus gauge** — Export `queue_depth{queue}` for alerting.
5. **Redis-based email rate limiting** — Replace in-memory `Map` with Redis sliding window for multi-instance.
6. **Auth on `/metrics`** — Add basic auth or IP allowlist for the metrics endpoint.
7. **Deterministic job IDs** — For email and notification queues, use content-hash-based IDs.
8. **Notifications `onFailed` handler** — Add `@OnWorkerEvent('failed')` to `NotificationsProcessor`.
9. **Generic SMTP config** — Support `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` for non-Gmail providers.
10. **Integration tests** — Cover queue paths, event ordering, and rate limiting.

---

## Summary Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Webhook Security | 9/10 | Excellent; compound unique index needed |
| Queue Infrastructure | 8/10 | Solid; idempotent jobIds missing for email/notifications |
| Event Ordering | 10/10 | Complete — status map, downgrade prevention, timestamp, dedup |
| Email Infrastructure | 9/10 | Queue, fallback, rate limiting, metrics all present |
| Notification Queue | 8/10 | Functional; missing metrics and `onFailed` handler |
| Observability | 9/10 | Sentry, structured logs, Prometheus all wired |
| Database Indexes | 10/10 | All planned indexes exist |
| Worker Isolation | 9/10 | Controllers validate + enqueue; inline fallback for dev only |
| Queue Health | 7/10 | Logging present; missing Prometheus export and agent-deployment |
| Environment Variables | 8/10 | Well documented; minor gaps (seed passwords, SendGrid) |
| **Overall** | **8.7/10** | Production-ready after S-1 through S-4 fixes |

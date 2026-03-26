# System Improvements Audit Report

**Date:** 2025-03-13  
**Scope:** Notifications, Monitoring, Admin Analytics, Logging, Stability  
**Constraint:** Retell call pipeline (webhooks, resolveAgentContext, upsertCallSession, call_sessions) is **locked** — no modifications.

---

## 1. Current Architecture Overview

### Notifications System

| Component | Location | Purpose |
|-----------|----------|---------|
| `NotificationsService` | `notifications/notifications.service.ts` | Creates notifications, emits via WebSocket, supports batch fanout via queue |
| `NotificationsGateway` | `notifications/notifications.gateway.ts` | Socket.IO namespace `/notifications`, rooms: `user:{id}`, `admin`, `tenant:{id}` |
| `NotificationsController` | `notifications/notifications.controller.ts` | REST: list, unread-count, mark read, clear |
| `NotificationsQueueService` | `notifications/notifications.queue.service.ts` | BullMQ fanout for multi-user notifications |
| `useNotifications` (frontend) | `hooks/useNotifications.ts` | Fetches list, listens to `notification:new`, unread badge, mark read |
| `NotificationDrawer` | `app/layout/Header/NotificationDrawer.tsx` | Drawer UI with filters, severity, mark-all-read |

**Current event sources:** tenant created, support tickets, agent health, system monitor failures, high error-rate spikes.

### Monitoring & Alerts

| Component | Location | Check | Interval |
|-----------|----------|-------|----------|
| `SystemMonitorService` | `health/system-monitor.service.ts` | MongoDB, Redis, Retell, stale agents, webhook queue depth | 45s |
| `ErrorRateMonitorService` | `notifications/error-rate-monitor.service.ts` | 5xx count in 60s window, threshold 25 | 30s |
| `QueueDepthLogger` | `queue/queue-depth.logger.ts` | Logs webhook/email/notification queue depths | 5 min (opt-in) |

**Alert delivery:** `notifyOnce()` with 5-min cooldown → `createForAdmins()` and optionally `createForTenantStaff()`.

### Admin Analytics

| Component | Location | Data |
|-----------|----------|------|
| `CallsService.getAnalyticsForAdmin` | `calls/calls.service.ts` | totalCalls, conversationRate, avgDuration, outcomes, sentiment |
| `DashboardService.getTenantMetrics` | `dashboard/dashboard.service.ts` | totalCalls, callOutcomes, avgCallDurationMs |
| `AdminCallsPage` | `modules/admin/pages/AdminCallsPage.tsx` | OutcomeBreakdown, SentimentChart, date range, export CSV |

**Outcome classification:** `booked`, `escalated`, `failed`, `info_only`, `unknown` (derived from summary text in webhooks.service).

### Logging

| Component | Location | Behavior |
|-----------|----------|----------|
| `RequestLoggerMiddleware` | `common/middleware/request-logger.middleware.ts` | JSON log: `event`, `requestId`, `method`, `path`, `statusCode`, `durationMs`, `tenantId`, `userId` |
| `GlobalExceptionFilter` | `common/filters/http-exception.filter.ts` | Logs 5xx with stack, sends to Sentry |
| `ErrorRateMonitorService` | `notifications/error-rate-monitor.service.ts` | `recordServerError()` on 5xx, cron checks spike |

**Correlation:** `x-correlation-id` / `x-request-id` set per request.

### Stability (Queues & Deduplication)

| Component | Location | Behavior |
|-----------|----------|----------|
| `WebhookQueueService` | `queue/webhook-queue.service.ts` | BullMQ webhooks queue, `jobId: eventId` for dedup |
| `WebhookProcessor` | `queue/webhook.processor.ts` | Concurrency 2, `isDuplicateEvent` before processing |
| `ProcessedEvent` | `webhooks/schemas/processed-event.schema.ts` | Unique index `(eventId, source)`, 30-day TTL |
| `DEFAULT_JOB_OPTIONS` | `queue/queue.constants.ts` | `attempts: 3`, exponential backoff 1000ms |

---

## 2. Improvement Opportunities

### 2.1 Notifications — New Call Arrival

**Gap:** No notification when a new call is created or ends. The webhook pipeline is locked, so notification cannot be added inside `webhooks.service` or `retell.webhook.controller`.

**Options (without touching webhook pipeline):**

1. **MongoDB Change Stream** — Watch `call_sessions` for inserts. New service subscribes to `insert` events and calls `NotificationsService.createForTenantStaff()`.
2. **Scheduled poll** — Cron job every 1–2 min checks for `call_sessions` created since last run, creates notifications for new calls.
3. **Queue listener (downstream)** — Add a separate BullMQ consumer that subscribes to a "call-events" topic. This would require emitting to that topic from somewhere *outside* the webhook handler (e.g. a post-insert hook in a different layer). Since `upsertCallSession` is in webhooks.service (locked), this is not feasible without a change stream or poll.

**Recommendation:** MongoDB Change Stream on `call_sessions` — clean, real-time, no webhook changes.

### 2.2 Notifications — WebSocket for Dashboard Refresh

**Gap:** Dashboard (`useDashboard`) uses `useAsyncData` with no WebSocket. When a new call arrives, the dashboard does not refresh until the user reloads or navigates.

**Options:**

1. **Emit `dashboard:refresh`** — When a call notification is created, gateway emits `dashboard:refresh` to `tenant:{tenantId}`. Frontend `useDashboard` listens and refetches.
2. **Polling** — Add `refetchInterval` to `useAsyncData` (e.g. 30s). Simpler but less real-time.
3. **Call-specific event** — Emit `call:new` with minimal payload; dashboard merges into `recentCalls` optimistically.

**Recommendation:** Emit `dashboard:refresh` or `call:new` when a new call notification is created. Reuse existing `emitToTenant()`.

### 2.3 Notifications — Unread Badge & Count

**Current:** `GET /notifications/unread-count` exists. `useNotifications` fetches it and updates on socket `notification:new`. Badge is shown in Header.

**Gap:** Minor — `setUnreadCount` in socket handler uses `item.unread ? 1 : 0`; if `item.unread` is false, count doesn't increment. Verify payload from backend always has `read: false` for new notifications.

### 2.4 Monitoring — Webhook Errors

**Gap:** `WebhookProcessor.onFailed` logs and sends to Sentry, but does **not** create an admin notification. Failed webhooks (after 3 retries) go to DLQ with no in-app alert.

**Recommendation:** In `WebhookProcessor.onFailed`, call `NotificationsService.createForAdmins()` with `source: 'retell'` or `source: 'system'`, `type: 'webhook_job_failed'`. This does **not** modify webhooks.service or the call pipeline — only the processor's failure handler.

### 2.5 Monitoring — Excessive Logs

**Gap:** No detection of excessive log volume (e.g. repeated errors, log spam). `ErrorRateMonitorService` tracks 5xx HTTP errors only.

**Recommendation:** Optional log-volume monitor: sample `Logger` output or hook into a transport, count log lines per minute, notify when above threshold. Lower priority.

### 2.6 Admin Analytics — Conversion Rate & Booking Detection

**Current:** `conversationRate = bookedCount / totalCalls` in `CallsService.runAnalyticsAggregation`. Booking detection is in `webhooks.service.deriveOutcome()` (summary text: "booked", "appointment confirmed").

**Gaps:**

- No explicit "conversion funnel" at admin level (e.g. calls → contacted → booked).
- Booking detection is heuristic; no link to `bookings` collection or `bookingId` on call_sessions.
- `call_sessions.bookingId` exists in schema but may not be populated by current pipeline.

**Recommendation:** Add admin analytics that joins `call_sessions` with `bookings` where `bookingId` is set. Compute conversion from calls-with-booking vs total. Do not change webhook/upsert logic — only add new aggregation queries.

### 2.7 Admin Analytics — Performance Metrics

**Gap:** No admin-level performance metrics (e.g. P95 call duration, calls per tenant, top/bottom performers).

**Recommendation:** New aggregation in `CallsService` or `DashboardService`: `$group` by tenant, compute percentiles, call volume. Admin-only endpoint.

### 2.8 Logging — Structured Logs & Error Tracing

**Current:** Request logger outputs JSON. Sentry captures 5xx with requestId, path, tenantId.

**Gaps:**

- No trace ID spanning async operations (e.g. webhook → queue → processor).
- Some services use `this.logger.log(string)` instead of structured `{ event, ... }`.
- Queue depth logger uses object but not all loggers are consistent.

**Recommendation:** Standardize on `this.logger.log(JSON.stringify({ event, ... }))` for key flows. Add `traceId` to AsyncLocalStorage for request-scoped correlation. Optional: integrate Pino/Winston for structured output.

### 2.9 Logging — System Health Status

**Current:** `GET /health` returns MongoDB, Redis, Retell status. `AdminService.getSystemHealth()` returns uptime, memory.

**Gap:** No periodic "health status" log (e.g. every 5 min: DB up, Redis up, queue depth). `QueueDepthLogger` exists but is opt-in.

**Recommendation:** Enable `QUEUE_DEPTH_LOGGING_ENABLED` by default in production, or add a lightweight health-summary log to `SystemMonitorService`.

### 2.10 Stability — Retry Failed Webhook Processing

**Current:** BullMQ `attempts: 3`, exponential backoff. Failed jobs go to DLQ (`removeOnFail: 500`). No automatic retry of failed jobs.

**Gap:** No "retry failed" admin action or cron to re-queue failed webhooks.

**Recommendation:** Admin endpoint or maintenance script to move failed jobs back to waiting. BullMQ supports `job.retry()`. Low priority if failure rate is low.

### 2.11 Stability — Duplicate Call Inserts

**Current:** `ProcessedEvent` unique index on `(eventId, source)`. `isDuplicateEvent` checked before processing. `upsertCallSession` uses `callId` as unique key.

**Status:** Adequate. Duplicate prevention is in place. No change needed.

### 2.12 Stability — Queue Heavy Processing

**Current:** Webhooks are queued when `QUEUE_WEBHOOKS_ENABLED=true`. Notifications fanout uses queue. Concurrency is 2 for webhooks.

**Gap:** If webhook volume spikes, queue depth grows. `SystemMonitorService` alerts at 500. No backpressure or rate limiting on enqueue.

**Recommendation:** Consider `limiter` in BullMQ job options for webhooks. Monitor queue depth; existing alert at 500 is reasonable.

---

## 3. Potential Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Change stream on `call_sessions` requires replica set | Medium | MongoDB must be run as replica set for change streams. Single-node dev may need `mongod --replSet rs0`. |
| Webhook processor calling NotificationsService creates new dependency | Low | Processor already has Sentry; adding NotificationsService is a single inject. Ensure NotificationsModule is imported in QueueModule/WebhooksModule. |
| Dashboard WebSocket refresh could cause excessive refetches | Low | Throttle or debounce `dashboard:refresh` handler (e.g. max 1 refetch per 10s). |
| ErrorRateMonitorService may not be injected in middleware | Low | Uses `@Optional()`; verify NotificationsModule is loaded before middleware. |
| Admin analytics aggregations on large datasets | Medium | Add date range limits, indexes on `tenantId`, `startedAt`, `outcome`. |

---

## 4. Summary

| Area | Current State | Priority Improvements |
|------|---------------|----------------------|
| **Notifications** | Solid base, WebSocket, unread badge | Add new-call notification (change stream), dashboard refresh event |
| **Monitoring** | DB, Redis, Retell, agents, queue, error spike | Add webhook failure notification |
| **Admin Analytics** | Basic outcomes, sentiment, export | Conversion rate, booking linkage, performance metrics |
| **Logging** | JSON request logs, Sentry | Structured logs, trace ID, health summary |
| **Stability** | Retry, dedup, queue | Optional: retry failed jobs, queue limiter |

---

## 5. Implementation Order (Suggested)

1. **Webhook failure notification** — `WebhookProcessor.onFailed` → `NotificationsService.createForAdmins()`. No pipeline changes.
2. **New call notification** — MongoDB Change Stream on `call_sessions` → `NotificationsService.createForTenantStaff()`.
3. **Dashboard refresh event** — Emit `dashboard:refresh` when call notification created; `useDashboard` listens and refetches.
4. **Admin analytics enhancements** — New aggregations for conversion, booking linkage, performance.
5. **Logging improvements** — Structured log format, optional trace ID.

---

*End of audit. No changes to webhooks.service, retell.webhook.controller, resolveAgentContext, upsertCallSession, or call_sessions schema.*

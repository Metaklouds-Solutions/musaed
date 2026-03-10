# Phase 6 — Scalability Preparation Summary

## Overview

Improves scalability and reliability for high-traffic environments through async notification fanout, compound indexes, horizontal scaling preparation, optional report pre-aggregation, and queue depth logging.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/notifications/notifications.queue.service.ts` | Enqueues notification fanout jobs when `QUEUE_NOTIFICATIONS_ENABLED=true` |
| `apps/backend/src/notifications/workers/notifications.worker.ts` | BullMQ processor: creates notifications, emits WebSocket events, retries on failure, captures errors in Sentry |
| `apps/backend/src/reports/schemas/report-snapshot.schema.ts` | Schema for daily aggregated call outcomes, sentiment, peak hours |
| `apps/backend/src/reports/report-aggregation.service.ts` | Daily cron (2 AM) to aggregate call data into report snapshots |
| `apps/backend/src/queue/queue-depth.logger.ts` | Cron (every 5 min) to log queue depths when `QUEUE_DEPTH_LOGGING_ENABLED=true` |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/queue/queue.constants.ts` | Added `NOTIFICATIONS` queue name |
| `apps/backend/src/queue/queue.module.ts` | Registered notifications queue, `NotificationsQueueService`, `QueueDepthLogger` |
| `apps/backend/src/notifications/notifications.service.ts` | Added `createFromQueue()`, `createForUsers()` now enqueues when queue enabled |
| `apps/backend/src/notifications/notifications.module.ts` | Imports `QueueModule`, adds `NotificationsProcessor` |
| `apps/backend/src/queue/webhook-queue.service.ts` | Added `getQueueDepth()` |
| `apps/backend/src/email/email.queue.service.ts` | Added `getQueueDepth()` |
| `apps/backend/src/queue/queue.module.ts` | Added `QueueDepthLogger` provider |
| `apps/backend/src/app.module.ts` | Added optional `MONGODB_MAX_POOL_SIZE`, `MONGODB_MIN_POOL_SIZE` |
| `apps/backend/src/support/schemas/support-ticket.schema.ts` | Added compound index |
| `apps/backend/src/bookings/schemas/booking.schema.ts` | Added compound indexes |
| `apps/backend/src/customers/schemas/customer.schema.ts` | Added compound indexes |
| `apps/backend/src/reports/reports.module.ts` | Added `ReportSnapshot` schema, `ReportAggregationService` |
| `apps/backend/.env.example` | Added env vars |

---

## Indexes Added

| Schema | Index |
|--------|-------|
| **SupportTicket** | `{ tenantId: 1, status: 1, createdAt: -1 }` |
| **Booking** | `{ tenantId: 1, date: 1, status: 1 }` |
| **Booking** | `{ tenantId: 1, createdAt: -1 }` |
| **Customer** | `{ tenantId: 1, deletedAt: 1 }` |
| **Customer** | `{ tenantId: 1, createdAt: -1 }` |
| **CallSession** | *(already had)* `{ tenantId: 1, createdAt: -1 }`, `{ tenantId: 1, outcome: 1 }`, `{ callId: 1 }` unique |
| **ReportSnapshot** | `{ tenantId: 1, snapshotDate: -1 }` unique, `{ snapshotDate: -1 }` |

---

## Environment Variables Added

| Variable | Description | Default |
|----------|-------------|---------|
| `QUEUE_WEBHOOKS_ENABLED` | Enable webhook queue | `false` |
| `QUEUE_NOTIFICATIONS_ENABLED` | Enable notification fanout queue | `false` |
| `QUEUE_DEPTH_LOGGING_ENABLED` | Log queue depths every 5 min | `false` |
| `MONGODB_MAX_POOL_SIZE` | MongoDB connection pool max | (unset) |
| `MONGODB_MIN_POOL_SIZE` | MongoDB connection pool min | (unset) |
| `REPORT_AGGREGATION_ENABLED` | Enable daily report pre-aggregation | `false` |

---

## New Logic

### 1. Async Notification Fanout

- `createForUsers()`, `createForAdmins()`, `createForTenantStaff()` enqueue when `QUEUE_NOTIFICATIONS_ENABLED=true` and `REDIS_URL` set
- Worker processes fanout jobs: creates notifications for each user, emits via WebSocket
- Logs: `notification_fanout_queued`, `notification_fanout_completed`, `notification_fanout_failed`
- Sentry captures notification job failures

### 2. Horizontal Scaling Preparation

- **No in-memory state for queues**: All jobs in Redis
- **MongoDB**: Optional `maxPoolSize` / `minPoolSize` via env
- **Workers**: BullMQ processors run in multiple instances; Redis distributes jobs

### 3. Report Pre-Aggregation

- Daily cron at 2 AM aggregates previous day’s call data per tenant
- Stores: `totalCalls`, `outcomes`, `sentiment`, `peakHours`, `avgDurationMs`
- Collection: `report_snapshots`

### 4. Queue Depth Logging

- `QueueDepthLogger` logs `webhooks`, `email`, `notifications` every 5 min when enabled
- `getQueueDepth()` on WebhookQueueService, EmailQueueService, NotificationsQueueService

---

## Verification Steps

1. **Build and test**
   ```bash
   cd apps/backend && npm run build && npm test
   ```

2. **Index creation**
   - MongoDB creates indexes on first collection access; or run `db.collection.createIndex()` manually

3. **Notification queue**
   - Set `REDIS_URL`, `QUEUE_NOTIFICATIONS_ENABLED=true`
   - Trigger `createForTenantStaff()` or `createForAdmins()` → verify job enqueued

4. **Report aggregation**
   - Set `REPORT_AGGREGATION_ENABLED=true`
   - Wait for 2 AM cron or trigger manually for testing

5. **Queue depth logging**
   - Set `QUEUE_DEPTH_LOGGING_ENABLED=true` → verify logs every 5 min

---

## Rollback Instructions

1. **Revert notifications**
   - Remove `notifications.queue.service.ts`, `workers/notifications.worker.ts`
   - Restore `notifications.service.ts` (remove `createFromQueue`, queue logic in `createForUsers`)
   - Revert `notifications.module.ts`

2. **Revert queue**
   - Remove `NOTIFICATIONS` from queue.constants
   - Remove notifications queue from QueueModule
   - Remove NotificationsQueueService, QueueDepthLogger

3. **Revert indexes**
   - Remove new indexes from SupportTicket, Booking, Customer schemas
   - Drop `report_snapshots` collection if created

4. **Revert reports**
   - Remove `report-snapshot.schema.ts`, `report-aggregation.service.ts`
   - Revert reports.module.ts

5. **Revert app.module**
   - Remove MongoDB pool size options

6. **Revert .env.example**
   - Remove new env vars

7. **Verify**
   ```bash
   cd apps/backend && npm test && npm run build
   ```

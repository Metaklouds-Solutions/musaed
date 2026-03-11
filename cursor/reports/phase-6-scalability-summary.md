# Phase 6 — Scalability Preparation Summary

## Overview

Phase 6 scalability preparation was largely implemented before this phase. This summary documents the existing setup and the enhancement added to complete the plan.

---

## Already Implemented (Pre-Phase 6)

| Component | Status |
|-----------|--------|
| Call session state ordering | `RETELL_STATUS_ORDER` in webhooks.service.ts; `upsertCallSession` rejects downgrades (`incomingOrder <= currentOrder`) and uses timestamp fallback |
| Notifications queue | `NotificationsQueueService`, `NotificationsProcessor`; `createForUsers` enqueues when `QUEUE_NOTIFICATIONS_ENABLED=true` |
| createForAdmins / createForTenantStaff | Both delegate to `createForUsers`, so they use the queue when enabled |
| Booking indexes | `{ tenantId: 1, date: 1 }`, `{ tenantId: 1, date: 1, status: 1 }`, `{ tenantId: 1, createdAt: -1 }` |
| Customer indexes | `{ tenantId: 1, deletedAt: 1 }`, `{ tenantId: 1, createdAt: -1 }` |
| CallSession indexes | `{ tenantId: 1, createdAt: -1 }`, `{ tenantId: 1, outcome: 1 }`, `{ tenantId: 1, 'metadata.intent': 1 }` |
| MongoDB connection pool | `maxPoolSize` and `minPoolSize` from env in app.module.ts |

---

## Enhancement Added (Phase 6 Completion)

### SupportTicket Compound Index

**File:** `apps/backend/src/support/schemas/support-ticket.schema.ts`

- Added index: `{ tenantId: 1, priority: 1 }` for priority-based queries (e.g. list high-priority tickets per tenant)

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/support/schemas/support-ticket.schema.ts` | Added `{ tenantId: 1, priority: 1 }` index |

---

## Index Summary

| Collection | Indexes |
|------------|---------|
| SupportTicket | `{ tenantId: 1 }`, `{ status: 1 }`, `{ createdBy: 1 }`, `{ tenantId: 1, status: 1, createdAt: -1 }`, `{ tenantId: 1, priority: 1 }` |
| Booking | `{ tenantId: 1, date: 1 }`, `{ tenantId: 1, date: 1, status: 1 }`, `{ tenantId: 1, createdAt: -1 }`, `{ customerId: 1 }` |
| Customer | `{ tenantId: 1 }`, `{ tenantId: 1, phone: 1 }`, `{ tenantId: 1, email: 1 }`, `{ tenantId: 1, deletedAt: 1 }`, `{ tenantId: 1, createdAt: -1 }` |
| CallSession | `{ callId: 1 }` (unique), `{ tenantId: 1, createdAt: -1 }`, `{ tenantId: 1, outcome: 1 }`, `{ tenantId: 1, 'metadata.intent': 1 }`, `{ agentInstanceId: 1, createdAt: -1 }` |

---

## Call Session State Ordering

**File:** `apps/backend/src/webhooks/webhooks.service.ts`

- `RETELL_STATUS_ORDER`: `created: 0`, `started: 1`, `ended: 2`, `analyzed: 3`
- In `upsertCallSession`: if `incomingOrder <= currentOrder`, update is skipped (prevents out-of-order downgrades)
- Timestamp fallback used when status order is equal

---

## Notifications Async Fanout

**Files:** `notifications.service.ts`, `notifications.queue.service.ts`, `workers/notifications.worker.ts`

- `createForUsers` checks `notificationsQueue?.isEnabled()`; if true, enqueues via `enqueueFanout`
- `NotificationsProcessor` processes fanout jobs; calls `createFromQueue` per user
- `createForAdmins` and `createForTenantStaff` both call `createForUsers`, so they use the queue when enabled
- Env: `QUEUE_NOTIFICATIONS_ENABLED=true` and `REDIS_URL` required for queue

---

## Horizontal Scaling Notes

- **MongoDB**: `MONGODB_MAX_POOL_SIZE` and `MONGODB_MIN_POOL_SIZE` in `.env.example`; tune per instance count
- **Redis**: Required for queues; ensure Redis is shared across backend instances
- **Pre-aggregation**: Deferred per plan; add if report queries become slow at scale

---

## Verification Steps

1. **Build**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Index creation**: Indexes are created on app startup via Mongoose schema; use `background: true` (default) to avoid blocking

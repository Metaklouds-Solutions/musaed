# Phase 2 — Queue Infrastructure Summary

## Overview

Phase 2 was largely implemented. This summary documents the existing queue infrastructure and the enhancements added to complete the plan.

---

## Already Implemented (Pre-Phase 2)

| Component | Status |
|-----------|--------|
| QueueModule | BullMQ with Redis, queues: webhooks, email, notifications |
| Webhook flow | Retell & Stripe controllers enqueue when `QUEUE_WEBHOOKS_ENABLED=true`, return 202 |
| WebhookProcessor | Handles Retell and Stripe events; idempotency via `jobId = eventId` |
| EmailQueueService | Enqueues invite, password_reset, appointment_reminder |
| EmailService | Uses `enqueueOrSend` — queue when enabled, sync fallback |
| EmailProcessor | Processes email jobs with retries |
| Default job options | `attempts: 3`, `backoff: { type: 'exponential', delay: 1000 }`, `removeOnFail: 500` |
| Idempotency | Process first; record in ProcessedEvent after success; BullMQ `jobId` prevents duplicate jobs |
| Agent deployment queue | Separate queue with retries; `worker.on('failed')` logs |

---

## Enhancements Added (Phase 2 Completion)

### 1. Fail-Fast in Production

**File:** `apps/backend/src/queue/queue.module.ts`

- When `NODE_ENV=production` and `REDIS_URL` is empty, the app fails to start with a clear error.
- Prevents running production without Redis when queue modules are loaded.

### 2. Failed Job Handlers (DLQ Pattern)

**WebhookProcessor** (`apps/backend/src/queue/webhook.processor.ts`):
- `@OnWorkerEvent('failed')` — logs failed webhook jobs and reports to Sentry.
- Failed jobs remain in BullMQ (removeOnFail: 500) for inspection.

**EmailProcessor** (`apps/backend/src/email/workers/email.worker.ts`):
- `@OnWorkerEvent('failed')` — logs failed email jobs.
- Sentry already captures exceptions in the process() catch block.

**AgentDeploymentService** (`apps/backend/src/agent-deployments/agent-deployment.service.ts`):
- Enhanced `worker.on('failed')` — logs with tenantId; reports to Sentry.

### 3. Environment Documentation

**File:** `apps/backend/.env.example`

- Documented that `REDIS_URL` is required in production.
- Consolidated queue-related env vars (removed duplicate `QUEUE_EMAIL_ENABLED`).

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/queue/queue.module.ts` | Fail-fast when REDIS_URL empty in production |
| `apps/backend/src/queue/webhook.processor.ts` | `@OnWorkerEvent('failed')` + Sentry |
| `apps/backend/src/email/workers/email.worker.ts` | `@OnWorkerEvent('failed')` |
| `apps/backend/src/agent-deployments/agent-deployment.service.ts` | Sentry in failed handler |
| `apps/backend/.env.example` | Redis production requirement, env consolidation |
| `apps/backend/src/common/guards/permissions.guard.ts` | Fix NestJS 11 `getAllAndMerge` signature (unrelated) |

---

## Queue Flow Summary

### Webhooks

1. Controller: verify signature, parse body, validate timestamp.
2. If `QUEUE_WEBHOOKS_ENABLED=true`: enqueue with `jobId = eventId`, return 202.
3. Worker: check `ProcessedEvent` (dedup); process; record on success.
4. On failure after retries: log, Sentry, job kept in failed set.

### Email

1. Caller uses `EmailService.sendInviteEmail`, `sendPasswordResetEmail`, `sendAppointmentReminder`.
2. If `QUEUE_EMAIL_ENABLED=true`: enqueue; worker calls `sendInternalFromJob`.
3. On failure: retries; then log, Sentry, job in failed set.

### Reminders

- `RemindersProcessor` (Cron) calls `EmailService.sendAppointmentReminder`.
- When queue enabled, reminders go through the email queue automatically.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Required in production when queue modules load |
| `QUEUE_WEBHOOKS_ENABLED` | Enable webhook queue (default: false) |
| `QUEUE_EMAIL_ENABLED` | Enable email queue (default: false) |
| `QUEUE_NOTIFICATIONS_ENABLED` | Enable notifications queue (default: false) |
| `AGENT_DEPLOYMENT_QUEUE_ENABLED` | Enable agent deployment queue (default: false in dev) |

---

## Verification Steps

1. **Build**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Production fail-fast**
   - Set `NODE_ENV=production`, unset `REDIS_URL` → app should fail to start with clear error.

3. **Webhook queue**
   - Set `REDIS_URL` and `QUEUE_WEBHOOKS_ENABLED=true`.
   - Send Retell/Stripe webhook → expect 202 and async processing.

4. **Email queue**
   - Set `REDIS_URL` and `QUEUE_EMAIL_ENABLED=true`.
   - Trigger invite or password reset → email queued and sent by worker.

---

## Rollback

1. Revert queue.module.ts (remove fail-fast).
2. Revert webhook.processor.ts, email.worker.ts, agent-deployment.service.ts (remove failed handlers).
3. Revert .env.example.

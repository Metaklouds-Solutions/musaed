# Redis Integration Audit Report

**Date:** 2025-03-12  
**Scope:** Backend Redis queues (webhooks, email, notifications)  
**Status:** VERIFIED

---

## 1. Redis Usage Detected

| Item | Status |
|------|--------|
| **Redis usage** | **YES** |
| **Packages** | `ioredis` (^5.10.0), `bullmq` (^5.70.4), `@nestjs/bullmq` (^10.2.3) |
| **Queue services** | WebhookQueueService, EmailQueueService, NotificationsQueueService |

---

## 2. Redis Dependency Type

| Environment | Dependency |
|-------------|------------|
| **Production** | **REQUIRED** — `QueueModule` throws if `REDIS_URL` is empty |
| **Development** | **OPTIONAL** — Falls back to `localhost:6379` with `lazyConnect` when unset; queues disabled when `REDIS_URL` empty |

---

## 3. Queue Services Detected

| Service | File | Behavior when disabled |
|---------|------|-------------------------|
| **Webhook** | `queue/webhook-queue.service.ts` | Retell/Stripe webhooks processed synchronously in controller |
| **Email** | `email/email.queue.service.ts` | `EmailService` sends directly via SMTP (no queue) |
| **Notifications** | `notifications/notifications.queue.service.ts` | Direct processing / fanout without queue |

**Enable condition:** Both `REDIS_URL` set **and** `QUEUE_*_ENABLED === 'true'`.

---

## 4. Environment Configuration Status

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `REDIS_URL` | Production: yes; Dev: no | — | Optional in Joi; QueueModule throws in prod if empty |
| `QUEUE_WEBHOOKS_ENABLED` | No | `'false'` | Joi `booleanString('false')` |
| `QUEUE_EMAIL_ENABLED` | No | `'false'` | Joi `booleanString('false')` |
| `QUEUE_NOTIFICATIONS_ENABLED` | No | `'false'` | Joi `booleanString('false')` |
| `QUEUE_DEPTH_LOGGING_ENABLED` | No | `'false'` | Cron logs queue depths when enabled |

**Current `.env` (apps/backend/.env):**
- `REDIS_URL=redis://localhost:6379` ✓
- `QUEUE_WEBHOOKS_ENABLED=true` ✓
- `QUEUE_EMAIL_ENABLED=true` ✓
- `QUEUE_NOTIFICATIONS_ENABLED=true` ✓

**Note:** If "queue disabled" logs appear despite this config, verify:
1. Redis is running locally (`redis-server` or Docker)
2. Config loads from `apps/backend/` (NestJS uses `process.cwd()` by default)
3. Log level — "queue disabled" uses `logger.debug()`; visible only with DEBUG enabled

---

## 5. Docker Redis Configuration Status

| Item | Status |
|------|--------|
| **docker-compose.yml** | Not present — no Redis container in repo |
| **Dockerfile (backend)** | No Redis; app expects external Redis |
| **Deployment** | Cloud Run uses `REDIS_URL` from GCP Secret Manager |

**Recommendation:** For local dev with Redis, run Redis separately:
```bash
docker run -d -p 6379:6379 redis:7-alpine
# or: redis-server
```

---

## 6. Redis Connection Code

| Location | Behavior |
|----------|----------|
| `queue/queue.config.ts` | `getRedisConnectionOptions(redisUrl)` parses URL, sets host/port/auth/db |
| `queue/queue.module.ts` | `BullModule.forRootAsync` — prod throws if no REDIS_URL; dev uses localhost:6379 fallback |
| `queue/*.queue.service.ts` | Each creates `new Queue(..., { connection: getRedisConnectionOptions(redisUrl) })` when enabled |
| `health/health.controller.ts` | Injects Bull queue, pings Redis; health = degraded if Redis down |
| `agent-deployments/agent-deployment.service.ts` | Own Redis connection for deployment queue; warns and disables when REDIS_URL missing |

---

## 7. Queue Initialization Logic

- **BullModule** always registers queues (webhooks, email, notifications).
- **Queue services** create their own `Queue` instances only when `redisUrl && enabled`.
- **Fallback:** When queue is `null`, `add()`/`enqueue()` return `null`; callers process synchronously.
- **Workers:** `WebhookProcessor`, `EmailWorker`, `NotificationsWorker` consume from Bull queues; they run only when Bull connects to Redis.

---

## 8. Logging Behavior

| Message | Level | When |
|---------|-------|------|
| `Webhook queue enabled` | `log` | `redisUrl && QUEUE_WEBHOOKS_ENABLED` |
| `Webhook queue disabled (REDIS_URL or QUEUE_WEBHOOKS_ENABLED)` | `debug` | Otherwise |
| Same pattern for Email, Notifications | — | — |

These messages are correct. "Queue disabled" at debug level is expected when Redis/queues are intentionally off.

---

## 9. Issues Found

| # | Issue | Severity |
|---|-------|----------|
| 1 | **Deploy missing queue flags** — Production deploy did not set `QUEUE_WEBHOOKS_ENABLED`, `QUEUE_EMAIL_ENABLED`, `QUEUE_NOTIFICATIONS_ENABLED`. Joi defaults to `'false'`, so production queues were disabled even with `REDIS_URL` set. | **High** |
| 2 | No `docker-compose` for local Redis — developers must run Redis manually. | Low |

---

## 10. Fixes Applied

| Fix | File |
|-----|------|
| Added `QUEUE_WEBHOOKS_ENABLED=true`, `QUEUE_EMAIL_ENABLED=true`, `QUEUE_NOTIFICATIONS_ENABLED=true` to backend Cloud Run deploy | `.github/workflows/deploy.yml` |

---

## 11. System Behavior Verification

| Feature | Without Redis | With Redis |
|---------|---------------|------------|
| Webhook processing | Synchronous in controller | Queued via BullMQ |
| Email sending | Direct SMTP | Queued via BullMQ |
| Notifications | Direct processing | Queued via BullMQ |
| Analytics APIs | Work (MongoDB) | Work |
| Calls ingestion | Works (sync webhook handling) | Works (queued) |
| Health endpoint | `degraded` if Redis down | `ok` when Redis up |

---

## 12. Final Recommendation

1. **Production:** Ensure `REDIS_URL` is set in GCP Secret Manager and that the deploy sets `QUEUE_*_ENABLED=true` (now applied).
2. **Local dev:**  
   - **Without Redis:** Comment out `REDIS_URL` in `.env`; queues disabled, sync fallback used.  
   - **With Redis:** Set `REDIS_URL=redis://localhost:6379`, run Redis, keep `QUEUE_*_ENABLED=true`.
3. **Optional:** Add `docker-compose.yml` with Redis for local dev convenience.

---

## REDIS INTEGRATION STATUS: VERIFIED

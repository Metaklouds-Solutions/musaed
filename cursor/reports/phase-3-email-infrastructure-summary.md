# Phase 3 — Email Infrastructure Summary

## Overview

Improves email delivery reliability by integrating the email system with BullMQ, adding multi-transport support, structured logging, Prometheus metrics, fallback validation, template injection safety, and per-recipient rate limiting.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/email/email.queue.service.ts` | Enqueues email jobs when `QUEUE_EMAIL_ENABLED=true` and `REDIS_URL` is set |
| `apps/backend/src/email/workers/email.worker.ts` | BullMQ processor for email queue; calls `sendInternalFromJob`, retries on failure, captures errors in Sentry |
| `apps/backend/src/email/email.queue.service.spec.ts` | Unit tests for queue disabled states |
| `apps/backend/src/email/email.service.spec.ts` | Unit tests for EmailService (dev mode, enqueue, direct send, rate limit) |
| `apps/backend/src/email/workers/email.worker.spec.ts` | Unit tests for EmailProcessor (invite, appointment_reminder, failure/retry) |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/email/email.service.ts` | Refactored: `send()` → `sendInternal()`, added `enqueueOrSend()`, multi-transport (primary + fallback), `sendInternalFromJob()` for worker, structured logging, `escapeHtml()` for templates, `checkRateLimit()`, fallback verification on startup |
| `apps/backend/src/email/email.module.ts` | Imports `QueueModule.forRoot()`, adds `EmailProcessor` provider |
| `apps/backend/src/email/workers/email.worker.ts` | Injects `MetricsService`, records `email_sent_total` / `email_failed_total` |
| `apps/backend/src/metrics/metrics.service.ts` | Added `email_sent_total`, `email_failed_total` counters; `recordEmailSent()`, `recordEmailFailed()` |
| `apps/backend/src/queue/queue.module.ts` | Adds `EmailQueueService` provider and export |
| `apps/backend/.env.example` | Added `QUEUE_EMAIL_ENABLED`, `SMTP_PRIMARY_*`, `SMTP_FALLBACK_*`, `EMAIL_RATE_LIMIT_PER_RECIPIENT` |

---

## Environment Variables Added

| Variable | Description | Default |
|----------|-------------|---------|
| `QUEUE_EMAIL_ENABLED` | Enable email queue (requires `REDIS_URL`) | `false` |
| `SMTP_PRIMARY_USER` | Primary SMTP user (falls back to `SMTP_USER` if unset) | — |
| `SMTP_PRIMARY_PASS` | Primary SMTP password (falls back to `SMTP_PASS` if unset) | — |
| `SMTP_FALLBACK_USER` | Fallback SMTP user when primary fails | — |
| `SMTP_FALLBACK_PASS` | Fallback SMTP password | — |
| `EMAIL_RATE_LIMIT_PER_RECIPIENT` | Max emails per recipient per hour (0 = disabled) | `10` |

---

## New Logic

### 1. EmailQueueService

- `enqueueEmail(type, payload)` — adds job to `email` queue
- Job types: `invite`, `password_reset`, `appointment_reminder`
- Enabled when `REDIS_URL` and `QUEUE_EMAIL_ENABLED=true`

### 2. Email Worker

- Processes jobs from `email` queue (concurrency: 3)
- Calls `EmailService.sendInternalFromJob(type, payload)`
- Retries on failure (3 attempts, exponential backoff)
- Captures errors with `Sentry.captureException()`
- Records `email_sent_total` / `email_failed_total` via MetricsService
- Logs: `email_sent`, `email_retry`, `email_failed`

### 3. EmailService Flow

- **Queue enabled**: `sendInviteEmail` / `sendPasswordResetEmail` / `sendAppointmentReminder` → `enqueueEmail()` → worker → `sendInternal()`
- **Queue disabled**: same methods → `sendInternal()` directly

### 4. Multi-Transport

- Primary: `SMTP_PRIMARY_*` or `SMTP_USER` / `SMTP_PASS`
- Fallback: `SMTP_FALLBACK_*` (only if different from primary)
- On primary failure: retry with fallback transport
- **Fallback validation**: `verify()` on startup; logs warning if verification fails

### 5. Observability

- **Metrics**: `email_sent_total{type}`, `email_failed_total{type}` exposed at `/metrics`
- **Logging**: `email_sent`, `email_retry`, `email_failed`, `email_queued` (debug)

### 6. Template Injection Safety

- `escapeHtml()` escapes `&`, `<`, `>`, `"`, `'` in user-supplied content (name, customerName, dateStr, timeSlot)
- Prevents XSS/injection in email HTML templates

### 7. Per-Recipient Rate Limiting

- In-memory rate limit: max N emails per recipient per hour (configurable via `EMAIL_RATE_LIMIT_PER_RECIPIENT`)
- Default: 10 per hour; 0 = disabled
- Throws when exceeded; job retries then DLQ

---

## Verification Steps

1. **Run tests**
   ```bash
   cd apps/backend && npm test
   ```

2. **Build**
   ```bash
   cd apps/backend && npm run build
   ```

3. **Manual verification**
   - Set `REDIS_URL` and `QUEUE_EMAIL_ENABLED=true`
   - Trigger invite / password reset / appointment reminder
   - Confirm jobs appear in Redis and are processed
   - Simulate primary SMTP failure and confirm fallback is used

---

## Rollback Instructions

1. **Revert `email.service.ts`**
   - Restore single `transporter`, `send()` method
   - Remove `sendInternal`, `sendInternalFromJob`, `enqueueOrSend`, multi-transport

2. **Remove new files**
   - `email.queue.service.ts`
   - `email/workers/email.worker.ts`
   - `email.queue.service.spec.ts`
   - `email.service.spec.ts`
   - `email/workers/email.worker.spec.ts`

3. **Revert `email.module.ts`**
   - Remove `QueueModule` import and `EmailProcessor` provider

4. **Revert `queue.module.ts`**
   - Remove `EmailQueueService` provider and export

5. **Revert `.env.example`**
   - Remove `QUEUE_EMAIL_ENABLED`, `SMTP_PRIMARY_*`, `SMTP_FALLBACK_*`

6. **Verify**
   ```bash
   cd apps/backend && npm test && npm run build
   ```

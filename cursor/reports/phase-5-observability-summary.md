# Phase 5 — Observability Summary

## Overview

Phase 5 observability was largely implemented. This summary documents the existing setup and the enhancements added to complete the plan.

---

## Already Implemented (Pre-Phase 5)

| Component | Status |
|-----------|--------|
| Sentry | Init in main.ts with dsn, environment, release, tracesSampleRate |
| GlobalExceptionFilter | Captures 5xx to Sentry with requestId, tenantId, userId |
| RequestLoggerMiddleware | Sets x-request-id, x-correlation-id; logs JSON with requestId, tenantId, userId |
| MetricsService | prom-client; http_requests_total, http_request_duration_seconds |
| MetricsController | Exposes /metrics (excluded from /api prefix) |
| Email metrics | email_sent_total, email_failed_total |
| Queue context | Propagates requestId to webhook/email jobs |
| Worker Sentry | Webhook, email, agent-deployment processors capture failures |

---

## Enhancements Added (Phase 5 Completion)

### 1. webhooks_received_total Metric

**File:** `apps/backend/src/metrics/metrics.service.ts`

- Added counter: `webhooks_received_total{source}` (retell, stripe)
- Incremented after signature verification, before processing

**Files:** `apps/backend/src/webhooks/retell.webhook.controller.ts`, `stripe.webhook.controller.ts`

- Inject MetricsService; call `recordWebhookReceived('retell')` / `recordWebhookReceived('stripe')`

### 2. req.id for Correlation

**File:** `apps/backend/src/common/middleware/request-logger.middleware.ts`

- Attach `req.id = requestId` so handlers can access `req.id` for logging/tracing

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/metrics/metrics.service.ts` | Added webhooks_received_total, recordWebhookReceived() |
| `apps/backend/src/webhooks/retell.webhook.controller.ts` | Inject MetricsService, record webhook |
| `apps/backend/src/webhooks/stripe.webhook.controller.ts` | Inject MetricsService, record webhook |
| `apps/backend/src/common/middleware/request-logger.middleware.ts` | Set req.id = requestId |
| `apps/backend/src/webhooks/retell.webhook.controller.spec.ts` | Add MetricsService mock |

---

## Metrics Exposed at /metrics

| Metric | Labels | Description |
|--------|--------|-------------|
| http_requests_total | method, path, status | HTTP request count |
| http_request_duration_seconds | method, path, status | Request duration histogram |
| email_sent_total | type | Successful email sends |
| email_failed_total | type | Failed email sends |
| webhooks_received_total | source | Webhooks received (retell, stripe) |
| process_* | — | Default Node.js metrics (CPU, memory) |

---

## Verification Steps

1. **Build**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Tests**
   ```bash
   npm test
   ```

3. **Metrics**
   - GET /metrics → Prometheus format with webhooks_received_total

4. **Sentry**
   - Set SENTRY_DSN; trigger 5xx → exception captured with requestId, tenantId

---

## Rollback

1. Revert metrics.service.ts (remove webhooks_received_total)
2. Revert webhook controllers (remove MetricsService, recordWebhookReceived)
3. Revert request-logger.middleware.ts (remove req.id)
4. Revert retell.webhook.controller.spec.ts

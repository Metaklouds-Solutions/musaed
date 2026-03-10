# Phase 5 — Observability Summary

**Completed:** March 2025  
**Scope:** Sentry error tracking, Prometheus metrics, structured logging, queue context for Phase 2

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/metrics/metrics.service.ts` | Prometheus metrics: HTTP duration histogram, request counter, default Node.js metrics |
| `apps/backend/src/metrics/metrics.controller.ts` | Exposes `/metrics` endpoint for Prometheus scraping |
| `apps/backend/src/metrics/metrics.module.ts` | Global metrics module |
| `apps/backend/src/common/constants/queue-context.ts` | `extractQueueContext`, `QUEUE_CONTEXT_KEYS` for Phase 2 job propagation |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/main.ts` | Sentry.init() when SENTRY_DSN set; added `metrics` to global prefix exclude |
| `apps/backend/src/app.module.ts` | Import MetricsModule; add RequestLoggerMiddleware to providers |
| `apps/backend/src/common/middleware/request-logger.middleware.ts` | Inject MetricsService; add requestId, tenantId, userId to logs; record HTTP metrics; set x-request-id header |
| `apps/backend/src/common/filters/http-exception.filter.ts` | Capture 5xx to Sentry with requestId, tenantId, userId context |
| `apps/backend/package.json` | Added @sentry/node, prom-client |
| `apps/backend/.env.example` | Added SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE |

---

## Environment Variables Added

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | — | Sentry project DSN; when unset, Sentry is disabled |
| `SENTRY_ENVIRONMENT` | No | `NODE_ENV` or `development` | Environment name in Sentry |
| `SENTRY_RELEASE` | No | — | Release version for Sentry grouping |

---

## Metrics Exposed

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_request_duration_seconds` | Histogram | method, path, status | Request duration in seconds |
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `process_cpu_user_seconds_total` | Counter | — | Node.js default |
| `process_resident_memory_bytes` | Gauge | — | Node.js default |
| `nodejs_eventloop_lag_seconds` | Gauge | — | Node.js default |
| `nodejs_heap_size_*` | Gauges | — | Node.js default |

Path labels are normalized (e.g. `/api/tenant/123` → `/api/tenant/:id`) to limit cardinality.

---

## Verification Steps

### 1. Build

```bash
cd apps/backend && npm run build
```

Expected: Build succeeds.

### 2. Unit Tests

```bash
cd apps/backend && npm test
```

Expected: All tests pass.

### 3. Start Server and Check /metrics

```bash
cd apps/backend && npm run start:dev
```

In another terminal:

```bash
curl http://localhost:3001/metrics
```

Expected: Prometheus exposition format (e.g. `# HELP http_requests_total`, `# TYPE http_requests_total counter`).

### 4. Trigger HTTP Request and Verify Metrics

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/metrics
```

Expected: `http_requests_total` and `http_request_duration_seconds` include entries for the health request.

### 5. Structured Logs

Make an authenticated request (e.g. login, then call a tenant endpoint). Check logs for:

```json
{"event":"http.request","requestId":"...","method":"GET","path":"/api/...","statusCode":200,"durationMs":10,"tenantId":"...","userId":"..."}
```

### 6. Sentry (when SENTRY_DSN set)

1. Set `SENTRY_DSN` in `.env`.
2. Trigger a 5xx error (e.g. invalid DB call).
3. Verify error appears in Sentry dashboard with requestId, tenantId, userId tags.

---

## Rollback Instructions

### Full revert

```bash
git checkout HEAD -- apps/backend/src/main.ts
git checkout HEAD -- apps/backend/src/app.module.ts
git checkout HEAD -- apps/backend/src/common/middleware/request-logger.middleware.ts
git checkout HEAD -- apps/backend/src/common/filters/http-exception.filter.ts
git checkout HEAD -- apps/backend/package.json
git checkout HEAD -- apps/backend/.env.example
rm -rf apps/backend/src/metrics
rm apps/backend/src/common/constants/queue-context.ts
npm install
```

### Disable Sentry only

Remove or leave empty `SENTRY_DSN` in `.env`. Sentry is no-op when DSN is unset.

### Disable metrics recording in middleware

Remove `MetricsModule` from `AppModule` imports. The middleware uses `@Optional()` for MetricsService, so it will skip metrics recording when MetricsService is unavailable.

---

## Phase 2 Integration Notes

When implementing Phase 2 (queue infrastructure), use `extractQueueContext(req)` when enqueueing jobs:

```typescript
import { extractQueueContext } from '../common/constants/queue-context';

// In webhook controller:
await webhookQueue.add('process', { ...payload, ...extractQueueContext(req) }, { jobId: eventId });
```

Workers should read `job.data.requestId` and include it in logs for correlation.

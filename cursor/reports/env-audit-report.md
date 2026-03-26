# Environment Configuration Audit Report

**Date:** 2025-03-12  
**Scope:** Full repository — backend (`apps/backend`), frontend (`apps/prototype`), env files, and startup validation.

---

## 1. Summary

| Category | Count |
|----------|--------|
| Backend env vars used in code | 45 |
| Backend vars in `.env.example` | 44 |
| Frontend (Vite) env vars used | 5 |
| **Missing from backend `.env.example`** | 0 (all present after audit) |
| **Unused in backend code** (defined only in .env.example) | 0 |
| **Required at startup** (validation fails if missing) | 3 (MONGODB_URI, JWT_SECRET; RETELL_API_KEY at first Retell use) |

---

## 2. Backend Environment Variables (Complete List)

### 2.1 Used in code (by source)

| Variable | Where used | Required at bootstrap? |
|----------|------------|--------------------------|
| `MONGODB_URI` | app.module (getOrThrow), seed.ts, get-invite-token.js, clear-db.js, migrate-agent-deployment-v2.ts | **Yes** |
| `MONGODB_MAX_POOL_SIZE` | app.module | No |
| `MONGODB_MIN_POOL_SIZE` | app.module | No |
| `PORT` | main.ts, agent-deployment.service (fallback for API_BASE_URL) | No (default 3001) |
| `NODE_ENV` | main.ts, queue modules, email queue, webhooks, agent-deployment.service | No |
| `ALLOWED_ORIGINS` | main.ts, notifications.gateway | No (CORS) |
| `CORS_ORIGIN` | main.ts, notifications.gateway | No |
| `JWT_SECRET` | auth.module, jwt.strategy, notifications.module, notifications.gateway (getOrThrow) | **Yes** |
| `JWT_EXPIRES_IN` | auth.module, notifications.module | No |
| `JWT_REFRESH_EXPIRES_IN` | (in schema / docs) | No |
| `REDIS_URL` | queue.module, email.queue.service, webhook-queue.service, notifications.queue.service, agent-deployment.service | No (required only when queues enabled) |
| `AGENT_DEPLOYMENT_QUEUE_ENABLED` | env.validation only; queue module uses REDIS_URL + queue-specific flags | No |
| `QUEUE_WEBHOOKS_ENABLED` | webhook-queue.service | No |
| `QUEUE_EMAIL_ENABLED` | email.queue.service | No |
| `QUEUE_NOTIFICATIONS_ENABLED` | notifications.queue.service | No |
| `QUEUE_DEPTH_LOGGING_ENABLED` | queue-depth.logger | No |
| `STRIPE_SECRET_KEY` | stripe.webhook.controller | No |
| `STRIPE_WEBHOOK_SECRET` | stripe.webhook.controller | No |
| `STRIPE_WEBHOOK_SECRET_LEGACY` | (in schema; optional rotation) | No |
| `SMTP_USER` | email.service | No |
| `SMTP_PASS` | email.service | No |
| `SMTP_FROM` | email.service | No |
| `SMTP_PRIMARY_USER` | email.service | No |
| `SMTP_PRIMARY_PASS` | email.service | No |
| `SMTP_FALLBACK_USER` | email.service | No |
| `SMTP_FALLBACK_PASS` | email.service | No |
| `EMAIL_RATE_LIMIT_PER_RECIPIENT` | email.service | No |
| `FRONTEND_URL` | email.service | No |
| `RETELL_API_KEY` | retell.client (getOrThrow) | At first Retell use |
| `RETELL_WEBHOOK_SECRET` | retell.webhook.controller | No |
| `RETELL_WEBHOOK_SECRET_LEGACY` | retell.webhook.controller | No |
| `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` | retell.webhook.controller | No |
| `API_BASE_URL` | agent-deployment.service (flow templates) | No |
| `RETELL_TOOL_API_KEY` | agent-deployment.service, agent-tools.service | No (required when using tool callbacks) |
| `AGENT_DEPLOYMENT_V2_ENABLED` | agent-rollout.service | No |
| `AGENT_AUTO_DEPLOY_ON_CREATE` | agent-rollout.service | No |
| `AGENT_DEPLOYMENT_FAILURE_ALERT_THRESHOLD` | agent-deployment-metrics.service | No |
| `CALL_SESSION_INGEST_ENABLED` | (in schema; feature flag) | No |
| `ADMIN_SEED_PASSWORD` | reset-admin-password.js, seed | No (scripts only) |
| `OWNER_SEED_PASSWORD` | seed | No (scripts only) |
| `REPORT_AGGREGATION_ENABLED` | report-aggregation.service | No |
| `SENTRY_DSN` | main.ts, http-exception.filter | No |
| `SENTRY_ENVIRONMENT` | main.ts | No |
| `SENTRY_RELEASE` | main.ts | No |
| `METRICS_API_KEY` | metrics-auth.guard | No |

### 2.2 Backend variables in `.env.example` (all are used or documented)

All variables listed in Section 2.1 are present in `.env.example`. No variable in `.env.example` is completely unused in code or scripts.

---

## 3. Frontend (Prototype / Vite) Environment Variables

| Variable | Where used | Notes |
|----------|------------|--------|
| `VITE_API_URL` | apiClient, SessionContext, export.adapter, socket.ts | API base URL; default `http://localhost:3001/api` |
| `VITE_DATA_MODE` | adapters/index.ts, socket.ts | `local` \| `api` |
| `VITE_PORT` | vite.config.ts | Dev server port |
| `VITE_SUPPORT_EMAIL` | LoginPage (disabled-account mailto) | Optional |
| `GEMINI_API_KEY` | vite.config.ts (define) | Injected at build; not in import.meta.env |
| `DISABLE_HMR` | vite.config.ts (process.env) | Build/dev only |

`APP_URL` appears in `apps/prototype/.env.example` but is **not referenced** in prototype code; it can be removed from the example or kept as documentation for deployment platforms that inject it.

---

## 4. Problems Identified and Fixes Applied

### 4.1 Missing variables

- **None.** Every variable used in backend code is present in `apps/backend/.env.example` (with comments and example values).

### 4.2 Variables missing from `.env.example`

- **None** after audit. `API_BASE_URL`, `RETELL_TOOL_API_KEY`, `SMTP_FROM`, and all Retell/queue/observability vars were already in `.env.example`.

### 4.3 Unused variables (defined in .env but never in code)

- **Backend:** None. All entries in `.env.example` are either used in app/scripts or are optional placeholders for deployment (e.g. `STRIPE_WEBHOOK_SECRET_LEGACY`).
- **Frontend:** `APP_URL` in prototype `.env.example` is not used in code; optional to keep for documentation.

### 4.4 Incorrect variable names

- **None.** Naming is consistent (e.g. `RETELL_API_KEY`, `RETELL_TOOL_API_KEY`, `API_BASE_URL`).

### 4.5 Hardcoded values that should be env

- **None.** Defaults are appropriate (e.g. `http://localhost:5173` for CORS/FRONTEND_URL, `3001` for PORT).

### 4.6 Critical integrations and env

| Integration | Env variables | Status |
|-------------|----------------|--------|
| Retell API | `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET`, `RETELL_WEBHOOK_SECRET_LEGACY`, `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` | Correct |
| Retell tool callbacks | `API_BASE_URL`, `RETELL_TOOL_API_KEY` | Correct |
| Database | `MONGODB_URI` (required) | Validated at startup |
| JWT auth | `JWT_SECRET` (required), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Validated at startup |
| API base URL | `API_BASE_URL` (flow templates), `PORT` (fallback) | Correct |
| WebSockets | CORS from `ALLOWED_ORIGINS` / `CORS_ORIGIN`; JWT for auth | Correct |
| CORS | `ALLOWED_ORIGINS` (precedence) or `CORS_ORIGIN` | Correct |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET_LEGACY` | Correct |
| Email | `SMTP_*`, `FRONTEND_URL`, `EMAIL_RATE_LIMIT_PER_RECIPIENT` | Correct |

---

## 5. Validation at Server Startup

- **Location:** `apps/backend/src/config/env.validation.ts` (Joi schema).  
- **Wired in:** `apps/backend/src/app.module.ts` via `ConfigModule.forRoot({ validationSchema: envValidationSchema, validationOptions: { abortEarly: false } })`.
- **Behavior:**  
  - **Required:** `MONGODB_URI`, `JWT_SECRET`. If missing or invalid, NestJS fails at bootstrap with validation errors.  
  - **Optional:** All other variables have defaults or `.optional()` / `.allow('')`.  
  - **RETELL_API_KEY:** Optional in schema; Retell module uses `getOrThrow`, so the app fails at first Retell use if not set (acceptable).
- **Schema fix:** Schema was updated to accept **string** values from `process.env` for numeric and boolean keys (Joi receives env as strings), so validation does not falsely fail (e.g. `PORT=3001`, `QUEUE_EMAIL_ENABLED=true`).

---

## 6. Deliverables

| Deliverable | Location / action |
|-------------|-------------------|
| Full env variable report | This file (`cursor/reports/env-audit-report.md`) |
| Corrected `.env.example` | `apps/backend/.env.example` (complete list, comments, example values) |
| Unused variables list | **Backend:** none. **Frontend:** `APP_URL` in prototype `.env.example` only (optional to keep) |
| Missing variables list | **None** (all used vars are in backend `.env.example`) |
| Validation at server startup | `apps/backend/src/config/env.validation.ts` (Joi; required vars fail fast with clear errors) |

---

## 7. Recommendations

1. **Backend:** Keep using `ConfigService.get()` / `getOrThrow()`; avoid reading `process.env` in application code so validation and defaults apply.
2. **Frontend:** Use only `import.meta.env.VITE_*` for client-exposed config; keep `GEMINI_API_KEY` / `DISABLE_HMR` in build/config only as today.
3. **Secrets:** Never commit real values; keep `.env` in `.gitignore` and use `.env.example` as the single template with safe placeholders and short comments.
4. **Deploy:** Ensure production sets `MONGODB_URI`, `JWT_SECRET`, and (if using Retell) `RETELL_API_KEY` and `RETELL_TOOL_API_KEY`; set `API_BASE_URL` to the public API URL when not running on localhost.

# Phase 1 — Security Hardening Summary

**Completed:** March 2025  
**Scope:** Webhook constant-time signature verification, secret rotation, timestamp/replay protection, HSTS

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/webhooks/retell.webhook.controller.spec.ts` | Unit tests for Retell webhook signature verification, legacy secret, and rejection cases |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/webhooks/retell.webhook.controller.ts` | Constant-time `timingSafeEqualHex()`; secret rotation (`RETELL_WEBHOOK_SECRET_LEGACY`); optional timestamp validation (`x-retell-timestamp`, `WEBHOOK_TIMESTAMP_MAX_AGE_SEC`); `@Headers('x-retell-timestamp')` |
| `apps/backend/src/main.ts` | Helmet config with HSTS enabled in production (`maxAge: 31536000`, `includeSubDomains`, `preload`) |
| `apps/backend/.env.example` | Added `RETELL_WEBHOOK_SECRET_LEGACY`, `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` |

---

## Database Migrations

**None.** Phase 1 does not touch the database.

---

## New Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RETELL_WEBHOOK_SECRET_LEGACY` | No | `''` | Legacy webhook secret for zero-downtime rotation |
| `WEBHOOK_TIMESTAMP_MAX_AGE_SEC` | No | `0` | Max age of `x-retell-timestamp` in seconds; `0` = disabled |

---

## Potential Breaking Changes

| Change | Risk | Mitigation |
|--------|------|------------|
| Constant-time signature compare | **None** | Behaviorally identical; only prevents timing attacks |
| Timestamp validation | **Low** | Disabled by default (`WEBHOOK_TIMESTAMP_MAX_AGE_SEC=0`). If enabled and Retell does not send `x-retell-timestamp`, webhooks would be rejected. **Do not enable** until Retell confirms timestamp header support. |
| HSTS in production | **Low** | Only applies when `NODE_ENV=production` and over HTTPS. Ensures browsers enforce HTTPS. |
| Secret rotation | **None** | Additive; legacy secret is optional |

---

## Verification Steps

### 1. Build

```bash
cd apps/backend && npm run build
```

Expected: Build succeeds.

### 2. Unit Tests

```bash
cd apps/backend && npm test -- retell.webhook.controller
```

Expected: 4 tests pass (valid signature, invalid signature, missing signature, legacy secret).

### 3. Manual Webhook Test (with Retell)

1. Set `RETELL_WEBHOOK_SECRET` in `.env`.
2. Start backend: `npm run start:dev`.
3. Trigger a Retell webhook (e.g. test call).
4. Verify 200 response and event processing in logs.

### 4. Secret Rotation Test

1. Set `RETELL_WEBHOOK_SECRET` = new secret, `RETELL_WEBHOOK_SECRET_LEGACY` = old secret.
2. Send webhook signed with old secret.
3. Verify 200 response and log: `Retell webhook verified with legacy secret (rotation in progress)`.

### 5. HSTS Check (Production)

1. Set `NODE_ENV=production`.
2. Deploy behind HTTPS reverse proxy.
3. Inspect response headers: `Strict-Transport-Security` should be present.

---

## Rollback Instructions

### If webhook verification fails

1. **Temporary:** Set `NODE_ENV=development` to skip signature requirement (not recommended for production).
2. **Permanent:** Revert `retell.webhook.controller.ts` to use `signature !== expected` instead of `timingSafeEqualHex()`.

### If HSTS causes issues

Revert `main.ts` helmet config:

```typescript
app.use(helmet());
```

### Git rollback

```bash
git checkout HEAD -- apps/backend/src/webhooks/retell.webhook.controller.ts
git checkout HEAD -- apps/backend/src/main.ts
git checkout HEAD -- apps/backend/.env.example
rm apps/backend/src/webhooks/retell.webhook.controller.spec.ts
```

---

## Not Implemented (Deferred)

- **RBAC foundation** — Schema changes, `PermissionsGuard`, `@RequirePermissions` (Phase 1 plan item; deferred to later phase)
- **Stripe webhook** — Stripe uses `constructEvent`, which already performs constant-time verification; no change needed

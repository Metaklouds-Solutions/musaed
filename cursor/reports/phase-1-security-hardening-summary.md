# Phase 1 — Security Hardening Summary

## Overview

Eliminates timing attacks on webhook verification, adds replay protection, secret rotation support, CORS allowlist, RBAC foundation, and security headers.

---

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/common/constants/permissions.ts` | Permission enum and role-to-permissions mapping |
| `apps/backend/src/common/decorators/require-permissions.decorator.ts` | `@RequirePermissions(...)` decorator |
| `apps/backend/src/common/guards/permissions.guard.ts` | Guard that checks user permissions |

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/main.ts` | CORS: `ALLOWED_ORIGINS` takes precedence over `CORS_ORIGIN` |
| `apps/backend/src/webhooks/stripe.webhook.controller.ts` | `STRIPE_WEBHOOK_SECRET_LEGACY` for zero-downtime rotation |
| `apps/backend/src/auth/auth.service.ts` | `getPermissionsForUser()` for role-based permissions |
| `apps/backend/src/auth/strategies/jwt.strategy.ts` | Adds `permissions` to user object |
| `apps/backend/src/common/interfaces/authenticated-request.interface.ts` | Added `permissions?: string[]` to AuthenticatedUser |
| `apps/backend/src/bookings/bookings.controller.ts` | Example: `PermissionsGuard` + `@RequirePermissions` |
| `apps/backend/src/bookings/bookings.module.ts` | Added `PermissionsGuard` provider |
| `apps/backend/.env.example` | `ALLOWED_ORIGINS`, `STRIPE_WEBHOOK_SECRET_LEGACY` |

---

## Already Implemented (Retell)

- Constant-time signature comparison (`timingSafeEqualHex`)
- Timestamp validation (`WEBHOOK_TIMESTAMP_MAX_AGE_SEC`)
- Secret rotation (`RETELL_WEBHOOK_SECRET_LEGACY`)
- Helm with HSTS in production

---

## New Logic

### 1. CORS

- `ALLOWED_ORIGINS` (comma-separated) takes precedence over `CORS_ORIGIN`
- Both support multiple origins

### 2. Stripe Secret Rotation

- `STRIPE_WEBHOOK_SECRET_LEGACY` for zero-downtime rotation
- Tries primary secret first; on failure, retries with legacy
- Logs when legacy secret is used

### 3. RBAC Foundation

- **Permissions**: `calls:read`, `bookings:write`, etc. (see `permissions.ts`)
- **Role mapping**: `tenant_owner`, `clinic_admin`, `receptionist`, etc. → permission sets
- **PermissionsGuard**: Checks `@RequirePermissions(...)` against `request.user.permissions`
- **JWT payload**: `permissions` added from role mapping
- **Admin**: Bypasses permission checks (all access)

### 4. Example Usage

- Bookings controller: `@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)`
- `@RequirePermissions(PERMISSIONS.BOOKINGS_READ)` at class level
- `@RequirePermissions(PERMISSIONS.BOOKINGS_WRITE)` on POST and PATCH

---

## Environment Variables Added

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (takes precedence over CORS_ORIGIN) |
| `STRIPE_WEBHOOK_SECRET_LEGACY` | Legacy Stripe webhook secret for rotation |

---

## Verification Steps

1. **Build and test**
   ```bash
   cd apps/backend && npm run build && npm test
   ```

2. **CORS**
   - Set `ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`
   - Verify only those origins are accepted

3. **Stripe rotation**
   - Set `STRIPE_WEBHOOK_SECRET_LEGACY` to old secret
   - Rotate primary secret; verify webhooks still work

4. **RBAC**
   - Bookings API requires `bookings:read` (and `bookings:write` for create/update)
   - Tenant staff with `receptionist` role have these permissions

---

## Rollback Instructions

1. Revert `bookings.controller.ts` and `bookings.module.ts` (remove PermissionsGuard)
2. Revert `auth.service.ts`, `jwt.strategy.ts`, `authenticated-request.interface.ts`
3. Remove `permissions.ts`, `require-permissions.decorator.ts`, `permissions.guard.ts`
4. Revert `stripe.webhook.controller.ts` (remove legacy secret)
5. Revert `main.ts` (remove ALLOWED_ORIGINS)
6. Revert `.env.example`

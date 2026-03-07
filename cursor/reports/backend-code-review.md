# NestJS Backend — Full Code Review Report

**Date**: 2026-03-08  
**Scope**: `apps/backend/src/` — 81 TypeScript files across 19 modules  
**Severity levels**: CRITICAL / HIGH / MEDIUM / LOW

---

## EXECUTIVE SUMMARY

The backend has solid architectural bones (multi-tenant, proper module separation, guards), but has **3 CRITICAL blockers** that must be fixed before any testing or deployment:

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **No global `ValidationPipe`** — ALL DTO validation is silently disabled | CRITICAL | Any payload accepted; injection/corruption possible |
| 2 | **No CORS configuration** — frontend cannot call the API | CRITICAL | 100% of frontend requests blocked by browser |
| 3 | **`TenantGuard` reads `tenantId` from `req.user`, but JWT strategy returns only the DB user doc (which has no `tenantId`)** | CRITICAL | ALL tenant-scoped endpoints throw 403 for every non-admin user |

Beyond these, there are ~40 additional issues ranging from HIGH to LOW severity.

---

## 1. `src/main.ts`

| Line | Issue | Severity |
|------|-------|----------|
| — | **No `app.enableCors()`** — browser blocks all cross-origin requests from the frontend | CRITICAL |
| — | **No `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`** — every `@IsString()`, `@IsEmail()`, `@IsMongoId()` etc. across ALL DTOs is completely ignored | CRITICAL |
| — | **No `app.setGlobalPrefix('api')`** — if frontend expects `/api/*` routes, they will 404 | MEDIUM |
| 6+8 | `rawBody: true` in `NestFactory.create` AND `express.raw()` on the same route are redundant — pick one approach | LOW |
| — | No Helmet (`app.use(helmet())`) for security headers | MEDIUM |
| — | No global exception filter for structured error responses | MEDIUM |
| — | No request logging middleware (Morgan / built-in Logger middleware) | LOW |
| — | No rate-limiting middleware (`@nestjs/throttler`) | HIGH |

**Recommended fix for main.ts:**
```typescript
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
```

---

## 2. `src/app.module.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 25 | `MongooseModule.forRoot(process.env.MONGODB_URI)` reads env directly instead of using `MongooseModule.forRootAsync({ useFactory: (config) => ... , inject: [ConfigService] })` — fragile ordering with `ConfigModule` | MEDIUM |
| 25 | Hardcoded fallback `mongodb://localhost:27017/musaed` silently used if env var missing — should throw in production | MEDIUM |
| — | No `ThrottlerModule` imported for rate limiting | HIGH |

---

## 3. Auth Module — `src/auth/`

### `auth.module.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 18 | `JwtModule.register({ secret: process.env.JWT_SECRET ?? 'default-dev-secret' })` — hardcoded fallback secret in production is a catastrophic vulnerability. Should use `JwtModule.registerAsync` with `ConfigService` and throw if secret is missing | HIGH |
| 18 | Same `process.env` direct access race condition as MongooseModule | MEDIUM |

### `auth.controller.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 28 | `@Get('me')` — `req.user` is typed as `any`; should use a proper request interface | LOW |
| — | No rate limiting on `@Post('login')` — brute-force vulnerable | HIGH |
| — | No rate limiting on `@Post('refresh')` | MEDIUM |

### `auth.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 26 | **`refreshTokens` stored in an in-memory `Map`** — lost on restart, cannot scale across multiple instances. Must use MongoDB or Redis | HIGH |
| 4 | `ConflictException` imported but never used — dead import | LOW |
| 67-68 | Access token and refresh token are both signed JWTs with the same secret/structure — a refresh token could be used as an access token (no `type` claim to differentiate) | HIGH |
| 68 | Refresh token is both a verifiable JWT AND stored in memory — contradictory design. Choose one: opaque + stored, OR JWT + stateless | MEDIUM |
| — | No `bcrypt` salt rounds extracted to config — hardcoded `10` | LOW |

### `strategies/jwt.strategy.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 12 | **Hardcoded `'default-dev-secret'`** — MUST match the secret in `auth.module.ts`. If either reads env differently, tokens won't verify | HIGH |
| 12 | Uses `process.env.JWT_SECRET` directly instead of `ConfigService` | MEDIUM |
| 16-17 | **`validate()` returns `authService.validateUser(payload)` which returns only the User document from MongoDB. The JWT payload fields `tenantId` and `tenantRole` are DISCARDED.** This is the root cause of the TenantGuard bug | CRITICAL |

**Fix:** The `validate` method must merge JWT claims into the returned object:
```typescript
async validate(payload: JwtPayload) {
  const user = await this.authService.validateUser(payload);
  return {
    ...user.toObject(),
    tenantId: payload.tenantId,
    tenantRole: payload.tenantRole,
  };
}
```

### `guards/jwt-auth.guard.ts`
- Correct, no issues.

### `dto/login.dto.ts`
- Correct validators — but only enforced if ValidationPipe is added (see main.ts).

### `dto/refresh.dto.ts`
- Correct, no issues.

---

## 4. Common Guards — `src/common/guards/`

### `admin.guard.ts`

| Line | Issue | Severity |
|------|-------|----------|
| — | Must always be used AFTER `JwtAuthGuard` (depends on `request.user`). This ordering dependency is not enforced or documented | LOW |
| 9 | Checks `user.role !== 'ADMIN'` — correct but relies on DB user having `role` field | LOW |

### `tenant.guard.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 13 | **`user?.tenantId` is always `undefined`** because `JwtStrategy.validate()` returns the DB User document which does NOT have a `tenantId` field. **Every non-admin user gets 403 on every tenant endpoint** | CRITICAL |
| 18 | `request.tenantId = tenantId` — sets tenantId on the request but doesn't set it for ADMIN users. Admin users pass through without `request.tenantId` being set, so `req.tenantId` is `undefined` for admins on tenant routes | HIGH |

---

## 5. Users Module — `src/users/`

### `users.module.ts`
- Only exports `MongooseModule` (schema). No service, no controller. Correct for a shared schema module.

### `schemas/user.schema.ts`

| Line | Issue | Severity |
|------|-------|----------|
| — | No index on `role` field — admin queries by role would be slow | LOW |
| — | `passwordHash` field is never excluded in schema-level `toJSON` transform — password hashes could leak in API responses | HIGH |
| — | Missing `@Prop({ lowercase: true })` or a pre-save hook on `email` for case normalization | MEDIUM |

**Fix:** Add a `toJSON` transform to strip `passwordHash`:
```typescript
@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_, ret) => { delete ret.passwordHash; return ret; },
  },
})
```

---

## 6. Tenants Module — `src/tenants/`

### `tenants.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 57 | **Hardcoded password `'ChangeMe123!'`** for new tenant owners — no email notification, no forced reset. Owner won't know their credentials | HIGH |
| 89 | `update()` passes `$set: dto` directly — without ValidationPipe, any arbitrary field (including `status`, `ownerId`, `stripeCustomerId`) can be overwritten | CRITICAL (when combined with missing ValidationPipe) |
| 52 | `findOne({ slug: dto.slug })` — doesn't filter out soft-deleted tenants, so a deleted tenant's slug blocks reuse | MEDIUM |

### `dto/create-tenant.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 8 | `slug` has no format validation — spaces, uppercase, special chars accepted. Should use `@Matches(/^[a-z0-9-]+$/)` | MEDIUM |
| — | No `@MinLength()` on `name` or `slug` | LOW |

### `dto/update-tenant.dto.ts`
- Reasonable. `settings` uses `@IsObject()` — shallow validation only.

### `schemas/tenant.schema.ts`
- Well indexed. Good structure.

### `schemas/tenant-staff.schema.ts`
- Good compound unique index on `userId + tenantId`. Correct.

---

## 7. Staff Module — `src/staff/`

### `staff.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 31 | **Same hardcoded password `'ChangeMe123!'`** for invited staff | HIGH |
| — | No email/notification to invited staff — they can't know their password | HIGH |

### `dto/invite-staff.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 10 | `roleSlug` accepts any string — should use `@IsIn(['clinic_admin', 'receptionist', 'doctor', 'auditor', 'tenant_staff'])` to match the schema enum | HIGH |
| 1 | `IsOptional` imported but never used | LOW |

### `dto/update-staff.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 9 | `status` accepts any string — should use `@IsIn(['active', 'invited', 'disabled'])` | HIGH |
| 6 | `roleSlug` accepts any string — same issue as invite DTO | HIGH |

---

## 8. Agent Templates — `src/agent-templates/`

### `templates.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 54-55 | `remove()` uses `findByIdAndDelete()` — hard delete with no audit trail. Should soft-delete | MEDIUM |
| — | No version incrementing logic despite `version` field on schema | LOW |

### `dto/create-template.dto.ts` / `dto/update-template.dto.ts`
- Could use `PartialType(CreateTemplateDto)` for update to reduce duplication | LOW |

### `schemas/agent-template.schema.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 47-48 | `version` defaults to 1 but is never incremented anywhere in the codebase | LOW |
| — | No `name` index for search/lookup | LOW |

---

## 9. Agent Instances — `src/agent-instances/`

### `agents.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 75 | `syncAgent()` is a TODO stub — Retell API call not implemented | MEDIUM |
| 52-56 | `findByTenantId()` exists but is never called from any controller — dead code | LOW |

### `agents.controller.ts`
- Good dual-controller pattern (tenant + admin). Proper guards applied.

### `schemas/agent-instance.schema.ts`
- Well structured with proper indexes.

---

## 10. Billing Module — `src/billing/`

### `billing.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 49-66 | `getOverview()` loads ALL active tenants into memory to count by plan — should use MongoDB aggregation pipeline for scalability | HIGH |
| 21-23 | `getPlans()` method exists but is NOT exposed via any controller route (only `getAllPlans` is) | LOW |

### `dto/create-plan.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 14 | `monthlyPriceCents` has `@IsNumber()` but no `@Min(0)` — negative prices accepted | MEDIUM |
| 17-26 | `maxVoiceAgents`, `maxChatAgents`, `maxEmailAgents`, `maxStaff` have no `@Min(-1)` or `@Min(0)` validation | MEDIUM |

### `dto/update-plan.dto.ts`
- Same missing `@Min()` validations | MEDIUM |

---

## 11. Customers Module — `src/customers/`

### `customers.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 26-30 | **`$regex` with raw user input** — ReDoS vulnerability. Must escape regex special characters: `search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` | HIGH |
| — | No `@Patch` update endpoint — customers can only be created and soft-deleted, never updated | MEDIUM |

### `dto/create-customer.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 16-21 | Both `email` and `phone` are optional — a customer can be created with no contact info at all | MEDIUM |

### `schemas/customer.schema.ts`
- Good indexes. Correct structure.

---

## 12. Bookings Module — `src/bookings/`

### `bookings.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 40-43 | **`create()` does not validate that `customerId` belongs to the same tenant** — a tenant can book appointments for another tenant's customer (IDOR) | HIGH |
| — | No double-booking prevention (same provider + date + timeSlot) | HIGH |
| 57-65 | When booking status changes to `'cancelled'`, `totalBookings` on customer is not decremented | MEDIUM |
| 22 | `filter.date = new Date(date)` — exact date match fails for datetime values. Should use date range (`$gte/$lt` for the day) | HIGH |

### `dto/create-booking.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 29 | `timeSlot` is `@IsString()` with no format validation (e.g., `HH:mm`) | LOW |
| 20-21 | `locationId` is `@IsString()` — should probably be `@IsMongoId()` | LOW |

### `schemas/booking.schema.ts`
- `providerId` refs `'TenantStaff'` — correct. Indexes present.

---

## 13. Support Module — `src/support/`

### `support.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 14-19 | `findAllForTenant()` has **no pagination** — could return thousands of tickets | HIGH |
| 83 | `addMessage()` always sets `status: 'in_progress'` — reopens resolved/closed tickets without explicit intent | MEDIUM |
| — | Admin controller has no `addMessage` endpoint — admins can view tickets but cannot respond | MEDIUM |

### `dto/create-ticket.dto.ts`
- Correct validators.

### `dto/add-message.dto.ts`
- Minimal, correct.

### `schemas/support-ticket.schema.ts`
- Correct with proper indexes.

---

## 14. Dashboard Module — `src/dashboard/`

### `dashboard.service.ts`
- Well structured with proper aggregation using `countDocuments`.
- No major issues beyond the global TenantGuard bug affecting it.

---

## 15. Reports Module — `src/reports/`

### `reports.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 24 | **`this.bookingModel.find(filter)` loads ALL matching bookings into memory** to count by status/serviceType in JS. Should use `aggregate()` pipeline with `$group` | HIGH |
| — | No pagination, no result limiting — unbounded data fetching | HIGH |

---

## 16. Admin Module — `src/admin/`

### `admin.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 51-56 | `getSystemHealth()` exposes `process.memoryUsage()` — information disclosure in production | MEDIUM |

### `admin.controller.ts`
- Proper guards (`JwtAuthGuard`, `AdminGuard`). Correct.

---

## 17. Settings Module — `src/settings/`

### `settings.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 30-35 | Uses truthiness check (`if (dto.timezone)`) — setting a field to empty string `""` or boolean `false` would be silently ignored. Should use `dto.timezone !== undefined` | MEDIUM |

### `dto/update-settings.dto.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 17 | `locations` field is `Record<string, unknown>[]` but has no `@IsArray()` decorator — will accept any type | MEDIUM |

---

## 18. Webhooks Module — `src/webhooks/`

### `stripe.webhook.controller.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 20 | `Stripe` initialized with `process.env.STRIPE_SECRET_KEY ?? ''` — empty string creates a broken Stripe client silently | MEDIUM |
| 21 | `apiVersion: '2025-02-24.acacia'` is hardcoded — should match the Stripe SDK version | LOW |
| 44 | `err.message` — TypeScript strict mode types `err` as `unknown`; needs type assertion | LOW |
| — | No idempotency handling — duplicate events are processed twice | MEDIUM |

### `retell.webhook.controller.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 18 | **No signature verification** — anyone can POST fake Retell events | HIGH |
| 18 | `@Body() body: any` — no DTO validation whatsoever | MEDIUM |

### `webhooks.service.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 63-79 | Retell handlers are stubs (logging only) — acceptable as TODO | LOW |
| 26-28 | `handleInvoicePaid` only reactivates if `SUSPENDED` — doesn't handle `TRIAL` → `ACTIVE` transition | MEDIUM |

---

## 19. Health Module — `src/health/`

### `health.controller.ts`

| Line | Issue | Severity |
|------|-------|----------|
| — | No actual health checks (DB connectivity, memory thresholds). Should use `@nestjs/terminus` | MEDIUM |

---

## 20. Seed Script — `src/db/seed.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 100 | Prints admin password `'Admin123!'` to stdout | MEDIUM |
| 93 | Weak admin seed password `'Admin123!'` — should be read from env or generated randomly | MEDIUM |
| — | No way to re-seed or update existing data (only inserts if count is 0) | LOW |

---

## 21. Subscription Plans — `src/subscription-plans/`

### `subscription-plan.schema.ts`

| Line | Issue | Severity |
|------|-------|----------|
| — | No index on `name` or `isActive` — queries by these fields will be slow at scale | LOW |
| — | No `unique` index on `name` — duplicate plan names possible | LOW |

---

## CROSS-CUTTING ISSUES

| # | Issue | Severity | Files Affected |
|---|-------|----------|----------------|
| 1 | **No ValidationPipe** — ALL DTO validation is dead code | CRITICAL | main.ts + all DTOs |
| 2 | **No CORS** — frontend blocked | CRITICAL | main.ts |
| 3 | **TenantGuard bug** — tenantId lost in JWT strategy | CRITICAL | jwt.strategy.ts, tenant.guard.ts, 8+ controllers |
| 4 | In-memory refresh tokens — lost on restart, no horizontal scaling | HIGH | auth.service.ts |
| 5 | Hardcoded passwords `'ChangeMe123!'` in 2 places, no notification | HIGH | tenants.service.ts, staff.service.ts |
| 6 | No rate limiting on any endpoint | HIGH | main.ts |
| 7 | Regex injection (ReDoS) in customer search | HIGH | customers.service.ts |
| 8 | Booking IDOR — can book for other tenant's customers | HIGH | bookings.service.ts |
| 9 | JWT secret insecure fallback `'default-dev-secret'` | HIGH | auth.module.ts, jwt.strategy.ts |
| 10 | `passwordHash` can leak in API responses (no toJSON transform) | HIGH | user.schema.ts |
| 11 | Reports loads ALL bookings into memory | HIGH | reports.service.ts |
| 12 | Support tickets no pagination for tenant endpoint | HIGH | support.service.ts |
| 13 | DTO enum values not validated (roleSlug, status fields accept any string) | HIGH | invite-staff.dto, update-staff.dto |
| 14 | No Helmet security headers | MEDIUM | main.ts |
| 15 | No global exception filter | MEDIUM | main.ts |
| 16 | Admin user tenantId is undefined on tenant routes | HIGH | tenant.guard.ts |

---

## PRIORITY FIX ORDER

### Immediate (blocks ALL functionality):
1. Add `ValidationPipe` to `main.ts`
2. Add `app.enableCors()` to `main.ts`
3. Fix `JwtStrategy.validate()` to preserve `tenantId`/`tenantRole` from JWT payload
4. Fix `TenantGuard` to set `request.tenantId` for admin users too (or handle admin separately in controllers)

### Before testing:
5. Add `toJSON` transform to User schema to strip `passwordHash`
6. Add `@IsIn()` validators to all enum DTO fields
7. Fix customer search regex injection
8. Validate booking `customerId` belongs to same tenant

### Before staging/production:
9. Move refresh tokens to MongoDB/Redis
10. Add rate limiting (`@nestjs/throttler`)
11. Add Helmet
12. Use `ConfigService` for all `process.env` reads
13. Replace hardcoded passwords with secure random generation + email flow
14. Add JWT `type` claim to differentiate access vs refresh tokens
15. Refactor reports/billing overview to use aggregation pipelines
16. Add pagination to `support.findAllForTenant()`
17. Add Retell webhook signature verification
18. Add `@nestjs/terminus` for health checks

---

## FILE-LEVEL ISSUE COUNT

| File | Issues |
|------|--------|
| `main.ts` | 8 |
| `app.module.ts` | 3 |
| `auth/auth.module.ts` | 2 |
| `auth/auth.controller.ts` | 3 |
| `auth/auth.service.ts` | 5 |
| `auth/strategies/jwt.strategy.ts` | 3 |
| `auth/guards/jwt-auth.guard.ts` | 0 |
| `auth/dto/login.dto.ts` | 0 |
| `auth/dto/refresh.dto.ts` | 0 |
| `common/guards/admin.guard.ts` | 1 |
| `common/guards/tenant.guard.ts` | 2 |
| `users/users.module.ts` | 0 |
| `users/schemas/user.schema.ts` | 3 |
| `tenants/tenants.module.ts` | 0 |
| `tenants/tenants.controller.ts` | 0 |
| `tenants/tenants.service.ts` | 3 |
| `tenants/dto/create-tenant.dto.ts` | 2 |
| `tenants/dto/update-tenant.dto.ts` | 0 |
| `tenants/schemas/tenant.schema.ts` | 0 |
| `tenants/schemas/tenant-staff.schema.ts` | 0 |
| `staff/staff.module.ts` | 0 |
| `staff/staff.controller.ts` | 0 |
| `staff/staff.service.ts` | 2 |
| `staff/dto/invite-staff.dto.ts` | 2 |
| `staff/dto/update-staff.dto.ts` | 2 |
| `agent-templates/agent-templates.module.ts` | 0 |
| `agent-templates/templates.controller.ts` | 0 |
| `agent-templates/templates.service.ts` | 1 |
| `agent-templates/dto/create-template.dto.ts` | 0 |
| `agent-templates/dto/update-template.dto.ts` | 0 |
| `agent-templates/schemas/agent-template.schema.ts` | 2 |
| `agent-instances/agent-instances.module.ts` | 0 |
| `agent-instances/agents.controller.ts` | 0 |
| `agent-instances/agents.service.ts` | 2 |
| `agent-instances/dto/update-prompts.dto.ts` | 0 |
| `agent-instances/schemas/agent-instance.schema.ts` | 0 |
| `billing/billing.module.ts` | 0 |
| `billing/billing.controller.ts` | 0 |
| `billing/billing.service.ts` | 2 |
| `billing/dto/create-plan.dto.ts` | 2 |
| `billing/dto/update-plan.dto.ts` | 2 |
| `customers/customers.module.ts` | 0 |
| `customers/customers.controller.ts` | 0 |
| `customers/customers.service.ts` | 2 |
| `customers/dto/create-customer.dto.ts` | 1 |
| `customers/schemas/customer.schema.ts` | 0 |
| `bookings/bookings.module.ts` | 0 |
| `bookings/bookings.controller.ts` | 0 |
| `bookings/bookings.service.ts` | 4 |
| `bookings/dto/create-booking.dto.ts` | 2 |
| `bookings/dto/update-booking.dto.ts` | 0 |
| `bookings/schemas/booking.schema.ts` | 0 |
| `support/support.module.ts` | 0 |
| `support/support.controller.ts` | 0 |
| `support/support.service.ts` | 3 |
| `support/dto/create-ticket.dto.ts` | 0 |
| `support/dto/add-message.dto.ts` | 0 |
| `support/schemas/support-ticket.schema.ts` | 0 |
| `dashboard/dashboard.module.ts` | 0 |
| `dashboard/dashboard.controller.ts` | 0 |
| `dashboard/dashboard.service.ts` | 0 |
| `reports/reports.module.ts` | 0 |
| `reports/reports.controller.ts` | 0 |
| `reports/reports.service.ts` | 2 |
| `admin/admin.module.ts` | 0 |
| `admin/admin.controller.ts` | 0 |
| `admin/admin.service.ts` | 1 |
| `settings/settings.module.ts` | 0 |
| `settings/settings.controller.ts` | 0 |
| `settings/settings.service.ts` | 1 |
| `settings/dto/update-settings.dto.ts` | 1 |
| `webhooks/webhooks.module.ts` | 0 |
| `webhooks/stripe.webhook.controller.ts` | 4 |
| `webhooks/retell.webhook.controller.ts` | 2 |
| `webhooks/webhooks.service.ts` | 2 |
| `health/health.module.ts` | 0 |
| `health/health.controller.ts` | 1 |
| `db/seed.ts` | 3 |
| `subscription-plans/subscription-plans.module.ts` | 0 |
| `subscription-plans/schemas/subscription-plan.schema.ts` | 2 |

**Total: ~70 issues (3 CRITICAL, ~18 HIGH, ~30 MEDIUM, ~19 LOW)**

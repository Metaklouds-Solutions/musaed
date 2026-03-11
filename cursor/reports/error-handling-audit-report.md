# Error Handling Audit Report — Backend Services & Controllers

**Date:** 2026-03-11  
**Scope:** `apps/backend/src/**/*.service.ts` and `apps/backend/src/**/*.controller.ts`

---

## Executive Summary

Audited **15 service files** and **16 controller files** across the backend. Overall the codebase has a solid foundation — most services throw proper NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, etc.) and controllers use guards correctly. However, there are several categories of issues that need attention before production traffic at scale.

**Critical issues:** 7  
**High issues:** 12  
**Medium issues:** 15  
**Low / Informational:** 8  

---

## CRITICAL Issues

### C-1. Missing try/catch around Retell API calls in `agents.service.ts`

**File:** `src/agent-instances/agents.service.ts`  
**Lines:** 284–313 (`startConversationForTenant`)

The `retellClient.createWebCall()` and `retellClient.createChat()` calls have **no try/catch**. If Retell returns a network error, a 500 (or worse, a Retell-specific error object) leaks directly to the tenant.

```
FIX: Wrap in try/catch, throw an InternalServerErrorException or
     UnprocessableEntityException with a user-friendly message.
     Log the original Retell error with context.
```

**Lines:** 318–319 (`getChat`)  
Same issue — `retellClient.getChat(chatId)` has no error handling. A Retell 404 would propagate as a raw error.

**Lines:** 331–332 (`sendChatMessage`)  
Same — `retellClient.createChatCompletion()` has no try/catch.

---

### C-2. Missing try/catch around Retell API in `calls.service.ts`

**File:** `src/calls/calls.service.ts`  
**Lines:** 162–169 (`createWebCall`)

`retellClient.createWebCall()` has no error wrapping. Retell errors propagate raw.

**Lines:** 244–253 (`getRetellCallForTenant`)  
`retellClient.getCall()` has no try/catch. If Retell is down, internal server error leaks.

---

### C-3. `as any` type cast on `configSnapshot` in `agents.service.ts`

**File:** `src/agent-instances/agents.service.ts`  
**Lines:** 118, 142

```typescript
instance.configSnapshot = { ...instance.configSnapshot, ...retellData } as any;
```

Violates the project's "no `any`" rule. If Retell returns unexpected shapes, this silently corrupts the document with no validation.

```
FIX: Create a proper type for configSnapshot. Use a type guard or
     Zod schema to validate retellData before merging.
```

---

### C-4. `as any` on `transcriptObject` in `calls.service.ts`

**File:** `src/calls/calls.service.ts`  
**Line:** 343

```typescript
transcriptObject: callData.transcript_object ? (callData.transcript_object as any) : undefined,
```

Violates "no `any`" rule. Arbitrary external data stored without validation.

```
FIX: Define a TranscriptObject interface and validate the shape,
     or use the existing isTranscriptObject() guard from line 268.
```

---

### C-5. Non-null assertion operator (`!`) used pervasively in controllers

**Files (all controllers):**  
- `bookings.controller.ts` line 38: `req.tenantId!`
- `support.controller.ts` line 33: `req.tenantId!`
- `dashboard.controller.ts` lines 15, 24, 33, 42, 58: `req.tenantId!`
- `reports.controller.ts` lines 18, 26, 34, 44, 51, 58, 65: `req.tenantId!`
- `billing.controller.ts` line 52: `req.tenantId!`
- `staff.controller.ts` line 26: `req.tenantId!`
- `customers.controller.ts` lines 34, 42, 48, 54, 60, 66: `req.tenantId!`
- `agents.controller.ts` lines 36, 41, 50, 55, 60, 69, 76, 85, 95, 105: `req.tenantId!`

This violates the project's **"no `!` — you own the crash"** rule. If `TenantGuard` ever has a bug and doesn't set `tenantId`, every controller crashes with an unhandled undefined dereference instead of a proper 400 error.

```
FIX: Create a helper like the one in calls.controller.ts (requireTenantId)
     and use it in ALL tenant-scoped controllers. The calls controller 
     already does this correctly (lines 63-68) — replicate that pattern.
```

---

### C-6. `updateProfile` uses `any` for updateData

**File:** `src/auth/auth.service.ts`  
**Line:** 356

```typescript
const updateData: any = {};
```

Violates "no `any`" rule. Should be typed as `Partial<{ name: string; avatarUrl: string }>`.

---

### C-7. `verifyToken` uses `as any` cast

**File:** `src/auth/auth.service.ts`  
**Line:** 228

```typescript
const user = record.userId as any;
```

Should use a type guard or properly type the populated field.

---

## HIGH Issues

### H-1. Missing try/catch around database operations in `tenants.service.ts` `create()`

**File:** `src/tenants/tenants.service.ts`  
**Lines:** 69–189

The `create()` method performs ~10 database operations in sequence with no overall try/catch. If any intermediate step fails (e.g., `staffModel.create` on line 134 after `tenantModel.create` on line 125), the system is left in a partial state:
- Tenant created but no staff record
- Staff created but no invite sent
- Agent instance created but deployment not enqueued

```
FIX: Wrap in a try/catch. On failure, attempt to clean up the 
     partially created tenant, or use MongoDB transactions.
     At minimum, log the failure with all created entity IDs.
```

---

### H-2. Missing try/catch around email operations

**File:** `src/tenants/tenants.service.ts`  
**Line:** 145: `this.emailService.sendInviteEmail()`  
**File:** `src/auth/auth.service.ts`  
**Line:** 280: `this.emailService.sendPasswordResetEmail()`  
**File:** `src/staff/staff.service.ts`  
**Line:** 70: `this.emailService.sendInviteEmail()`

If the email service throws (SMTP failure, rate limit), the entire operation fails and the tenant/user/staff record has already been created. The caller gets a 500 error even though the primary action succeeded.

```
FIX: Wrap email sends in try/catch. Log the failure but don't 
     let it fail the parent operation. Return a flag indicating 
     the email could not be sent.
```

---

### H-3. Missing try/catch around notification operations

**File:** `src/tenants/tenants.service.ts`  
**Line:** 148: `this.notificationsService.createForAdmins()`  
**File:** `src/bookings/bookings.service.ts`  
**Line:** 98: `this.notificationsService.createForTenantStaff()`  
**File:** `src/support/support.service.ts`  
**Line:** 89: `this.notificationsService.createForTenantStaff()`  
**Line:** 126: `this.notificationsService.createForTenantStaff()`

Notification failures should not crash the parent operation. If the notification DB is down or WS gateway is broken, the booking/ticket creation should still succeed.

```
FIX: Wrap notification calls in try/catch with logging. 
     Notifications are non-critical side effects.
```

---

### H-4. `syncAllFromRetell` accesses model via `db.model()` anti-pattern

**File:** `src/calls/calls.service.ts`  
**Lines:** 318–325

```typescript
const agents = (await this.callSessionModel.db.model('AgentInstance').find({...})) as unknown as Array<...>;
```

This bypasses Mongoose injection, uses double `as unknown as` casts, and is fragile (string-based model name). Similar pattern on line 153 (`createWebCall`).

```
FIX: Inject AgentInstanceModel directly via constructor instead of 
     using callSessionModel.db.model(). Remove unsafe casts.
```

---

### H-5. Webhook handlers don't wrap DB operations in try/catch

**File:** `src/webhooks/webhooks.service.ts`  
**Lines:** 81–124 (`handleInvoicePaid`, `handleInvoiceFailed`, `handleSubscriptionDeleted`)

The Stripe webhook handlers call `tenant.save()` without try/catch. If the DB save fails, the error propagates back to the webhook controller, which returns a 500 to Stripe. Stripe will then retry, potentially causing duplicate processing.

```
FIX: Wrap in try/catch, log the error, and still return 200 to 
     Stripe. Mark the event for manual review.
```

---

### H-6. `markAllAsRead` and `markAsRead` return `void` instead of confirmation

**File:** `src/notifications/notifications.service.ts`  
**Lines:** 227–239

These methods call `updateOne`/`updateMany` but don't check `modifiedCount`. The caller has no way to know if anything was actually updated.

**File:** `src/notifications/notifications.controller.ts`  
**Lines:** 44–53

The controller methods `markAllAsRead` and `markAsRead` return `undefined` (void). They should return `{ message: 'ok' }` or `{ modifiedCount }` for a proper API response.

```
FIX: Return { message: 'Success' } or { modifiedCount } from 
     the service. The controller should return a response body.
```

---

### H-7. `delete` notification returns void

**File:** `src/notifications/notifications.controller.ts`  
**Line:** 56–59

`delete()` returns `void`. A DELETE endpoint should return `{ message: 'Deleted' }` or at minimum `204 No Content`.

```
FIX: Add @HttpCode(HttpStatus.NO_CONTENT) or return { message: 'Deleted' }.
```

---

### H-8. Missing error handling in `enrichFromRetell` data path

**File:** `src/calls/calls.service.ts`  
**Lines:** 211–242

While the method has a try/catch, the data extraction from `callData` (lines 216–229) does no validation of the `callData` shape beyond basic type checks. If Retell returns a malformed response (e.g., `start_timestamp` is a string), the method silently stores `undefined` for computed fields like `durationMs`.

```
FIX: Add explicit validation for date fields. Log a warning 
     when expected fields are missing or malformed.
```

---

### H-9. Missing `@HttpCode` annotations on POST endpoints that aren't 201

Several POST endpoints that perform actions (not resource creation) return 200 implicitly but NestJS defaults POST to 201. This means:

- `POST auth/login` — returns 201 (should be 200)
- `POST auth/refresh` — returns 201 (should be 200)
- `POST auth/logout` — returns 201 (should be 200)
- `POST auth/forgot-password` — returns 201 (should be 200)
- `POST auth/reset-password` — returns 201 (should be 200)
- `POST auth/change-password` — returns 201 (should be 200)
- `POST auth/setup-password` — returns 201 (should be 200)
- `POST tenant/agents/:id/sync` — returns 201 (should be 200)
- `POST admin/agents/:id/deploy` — returns 201 (should be 200 or 202)
- `POST admin/tenants/:id/suspend` — returns 201 (should be 200)
- `POST admin/tenants/:id/enable` — returns 201 (should be 200)
- `POST admin/tenants/:id/disable` — returns 201 (should be 200)
- `POST admin/tenants/:id/resend-invite` — returns 201 (should be 200)
- `POST admin/calls/sync` — returns 201 (should be 200)

```
FIX: Add @HttpCode(HttpStatus.OK) to all action POST endpoints.
     Reserve 201 for endpoints that actually create a resource.
```

---

### H-10. `logout` doesn't validate token existence

**File:** `src/auth/auth.service.ts`  
**Lines:** 167–173

`logout()` calls `updateOne` which silently matches zero documents if the token doesn't exist. The user gets `{ message: 'Logged out' }` even with a completely invalid token.

```
FIX: Check modifiedCount and return appropriate feedback, 
     or at minimum log when the token was not found.
```

---

### H-11. Webhook controllers don't handle processing errors per event type

**File:** `src/webhooks/retell.webhook.controller.ts`  
**Lines:** 157–176

If `handleRetellCallStarted` throws, the entire webhook fails and `recordProcessedEvent` is never called. The event will be retried by Retell, but if it's a persistent error (bad data), it retries forever.

```
FIX: Wrap each case in try/catch. Log the error, still record 
     the event as processed (or add to a dead-letter table), 
     and return 200 to prevent infinite retries.
```

Same issue in `stripe.webhook.controller.ts` lines 104–118.

---

### H-12. `AgentDeploymentService.onModuleInit` is not async but calls async operations

**File:** `src/agent-deployments/agent-deployment.service.ts`  
**Line:** 87

`onModuleInit()` is not declared `async` even though it could benefit from being one. Currently it's synchronous which is fine, but the worker `failed` event handler (line 114) doesn't have proper typing for `job` which could be `undefined`.

```
FIX: Add null check: if (!job) return; before accessing job.data.
     The bullmq types already indicate job can be undefined.
```

---

## MEDIUM Issues

### M-1. No input validation on `syncAllFromRetell` admin endpoint

**File:** `src/calls/calls.controller.ts` line 90  
**File:** `src/calls/calls.service.ts` lines 317–383

This endpoint has no rate limiting and iterates over up to 1000 agents calling Retell API for each. A single admin request could trigger thousands of external API calls.

```
FIX: Add @Throttle decorator. Consider making this a background 
     job instead of a synchronous endpoint.
```

---

### M-2. Dashboard service has no try/catch on any method

**File:** `src/dashboard/dashboard.service.ts`

All methods run complex aggregation pipelines with no error handling. If any pipeline fails (e.g., malformed ObjectId, DB connection issue), a raw MongoDB error propagates to the client.

```
FIX: Wrap aggregation calls in try/catch. Return sensible defaults 
     (zeros) on failure and log the error.
```

---

### M-3. Reports service has no try/catch on any method

**File:** `src/reports/reports.service.ts`

Same as M-2. All aggregation pipelines run unprotected. A `BSONError` for an invalid tenantId would leak MongoDB internals.

```
FIX: Validate tenantId format before creating ObjectId. 
     Wrap aggregations in try/catch.
```

---

### M-4. `BillingService.getOverview()` has no error handling

**File:** `src/billing/billing.service.ts`  
**Lines:** 49–77

Runs multiple parallel queries with no try/catch. If the aggregation pipeline fails, raw error leaks.

---

### M-5. `InvalidObjectId` errors not handled globally

Throughout all services, `new Types.ObjectId(someString)` is called without validating the format. If a client sends `tenantId=abc`, Mongoose throws a `BSONError` which becomes an unformatted 500.

```
FIX: Either:
  a) Add a global exception filter that catches BSONError and 
     returns 400 Bad Request, OR
  b) Validate ObjectId format in each service method before use.
```

---

### M-6. Missing permissions guards on several controller endpoints

**File:** `src/customers/customers.controller.ts`  
No `PermissionsGuard` or `RequirePermissions` decorator. Any tenant user can CRUD customers.

**File:** `src/staff/staff.controller.ts`  
No `PermissionsGuard`. Any tenant user can invite/remove staff.

**File:** `src/support/support.controller.ts`  
No `PermissionsGuard`. Any tenant user can create/view support tickets (may be intentional, but worth flagging).

```
FIX: Add PermissionsGuard + RequirePermissions where appropriate 
     (at minimum for write operations on customers and staff).
```

---

### M-7. `availabilityService` does no validation on date range

**File:** `src/availability/availability.service.ts`  
**Line:** 26

`getAvailabilitySlots()` accepts arbitrary `start` and `end` dates. If someone passes a range of 10 years, the while loop at line 57 runs ~3650 iterations. No upper bound check.

```
FIX: Validate that the date range doesn't exceed a reasonable 
     maximum (e.g., 90 days). Throw BadRequestException otherwise.
```

---

### M-8. `SupportService.addMessage` status update uses unsafe cast

**File:** `src/support/support.service.ts`  
**Line:** 121

```typescript
(update as Record<string, Record<string, string>>).$set = { status: 'in_progress' };
```

This `as` cast is fragile and would break silently if `update` structure changes.

```
FIX: Build the update object as a properly typed structure from 
     the start instead of casting after the fact.
```

---

### M-9. `NotificationsService.createBatchFromQueue` uses `{ ordered: false }` without error handling

**File:** `src/notifications/notifications.service.ts`  
**Line:** 149

`insertMany` with `ordered: false` throws a `BulkWriteError` if some documents fail. The catch is not handled — a single duplicate would cause the entire batch to error.

```
FIX: Wrap in try/catch. If error is BulkWriteError, extract 
     successful inserts and continue. Log failed ones.
```

---

### M-10. Webhook queue fallback error not handled

**File:** `src/webhooks/retell.webhook.controller.ts`  
**Lines:** 142–153

If `webhookQueue.add()` returns null/undefined (queue not available), processing falls through to synchronous handling. But if `webhookQueue.add()` throws, the error is unhandled.

```
FIX: Wrap webhookQueue.add() in try/catch, fall through to 
     synchronous processing on failure.
```

---

### M-11. `DashboardService` aggregation results not null-safe

**File:** `src/dashboard/dashboard.service.ts`  
**Lines:** 117–119

```typescript
for (const r of staffByRole) {
  const item = r as { _id: string; count: number };
```

Uses `as` cast on aggregation results without validation. If the aggregation returns unexpected shapes, this silently produces incorrect data.

---

### M-12. `verifyToken` endpoint has no guard

**File:** `src/auth/auth.controller.ts`  
**Line:** 45–48

`GET auth/verify-token` has no `JwtAuthGuard` and no rate limiting. Anyone can probe for valid tokens.

```
FIX: Add @Throttle to prevent brute-force token probing.
```

---

### M-13. `callsService.syncAllFromRetell` uses `$setOnInsert` but doesn't update existing records

**File:** `src/calls/calls.service.ts`  
**Lines:** 369–373

```typescript
await this.callSessionModel.updateOne(
  { callId: callData.call_id },
  { $setOnInsert: updateData },
  { upsert: true }
);
```

`$setOnInsert` only writes on insert, meaning existing call records are never updated with new transcript or analysis data from Retell.

```
FIX: Use $set for fields that should be updated (transcript, 
     analysis) and $setOnInsert only for immutable fields (tenantId, 
     agentInstanceId).
```

---

### M-14. `AgentHealthService.runHealthCheck` creates duplicate alerts

**File:** `src/agent-instances/agent-health.service.ts`  
**Lines:** 239–291

The hourly cron creates new alerts every hour for the same agent without checking if an existing unresolved alert exists. This floods the alert table.

```
FIX: Check for existing unresolved alerts before creating new ones.
     Use upsert with a compound key of (agentInstanceId, type, resolved: false).
```

---

### M-15. Email rate limiter uses in-memory Map

**File:** `src/email/email.service.ts`  
**Lines:** 31, 117–132

The rate limiter uses a local `Map` which resets on process restart and doesn't work across multiple instances.

```
FIX: For production, use Redis-based rate limiting. Document 
     that the current implementation is single-instance only.
```

---

## LOW / Informational Issues

### L-1. Inconsistent error response structures

Some services return `{ message: 'Logged out' }`, others return `{ message: 'Deleted' }`, others return the entity itself, and some return `void`. There's no standard response envelope.

```
RECOMMENDATION: Adopt a standard { success: boolean, data?, message? } 
     envelope or document the conventions.
```

---

### L-2. `BillingService` exposes `stripeCustomerId` and `stripeSubscriptionId`

**File:** `src/billing/billing.service.ts`  
**Lines:** 89–90

These are internal Stripe identifiers returned to the client. Not a security risk per se, but unnecessary exposure.

---

### L-3. Missing JSDoc on several service methods

The following exported methods lack JSDoc documentation (required by project rules):
- `TenantsService.findAll`, `create`, `update`, `suspend`, `enable`, `remove`
- `BookingsService.findAllForTenant`, `create`, `update`
- `CustomersService.findAllForTenant`, `create`, `update`, `softDelete`
- `StaffService.findAllForTenant`, `invite`, `update`, `remove`
- `BillingService.getPlans`, `createPlan`, `updatePlan`, `getOverview`, `getTenantBilling`
- `DashboardService` — all methods
- `ReportsService` — most methods

---

### L-4. `AgentsTenantController` chat routes have conflicting path patterns

**File:** `src/agent-instances/agents.controller.ts`  
**Lines:** 71, 79

Routes `GET tenant/agents/chats/:chatId` and `POST tenant/agents/chats/:chatId/messages` use `chats` as a sub-resource under the `agents` controller. This could conflict with `GET tenant/agents/:id` if `chatId` looks like an ObjectId — NestJS would try to match the `:id` route first.

```
FIX: Move chat routes to a separate controller or ensure the 
     static 'chats' prefix is registered before the :id param route.
```

---

### L-5. `DashboardService.getRoiMetrics` uses hardcoded business values

**File:** `src/dashboard/dashboard.service.ts`  
**Lines:** 232–234

```typescript
const revenue = bookedCount * 50;
const aiCost = minutes * 0.05;
const costSaved = minutes * 2;
```

These magic numbers should be configurable constants.

---

### L-6. `AvailabilityService` — type assertions throughout

**File:** `src/availability/availability.service.ts`

Multiple `as` casts on populated documents (lines 40–42, 51–55, 61–66) without type guards. Common pattern with Mongoose populate, but fragile.

---

### L-7. `RetellWebhookController` constructor throws raw Error

**File:** `src/webhooks/retell.webhook.controller.ts`  
**Line:** 63

```typescript
throw new Error('RETELL_WEBHOOK_SECRET must be set...');
```

Should use NestJS Logger + process exit or a more graceful startup failure pattern.

---

### L-8. Audit service calls in tenant/staff operations are fire-and-forget

**File:** `src/tenants/tenants.service.ts` — audit calls on lines 158, 225, 263  
**File:** `src/staff/staff.service.ts` — audit calls on lines 84, 102

These `await this.auditService.log()` calls will crash the parent operation if the audit DB is down. They should be fire-and-forget with error logging.

```
FIX: Wrap in try/catch or use .catch() pattern to prevent 
     audit failures from blocking business operations.
```

---

## Summary by File

| File | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| `auth/auth.service.ts` | 2 | 1 | 0 | 0 |
| `auth/auth.controller.ts` | 0 | 1 | 1 | 0 |
| `tenants/tenants.service.ts` | 0 | 2 | 0 | 1 |
| `tenants/tenants.controller.ts` | 0 | 0 | 0 | 0 |
| `agent-instances/agents.service.ts` | 2 | 0 | 0 | 1 |
| `agent-instances/agents.controller.ts` | 1 | 0 | 0 | 1 |
| `agent-instances/agent-health.service.ts` | 0 | 0 | 1 | 0 |
| `agent-deployments/agent-deployment.service.ts` | 0 | 1 | 0 | 0 |
| `calls/calls.service.ts` | 2 | 1 | 2 | 0 |
| `calls/calls.controller.ts` | 0 | 0 | 1 | 0 |
| `bookings/bookings.service.ts` | 0 | 1 | 0 | 1 |
| `bookings/bookings.controller.ts` | 1 | 0 | 0 | 0 |
| `support/support.service.ts` | 0 | 1 | 1 | 0 |
| `support/support.controller.ts` | 0 | 0 | 0 | 0 |
| `billing/billing.service.ts` | 0 | 0 | 1 | 1 |
| `billing/billing.controller.ts` | 0 | 0 | 0 | 0 |
| `customers/customers.service.ts` | 0 | 0 | 0 | 1 |
| `customers/customers.controller.ts` | 1 | 0 | 1 | 0 |
| `staff/staff.service.ts` | 0 | 1 | 0 | 1 |
| `staff/staff.controller.ts` | 0 | 0 | 1 | 0 |
| `webhooks/webhooks.service.ts` | 0 | 1 | 0 | 0 |
| `webhooks/retell.webhook.controller.ts` | 0 | 1 | 1 | 1 |
| `webhooks/stripe.webhook.controller.ts` | 0 | 1 | 0 | 0 |
| `email/email.service.ts` | 0 | 0 | 1 | 0 |
| `notifications/notifications.service.ts` | 0 | 1 | 1 | 0 |
| `notifications/notifications.controller.ts` | 0 | 1 | 0 | 0 |
| `dashboard/dashboard.service.ts` | 0 | 0 | 2 | 1 |
| `dashboard/dashboard.controller.ts` | 1 | 0 | 0 | 0 |
| `reports/reports.service.ts` | 0 | 0 | 1 | 1 |
| `reports/reports.controller.ts` | 1 | 0 | 0 | 0 |
| `availability/availability.service.ts` | 0 | 0 | 1 | 1 |
| **Global / Cross-cutting** | 0 | 1 | 1 | 0 |

---

## Top Priority Fixes (Ordered)

1. **Add global exception filter for BSONError/CastError** → Returns 400 instead of 500 for invalid ObjectIds (fixes M-5 across all services)
2. **Replace all `req.tenantId!` with `requireTenantId(req)` pattern** in tenant-scoped controllers (fixes C-5)
3. **Wrap Retell API calls in try/catch** in `agents.service.ts` and `calls.service.ts` (fixes C-1, C-2)
4. **Add `@HttpCode(HttpStatus.OK)` to action POST endpoints** (fixes H-9)
5. **Wrap email/notification side-effects in try/catch** (fixes H-2, H-3)
6. **Remove all `as any` casts** — replace with proper types/guards (fixes C-3, C-4, C-6, C-7)
7. **Add try/catch to webhook handler event processing** (fixes H-5, H-11)
8. **Add PermissionsGuard to customers and staff controllers** (fixes M-6)
9. **Return response bodies from void controller methods** (fixes H-6, H-7)
10. **Add rate limiting to `verify-token` and `syncAllFromRetell`** (fixes M-1, M-12)

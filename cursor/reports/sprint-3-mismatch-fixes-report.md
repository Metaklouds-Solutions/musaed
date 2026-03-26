# Sprint 3 — Mismatch & Integration Fixes Report

**Date:** 2026-03-11
**Scope:** Fix all mismatches and incorrect behavior identified in the Final System Verification Report

---

## Summary

7 issues fixed across 12 modified files and 3 new files. All changes are backward compatible. TypeScript compilation passes with zero errors.

---

## Fix 1: CallSession PII Exposure via `.lean()`

**Problem:** The `toJSON` transform on `CallSessionSchema` strips sensitive fields (`recordingUrl`, `transcript`, `transcriptObject`), but all list/detail queries use `.lean()` which bypasses Mongoose transforms entirely. PII was leaking in API responses.

**Solution:** Added `.select('-recordingUrl -transcript -transcriptObject')` to all 6 `.lean()` query chains in `CallsService`:

- `listForTenant()` — tenant list endpoint
- `listForAdmin()` — admin list endpoint
- `getByIdForTenant()` — tenant detail endpoint
- `getByRetellIdForTenant()` — tenant Retell lookup
- `getByIdForAdmin()` — admin detail endpoint
- `getByRetellIdForAdmin()` — admin Retell lookup

**File modified:** `apps/backend/src/calls/calls.service.ts`

---

## Fix 2: Missing ParseObjectIdPipe on Agents & Runs Controllers

**Problem:** `AgentsTenantController`, `AgentsAdminController`, `AgentsAdminV1Controller`, and `RunsController` accepted raw `:id` and `:tenantId` params without ObjectId validation, risking Mongoose `CastError` exceptions in production.

**Solution:** Applied `ParseObjectIdPipe` to all 20+ route parameters across all four controllers:

- `AgentsTenantController`: `:id` on 7 endpoints (findById, updatePrompts, syncAgent, getDeployments, startConversation, getAnalytics, getHealth)
- `AgentsAdminController`: `:id` on 9 endpoints, `:tenantId` on 2 endpoints
- `AgentsAdminV1Controller`: `:id` on 1 endpoint
- `RunsController`: `:id` on 2 endpoints (getRun, getRunEvents)

**File modified:** `apps/backend/src/agent-instances/agents.controller.ts`, `apps/backend/src/runs/runs.controller.ts`

---

## Fix 3: Inline Body Types Replaced with Proper DTOs

**Problem:** Two controller endpoints used inline type annotations (`{ agentInstanceId: string }` and `{ messages: unknown[] }`) instead of validated DTOs. This bypassed the global `ValidationPipe`, meaning no input validation was applied.

**Solution:** Created two new DTOs with proper class-validator decorators:


| Endpoint                                     | Old Type                      | New DTO              | Validation                       |
| -------------------------------------------- | ----------------------------- | -------------------- | -------------------------------- |
| `POST /tenant/calls/web-call`                | `{ agentInstanceId: string }` | `CreateWebCallDto`   | `@IsMongoId()`                   |
| `POST /tenant/agents/chats/:chatId/messages` | `{ messages: unknown[] }`     | `SendChatMessageDto` | `@IsArray()`, `@ArrayMinSize(1)` |


**Files created:**

- `apps/backend/src/calls/dto/create-web-call.dto.ts`
- `apps/backend/src/agent-instances/dto/send-chat-message.dto.ts`

**Files modified:**

- `apps/backend/src/calls/calls.controller.ts`
- `apps/backend/src/agent-instances/agents.controller.ts`

---

## Fix 4: Missing PATCH Endpoint for Support Ticket Status

**Problem:** Frontend calls `PATCH /tenant/support/tickets/:id` with `{ status }` to update ticket status, but the backend had no PATCH endpoint — only GET and POST routes existed. The frontend's `updateStatus()` calls were silently failing.

**Solution:**

- Created `UpdateTicketStatusDto` with `@IsIn(['open', 'in_progress', 'resolved', 'closed'])` validation
- Added `updateStatus()` method to `SupportService` (also sets `closedAt` when status becomes `closed` or `resolved`)
- Added `PATCH :id` route to both `SupportTenantController` and `SupportAdminController`

**Files created:** `apps/backend/src/support/dto/update-ticket-status.dto.ts`
**Files modified:** `apps/backend/src/support/support.service.ts`, `apps/backend/src/support/support.controller.ts`

---

## Fix 5: Customer Export HTTP Method Mismatch

**Problem:** Frontend calls `GET /tenant/customers/:id/export` via `api.get()`, but the backend defined `@Post(':id/export')`. Requests returned 404 due to method mismatch. Semantically, data export is a read operation, so GET is correct.

**Solution:** Changed `@Post(':id/export')` to `@Get(':id/export')` in `CustomersController`.

**File modified:** `apps/backend/src/customers/customers.controller.ts`

---

## Fix 6: Tenants Search Parameter Not Supported

**Problem:** Frontend sends `search` query parameter in `GET /admin/tenants?search=...`, but the backend controller didn't extract it and the service didn't filter by it. Search input was silently ignored.

**Solution:**

- Added `@Query('search') search?: string` to `TenantsController.findAll()`
- Updated `TenantsService.findAll()` to accept `search` parameter and apply `{ name: { $regex: search, $options: 'i' } }` filter for case-insensitive name matching

**Files modified:** `apps/backend/src/tenants/tenants.controller.ts`, `apps/backend/src/tenants/tenants.service.ts`

---

## Fix 7: UpdateTenantDto Status Enum Mismatch

**Problem:** `UpdateTenantDto` had `@IsIn(['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED'])` but the Mongoose schema defines `enum: ['ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED']`. This meant:

- `TRIAL` and `CHURNED` were valid in DB but rejected by DTO validation
- `CANCELLED` was accepted by DTO but rejected by Mongoose schema

**Solution:** Aligned DTO enum to match schema: `@IsIn(['ONBOARDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CHURNED'])`.

**File modified:** `apps/backend/src/tenants/dto/update-tenant.dto.ts`

---

## Files Summary

### New Files (3)


| File                                                            | Purpose                      |
| --------------------------------------------------------------- | ---------------------------- |
| `apps/backend/src/calls/dto/create-web-call.dto.ts`             | DTO for web call creation    |
| `apps/backend/src/agent-instances/dto/send-chat-message.dto.ts` | DTO for chat message sending |
| `apps/backend/src/support/dto/update-ticket-status.dto.ts`      | DTO for ticket status update |


### Modified Files (9)


| File                                                    | Changes                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/backend/src/calls/calls.service.ts`               | Added `.select()` PII exclusions to 6 query chains                                          |
| `apps/backend/src/calls/calls.controller.ts`            | Replaced inline body type with `CreateWebCallDto`                                           |
| `apps/backend/src/agent-instances/agents.controller.ts` | Added `ParseObjectIdPipe` to 20 params, replaced inline body type with `SendChatMessageDto` |
| `apps/backend/src/runs/runs.controller.ts`              | Added `ParseObjectIdPipe` to 2 params                                                       |
| `apps/backend/src/support/support.service.ts`           | Added `updateStatus()` method                                                               |
| `apps/backend/src/support/support.controller.ts`        | Added PATCH endpoint to both tenant and admin controllers                                   |
| `apps/backend/src/customers/customers.controller.ts`    | Changed export from POST to GET                                                             |
| `apps/backend/src/tenants/tenants.controller.ts`        | Added search query param                                                                    |
| `apps/backend/src/tenants/tenants.service.ts`           | Added search filter to findAll                                                              |
| `apps/backend/src/tenants/dto/update-tenant.dto.ts`     | Fixed status enum values                                                                    |


### Verification

- **TypeScript compilation:** PASS (zero errors)
- **Linter:** PASS (zero errors on all modified files)
- **Backward compatibility:** All changes are additive or corrective — no existing API contracts broken


# Frontend-Backend API Integration Audit

**Date**: March 11, 2026  
**Scope**: `apps/prototype/src/adapters/api/*.adapter.ts` + `lib/apiClient.ts`  
**Backend reference**: Known backend routes from NestJS controllers

---

## 1. HTTP Client (`lib/apiClient.ts`)

### What's Good
- **Auth token management**: Proper `Bearer` token injection via `Authorization` header
- **Token refresh**: Automatic 401 retry with `/auth/refresh` before failing
- **Error class**: `ApiClientError` with status and message — clean
- **Backend unavailability**: Cooldown-based circuit breaker (`BACKEND_RETRY_COOLDOWN_MS = 5000`)
- **Base URL**: Configurable via `VITE_API_URL` env var
- **204 handling**: Returns `undefined` for no-content responses

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `options.headers as Record<string, string>` on L140 — unsafe `as` cast; if caller passes `Headers` object this will break silently |
| 2 | **LOW** | `return undefined as T` on L164 — `as T` cast without guard; caller gets `undefined` typed as `T` |
| 3 | **LOW** | No request/response interceptor pattern — each adapter must handle error fallback individually |
| 4 | **LOW** | No request timeout — hangs indefinitely on slow responses |
| 5 | **LOW** | Missing `Content-Type` removal for non-JSON requests (export adapter works around by using raw `fetch`) |

### Missing Features
- No retry logic for transient errors (5xx)
- No request deduplication for identical concurrent calls
- No abort controller integration for component unmount

---

## 2. Per-Adapter Audit

### 2.1 `admin.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/overview` | `/api/admin/overview` | MATCH |
| `/admin/tenants?page=1&limit=100` | `/api/admin/tenants/*` | MATCH |
| `/admin/system` | `/api/admin/system` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `api.get<any>('/admin/overview')` — uses `any` type on L19 |
| 2 | **HIGH** | `api.get<{ data: any[] }>` — uses `any[]` on L33 |
| 3 | **HIGH** | `(t: any)` — untyped mapper on L34 |
| 4 | **HIGH** | `api.get<any>('/admin/system')` — uses `any` on L46 |
| 5 | **MEDIUM** | `getAdminKpis()`, `getRecentTenants()`, `getSupportSnapshot()`, `getRecentCalls()`, `getSystemHealthExtended()`, `getBillingOverview()` — all return hardcoded empty/default values, no API calls. Either stub methods or dead code. |

---

### 2.2 `agents.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/agents?page=1&limit=100` | `/api/admin/agents/*` | MATCH |
| `/admin/agents/:id/assign` | `/api/admin/agents/*` | MATCH |
| `/admin/agents/:id/unassign` | `/api/admin/agents/*` | MATCH |
| `/admin/agents/:id` (PATCH) | `/api/admin/agents/*` | MATCH |
| `/v1/admin/agents/:id/deploy` | **MISMATCH** | Path starts with `/v1/` — not matching `/api/admin/agents/*` |
| `/admin/agents/tenants/:tenantId` (POST) | `/api/admin/agents/*` | MATCH |
| `/admin/agents` (POST) | `/api/admin/agents/*` | MATCH |
| `/admin/agents/:id/deployments` | `/api/admin/agents/*` | MATCH |
| `/admin/agents/:id/retell-config` | `/api/admin/agents/*` | MATCH |
| `/tenant/agents` | `/api/tenant/agents/*` | MATCH |
| `/tenant/agents/:id` | `/api/tenant/agents/*` | MATCH |
| `/tenant/agents/:id/sync` | `/api/tenant/agents/*` | MATCH |
| `/tenant/agents/:id/deployments` | `/api/tenant/agents/*` | MATCH |
| `/tenant/agents/:id/conversations/start` | `/api/tenant/agents/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `/v1/admin/agents/:id/deploy` — prefixed with `/v1/` while all other routes use no version prefix. BASE_URL already includes `/api`. This likely results in `http://localhost:3001/api/v1/admin/agents/:id/deploy` which may not exist on the backend. |
| 2 | **MEDIUM** | `let agent: any` on L402 — `any` type in `getAgentDetailFullAsync` |
| 3 | **MEDIUM** | `try { await api.post(...); } catch {}` — empty catch on L405 silently swallows sync errors with no logging |
| 4 | **MEDIUM** | `getDetails()`, `getAgentForTenant()`, `getAgentDetailFull()` — sync methods return `null` always; no API call |

---

### 2.3 `alerts.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/alerts` | `/api/tenant/alerts/*` | MATCH |
| `/tenant/alerts/:id/resolve` | `/api/tenant/alerts/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **LOW** | `resolveAlert()` has no error handling — throws to caller |
| 2 | **NONE** | Clean, well-typed. No `any` usage. |

---

### 2.4 `audit.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/audit` | `/api/admin/audit` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **NONE** | Clean. Properly typed. Error handling present. |

---

### 2.5 `billing.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/billing` | `/api/tenant/billing` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `api.get<any>('/tenant/billing')` — uses `any` on L12 |
| 2 | **MEDIUM** | `buyCredits()` is a no-op — no API integration |
| 3 | **MEDIUM** | No admin billing routes used (`/admin/billing/*` exists on backend but has no adapter calls) |

---

### 2.6 `bookings.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/bookings` | `/api/tenant/bookings` | MATCH |
| `/tenant/bookings/:id` | `/api/tenant/bookings` | MATCH |
| `/tenant/availability` | `/api/tenant/availability` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `mapBooking(b: any)` — uses `any` parameter |
| 2 | **HIGH** | `api.get<{ data: any[] }>` — multiple `any` usages |
| 3 | **HIGH** | `api.get<any>('/tenant/bookings/${id}')` — `any` on L96 |
| 4 | **HIGH** | `api.patch<any>` and `api.post<any>` — `any` on L105, L114 |
| 5 | **MEDIUM** | `getCalendarAppointments` filters by `tenantId` client-side even though backend should scope by JWT tenant — redundant/fragile logic |

---

### 2.7 `calls.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/calls` | `/api/tenant/calls/*` | MATCH |
| `/admin/calls` | `/api/admin/calls/*` | MATCH |
| `/tenant/calls/:id` | `/api/tenant/calls/*` | MATCH |
| `/admin/calls/:id` | `/api/admin/calls/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `(c: any)` — untyped mapper on L28, L50 |
| 2 | **HIGH** | `const c: any = await api.get(...)` — `any` on L49 |
| 3 | **MEDIUM** | Hardcoded `customerName: 'Unknown'`, `customerPhone: 'Unknown'` — no customer lookup from backend response |
| 4 | **MEDIUM** | `refresh()` is a no-op |

---

### 2.8 `customers.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/customers` | `/api/tenant/customers/*` | MATCH |
| `/tenant/customers/:id` | `/api/tenant/customers/*` | MATCH |
| `/tenant/customers/:id/export` | `/api/tenant/customers/*` | MATCH (GDPR) |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `mapCustomer(c: any)` — uses `any` parameter |
| 2 | **HIGH** | `api.get<{ data: any[] }>` — `any` on L23 |
| 3 | **HIGH** | `api.get<any>`, `api.post<any>` — multiple `any` usages |
| 4 | **MEDIUM** | `exportGdpr()` has no error handling |
| 5 | **LOW** | `create()` accepts `Partial<Customer>` which could send `id` and other read-only fields |

---

### 2.9 `dashboard.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/dashboard/metrics` | `/api/tenant/dashboard/*` | MATCH |
| `/tenant/dashboard/funnel` | `/api/tenant/dashboard/*` | MATCH |
| `/tenant/dashboard/trend` | `/api/tenant/dashboard/*` | MATCH |
| `/tenant/dashboard/roi` | `/api/tenant/dashboard/*` | MATCH |
| `/tenant/dashboard/agent-status` | `/api/tenant/dashboard/*` | MATCH |
| `/tenant/dashboard/recent-calls` | `/api/tenant/dashboard/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `getTenantKpis()` and `getTenantStaffCounts()` both call `/tenant/dashboard/metrics` — duplicate network calls for the same endpoint |
| 2 | **MEDIUM** | `getTenantOpenTickets()` also calls `/tenant/dashboard/metrics` — triple-calling same endpoint |
| 3 | **NONE** | Well-typed throughout. No `any` usage. |

---

### 2.10 `export.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/export/staff` | `/api/tenant/export/*` | MATCH |
| `/tenant/export/tickets` | `/api/tenant/export/*` | MATCH |
| `/admin/export/tenants` | `/api/admin/export/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | Duplicates `BASE_URL` on L7 instead of importing from `apiClient` |
| 2 | **MEDIUM** | Uses raw `fetch` instead of `apiFetch` — bypasses 401 retry, circuit breaker |
| 3 | **LOW** | No error handling on download — throws to caller |

---

### 2.11 `maintenance.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/maintenance/status` | `maintenance/status` (no `/api` prefix on backend) | **POTENTIAL MISMATCH** |
| `/admin/maintenance` | `admin/maintenance` (no `/api` prefix on backend) | **POTENTIAL MISMATCH** |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | Backend controller uses `@Controller()` with no path prefix and route decorators `@Get('maintenance/status')` and `@Patch('admin/maintenance')`. The apiClient prepends `BASE_URL` which includes `/api`. This means the frontend calls `/api/maintenance/status` but the backend serves at `/maintenance/status` (or `/api/maintenance/status` if there's a global prefix). **Depends on whether NestJS global prefix includes these routes.** |
| 2 | **LOW** | `setMessage()` is a no-op |

---

### 2.12 `notifications.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/notifications` | `/api/notifications/*` | MATCH |
| `/notifications/unread-count` | `/api/notifications/*` | MATCH |
| `/notifications/:id/read` | `/api/notifications/*` | MATCH |
| `/notifications/read-all` | `/api/notifications/*` | MATCH |
| `/notifications/:id` (DELETE) | `/api/notifications/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `markAsRead()` and `delete()` have no error handling — throw to caller |
| 2 | **MEDIUM** | `markAllAsRead()` has no error handling — throws to caller |
| 3 | **NONE** | Well-typed. No `any` usage. |

---

### 2.13 `reports.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/reports/performance` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/outcomes-by-version` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/performance-for-period` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/sentiment-distribution` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/peak-hours` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/intent-distribution` | `/api/tenant/reports/*` | MATCH |
| `/tenant/reports/outcomes-by-day` | `/api/tenant/reports/*` | MATCH |
| `/admin/reports/tenant-comparison` | `/api/admin/reports/*` | MATCH |
| `/admin/settings/scheduled-reports` | `/api/admin/settings/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **NONE** | Clean. Well-typed. Error handling present on all methods. |

---

### 2.14 `runs.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/runs` | `/api/admin/runs/*` | MATCH |
| `/admin/runs/:id` | `/api/admin/runs/*` | MATCH |
| `/admin/runs/by-call/:callId` | `/api/admin/runs/*` | MATCH |
| `/admin/runs/:id/events` | `/api/admin/runs/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `listRuns()` (sync), `getRun()`, `getRunByCallId()`, `getRunEvents()` — all return empty/null. Dual sync/async API is confusing. |
| 2 | **NONE** | Async methods are properly typed. Error handling present. |

---

### 2.15 `search.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/search` | `/api/search` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **LOW** | No error handling — throws to caller |
| 2 | **NONE** | Well-typed otherwise. |

---

### 2.16 `settings.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/settings` | `/api/admin/settings/*` | MATCH |
| `/admin/settings/retention` | `/api/admin/settings/*` | MATCH |
| `/admin/settings/integrations` | `/api/admin/settings/*` | MATCH |
| `/tenant/settings` | `/api/tenant/settings` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `saveAdminSettings()` makes 2 sequential API calls (retention + integrations) — not atomic; partial failure leaves inconsistent state |
| 2 | **MEDIUM** | `getAgentPrompts()` returns hardcoded defaults — no API call |
| 3 | **LOW** | `saveTenantSettings()` has no error handling — throws to caller |

---

### 2.17 `staff.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/tenant/staff` | `/api/tenant/staff/*` | MATCH |
| `/tenant/staff/:id` (DELETE) | `/api/tenant/staff/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `mapStaffRow(s: any)` — uses `any` parameter |
| 2 | **HIGH** | `api.get<any[]>` — `any` on L35 |
| 3 | **HIGH** | `api.post<any>` — `any` on L43 |
| 4 | **MEDIUM** | `importCsv()` returns `0` always — no API call |

---

### 2.18 `support.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/support` | `/api/admin/support/*` | MATCH |
| `/tenant/support/tickets` | `/api/tenant/support/tickets/*` | MATCH |
| `/tenant/support/tickets/:id` | `/api/tenant/support/tickets/*` | MATCH |
| `/tenant/support/tickets/:id/messages` | `/api/tenant/support/tickets/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **HIGH** | `mapTicket(t: any)` — uses `any` on L19 |
| 2 | **HIGH** | `api.get<{ data: any[] }>` — `any` on L41 |
| 3 | **HIGH** | `api.get<any>`, `api.post<any>` — multiple `any` usages |
| 4 | **HIGH** | `updateStatus()` fires and forgets with `.catch(() => {})` — returns `null` immediately, swallows errors, no feedback to user |
| 5 | **MEDIUM** | `assignTicket()` returns `null` always — no API call |
| 6 | **MEDIUM** | `getAuthorName()` / `getTenantName()` are passthrough stubs |

---

### 2.19 `tenants.adapter.ts`

**Routes used:**
| Frontend Path | Backend Route | Status |
|--------------|---------------|--------|
| `/admin/tenants` | `/api/admin/tenants/*` | MATCH |
| `/admin/tenants/:id` | `/api/admin/tenants/*` | MATCH |
| `/admin/tenants/:id/enable` | `/api/admin/tenants/*` | MATCH |
| `/admin/tenants/:id/disable` | `/api/admin/tenants/*` | MATCH |
| `/admin/agents/tenants/:id` | `/api/admin/agents/*` | MATCH |
| `/admin/templates?page=1&limit=100` | `/api/admin/templates/*` | MATCH |

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | `getMembers()` returns empty array — no API call |
| 2 | **LOW** | `console.warn()` in error handlers on L158 and L277 — should use structured logging |
| 3 | **NONE** | Most methods are well-typed with proper interfaces (no `any`). Best-typed adapter in the codebase. |

---

## 3. Auth Integration (Not in `adapters/api/`)

Auth is **not** an adapter — it's handled directly in:
- `LoginPage.tsx` → calls `api.post('/auth/login')`
- `SessionContext.tsx` → calls `fetch('/auth/me')` and `fetch('/auth/refresh')` directly
- `ForgotPasswordPage.tsx` → presumably calls `/auth/forgot-password`
- `ResetPasswordPage.tsx` → presumably calls `/auth/reset-password`
- `SetupPasswordPage.tsx` → presumably calls `/auth/setup-password`

**Issues:**
| # | Severity | Issue |
|---|----------|-------|
| 1 | **MEDIUM** | Auth calls are scattered across pages/contexts — no centralized auth adapter. Violates the adapter architecture pattern. |
| 2 | **MEDIUM** | `SessionContext.tsx` uses raw `fetch` instead of `apiFetch` — bypasses circuit breaker |
| 3 | **LOW** | No adapter for `/auth/logout`, `/auth/verify-token`, `/auth/change-password` — `logout()` only clears local tokens |

---

## 4. Summary: Missing Adapters for Existing Backend Routes

| Backend Route | Adapter Coverage | Status |
|--------------|-----------------|--------|
| `/api/auth/*` | Scattered in pages/context | **NO ADAPTER** |
| `/api/admin/billing/*` | Not called | **MISSING** |
| `/api/tenant/staff/*` (update) | No update method | **PARTIAL** |
| `/api/tenant/staff/*` (importCsv) | Stub, always returns 0 | **STUB** |
| `/health` | Not called | **MISSING** |

---

## 5. Summary: Phantom Routes (Frontend calls routes that may not exist)

| Frontend Call | Concern |
|-------------|---------|
| `/v1/admin/agents/:id/deploy` | Uses `/v1/` prefix — does not match the standard route pattern |
| `/tenant/dashboard/funnel` | Not confirmed in backend controllers |
| `/tenant/dashboard/trend` | Not confirmed in backend controllers |
| `/tenant/dashboard/roi` | Not confirmed in backend controllers |
| `/tenant/dashboard/agent-status` | Not confirmed in backend controllers |
| `/tenant/dashboard/recent-calls` | Not confirmed in backend controllers |
| `/tenant/reports/outcomes-by-version` | Not confirmed in backend controllers |
| `/tenant/reports/performance-for-period` | Not confirmed in backend controllers |
| `/tenant/reports/sentiment-distribution` | Not confirmed in backend controllers |
| `/tenant/reports/peak-hours` | Not confirmed in backend controllers |
| `/tenant/reports/intent-distribution` | Not confirmed in backend controllers |
| `/tenant/reports/outcomes-by-day` | Not confirmed in backend controllers |
| `/tenant/customers/:id/export` | Not confirmed as GDPR export route |

> **Note:** These may exist in unaudited backend controllers. Verification against actual backend route definitions is needed.

---

## 6. Summary: `any` Type Violations

| Adapter | `any` Count | Files Needing Fix |
|---------|------------|-------------------|
| `admin.adapter.ts` | 4 | L19, L33, L34, L46 |
| `agents.adapter.ts` | 1 | L402 |
| `billing.adapter.ts` | 1 | L12 |
| `bookings.adapter.ts` | 5 | L9, L29, L87, L96, L105, L114 |
| `calls.adapter.ts` | 3 | L28, L49, L50 |
| `customers.adapter.ts` | 5 | L8, L23, L32, L42 |
| `staff.adapter.ts` | 3 | L17, L35, L43 |
| `support.adapter.ts` | 6 | L19, L41, L50, L56, L78, L89 |
| **Total** | **28** | 8 of 19 adapters |

---

## 7. Error Handling Summary

| Pattern | Adapters Using It | Assessment |
|---------|-------------------|------------|
| try/catch returning defaults | Most adapters | **GOOD** — graceful degradation |
| No error handling (throws to caller) | alerts (resolve), notifications (mark/delete), search, settings (save), export | **MEDIUM** — caller must handle |
| Fire-and-forget `.catch(() => {})` | support.updateStatus | **BAD** — silent failure |
| Empty catch `catch {}` | agents (sync call) | **BAD** — swallowed error |

---

## 8. Prioritized Action Items

### P0 — Critical (fix before production)
1. **Fix `/v1/admin/agents/:id/deploy` route** — remove `/v1/` prefix or verify backend route exists
2. **Verify maintenance routes** — check if NestJS global prefix covers `maintenance/status`
3. **Create auth adapter** — centralize auth API calls (`login`, `logout`, `refresh`, `me`, `setup-password`, `forgot-password`, `reset-password`, `change-password`, `verify-token`)

### P1 — High (fix in next sprint)
4. **Eliminate all 28 `any` types** — create proper interfaces for backend response shapes
5. **Fix `support.updateStatus()`** — make it async, return result, handle errors
6. **Fix empty catch blocks** — at minimum log errors
7. **Add error handling** to `notifications.markAsRead/delete`, `alerts.resolveAlert`, `search.search`, `settings.saveTenantSettings`

### P2 — Medium (schedule)
8. **Remove duplicate `BASE_URL`** from `export.adapter.ts` — use `apiFetch` or import from apiClient
9. **Add admin billing adapter** — calls to `/admin/billing/*`
10. **Consolidate dashboard calls** — `getTenantKpis`, `getTenantStaffCounts`, `getTenantOpenTickets` all hit `/tenant/dashboard/metrics` separately
11. **Remove sync stub methods** from `runs.adapter.ts` — keep only async versions
12. **Complete stub methods** — `staff.importCsv`, `support.assignTicket`, `tenants.getMembers`
13. **Add request timeout** to apiClient
14. **Call `/auth/logout`** on backend when user logs out (currently only clears local tokens)

### P3 — Low
15. Add structured logging instead of `console.warn`
16. Implement `health` endpoint check
17. Remove hardcoded `customerName: 'Unknown'` from calls adapter

# MUSAED Implementation Guide — Step-by-Step for Agent

**Purpose:** This file guides the agent through implementing the MUSAED platform one module at a time. Each task has a **tag** for tracking. After each module, run a **review checkpoint** before moving on.

**Reference:** MUSAED Plan (Cursor plan: MUSAED Multi-Tenant Platform)

**Workflow:** After each module, the agent shows a **MODULE COMPLETE** message. The user reviews the code, then says **"Start next module"** or **"Start [PHASE-X-MODULE]"** to continue. Do not proceed to the next module until the user confirms.

---

## Current Status (Last Updated)

| Phase | Status | Next |
|-------|--------|------|
| Phase 1 (Foundation) | ✅ DONE | — |
| Phase 2 (Sidebar) | ✅ DONE | — |
| Phase 3 (Routing) | ✅ DONE | — |
| Phase 4 (Modules) | ✅ DONE | — |
| Phase 5 (Guards) | ✅ DONE | — |
| Phase 6 (Data) | ✅ DONE | — |
| Phase 7A (Enhancements) | ✅ DONE | — |
| Phase 7B–7C (Enhancements) | ✅ DONE | — |

**Phase 7C complete. See backlog for remaining enhancements.**

---

## Current State Summary (from Plan)

| Area | Exists | Gap |
|------|--------|-----|
| Auth | ADMIN, TENANT_OWNER, STAFF | Need tenant-scoped roles: clinic_admin, receptionist, doctor, auditor, tenant_staff |
| Admin Sidebar | 3 items (Overview, Tenants, System) | Need 10+ items with nested structure |
| Tenant Sidebar | 6 items (Dashboard, Calls, Customers, Bookings, Alerts, Billing) | Need 8 items (Agent, Staff, Reports, Help Center, Settings; restructure) |
| Admin Pages | Overview, Tenants, System | Add Wizard, Details, Agents, Staff, Support, Runs, Skills, Billing, Settings |
| Tenant Pages | Dashboard, Calls, Customers, Bookings, Alerts, Billing | Add Agent, Staff, Reports, Help Center, Settings |
| Billing | Full (Module 8) | Keep; extend for admin cross-tenant view |
| Data | tenants, agents, calls, customers, alerts, credits | Add: support_tickets, ticket_messages, staff_profiles, voice_agents, agent_runs, run_events, skills |

---

## Mock Data Files (Existing)

### 1. `src/mock/seedData.ts` — Main seed data (used by adapters)

**Rule:** No component may directly access this; use adapters only.

| Export | Description | Used by |
|--------|-------------|---------|
| `seedTenants` | Tenants (id, name) | admin, tenants adapters |
| `seedAgents` | Agents (id, tenantId, name) | admin, agents adapters |
| `seedCustomers` | Customers (id, tenantId, name, email) | customers adapter |
| `seedCalls` | Calls (id, tenantId, customerId, duration, transcript, escalationFlag, bookingCreated, etc.) | calls, dashboard, billing adapters |
| `seedBookings` | Bookings (id, tenantId, callId, customerId, amount, status) | bookings, dashboard adapters |
| `seedAlerts` | Alerts (id, tenantId, severity, title, message, resolved) | alerts adapter |
| `seedCredits` | Credits (tenantId, balance, minutesUsed) | billing adapter |
| `seedTenantPlans` | Tenant plans + MRR (tenantId, plan, mrr) | admin, billing adapters |
| `seedCreditsRevenue` | Platform credits revenue | admin adapter |
| `seedPaymentFailures` | Payment failures (id, tenantId, amount, failedAt) | admin adapter |
| `seedUsageAnomalies` | Usage anomalies (id, tenantId, description, severity, detectedAt) | admin adapter |
| `seedChurnRisk` | Churn risk (tenantId, reason, score) | admin adapter |

### 2. `src/mocks/initialData.ts` — Richer structure (used by storage)

| Field | Description |
|-------|-------------|
| `me` | Current user (id, name, email, role) |
| `tenants` | Rich tenant objects: status, plan, timezone, locale, onboarding, members, agentProfile, policies, quotas, tools, integrations |
| `sessions` | Call sessions with transcript, outcome, entities |
| `auditLogs` | Audit log entries |
| `patients` | Patient records |
| `bookings` | Booking records |

**Used by:** `src/services/storage.ts`

### 3. New entities to add to `src/mock/seedData.ts` (per Phase 6)

| Export | Entity | Fields |
|--------|--------|--------|
| `seedTenantMemberships` | TenantMembership | userId, tenantId, roleSlug, status, appointedAt |
| `seedStaffProfiles` | StaffProfile | userId, tenantId, availability, specialties |
| `seedVoiceAgents` | VoiceAgent | id, tenantId, externalAgentId, voice, language, status, lastSyncedAt |
| `seedSupportTickets` | SupportTicket | id, tenantId, title, category, status, priority, createdAt |
| `seedTicketMessages` | TicketMessage | id, ticketId, authorId, body, createdAt |
| `seedAgentRuns` | AgentRun | id, callId, tenantId, usage, startedAt |
| `seedRunEvents` | RunEvent | id, runId, eventType, payload, timestamp |
| `seedSkills` | Skill | id, name, description, deprecated |

**Extend `seedTenants`:** Add `status` (ACTIVE/TRIAL/SUSPENDED), `onboarding` (step, complete).

---

## Code Quality Rules (Always Follow)

1. **Small components:** If a component exceeds ~80 lines or has multiple distinct UI blocks, extract sub-components (e.g. `StatCard`, `CreditsSection`, `TicketRow`).
2. **Single responsibility:** One component = one concern. Extract hooks for data fetching.
3. **Comments:** Add JSDoc for exported components/hooks. Add inline comments for non-obvious logic.
4. **No monolithic files:** Avoid 200+ line components. Split into `ComponentName.tsx` + `ComponentName/SubPart.tsx` or `components/` folder.
5. **Reuse shared UI:** Use existing `PageHeader`, `Table`, `Button`, `Card`, `Badge` from `src/shared/ui` before creating new ones.
6. **Adapters only:** Components must not access `seedData` or mock data directly. Use adapters only.
7. **Modern UI & animations:** Use Framer Motion, GSAP, React Spline, Anime.js, or React Transition Group for smooth, polished animations. Keep animations performant (prefer `transform`/`opacity`, avoid layout thrashing).
8. **Performance:** Write fast code — lazy-load routes, memoize expensive computations, avoid unnecessary re-renders. Use `React.memo`, `useMemo`, `useCallback` where appropriate. Keep bundle size lean.
9. **Responsive design:** All code must be responsive. Use mobile-first CSS, breakpoints (sm/md/lg/xl), and test on viewports 320px–1920px+. Touch targets ≥44px on mobile.
10. **Charts:** When displaying chart data (bar, line, pie, area, etc.), use **shadcn charts** (`@/components/ui/chart`). Do not build custom CSS-only charts; use `ChartContainer`, `ChartTooltip`, and Recharts primitives (BarChart, LineChart, PieChart, etc.) from the shadcn chart component.
11. **UI organization (industry standard):** Do not cluster unrelated features in one place. Follow patterns used by Google, Microsoft, Stripe, and other large products:
    - **Account (Manage Account / Profile):** User identity, security, and session. Place here: profile, password, 2FA, active session, connected accounts. Accessed from header avatar → Manage Account.
    - **Settings:** Tenant or app configuration (timezone, business hours, feature flags, integrations). Not user identity.
    - **Sidebar:** Navigation only. No dropdowns or nested menus unless the IA clearly requires it. Keep the sidebar flat and scannable.
    - **Single entry point:** Each concern has one primary location. Avoid duplicating the same feature across Settings, Account, and sidebar.

---

## Tag Format

Tags: `[PHASE-X-MODULE]` e.g. `[PHASE-1-ROLES]`, `[PHASE-2-SIDEBAR]`

When a task is done, mark: `[PHASE-1-ROLES] ✅ DONE`

---

# PHASE 1: Foundation

## [PHASE-1-ROLES] Extend Role Model

**Status:** ✅ DONE

**Files:**
- `src/shared/types/session.ts`

**Tasks:**
1. Add `TenantRoleSlug` type: `'tenant_owner' | 'clinic_admin' | 'receptionist' | 'doctor' | 'auditor' | 'tenant_staff'`
2. Add `User.tenantRole?: TenantRoleSlug`
3. Keep `Role`: `'ADMIN' | 'TENANT_OWNER' | 'STAFF'`
4. Ensure `User.tenantId?: string` exists

**Review checkpoint:** Types compile, no breaking changes to existing `User` usage.

> **MODULE COMPLETE** — [PHASE-1-ROLES] done. Review the code, then say: **"Start next module"** or **"Start [PHASE-1-ENTITIES]"** to continue.

---

## [PHASE-1-ENTITIES] New Entity Types

**Status:** ✅ DONE

**Files:**
- `src/shared/types/entities.ts`

**Tasks:**
1. Add `TenantMembership`: `userId`, `tenantId`, `roleSlug`, `status`, `appointedAt`
2. Add `StaffProfile`: `userId`, `tenantId`, doctor metadata (availability, specialties)
3. Add `VoiceAgent`: `id`, `tenantId`, `externalAgentId`, `voice`, `language`, `status`, `lastSyncedAt`
4. Add `SupportTicket`: `id`, `tenantId`, `title`, `category`, `status`, `priority`, `createdAt`
5. Add `TicketMessage`: `id`, `ticketId`, `authorId`, `body`, `createdAt`
6. Add `AgentRun`: `id`, `callId`, `tenantId`, `usage`, `startedAt`
7. Add `RunEvent`: `id`, `runId`, `eventType`, `payload`, `timestamp`
8. Add `Skill`: `id`, `name`, `description`, `deprecated`

**Review checkpoint:** All types exported from `shared/types/index.ts`.

> **MODULE COMPLETE** — [PHASE-1-ENTITIES] done. Review the code, then say: **"Start next module"** or **"Start Phase 2"** to continue.

---

**PHASE 1 REVIEW:** Run linter, ensure no regressions. Mark Phase 1 complete before Phase 2.

> **PHASE 1 COMPLETE** — Foundation (roles + entities) done. Ready for Phase 2. Say: **"Start Phase 2"** to continue.

---

# PHASE 2: Sidebar Restructure

## [PHASE-2-SIDEBAR-NAV] Nav Item Types & Structure

**Status:** ✅ DONE

**Files:**
- `src/app/layout/Sidebar/types.ts` (create)
- `src/app/layout/Sidebar/Sidebar.tsx`

**Tasks:**
1. Create `NavItem` type with optional `children?: NavItem[]` for nested items
2. Define `ADMIN_ITEMS` and `TENANT_ITEMS` as per plan (nested structure)
3. Do not change rendering yet — only data structure

**Review checkpoint:** Types and nav data defined; Sidebar still renders (may need minimal wiring).

> **MODULE COMPLETE** — [PHASE-2-SIDEBAR-NAV] done. Say: **"Start next module"** to continue.

---

## [PHASE-2-SIDEBAR-ADMIN] Admin Sidebar UI

**Status:** ✅ DONE

**Files:**
- `src/app/layout/Sidebar/components/SidebarItem.tsx` (extend)
- `src/app/layout/Sidebar/components/SidebarGroup.tsx` (create if needed)
- `src/app/layout/Sidebar/Sidebar.tsx`

**Tasks:**
1. Support nested nav: expandable groups for Tenants, Agents, Settings
2. Render Admin items: Dashboard, Tenants (Add, Directory), Agents, Staff, Support, Calls, Runs, Skills (Coming Soon), Billing, Settings
3. Extract `SidebarGroup` if a nav item has children
4. Keep compact/expanded variant behavior

**Review checkpoint:** Admin user sees full admin sidebar; expand/collapse works.

> **MODULE COMPLETE** — [PHASE-2-SIDEBAR-ADMIN] done. Say: **"Start next module"** to continue.

---

## [PHASE-2-SIDEBAR-TENANT] Tenant Sidebar UI

**Status:** ✅ DONE

**Files:**
- `src/app/layout/Sidebar/Sidebar.tsx`

**Tasks:**
1. Replace TENANT_ITEMS with: Dashboard, Calls, Agent, Staff, Reports, Help Center, Billing, Settings
2. Remove Customers, Bookings, Alerts as top-level (or move under Reports if desired)
3. Ensure tenant user sees correct sidebar

**Review checkpoint:** Tenant user sees new sidebar; all links resolve (404 ok for missing routes).

> **MODULE COMPLETE** — [PHASE-2-SIDEBAR-TENANT] done. Say: **"Start next module"** to continue.

---

**PHASE 2 REVIEW:** Both Admin and Tenant sidebars render correctly. No layout regressions.

> **PHASE 2 COMPLETE** — Sidebar restructure done. Ready for Phase 3. Say: **"Start Phase 3"** to continue.

---

# PHASE 3: Routing

## [PHASE-3-ROUTES] Add All Routes

**Status:** ✅ DONE

**Files:**
- `src/app/router.tsx`

**Tasks:**
1. Add Admin routes: `/admin/tenants/add`, `/admin/tenants/:id`, `/admin/agents`, `/admin/agents/:id`, `/admin/staff`, `/admin/support`, `/admin/calls`, `/admin/calls/:id`, `/admin/runs`, `/admin/runs/:id`, `/admin/skills`, `/admin/billing`, `/admin/settings`
2. Add Tenant routes: `/agent`, `/staff`, `/reports`, `/help`, `/help/tickets/:id`, `/settings`
3. Create placeholder page components (empty with PageHeader) for each new route
4. Wire route elements to placeholder pages

**Review checkpoint:** All routes load without crash; placeholders show page title.

> **MODULE COMPLETE** — [PHASE-3-ROUTES] done. Say: **"Start next module"** to continue.

---

**PHASE 3 REVIEW:** Navigation works; no 404 for defined routes.

> **PHASE 3 COMPLETE** — Routing done. Ready for Phase 4 (Modules). Say: **"Start Phase 4"** or **"Start [PHASE-4-ADMIN-DASHBOARD]"** to continue.

---

# PHASE 4: Modules (One by One)

## [PHASE-4-ADMIN-DASHBOARD] Admin Dashboard Widgets

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminOverviewPage.tsx` (rename/refactor to AdminDashboardPage if desired)
- `src/modules/admin/components/AdminKpiCards/` (create)
- `src/modules/admin/components/AdminRecentTenants/` (create)
- `src/modules/admin/components/AdminSupportSnapshot/` (create)
- `src/modules/admin/components/AdminRecentCalls/` (create)
- `src/modules/admin/components/AdminSystemHealth/` (create)
- `src/adapters/local/admin.adapter.ts` (extend)

**Tasks:**
1. Extend adminAdapter: `getRecentTenants()`, `getSupportSnapshot()`, `getRecentCalls()`, `getAdminKpis()`
2. Create `AdminKpiCards` — extract each KPI as small card component
3. Create `AdminRecentTenants` — table component
4. Create `AdminSupportSnapshot` — open/critical/oldest counts
5. Create `AdminRecentCalls` — cross-tenant table
6. Create `AdminSystemHealth` — Retell sync, webhooks status
7. Compose in AdminOverviewPage

**Component rule:** Each widget in its own folder with `index.ts` barrel.

**Review checkpoint:** Admin dashboard shows all widgets; data from adapter; no monolithic component.

> **MODULE COMPLETE** — [PHASE-4-ADMIN-DASHBOARD] done. Review, then say: **"Start next module"** or **"Start [PHASE-4-TENANT-DASHBOARD]"** to continue.

---

## [PHASE-4-TENANT-DASHBOARD] Tenant Dashboard Widgets

**Status:** ✅ DONE

**Files:**
- `src/modules/dashboard/pages/DashboardPage.tsx`
- `src/modules/dashboard/components/TenantKpiCards/` (create)
- `src/modules/dashboard/components/AgentStatusCard/` (create)
- `src/modules/dashboard/components/RecentCallsTable/` (create)
- `src/modules/dashboard/components/StaffQuickView/` (create)
- `src/modules/dashboard/components/OpenTicketsWidget/` (create)
- `src/adapters/local/dashboard.adapter.ts` (extend)

**Tasks:**
1. Extend dashboardAdapter for tenant KPIs, agent status, staff counts, open tickets
2. Extract `TenantKpiCards` — small card per KPI
3. Extract `AgentStatusCard` — voice, language, last synced
4. Extract `RecentCallsTable` — last 10 calls
5. Extract `StaffQuickView` — count by role
6. Extract `OpenTicketsWidget` — open tickets + latest
7. Compose in DashboardPage

**Review checkpoint:** Tenant dashboard shows all widgets; components are small and reusable.

> **MODULE COMPLETE** — [PHASE-4-TENANT-DASHBOARD] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-TENANT-DETAILS] Admin Tenant Details Page

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminTenantDetailPage.tsx`
- `src/modules/admin/components/TenantDetail/` (create)
  - `TenantProfileSection.tsx`
  - `TenantSettingsSection.tsx`
  - `TenantOnboardingSection.tsx`
- `src/adapters/local/tenants.adapter.ts` (extend)

**Tasks:**
1. Create AdminTenantDetailPage for route `/admin/tenants/:id`
2. Tenant profile: name, plan, status, createdAt
3. Tenant settings: timezone, locale, business hours
4. Onboarding progress (step, complete)
5. Extract each section as small component

**Review checkpoint:** Admin can view tenant details by ID.

> **MODULE COMPLETE** — [PHASE-4-TENANT-DETAILS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-TENANT-WIZARD] Add Tenant Wizard (Admin)

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminTenantWizardPage.tsx`
- `src/modules/admin/components/TenantWizard/` (create)
  - `TenantWizardStep1ClinicInfo.tsx`
  - `TenantWizardStep2DeployAgent.tsx`
  - `TenantWizardProgress.tsx`
- `src/adapters/local/tenants.adapter.ts` (create)

**Tasks:**
1. Create tenantsAdapter: `createTenant()`, `createOwner()`, `createMembership()`, `createTenantSettings()`, `createTenantOnboarding()`, `createAuthInvite()` (or equivalent)
2. Step 1A: Clinic info form (name, owner, email, phone, address, timezone, plan, locale)
3. Step 1B: Deploy agent (list agents, Deploy button)
4. Wizard progress indicator
5. On submit: call adapter, show success, redirect to tenant directory

**Component rule:** Each step = separate component. Form fields in small sub-components.

**Review checkpoint:** Wizard completes; tenant appears in directory (seed + in-memory).

> **MODULE COMPLETE** — [PHASE-4-TENANT-WIZARD] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-STAFF] Staff Module (Admin + Tenant)

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminStaffPage.tsx`
- `src/modules/tenant/staff/pages/StaffPage.tsx`
- `src/modules/shared/staff/` (create shared components)
  - `StaffTable.tsx`
  - `StaffTableRow.tsx`
  - `AddStaffForm.tsx`
  - `StaffFilters.tsx`
- `src/adapters/local/staff.adapter.ts` (create)
- `src/mock/seedData.ts` (extend)

**Tasks:**
1. Add seedTenantMemberships, seedStaffProfiles to seedData
2. Create staffAdapter: `list(tenantId?)`, `add()`, `importCsv()` (CSV can be stub)
3. Create shared StaffTable (tenant filter for admin)
4. AdminStaffPage: table + Add staff + CSV import button
5. Tenant StaffPage: table + Add staff + CSV import button
6. Extract row, form, filters into small components

**Review checkpoint:** Both admin and tenant staff pages work; data from adapter.

> **MODULE COMPLETE** — [PHASE-4-STAFF] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-TENANT-AGENT] Tenant Agent Overview Page

**Status:** ✅ DONE

**Files:**
- `src/modules/tenant/agent/pages/AgentPage.tsx`
- `src/modules/tenant/agent/components/` (create)
  - `AgentStatusCard.tsx` (voice, language, last synced)
  - `AgentSkillsPanel.tsx` (enabled skills toggle/priority)
  - `AgentSyncStatus.tsx`
- `src/adapters/local/agents.adapter.ts` (extend getAgentForTenant)

**Tasks:**
1. Create AgentPage for route `/agent`
2. Agent Overview: status, voice, language, last synced
3. Skills Enabled: toggle / priority (if allowed)
4. Sync Status: last synced timestamp
5. Extract components; use adapter for tenant-scoped agent

**Review checkpoint:** Tenant sees own agent status and skills.

> **MODULE COMPLETE** — [PHASE-4-TENANT-AGENT] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-AGENTS] Agents Module (Admin)

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminAgentsPage.tsx`
- `src/modules/admin/pages/AdminAgentDetailPage.tsx`
- `src/modules/admin/components/AgentsTable/` (create)
- `src/modules/admin/components/AssignAgentModal/` (create)
- `src/adapters/local/agents.adapter.ts` (create)
- `src/mock/seedData.ts` (extend seedVoiceAgents)

**Tasks:**
1. Add seedVoiceAgents to seedData
2. Create agentsAdapter: `list()`, `assign(agentId, tenantId)`, `unassign(agentId)`, `getDetails(id)`
3. AgentsTable: Name, Retell ID, Voice, Language, Linked Tenant, Status, Last Synced
4. AssignAgentModal: tenant dropdown, confirm
5. Agent detail page: skills, locale, status, sync

**Review checkpoint:** Admin can view agents and assign to tenant.

> **MODULE COMPLETE** — [PHASE-4-AGENTS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-SUPPORT] Support / Help Center

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminSupportPage.tsx`
- `src/modules/tenant/help/pages/HelpCenterPage.tsx`
- `src/modules/tenant/help/pages/TicketDetailPage.tsx`
- `src/modules/shared/support/` (create)
  - `TicketList.tsx`
  - `TicketRow.tsx`
  - `TicketChatThread.tsx`
  - `CreateTicketForm.tsx`
- `src/adapters/local/support.adapter.ts` (create)
- `src/mock/seedData.ts` (extend seedSupportTickets, seedTicketMessages)

**Tasks:**
1. Add seedSupportTickets, seedTicketMessages to seedData
2. Create supportAdapter: `listTickets()`, `getTicket()`, `createTicket()`, `addMessage()`, `updateStatus()`, `assignTicket(ticketId, userId)`
3. Admin: unified inbox, filters (tenant, status, priority), assign ticket to admin, reply
4. Tenant: create ticket, my tickets list, ticket chat thread
5. Extract TicketRow, TicketChatThread, CreateTicketForm as small components

**Review checkpoint:** Both admin inbox and tenant help center work end-to-end.

> **MODULE COMPLETE** — [PHASE-4-SUPPORT] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-REPORTS] Reports Module (Tenant)

**Status:** ✅ DONE

**Files:**
- `src/modules/tenant/reports/pages/ReportsPage.tsx`
- `src/modules/tenant/reports/components/OutcomeBreakdown/` (create)
- `src/modules/tenant/reports/components/PerformanceMetrics/` (create)
- `src/adapters/local/reports.adapter.ts` (create)

**Tasks:**
1. Create reportsAdapter: `getOutcomes(tenantId)`, `getPerformance(tenantId)`
2. OutcomeBreakdown: Booked / Escalated / Failed chart or table
3. PerformanceMetrics: agent performance metrics
4. Compose in ReportsPage

**Review checkpoint:** Reports page shows outcomes and performance; data from adapter.

> **MODULE COMPLETE** — [PHASE-4-REPORTS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-RUNS] Runs & Logs

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminRunsPage.tsx`
- `src/modules/admin/pages/AdminRunDetailPage.tsx`
- `src/modules/admin/components/RunsTable/` (create)
- `src/modules/admin/components/RunEventsViewer/` (create)
- `src/adapters/local/runs.adapter.ts` (create)
- `src/mock/seedData.ts` (extend seedAgentRuns, seedRunEvents)

**Tasks:**
1. Add seedAgentRuns, seedRunEvents to seedData
2. Create runsAdapter: `listRuns()`, `getRunEvents(runId)`
3. Admin runs list: cross-tenant, cost view
4. Run detail: run_events debug console
5. Tenant: optional runs per call (auditor only)

**Review checkpoint:** Admin can view runs and run events.

> **MODULE COMPLETE** — [PHASE-4-RUNS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-SETTINGS] Settings (Admin + Tenant)

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminSettingsPage.tsx`
- `src/modules/tenant/settings/pages/SettingsPage.tsx`
- `src/modules/admin/components/settings/` (Admin users, Integrations, Retention)
- `src/modules/tenant/settings/components/` (Clinic profile, Business hours, Notifications)

**Tasks:**
1. Admin: Admin users list, Integrations (Retell keys, webhooks), Retention policies
2. Tenant: Clinic profile (timezone, locale), Business hours, Notifications
3. Extract each section as small component
4. Use adapters for read/write (can be localStorage or seed for now)

**Review checkpoint:** Both settings pages render; forms are wired.

> **MODULE COMPLETE** — [PHASE-4-SETTINGS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-SKILLS] Skills Catalog (Coming Soon)

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminSkillsPage.tsx`

**Tasks:**
1. Create placeholder page with "Coming Soon" message
2. Add route and sidebar link

**Review checkpoint:** Skills page shows Coming Soon.

> **MODULE COMPLETE** — [PHASE-4-SKILLS] done. Say: **"Start next module"** to continue.

---

## [PHASE-4-ADMIN-BILLING] Admin Billing

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminBillingPage.tsx`
- `src/modules/admin/components/BillingTenantPlans/` (create)
- `src/adapters/local/admin.adapter.ts` (extend)

**Tasks:**
1. Extend adminAdapter: `getBillingOverview()` (all tenants plans + usage)
2. BillingTenantPlans: table of tenants with plan, usage, cost
3. Compose in AdminBillingPage

**Review checkpoint:** Admin sees cross-tenant billing overview.

> **MODULE COMPLETE** — [PHASE-4-ADMIN-BILLING] done. Say: **"Start next module"** to continue.

---

**PHASE 4 REVIEW:** All modules implemented; each has small components; adapters used; no direct seed access.

> **PHASE 4 COMPLETE** — All modules done. Ready for Phase 5 (Guards). Say: **"Start Phase 5"** to continue.

---

# PHASE 5: Guards & Permissions

## [PHASE-5-GUARDS] Enhance Guards

**Status:** ✅ DONE

**Files:**
- `src/app/guards/TenantGuard.tsx`
- `src/app/guards/AdminGuard.tsx`
- `src/app/session/SessionContext.tsx` (ensure tenantId set for tenant users)

**Tasks:**
1. Ensure TenantGuard allows TENANT_OWNER, STAFF with tenantId
2. Add feature-level checks if needed (e.g. run_events for auditor only)
3. Login: ensure tenant users get tenantId in session

**Review checkpoint:** Role-based access works; no unauthorized access.

> **MODULE COMPLETE** — [PHASE-5-GUARDS] done. Say: **"Start next module"** to continue.

---

**PHASE 5 COMPLETE** — Guards done. Ready for Phase 6 (Data Layer). Say: **"Start Phase 6"** to continue.

---

# PHASE 6: Data Layer Consolidation

## [PHASE-6-SEED] Seed Data Extensions

**Status:** ✅ DONE

**Files:**
- `src/mock/seedData.ts`

**Tasks:**
1. Add all new exports per **Mock Data Files** section above: `seedTenantMemberships`, `seedStaffProfiles`, `seedVoiceAgents`, `seedSupportTickets`, `seedTicketMessages`, `seedAgentRuns`, `seedRunEvents`, `seedSkills`
2. Extend `seedTenants` with `status` (ACTIVE/TRIAL/SUSPENDED), `onboarding` (step, complete)

**Review checkpoint:** All adapters have data to display.

> **MODULE COMPLETE** — [PHASE-6-SEED] done. Say: **"Start next module"** to continue.

---

## [PHASE-6-ADAPTERS] Adapter Index & Exports

**Status:** ✅ DONE

**Files:**
- `src/adapters/index.ts`

**Tasks:**
1. Export all new adapters: staff, agents, support, runs, reports, tenants
2. Wire VITE_DATA_MODE for local vs api (api can be stubs)

**Review checkpoint:** Adapters index clean; no circular deps.

> **MODULE COMPLETE** — [PHASE-6-ADAPTERS] done. Say: **"Start next module"** to continue.

---

**PHASE 6 COMPLETE** — Data layer done. Ready for Phase 7A (Enhancements). Say: **"Start Phase 7A"** to continue.

---

# PHASE 7A: Enhancements (High Impact, Low Effort)

## [PHASE-7A-TOAST] Toast Notifications

**Status:** ✅ DONE

**Files:**
- `src/components/Toast/ToastProvider.tsx` (or add Sonner/Radix)
- `src/App.tsx` (wrap with provider)

**Tasks:**
1. Add toast library (e.g. sonner) or custom ToastProvider
2. Use `toast.success()` / `toast.error()` in mutation handlers (e.g. assign agent, create ticket)

**Review checkpoint:** Toasts appear on success/error actions.

> **MODULE COMPLETE** — [PHASE-7A-TOAST] done. Say: **"Start next module"** to continue.

---

## [PHASE-7A-EXPORT] CSV Export

**Status:** ✅ DONE

**Files:**
- `src/adapters/exportAdapter.ts`
- Add export button to Calls, Staff, Tickets tables

**Tasks:**
1. Create exportAdapter.exportCsv(data, filename)
2. Add Export button to relevant tables
3. Generate CSV from current table data

**Review checkpoint:** Export downloads CSV for calls, staff, tickets.

> **MODULE COMPLETE** — [PHASE-7A-EXPORT] done. Say: **"Start next module"** to continue.

---

## [PHASE-7A-AUDIT] Audit Log (Basic)

**Status:** ✅ DONE

**Files:**
- `src/adapters/auditAdapter.ts`
- `src/mock/seedData.ts` (seedAuditLog)
- Admin Settings or dedicated Audit page

**Tasks:**
1. Create auditAdapter.log(action, meta)
2. Call auditAdapter in key actions (create tenant, assign agent, disable staff)
3. Display audit log in admin (table)

**Review checkpoint:** Key actions are logged; admin can view log.

> **MODULE COMPLETE** — [PHASE-7A-AUDIT] done. Say: **"Start next module"** to continue.

---

## [PHASE-7A-DATERANGE] Custom Date Range Filters

**Status:** ✅ DONE

**Files:**
- `src/components/DateRangePicker/DateRangePicker.tsx`
- Integrate into Dashboard, Reports, Calls pages

**Tasks:**
1. Create DateRangePicker (presets: Last 7 days, This month, Custom)
2. Pass date range to adapters
3. Extend adapters to accept date filter

**Review checkpoint:** Date filter affects dashboard and reports.

> **MODULE COMPLETE** — [PHASE-7A-DATERANGE] done. Say: **"Start next module"** to continue.

---

## [PHASE-7A-COMMAND] Command Palette (⌘K)

**Status:** ✅ DONE

**Files:**
- `src/components/CommandPalette/CommandPalette.tsx`
- `src/App.tsx` or MainLayout (global listener)

**Tasks:**
1. Create CommandPalette with keyboard listener (Cmd/Ctrl+K)
2. Fuzzy search: tenants, agents, tickets, nav items
3. On select: navigate or run action

**Review checkpoint:** ⌘K opens palette; search and navigate work.

> **MODULE COMPLETE** — [PHASE-7A-COMMAND] done. Say: **"Start next module"** to continue.

---

**PHASE 7A COMPLETE** — Enhancements (Toast, Export, Audit, DateRange, Command) done. Ready for Phase 7B. Say: **"Start Phase 7B"** to continue.

---

# PHASE 7B: Enhancements (High Impact, Higher Effort)

## [PHASE-7B-GLOBAL-SEARCH] Global Search

**Status:** ✅ DONE

**Files:**
- `src/components/GlobalSearch/GlobalSearch.tsx`
- `src/adapters/local/search.adapter.ts` (create)
- `src/app/layout/Header/Header.tsx` (add search input)

**Tasks:**
1. Create searchAdapter.search(query) — search tenants, calls, staff, tickets
2. Header search input (or trigger from ⌘K)
3. Results dropdown with navigate on select

**Review checkpoint:** Global search finds and navigates to entities.

> **MODULE COMPLETE** — [PHASE-7B-GLOBAL-SEARCH] done. Say: **"Start next module"** to continue.

---

## [PHASE-7B-SCHEDULED-REPORTS] Scheduled Reports

**Status:** ✅ DONE

**Files:**
- Admin Settings > Scheduled Reports section
- `src/adapters/local/reports.adapter.ts` (extend)
- Backend/cron stub (or localStorage schedule config)

**Tasks:**
1. UI: configure weekly/monthly email digest (recipients, frequency)
2. Adapter: getScheduledReportConfig(), setScheduledReportConfig()
3. Note: Actual email sending requires backend; UI + config only for now

**Review checkpoint:** Admin can configure scheduled report preferences.

> **MODULE COMPLETE** — [PHASE-7B-SCHEDULED-REPORTS] done. Say: **"Start next module"** to continue.

---

## [PHASE-7B-CALENDAR] Calendar View

**Status:** ✅ DONE

**Files:**
- `src/components/Calendar/CalendarView.tsx`
- Route: `/staff/calendar` or `/bookings/calendar`
- `src/adapters/local/bookings.adapter.ts` (extend for calendar data)

**Tasks:**
1. Add FullCalendar or similar; or custom calendar component
2. Show appointments/availability by date
3. Integrate with staff_profiles.doctor.availability

**Review checkpoint:** Calendar displays appointments/availability.

> **MODULE COMPLETE** — [PHASE-7B-CALENDAR] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-COMPARISON-VIEWS] Comparison Views

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/components/TenantComparisonView/` — Admin tenant comparison
- `src/modules/reports/components/PeriodComparison/` — Tenant time period comparison
- `src/adapters/local/reports.adapter.ts` — getTenantComparison(), getPerformanceForPeriod()

**Tasks:**
1. Tenant comparison: Admin selects 2 tenants, sees metrics side by side (calls, bookings, conversion, escalation, duration, sentiment)
2. Time period comparison: Tenant Reports shows "vs last week" with % change indicators
3. Adapter: getTenantComparison(tenantIds, dateRange), getPerformanceForPeriod(tenantId, period)

**Review checkpoint:** Admin can compare tenants; tenants see period-over-period changes.

> **MODULE COMPLETE** — [PHASE-7-COMPARISON-VIEWS] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-CALL-ANALYTICS] Call Analytics

**Status:** ✅ DONE

**Files:**
- `src/modules/reports/components/SentimentChart/` — Sentiment distribution (positive/neutral/negative)
- `src/modules/reports/components/PeakHoursChart/` — Calls per hour (0–23)
- `src/modules/reports/components/OutcomesOverTimeChart/` — Outcomes by day (stacked bars)
- `src/adapters/local/reports.adapter.ts` — getSentimentDistribution(), getPeakHours(), getOutcomesByDay()

**Tasks:**
1. Sentiment distribution: buckets (positive ≥0.8, neutral 0.5–0.8, negative <0.5)
2. Peak hours: calls per hour with bar chart
3. Outcomes over time: booked/escalated/failed by day with stacked bars
4. Integrate into Reports page (tenant view)

**Review checkpoint:** Tenant Reports shows sentiment, peak hours, and outcomes-over-time charts.

> **MODULE COMPLETE** — [PHASE-7-CALL-ANALYTICS] done. Say: **"Start next module"** to continue.

---

## [PHASE-7B-2FA] 2FA / MFA

**Status:** ✅ DONE

**Placement:** Header → Manage Account → Security tab (not in Settings).

**Files:**
- `src/modules/auth/components/TwoFactorSetup.tsx`
- `src/modules/auth/components/TwoFactorVerify.tsx`
- Login flow extension
- TOTP library (e.g. speakeasy)

**Tasks:**
1. Setup flow: QR code, secret, verify
2. Login: prompt for TOTP code when 2FA enabled
3. Store 2FA status per user (localStorage or adapter)

**Review checkpoint:** Admin/tenant owner can enable 2FA; login requires code.

> **MODULE COMPLETE** — [PHASE-7B-2FA] done. Say: **"Start next module"** to continue.

---

## [PHASE-7B-I18N] i18n + RTL

**Status:** ✅ DONE

**Files:**
- `src/i18n/` (config, translations en.json, ar.json)
- `src/App.tsx` (wrap with I18nProvider)
- `dir="rtl"` support for Arabic

**Tasks:**
1. Add react-i18next or similar
2. Extract UI strings to translation files (en, ar)
3. RTL: apply dir="rtl" when locale is ar
4. Language switcher in Header or Settings

**Review checkpoint:** UI supports en/ar; RTL works for Arabic.

> **MODULE COMPLETE** — [PHASE-7B-I18N] done. Say: **"Start next module"** to continue.

---

**PHASE 7B COMPLETE** — Enhancements (Global Search, Scheduled Reports, Calendar, 2FA, i18n) done. Ready for Phase 7C. Say: **"Start Phase 7C"** to continue.

---

# PHASE 7C: Enhancements (Nice to Have / Backlog)

## [PHASE-7C-FEATURE-FLAGS] Feature Flags

**Status:** ✅ DONE

**Files:**
- `src/adapters/local/featureFlags.adapter.ts`
- Tenant Settings > Feature Flags section
- `tenant_settings.featureFlags` in seed

**Tasks:**
1. Adapter: getFeatureFlags(tenantId), setFeatureFlag(tenantId, key, value)
2. UI: toggle list (e.g. "Enable Reports", "Enable Calendar")
3. Use in guards or component visibility

**Review checkpoint:** Admin/tenant can toggle features per tenant.

> **MODULE COMPLETE** — [PHASE-7C-FEATURE-FLAGS] done. Say: **"Start next module"** to continue.

---

## [PHASE-7C-AGENT-SANDBOX] Agent Sandbox

**Status:** ✅ DONE

**Files:**
- `src/modules/admin/pages/AdminAgentSandboxPage.tsx`
- Mock call flow UI, outcome preview

**Tasks:**
1. Sandbox page: simulate call flow
2. Input: sample transcript or scenario
3. Output: predicted outcome, entities extracted
4. Stub/mock for now; real integration later

**Review checkpoint:** Sandbox page allows testing agent behavior.

> **MODULE COMPLETE** — [PHASE-7C-AGENT-SANDBOX] done. Say: **"Start next module"** to continue.

---

## [PHASE-7C-WEBHOOK-LOG] Webhook Event Log

**Status:** ✅ DONE

**Files:**
- Admin Settings > Integrations > Webhook Event Log
- `src/adapters/local/webhooks.adapter.ts`
- `webhook_events` seed/collection

**Tasks:**
1. Table: webhook calls, status, timestamp, retry option
2. Adapter: listWebhookEvents(), retryWebhook(id)
3. Seed sample events for demo

**Review checkpoint:** Admin can view and retry webhook events.

> **MODULE COMPLETE** — [PHASE-7C-WEBHOOK-LOG] done. Say: **"Start next module"** to continue.

---

## [PHASE-7C-PWA] PWA / Offline Support

**Status:** ✅ DONE

**Files:**
- `vite.config.ts` (PWA plugin)
- Service worker, manifest.json
- Offline indicator component

**Tasks:**
1. Add vite-plugin-pwa or similar
2. Cache critical assets and API responses
3. Show offline banner when navigator.onLine is false

**Review checkpoint:** App works offline for cached views.

> **MODULE COMPLETE** — [PHASE-7C-PWA] done. Say: **"Start next module"** to continue.

---

## [PHASE-7C-AB-TESTING] A/B Testing for Agents

**Status:** ✅ DONE

**Files:**
- Agent page: `AgentABTestSection` (version A/B split config)
- Reports: `ABComparisonReport` (comparison by agent version)
- `src/adapters/local/abTest.adapter.ts` (create)
- `src/adapters/local/reports.adapter.ts` (extend getOutcomesByVersion)

**Tasks:**
1. Store agent version per call/run ✅
2. Split traffic config (e.g. 50/50) ✅
3. Comparison report: outcomes by version ✅

**Review checkpoint:** Admin can run A/B test and compare outcomes.

> **MODULE COMPLETE** — [PHASE-7C-AB-TESTING] done. Say: **"Start next module"** to continue.

---

**PHASE 7C COMPLETE** — All Phase 7C enhancements done. Backlog items remain in Phase 7 table below.

---

# PHASE 7: Remaining Enhancements (7.1–7.8)

These are tagged for backlog; implement when Phase 7A–7C are done or as needed.

## [PHASE-7-SAVED-FILTERS] Saved Filters / Views

**Status:** ✅ DONE

**Files:**
- `src/adapters/local/savedFilters.adapter.ts`
- `src/shared/hooks/useSavedFilters.ts`
- `src/shared/ui/SavedFiltersDropdown/SavedFiltersDropdown.tsx`
- CallsPage, AdminSupportPage

**Tasks:**
1. Create savedFiltersAdapter (list, save, get, delete) — localStorage
2. Create useSavedFilters hook
3. Create SavedFiltersDropdown (save current, apply saved)
4. Integrate into CallsPage (outcome, dateRange), AdminSupportPage (tenant, status, priority)

**Review checkpoint:** User can save filter presets and apply them.

> **MODULE COMPLETE** — [PHASE-7-SAVED-FILTERS] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-SESSION-MGMT] Session Management (Timeout, Active Sessions)

**Status:** ✅ DONE

**Files:**
- `src/app/session/SessionContext.tsx` — idle timeout, activity tracking, extendSession
- `src/app/session/sessionConfig.ts` — timeout config (60 min)
- `src/modules/settings/components/SessionManagementSection/` — Active session UI
- `src/modules/account/components/AccountModal.tsx` — Session + 2FA in Security tab (Manage Account)

**Tasks:**
1. Idle timeout: 60 min inactivity → auto-logout with toast
2. Activity tracking: mousemove, keydown, click, scroll, touchstart
3. Warning toast 1 min before expiry
4. SessionManagementSection: started, last activity, expires in, Extend Session button
5. **Placement:** Header → Manage Account → Security tab. Not in Settings (per UI organization rule).

**Review checkpoint:** Session expires after 60 min idle; user extends via Manage Account → Security.

> **MODULE COMPLETE** — [PHASE-7-SESSION-MGMT] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-PII-MASKING] PII Masking Utility

**Status:** ✅ DONE

**Files:**
- `src/shared/utils/piiMask.ts` — maskEmail, maskPhone, maskName, maskInText
- `src/shared/hooks/usePiiMask.ts` — hook with toggle for auditors
- `src/shared/hooks/usePermissions.ts` — canViewUnmaskedPII (auditor, admin)
- TranscriptViewer, CustomersTable, CustomerDetailPage — integrated

**Tasks:**
1. maskEmail: j***@example.com
2. maskPhone: ***-***-1234
3. maskName: J*** D***
4. maskInText: replace emails/phones in transcripts
5. usePiiMask: masked by default; auditors can toggle Reveal PII
6. Transcript, customer list, customer detail: PII masked

**Review checkpoint:** PII masked in transcripts and customer data; auditors see Reveal PII toggle.

> **MODULE COMPLETE** — [PHASE-7-PII-MASKING] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-DATA-EXPORT-DELETE] Data Export / Delete (GDPR)

**Status:** ✅ DONE

**Files:**
- `src/adapters/local/gdpr.adapter.ts` — exportUserData, exportCustomerData, deleteUserData, deleteCustomerData
- `src/adapters/local/customers.adapter.ts` — filter soft-deleted customers
- Account modal: Export my data, Delete account (with confirmation)
- CustomerDetailPage: Export data, Delete customer (tenant_owner, clinic_admin)

**Tasks:**
1. exportUserData: JSON download (profile, 2FA status)
2. exportCustomerData: JSON download (customer, calls, bookings)
3. deleteUserData: clear 2FA, logout
4. deleteCustomerData: soft delete (localStorage), filter in customersAdapter
5. Account: Export my data + Delete account with confirmation
6. Customer detail: Export data + Delete customer with confirmation

**Review checkpoint:** User can export/delete account; tenant can export/delete customer (GDPR).

> **MODULE COMPLETE** — [PHASE-7-DATA-EXPORT-DELETE] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-MAINTENANCE-MODE] Maintenance Mode Banner

**Status:** ✅ DONE

**Files:**
- `src/adapters/local/maintenance.adapter.ts` — isEnabled, setEnabled, getMessage
- `src/components/MaintenanceBanner/` — banner component
- `src/app/layout/MainLayout.tsx` — banner above Header
- Admin System page — Enable/Disable toggle

**Tasks:**
1. maintenanceAdapter: localStorage, MAINTENANCE_CHANGED event
2. MaintenanceBanner: shows when enabled, custom message
3. MainLayout: banner at top for all authenticated users
4. Admin System: toggle button

**Review checkpoint:** Admin enables maintenance; banner appears for all users.

> **MODULE COMPLETE** — [PHASE-7-MAINTENANCE-MODE] done. Say: **"Start next module"** to continue.

---

## [PHASE-7-HEALTH-DASHBOARD] Health Dashboard (Retell, DB, API)

**Status:** ✅ DONE

**Files:**
- `src/adapters/local/admin.adapter.ts` — getSystemHealthExtended (Retell, DB, API, Stripe, Webhooks)
- `src/modules/admin/components/HealthDashboardSection/` — card layout for core services
- Admin System page — Health dashboard section

**Tasks:**
1. getSystemHealthExtended: Retell (Voice API), Database, API (Backend), Stripe, Webhooks
2. HealthDashboardSection: cards for Retell, DB, API with status badges
3. Admin System page: Health dashboard above Overall status

**Review checkpoint:** Admin sees Retell, DB, API health cards on System page.

> **MODULE COMPLETE** — [PHASE-7-HEALTH-DASHBOARD] done. Say: **"Start next module"** to continue.

---

| Tag | Enhancement | Section |
|-----|-------------|---------|
| [PHASE-7-BULK-ACTIONS] | Bulk actions (multi-select, bulk assign/archive/export) | 7.1 |
| [PHASE-7-SAVED-FILTERS] | Saved filters / views | 7.1 ✅ DONE |
| [PHASE-7-KEYBOARD-SHORTCUTS] | Keyboard shortcuts (N, G+D, etc.) | 7.1 ✅ DONE |
| [PHASE-7-SCHEDULED-REPORTS] | Scheduled reports (email digests) | 7.2 ✅ DONE |
| [PHASE-7-COMPARISON-VIEWS] | Comparison views (tenants, time periods) | 7.2 ✅ DONE |
| [PHASE-7-CALL-ANALYTICS] | Call analytics (sentiment, outcomes, peak hours) | 7.2 ✅ DONE |
| [PHASE-7-ROI-DASHBOARD] | ROI dashboard widget | 7.2 ✅ DONE |
| [PHASE-7-SESSION-MGMT] | Session management (timeout, active sessions) | 7.3 ✅ DONE |
| [PHASE-7-PII-MASKING] | PII masking utility | 7.3 ✅ DONE |
| [PHASE-7-DATA-EXPORT-DELETE] | Data export / delete (GDPR) | 7.3 ✅ DONE |
| [PHASE-7-MAINTENANCE-MODE] | Maintenance mode banner | 7.4 ✅ DONE |
| [PHASE-7-HEALTH-DASHBOARD] | Health dashboard (Retell, DB, API) | 7.4 ✅ DONE |
| [PHASE-7-SOFT-DELETE] | Soft delete (tenants, staff) | 7.4 ✅ DONE |
| [PHASE-7-PROVIDER-AVAILABILITY] | Provider availability matrix | 7.5 ✅ DONE |
| [PHASE-7-APPOINTMENT-REMINDERS] | Appointment reminders config | 7.5 |
| [PHASE-7-PMS-INTEGRATION] | PMS integration stubs | 7.5 |
| [PHASE-7-MULTI-LOCATION] | Multi-location support | 7.5 |
| [PHASE-7-CUSTOM-PROMPTS] | Custom prompts per tenant | 7.6 |
| [PHASE-7-CALL-REPLAY] | Call replay (step-through transcript) | 7.6 |
| [PHASE-7-INTENT-ANALYTICS] | Intent analytics | 7.6 |
| [PHASE-7-SCREEN-READER] | Screen reader / ARIA audit | 7.7 |
| [PHASE-7-HIGH-CONTRAST] | High contrast mode | 7.7 |
| [PHASE-7-VIRTUALIZED-LISTS] | Virtualized lists (large tables) | 7.8 |
| [PHASE-7-OPTIMISTIC-UPDATES] | Optimistic updates | 7.8 |
| [PHASE-7-SKELETON-LOADING] | Skeleton loading (all data pages) | 7.8 |

---

# Module Completion Checklist Template

After each module, run:

- [ ] Linter passes (`npm run lint`)
- [ ] No monolithic components (>80 lines without extraction)
- [ ] JSDoc on exported components/hooks
- [ ] Adapters used; no direct seed access
- [ ] Shared UI reused where possible
- [ ] Tag marked ✅ DONE in this file

---

# Quick Reference: Tag List

| Tag | Module |
|-----|--------|
| [PHASE-1-ROLES] | Role model |
| [PHASE-1-ENTITIES] | Entity types |
| [PHASE-2-SIDEBAR-NAV] | Nav structure |
| [PHASE-2-SIDEBAR-ADMIN] | Admin sidebar |
| [PHASE-2-SIDEBAR-TENANT] | Tenant sidebar |
| [PHASE-3-ROUTES] | Routing |
| [PHASE-4-ADMIN-DASHBOARD] | Admin dashboard |
| [PHASE-4-TENANT-DASHBOARD] | Tenant dashboard |
| [PHASE-4-TENANT-DETAILS] | Admin Tenant Details page |
| [PHASE-4-TENANT-WIZARD] | Add Tenant Wizard |
| [PHASE-4-STAFF] | Staff module |
| [PHASE-4-TENANT-AGENT] | Tenant Agent Overview page |
| [PHASE-4-AGENTS] | Admin Agents module |
| [PHASE-4-SUPPORT] | Support / Help Center |
| [PHASE-4-REPORTS] | Reports |
| [PHASE-4-RUNS] | Runs & Logs |
| [PHASE-4-SETTINGS] | Settings |
| [PHASE-4-SKILLS] | Skills (Coming Soon) |
| [PHASE-4-ADMIN-BILLING] | Admin Billing |
| [PHASE-5-GUARDS] | Guards |
| [PHASE-6-SEED] | Seed data |
| [PHASE-6-ADAPTERS] | Adapters index |
| [PHASE-7A-TOAST] | Toast notifications |
| [PHASE-7A-EXPORT] | CSV export |
| [PHASE-7A-AUDIT] | Audit log |
| [PHASE-7A-DATERANGE] | Date range filters |
| [PHASE-7A-COMMAND] | Command palette |
| [PHASE-7B-GLOBAL-SEARCH] | Global search |
| [PHASE-7B-SCHEDULED-REPORTS] | Scheduled reports |
| [PHASE-7B-CALENDAR] | Calendar view |
| [PHASE-7B-2FA] | 2FA / MFA |
| [PHASE-7B-I18N] | i18n + RTL |
| [PHASE-7C-FEATURE-FLAGS] | Feature flags |
| [PHASE-7C-AGENT-SANDBOX] | Agent sandbox |
| [PHASE-7C-WEBHOOK-LOG] | Webhook event log |
| [PHASE-7C-PWA] | PWA / offline |
| [PHASE-7C-AB-TESTING] | A/B testing for agents |

---

## Milestone 1 (Lean) Recommendation

For a lean first release:

1. **Implement:** Sidebar restructure (both portals), route scaffolding, Admin Dashboard widgets, Tenant Dashboard widgets, Staff module (basic), Add Tenant Wizard (Step 1A only), Help Center (basic create + list)
2. **Hide behind "Coming Soon":** Skills Catalog, Billing admin view (if not critical)
3. **Defer:** Runs & Logs debug view, CSV import, full onboarding flow (Step 1B + email)

---

## Key Files to Modify/Create (from Plan)

| Action | Path |
|--------|------|
| Modify | src/shared/types/session.ts, entities.ts |
| Modify | src/app/layout/Sidebar/Sidebar.tsx |
| Modify | src/app/router.tsx |
| Create | src/modules/admin/pages/AdminTenantWizardPage.tsx |
| Create | src/modules/admin/pages/AdminTenantDetailPage.tsx |
| Create | src/modules/admin/pages/AdminAgentsPage.tsx |
| Create | src/modules/admin/pages/AdminStaffPage.tsx |
| Create | src/modules/admin/pages/AdminSupportPage.tsx |
| Create | src/modules/admin/pages/AdminBillingPage.tsx |
| Create | src/modules/admin/pages/AdminSettingsPage.tsx |
| Create | src/modules/tenant/agent/AgentPage.tsx |
| Create | src/modules/tenant/staff/StaffPage.tsx |
| Create | src/modules/tenant/reports/ReportsPage.tsx |
| Create | src/modules/tenant/help/HelpCenterPage.tsx |
| Create | src/modules/tenant/settings/SettingsPage.tsx |
| Extend | src/mock/seedData.ts, adapters |

### Enhancement-Related Files

| Action | Path |
|--------|------|
| Create | src/components/CommandPalette/CommandPalette.tsx |
| Create | src/components/Toast/ToastProvider.tsx |
| Create | src/shared/hooks/useHotkeys.ts |
| Create | src/adapters/exportAdapter.ts |
| Create | src/adapters/auditAdapter.ts |
| Create | src/components/DateRangePicker/DateRangePicker.tsx |
| Create | src/components/Calendar/CalendarView.tsx |
| Create | src/i18n/ (translations, config) |
| Create | src/components/VirtualTable/VirtualTable.tsx |

---



---

## Architecture (from Plan)

```
Platform Layer → Admin Portal
Tenant Boundary (tenantId) → Tenant Portal
Roles: SYSTEM_ADMIN | TENANT_OWNER/clinic_admin | doctor | receptionist | auditor
Adapters: adminAdapter, staffAdapter, agentsAdapter, supportAdapter, runsAdapter → Seed Data / API
```

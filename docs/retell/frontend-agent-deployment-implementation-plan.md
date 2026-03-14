# Frontend Implementation Plan - Agent Deployment UI

## Objective

Deliver production-ready admin and tenant frontend behavior for:
- template-driven tenant onboarding
- agent instance deployment actions
- per-channel deployment visibility and error handling

This plan is aligned with the backend routes already available.

---

## Phase 1 - Stabilize Adapter Contracts

### Goals

- Standardize API response mapping for templates, tenants, agents, and deployments.
- Ensure adapters return predictable typed defaults even on partial payloads.

### Files

- `apps/prototype/src/adapters/api/tenants.adapter.ts`
- `apps/prototype/src/adapters/api/agents.adapter.ts`
- `apps/prototype/src/shared/types/admin.ts`

### Tasks

- Add dedicated interfaces for:
  - `AgentTemplateOption`
  - `AgentInstanceSummary`
  - `ChannelDeploymentSummary`
- Normalize status and channel mapping in one place.
- Remove fragile shape assumptions from components and keep them in adapters.

### Acceptance criteria

- API mode tenant onboarding works with template list and create payload.
- No UI component directly parses raw backend records.

---

## Phase 2 - Tenant Onboarding Deploy UX

### Goals

- Make step-2 template selection reliable, informative, and safe.

### Files

- `apps/prototype/src/modules/admin/components/AddTenantModal/AddTenantModal.tsx`
- `apps/prototype/src/modules/admin/components/TenantWizard/TenantWizardStep2DeployAgent.tsx`
- `apps/prototype/src/modules/admin/hooks/useAdminTenantCreation.ts`

### Tasks

- Improve loading, empty, and failure states for template loading.
- Show channel and capability metadata per template option.
- Add validation to prevent accidental deploy with invalid selection state.
- Keep skip flow explicit and user-friendly.

### Acceptance criteria

- Admin can create tenant with template and without template.
- Success and failure feedback is clear and consistent.

---

## Phase 3 - Admin Deployment Management

### Goals

- Provide deploy controls and deployment visibility from admin UI.

### Files

- `apps/prototype/src/modules/admin/pages/AdminAgentsPage.tsx`
- `apps/prototype/src/modules/admin/hooks/useAdminAgents.ts`
- `apps/prototype/src/adapters/api/agents.adapter.ts`

### Tasks

- Add adapter methods for:
  - deploy manual action (`/api/v1/admin/agents/:id/deploy`)
  - agent deployment listing (`/api/admin/agents/:id/deployments`)
  - tenant agent listing (`/api/admin/agents/tenants/:tenantId`)
- Add per-row deploy action with loading/disabled state.
- Add deployment panel/table with per-channel statuses and errors.

### Acceptance criteria

- Admin can trigger deploy and see resulting deployment records.
- Throttle and auth errors are surfaced as friendly messages.

---

## Phase 4 - Tenant Deployment Visibility

### Goals

- Expose deployment status clearly for tenant users.

### Files

- `apps/prototype/src/modules/tenant/components/TenantDetailTabs/TenantAgentsTab.tsx`
- `apps/prototype/src/modules/tenant/hooks/useTenantDetail.ts`
- `apps/prototype/src/adapters/api/agents.adapter.ts`

### Tasks

- Add adapter method for `/api/tenant/agents/:id/deployments`.
- Render deployment rows by channel in tenant view.
- Show status badges, timestamp, and failure reason where present.

### Acceptance criteria

- Tenant users can see deployment progress and failure states without admin access.

---

## Phase 5 - Reliability and UX Hardening

### Goals

- Make deployment interactions resilient under real runtime conditions.

### Tasks

- Add refresh/polling strategy for queued/deploying transitions.
- Prevent duplicate action submissions while requests are in flight.
- Handle `401`, `403`, `429`, and network failures consistently.
- Add retry affordances where safe.

### Acceptance criteria

- No duplicate deploys from rapid clicks.
- Users receive clear guidance when requests are blocked or throttled.

---

## Phase 6 - QA and Rollout Readiness

### Goals

- Verify API mode behavior and guard local mode compatibility.

### Tasks

- Manual smoke checks:
  - create tenant with template
  - create tenant without template
  - manual deploy existing agent
  - view failed deployment error output
- Verify navigation and state refresh after deploy actions.
- Confirm no regression in local data mode fallback behavior.

### Acceptance criteria

- Build passes.
- Core deployment flows are validated and implementation-ready for release.

---

## Implementation Notes

- Prefer versioned deploy endpoint for manual deploy calls:
  - `POST /api/v1/admin/agents/:id/deploy`
- Keep adapter layer as the single contract boundary with backend.
- Avoid direct API calls from components; use hooks plus adapters.
- Keep deployment state rendering channel-aware (chat, voice, email).

# Prompt: Agent Deployment UI - Clinic CRM Definition and Extension Guide

Use this prompt to understand, extend, and customize the Agent Deployment UI for the clinic CRM platform (admin and tenant), aligned with the current backend rollout.

## Purpose

This prompt defines how agent deployment works in this codebase:
- Admin creates tenants and can select a template during onboarding.
- Tenant-specific agent instances are created from templates.
- Deployments are tracked by channel and exposed for admin and tenant visibility.
- Manual deploy is supported through admin endpoints (including versioned route).

It is written so contributors can extend behavior without reading the full repository first.

---

## Product Scope (Current)

The frontend deployment UX currently has two practical flows:

1. Tenant creation with optional initial template deployment.
2. Agent instance and deployment management visibility for admin and tenant.

---

## Flow A: New Tenant + Initial Agent Deployment

### What it does

Admin onboarding wizard:
- Step 1: clinic and owner information.
- Step 2: template selection (or skip).
- Submit: creates tenant and optionally includes template/channel deployment inputs.

### Main frontend components

- `apps/prototype/src/modules/admin/components/AddTenantModal/AddTenantModal.tsx`
- `apps/prototype/src/modules/admin/components/TenantWizard/TenantWizardStep1ClinicInfo.tsx`
- `apps/prototype/src/modules/admin/components/TenantWizard/TenantWizardStep2DeployAgent.tsx`
- `apps/prototype/src/modules/admin/hooks/useAdminTenantCreation.ts`
- `apps/prototype/src/adapters/api/tenants.adapter.ts`

### Data flow

1. Admin opens Add Tenant from Admin Tenants page.
2. Step 2 loads template catalog from `/admin/templates` via adapter.
3. On submit, frontend calls `/admin/tenants`.
4. If template selected, payload includes `templateId` and `channelsEnabled` when available.
5. Backend creates tenant, creates agent instance, and enqueues deployment (feature flag controlled).

### How to extend

- Add onboarding steps by extending step state and navigation in `AddTenantModal`.
- Add pre-submit validation in step components and before create call.
- Add post-success actions (navigation, event tracking, handoff links).
- Add additional template metadata mapping in `tenants.adapter.ts`.

---

## Flow B: Agent Deployment Management (Admin and Tenant)

### What it does

Shows agent instances and deployment records, and allows manual deploy by admin.

### Backend endpoints used by frontend

- `GET /api/admin/templates`
- `POST /api/admin/tenants`
- `GET /api/admin/agents/tenants/:tenantId`
- `POST /api/admin/agents/tenants/:tenantId`
- `POST /api/admin/agents/:id/deploy`
- `POST /api/v1/admin/agents/:id/deploy`
- `GET /api/admin/agents/:id/deployments`
- `GET /api/tenant/agents/:id/deployments`
- `GET /api/tenant/agents`

### Related frontend files

- `apps/prototype/src/adapters/api/agents.adapter.ts`
- `apps/prototype/src/adapters/api/tenants.adapter.ts`
- `apps/prototype/src/modules/admin/pages/AdminAgentsPage.tsx`
- `apps/prototype/src/modules/admin/hooks/useAdminAgents.ts`
- `apps/prototype/src/modules/tenant/components/TenantDetailTabs/TenantAgentsTab.tsx`
- `apps/prototype/src/modules/tenant/hooks/useTenantDetail.ts`

### Data shape expectations

Agent instance surface in UI should include:
- `id`, `name`, `status`
- `channel` and/or `channelsEnabled`
- `deployedAt`, `lastSyncedAt`

Deployment rows should include:
- `channel`, `provider`, `status`
- `retellAgentId`, `retellConversationFlowId`
- `error` for failure visibility

### How to extend

- Add deployment actions in admin hooks/pages and map new APIs in adapters.
- Add deployment timeline and retries in details tabs.
- Add channel-specific rendering for chat/voice/email status states.
- Add polling/refresh strategy for queued or deploying states.

---

## Shared UI Behaviors

- Status badges for agent and deployment states.
- Toast feedback for create/deploy success and failures.
- Auth-aware error handling for 401/403 and throttle behavior for 429.
- Explicit loading and empty states for templates and deployments.

---

## File Map (Quick Reference)

| Purpose | Files |
| --- | --- |
| Tenant onboarding deployment flow | `AddTenantModal.tsx`, `TenantWizardStep2DeployAgent.tsx`, `useAdminTenantCreation.ts`, `tenants.adapter.ts` |
| Admin agent deployment management | `AdminAgentsPage.tsx`, `useAdminAgents.ts`, `agents.adapter.ts` |
| Tenant deployment visibility | `TenantAgentsTab.tsx`, `useTenantDetail.ts` |
| Adapter entry | `apps/prototype/src/adapters/index.ts` |
| Shared HTTP client | `apps/prototype/src/lib/apiClient.ts` |

---

## Extensibility Checklist

When changing behavior:

- New onboarding step:
  - add component
  - wire step state and navigation
  - add validation and payload merge
- New deployment action:
  - add adapter API method
  - wire action in hook/page
  - handle loading, success, error states
- Deployment history UI:
  - add typed adapter response for `/deployments`
  - render channel rows with timestamps and errors
- New environment or channel:
  - extend frontend enums/mappers
  - align backend payload and validation
- New entry point:
  - open existing onboarding modal with same state contract

---

## Customization Examples

- Add deploy preflight checklist before submit.
- Add "retry failed channel" action from deployment history.
- Add deployment notes/tags metadata per deployment.
- Add auto-refresh for deployment state transitions.
- Add channel-specific setup guidance in wizard review.

---

## Prompt Usage

Use this prompt to:
- Understand existing deployment UX and data flow.
- Extend onboarding and deployment management safely.
- Keep frontend aligned with backend deployment architecture.
- Onboard new developers quickly.

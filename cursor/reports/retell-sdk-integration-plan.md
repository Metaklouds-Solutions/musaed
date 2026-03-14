# Retell SDK Integration Plan — Clinic CRM

> **Purpose:** Map Retell API capabilities to clinic-crm tenant/admin needs and define implementation steps for a complete Retell-driven system.

---

## 1. Retell API Surface (Summary)

### 1.1 Agents (Voice & Chat)

| API | Method | Purpose |
|-----|--------|---------|
| Create Voice Agent | `POST /create-agent` | Create voice agent |
| Get Voice Agent | `GET /get-agent/{agent_id}` | Get agent details |
| List Voice Agents | `POST /list-agents` | List agents |
| Update Voice Agent | `PATCH /update-agent/{agent_id}` | Update agent |
| Delete Agent | `DELETE /delete-agent/{agent_id}` | Delete agent |
| Publish Agent | `POST /publish-agent/{agent_id}` | Publish version |
| Get Agent Versions | `GET /get-agent-versions/{agent_id}` | List versions |
| Create Chat Agent | `POST /create-chat-agent` | Create chat agent |
| Get Chat Agent | `GET /get-chat-agent/{agent_id}` | Get chat agent |
| List Chat Agents | `POST /list-chat-agents` | List chat agents |
| Update Chat Agent | `PATCH /update-chat-agent/{agent_id}` | Update chat agent |
| Delete Chat Agent | `DELETE /delete-chat-agent/{agent_id}` | Delete chat agent |
| Publish Chat Agent | `POST /publish-chat-agent/{agent_id}` | Publish version |

### 1.2 Calls

| API | Method | Purpose |
|-----|--------|---------|
| Create Web Call | `POST /v2/create-web-call` | Create web call → returns `access_token`, `call_id` |
| Create Phone Call | `POST /create-phone-call` | Outbound phone call |
| Get Call | `GET /v2/get-call/{call_id}` | Full call details (transcript, recording, analysis) |
| List Calls | `POST /v2/list-calls` | List calls with filters |
| Update Call | `PATCH /v2/update-call/{call_id}` | Update call metadata |
| Delete Call | `DELETE /v2/delete-call/{call_id}` | Delete call |

### 1.3 Conversation Flows & Components

| API | Method | Purpose |
|-----|--------|---------|
| Create Conversation Flow | `POST /create-conversation-flow` | Create flow |
| Get Conversation Flow | `GET /get-conversation-flow/{id}` | Get flow |
| List Conversation Flows | `POST /list-conversation-flows` | List flows |
| Update Conversation Flow | `PATCH /update-conversation-flow/{id}` | Update flow |
| Delete Conversation Flow | `DELETE /delete-conversation-flow/{id}` | Delete flow |
| Flow Components | CRUD | Create/update/delete flow components |

### 1.4 Other (Lower Priority for MVP)

- **Chat:** Create Chat, Get Chat, List Chats, Chat Completions, SMS
- **Phone Numbers:** Create, Import, List, Update, Delete
- **Voices:** Add, Clone, Search, List, Get
- **Knowledge Bases:** Create, List, Add Sources, Delete
- **Retell LLM:** Create, Update, List, Delete custom LLMs
- **Testing:** Batch tests, test case definitions, test runs
- **Account:** Get Concurrency

---

## 2. Current Clinic-CRM State

### 2.1 Already Implemented

| Component | Status | Notes |
|-----------|--------|-------|
| **RetellClient** | Custom fetch | `createAgent`, `createChatAgent`, `createConversationFlow`, `deleteAgent`, `deleteConversationFlow`, `probeConnectivity` |
| **Agent Deployments** | ✅ | Spin-up creates Retell agents/flows per channel |
| **Webhooks** | ✅ | `call_started`, `call_ended`, `call_analyzed` → CallSession upsert |
| **Call Sessions (DB)** | ✅ | `callId`, transcript, summary, sentiment, outcome |
| **Calls API** | ✅ | `GET /tenant/calls`, `GET /admin/calls`, `GET /:id` by MongoDB `_id` |
| **Health** | ✅ | Retell connectivity probe |

### 2.2 Gaps

| Gap | Impact |
|-----|--------|
| No `getCall(callId)` | Cannot fetch full Retell call details (recording URL, latency, transcript_object) |
| No `createWebCall` | Cannot start web calls from frontend |
| No `listCalls` from Retell | Rely only on webhooks; no reconciliation |
| No `getAgent` / `getChatAgent` | TODO in `agents.service.ts` for config snapshot |
| Raw fetch client | No SDK types, more boilerplate |

---

## 3. Endpoint Mapping: Tenant vs Admin

### 3.1 Tenant (Clinic) Scope

| Use Case | Retell API | Backend Endpoint | Frontend |
|----------|------------|------------------|----------|
| List my clinic's calls | — | `GET /api/tenant/calls` | Calls list (from DB) |
| Get call detail by MongoDB id | — | `GET /api/tenant/calls/:id` | Call detail |
| Get call detail by Retell call_id | `GET /v2/get-call/{call_id}` | `GET /api/tenant/calls/by-retell/:callId` (new) | Enrich detail with recording, latency |
| Start web call (patient) | `POST /v2/create-web-call` | `POST /api/tenant/calls/web-call` (new) | Returns `access_token` for widget |
| View transcript, recording | `GET /v2/get-call/{call_id}` | Merge into call detail | Call detail UI |

### 3.2 Admin Scope

| Use Case | Retell API | Backend Endpoint | Frontend |
|----------|------------|------------------|----------|
| List all calls (filter by tenant) | — | `GET /api/admin/calls` | Admin calls list |
| Get call detail | `GET /v2/get-call/{call_id}` | Enrich `GET /api/admin/calls/:id` | Admin call detail |
| List calls from Retell (reconciliation) | `POST /v2/list-calls` | Background job or admin tool | Optional backfill |
| Get agent config from Retell | `GET /get-agent/{id}` | `GET /api/admin/agents/:id/retell-config` | Agent detail |

---

## 4. Implementation Plan

### Phase 1: Retell SDK + Call Enrichment (Priority)

**Goal:** Use `retell-sdk`, add `getCall`, enrich call detail with Retell data.

| Task | Files | Description |
|------|-------|-------------|
| 1.1 Install `retell-sdk` | `apps/backend/package.json` | `npm i retell-sdk` |
| 1.2 Refactor RetellClient | `retell.client.ts` | Use SDK; keep same public interface; add `getCall(callId)` |
| 1.3 Add getCall to CallsService | `calls.service.ts` | `enrichFromRetell(callId)` → fetch from Retell, merge recording_url, transcript_object, latency |
| 1.4 New endpoint: by-retell-id | `calls.controller.ts` | `GET /tenant/calls/by-retell/:callId`, `GET /admin/calls/by-retell/:callId` |
| 1.5 Update call detail response | `calls.service.ts` | When call has `callId`, optionally enrich with Retell if requested |

### Phase 2: Create Web Call (Tenant)

**Goal:** Tenant can start a web call from their site.

| Task | Files | Description |
|------|-------|-------------|
| 2.1 Add `createWebCall` to RetellClient | `retell.client.ts` | `createWebCall({ agent_id, metadata? })` |
| 2.2 New endpoint | `calls.controller.ts` | `POST /api/tenant/calls/web-call` — body: `{ agentInstanceId }`, returns `{ access_token, call_id }` |
| 2.3 Tenant guard | — | Ensure agent belongs to tenant |
| 2.4 Frontend | Widget / SDK | Use `access_token` to join web call |

### Phase 3: Agent Sync (Admin)

**Goal:** Admin can see live Retell agent config.

| Task | Files | Description |
|------|-------|-------------|
| 3.1 Add `getAgent`, `getChatAgent` to RetellClient | `retell.client.ts` | Resolve TODO in agents.service |
| 3.2 Agent detail enrichment | `agents.service.ts` | Call Retell GET agent when loading agent detail |
| 3.3 Admin agent config endpoint | `agents.controller.ts` | `GET /api/admin/agents/:id/retell-config` |

### Phase 4: List Calls from Retell (Optional)

**Goal:** Reconciliation / backfill when webhooks miss events.

| Task | Files | Description |
|------|-------|-------------|
| 4.1 Add `listCalls` to RetellClient | `retell.client.ts` | `listCalls({ filter_criteria, ... })` |
| 4.2 Background job or admin tool | New module | Periodically sync Retell calls into CallSession |
| 4.3 Admin "Sync from Retell" action | — | Manual trigger for tenant |

### Phase 5: Deferred (Post-MVP)

- Create Phone Call (outbound)
- Chat / SMS APIs
- Phone number management
- Knowledge bases
- Batch tests

---

## 5. RetellClient Method Additions

```typescript
// New methods to add (after SDK migration)

/** Get full call details from Retell (transcript, recording, latency, analysis). */
async getCall(callId: string): Promise<V2CallResponse>;

/** Create web call; returns access_token for frontend widget. */
async createWebCall(params: { agent_id: string; metadata?: Record<string, unknown> }): Promise<V2WebCallResponse>;

/** List calls with filters (for reconciliation). */
async listCalls(params: ListCallsParams): Promise<ListCallsResponse>;

/** Get voice agent config (for admin sync). */
async getAgent(agentId: string): Promise<AgentResponse>;

/** Get chat agent config (for admin sync). */
async getChatAgent(agentId: string): Promise<ChatAgentResponse>;
```

---

## 6. Tenant vs Admin Access Matrix

| Resource | Tenant | Admin |
|----------|--------|-------|
| List calls | Own tenant only | All tenants (filterable) |
| Get call by MongoDB id | Own tenant only | Any |
| Get call by Retell call_id | Own tenant only (agent in tenant) | Any |
| Create web call | Own tenant agents only | — |
| Get Retell agent config | — | Any |
| Sync from Retell | — | Any tenant |

---

## 7. Security & Isolation

- **Tenant:** All call/agent access must validate `tenantId` from JWT against resource ownership.
- **Admin:** JWT must have admin role; can access any tenant.
- **Retell API key:** Server-side only; never exposed to frontend.
- **Web call access_token:** Short-lived; passed to frontend only for joining a specific call.

---

## 8. Next Steps

1. **Immediate:** Phase 1 — Install SDK, add `getCall`, enrich call detail.
2. **Short-term:** Phase 2 — Create web call for tenant.
3. **Medium-term:** Phase 3 — Agent config sync for admin.
4. **Optional:** Phase 4 — List calls reconciliation.

---

*Generated for clinic-crm Retell integration. Align with `docs/retell/retell-admin-tenant-full-roadmap.md` for MVP scope.*

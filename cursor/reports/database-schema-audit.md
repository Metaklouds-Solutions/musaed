# Database Schema Audit Report

**Date:** 2026-03-11
**Scope:** All 19 Mongoose schemas in `apps/backend/src/`
**Auditor:** Automated Schema Analysis

---

## Executive Summary

| Category | Total Issues |
|---|---|
| **CRITICAL** — Data integrity / multi-tenant isolation gaps | 3 |
| **HIGH** — Missing indexes impacting query performance | 5 |
| **MEDIUM** — Missing validation / enum constraints | 14 |
| **LOW** — Missing toJSON transforms / inconsistencies | 12 |

---

## 1. Per-Schema Findings

### 1.1 User (`src/users/schemas/user.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `email` (unique), `role`, `status` (inline), `deletedAt` (sparse) |
| tenantId indexed | N/A | Users are global, not tenant-scoped |
| toJSON transform | ✅ | Strips `passwordHash` |
| toObject transform | ⚠️ MEDIUM | **Missing** — `.toObject()` calls will leak `passwordHash` |
| References | ✅ | Standalone entity |
| Required fields | ✅ | `email`, `name`, `role` |
| Enum constraints | ✅ | `role`, `status` both constrained |

**Recommendations:**
- Add `toObject` transform identical to `toJSON` to prevent accidental `passwordHash` exposure via `.toObject()` or `.lean()` calls

---

### 1.2 Tenant (`src/tenants/schemas/tenant.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `slug` (unique), `ownerId`, `status`, `stripeCustomerId` (sparse) |
| tenantId indexed | N/A | This IS the tenant entity |
| toJSON transform | ⚠️ MEDIUM | **Missing** — `stripeCustomerId` and `stripeSubscriptionId` exposed in API responses |
| References | ✅ | `ownerId` → User, `planId` → SubscriptionPlan |
| Required fields | ✅ | `name`, `slug`, `status`, `ownerId` |
| Enum constraints | ✅ | `status` constrained |
| deletedAt index | ⚠️ LOW | `deletedAt` field exists but has **no sparse index** (unlike other schemas) |

**Recommendations:**
- Add `toJSON`/`toObject` transforms to strip `stripeCustomerId`, `stripeSubscriptionId`
- Add `TenantSchema.index({ deletedAt: 1 }, { sparse: true })`
- Add enum constraint on `AppointmentRemindersConfig.channel` (`['email', 'sms', 'whatsapp']`)

---

### 1.3 TenantStaff (`src/tenants/schemas/tenant-staff.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `userId+tenantId` (unique compound), `tenantId` standalone |
| tenantId indexed | ✅ | Both standalone and compound |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `userId` → User, `tenantId` → Tenant |
| Required fields | ✅ | `userId`, `tenantId`, `roleSlug`, `status` |
| Enum constraints | ✅ | `roleSlug`, `status` both constrained |

**Status: CLEAN** — No issues found.

---

### 1.4 RefreshToken (`src/auth/schemas/refresh-token.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ⚠️ HIGH | `token` (unique), `expiresAt` (TTL) — **missing `userId` index** |
| tenantId indexed | N/A | Auth tokens are user-scoped |
| toJSON transform | ⚠️ MEDIUM | **Missing** — raw `token` value could leak if serialized |
| References | ✅ | `userId` → User |
| Required fields | ✅ | `token`, `userId`, `expiresAt` |
| Enum constraints | N/A | No enum fields |

**Recommendations:**
- Add `RefreshTokenSchema.index({ userId: 1 })` — needed for "revoke all tokens for user" and "find active sessions" queries
- Add `toJSON` transform to strip `token` field
- Consider indexing `revokedAt` for revocation checks

---

### 1.5 InviteToken (`src/auth/schemas/invite-token.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `userId` (inline), `token` (inline unique), `expiresAt` (TTL inline) |
| tenantId indexed | ⚠️ MEDIUM | **No `tenantId` field** — invites can't be scoped per tenant |
| toJSON transform | ⚠️ MEDIUM | **Missing** — raw `token` value could leak |
| References | ✅ | `userId` → User |
| Required fields | ✅ | `userId`, `token`, `type`, `expiresAt` |
| Enum constraints | ✅ | `type` constrained |

**Recommendations:**
- Add `toJSON` transform to strip `token`
- Consider adding `tenantId` to scope invites per tenant

---

### 1.6 AgentInstance (`src/agent-instances/schemas/agent-instance.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ⚠️ HIGH | `tenantId`, `status`, `retellAgentId` (sparse) — **missing `templateId` index** |
| tenantId indexed | ✅ | Standalone index exists |
| tenantId required | 🔴 **CRITICAL** | `tenantId` has `default: null` instead of `required: true` — **breaks multi-tenant isolation** |
| toJSON transform | ⚠️ MEDIUM | **Missing** — `retellAgentId`, `retellLlmId` are provider secrets |
| References | ⚠️ MEDIUM | `assignedToStaffIds` refs `'User'` but field name implies `'TenantStaff'` |
| Required fields | ⚠️ MEDIUM | Only `channel` and `status` are required; `name` defaults to `''` |
| Enum constraints | ✅ | `channelsEnabled`, `channel`, `status` constrained |

**Recommendations:**
- **CRITICAL:** Change `tenantId` to `{ required: true }` — agents without a tenant break tenant isolation
- Add `AgentInstanceSchema.index({ templateId: 1 })` for reverse lookups
- Add compound index `{ tenantId: 1, status: 1 }` for tenant-scoped status filtering
- Add `toJSON` transform to strip `retellAgentId`, `retellLlmId`
- Consider making `name` required
- Clarify `assignedToStaffIds` ref — should it reference `'TenantStaff'`?

---

### 1.7 AgentTemplate (`src/agent-templates/schemas/agent-template.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `channel`, `isDefault`, `name`, `slug` (unique sparse), `deletedAt` (sparse) |
| tenantId indexed | N/A | Templates are global/shared |
| toJSON transform | ⚠️ LOW | Missing — `webhookUrl`, `mcpServerUrl` could contain sensitive URLs |
| References | ✅ | `createdBy` → User |
| Required fields | ✅ | `name`, `channel` |
| Enum constraints | ⚠️ MEDIUM | `capabilityLevel` defaults to `'L1'` but has **no enum constraint** |

**Recommendations:**
- Add enum on `capabilityLevel` (e.g. `['L1', 'L2', 'L3']`)
- Consider `toJSON` transform for `webhookUrl` and `mcpServerUrl`

---

### 1.8 AgentChannelDeployment (`src/agent-deployments/schemas/agent-channel-deployment.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ Excellent | `tenantId`, `agentInstanceId`, `retellAgentId` (sparse), `deletedAt` (sparse), compound unique with partial filter |
| tenantId indexed | ✅ | Multiple indexes |
| toJSON transform | ⚠️ LOW | Missing |
| References | ✅ | `tenantId` → Tenant, `agentInstanceId` → AgentInstance, `createdBy` → User |
| Required fields | ✅ | `tenantId`, `agentInstanceId`, `channel`, `provider`, `status` |
| Enum constraints | ⚠️ MEDIUM | `channel` and `status` constrained, but `provider` has **no enum** (defaults to `'retell'`) |

**Recommendations:**
- Add enum on `provider` (e.g. `['retell', 'vapi', 'custom']`)

---

### 1.9 CallSession (`src/calls/schemas/call-session.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ Excellent | `callId` (unique), `tenantId+createdAt`, `tenantId+outcome`, `tenantId+metadata.intent`, `agentInstanceId+createdAt` |
| tenantId indexed | ✅ | Multiple compound indexes |
| toJSON transform | ⚠️ MEDIUM | **Missing** — `recordingUrl`, `transcript` are sensitive (PII, HIPAA-relevant) |
| References | ✅ | `tenantId` → Tenant, `agentInstanceId` → AgentInstance, `bookingId` → Booking |
| Required fields | ✅ | `tenantId`, `agentInstanceId`, `callId` |
| Enum constraints | ⚠️ MEDIUM | `status` and `outcome` constrained, but **`sentiment` has no enum** |

**Recommendations:**
- **HIGH PRIORITY:** Add `toJSON`/`toObject` transforms — `transcript`, `recordingUrl` contain patient data
- Add enum on `sentiment` (`['positive', 'negative', 'neutral', 'unknown']`)

---

### 1.10 Booking (`src/bookings/schemas/booking.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ Excellent | `tenantId+date`, `tenantId+date+status`, `tenantId+createdAt`, `customerId`, `tenantId+status+reminderSent+date` |
| tenantId indexed | ✅ | Multiple compound indexes |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `tenantId` → Tenant, `customerId` → Customer, `providerId` → TenantStaff |
| Required fields | ✅ | `tenantId`, `customerId`, `serviceType`, `date`, `timeSlot`, `status` |
| Enum constraints | ⚠️ LOW | `status` constrained, but `serviceType` is a free-form string |

**Recommendations:**
- Consider adding `deletedAt` for soft delete consistency
- Consider enum or validation on `serviceType`

---

### 1.11 Customer (`src/customers/schemas/customer.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ Excellent | `tenantId`, `tenantId+phone`, `tenantId+email`, `tenantId+deletedAt`, `tenantId+createdAt` |
| tenantId indexed | ✅ | Multiple compound indexes |
| toJSON transform | ⚠️ MEDIUM | **Missing** — `phone`, `dateOfBirth`, `email` are PII |
| References | ✅ | `tenantId` → Tenant |
| Required fields | ✅ | `tenantId`, `name` |
| Enum constraints | ✅ | `source` constrained |
| Uniqueness | ⚠️ MEDIUM | No unique constraint on `tenantId+phone` or `tenantId+email` — **duplicate customers possible** |

**Recommendations:**
- Add `toJSON` transform to mask or strip PII fields (`phone`, `dateOfBirth`)
- Consider unique sparse indexes on `{ tenantId: 1, phone: 1 }` and `{ tenantId: 1, email: 1 }`
- Add `lowercase: true` on `email` (inconsistent with User schema)

---

### 1.12 SupportTicket (`src/support/schemas/support-ticket.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `tenantId`, `status`, `createdBy`, `tenantId+status+createdAt`, `tenantId+priority` |
| tenantId indexed | ✅ | Multiple indexes |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `tenantId` → Tenant, `assignedTo` → User, `createdBy` → User, `messages[].authorId` → User |
| Required fields | ✅ | `tenantId`, `title`, `category`, `status`, `priority`, `createdBy` |
| Enum constraints | ✅ | `category`, `status`, `priority` all constrained |

**Status: CLEAN** — Well-structured schema.

---

### 1.13 Notification (`src/notifications/schemas/notification.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `userId+createdAt`, `userId+read`, `tenantId` |
| tenantId indexed | ✅ | Standalone index |
| tenantId required | ⚠️ MEDIUM | `tenantId` is `default: null` — notifications can exist without tenant scope |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `userId` → User, `tenantId` → Tenant |
| Required fields | ✅ | `userId`, `type`, `title`, `message` |
| Enum constraints | ⚠️ MEDIUM | **`type` has no enum** — any string accepted |
| Enum constraints | ⚠️ MEDIUM | **`priority` has no enum** — defaults to `'normal'` but unconstrained |
| Timestamp conflict | ⚠️ LOW | Manual `createdAt` with `Date.now` default conflicts with `timestamps: true` |

**Recommendations:**
- Add enum on `type` (e.g. `['booking_reminder', 'system', 'alert', 'ticket_update', ...]`)
- Add enum on `priority` (e.g. `['low', 'normal', 'high', 'urgent']`)
- Remove manual `createdAt` field — `timestamps: true` already handles it
- Consider making `tenantId` required for tenant-scoped notification queries

---

### 1.14 Alert (`src/alerts/schemas/alert.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `tenantId`, `resolved`, `tenantId+createdAt` |
| tenantId indexed | ✅ | Multiple indexes |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `tenantId` → Tenant |
| Required fields | ✅ | `tenantId`, `type`, `title`, `message` |
| Enum constraints | ⚠️ MEDIUM | **`type` has no enum** |
| Enum constraints | ⚠️ MEDIUM | **`severity` has no enum** — defaults to `'medium'` but unconstrained |
| Timestamp conflict | ⚠️ LOW | Manual `createdAt` conflicts with `timestamps: true` |

**Recommendations:**
- Add enum on `type` (e.g. `['agent_down', 'high_error_rate', 'missed_booking', ...]`)
- Add enum on `severity` (e.g. `['low', 'medium', 'high', 'critical']`)
- Remove manual `createdAt` — let `timestamps: true` handle it

---

### 1.15 AuditEntry (`src/audit/schemas/audit-entry.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `timestamp`, `tenantId+timestamp` |
| tenantId indexed | ✅ | Compound index |
| toJSON transform | ✅ OK | No sensitive fields |
| References | 🔴 **CRITICAL** | `userId` is typed as `string` (plain) instead of `Types.ObjectId` with `ref: 'User'` — **breaks referential integrity** |
| Required fields | ⚠️ MEDIUM | `tenantId` is `default: null` instead of required |
| Enum constraints | ⚠️ MEDIUM | **`action` has no enum** — should have a defined set of audit actions |

**Recommendations:**
- **CRITICAL:** Change `userId` from plain `string` to `{ type: Types.ObjectId, ref: 'User', required: true }` for referential integrity and `.populate()` support
- Add enum on `action` (e.g. `['login', 'logout', 'create', 'update', 'delete', 'invite', ...]`)
- Consider making `tenantId` required

---

### 1.16 ReportSnapshot (`src/reports/schemas/report-snapshot.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ Excellent | `tenantId+snapshotDate` (unique), `snapshotDate` |
| tenantId indexed | ✅ | Compound unique index |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `tenantId` → Tenant |
| Required fields | ✅ | `tenantId`, `snapshotDate` |
| Enum constraints | N/A | Numeric aggregation data |

**Status: CLEAN** — Well-structured schema.

---

### 1.17 ProcessedEvent (`src/webhooks/schemas/processed-event.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `eventId+source` (unique) |
| tenantId indexed | ⚠️ LOW | **No `tenantId` field** — webhook events are not tenant-scoped |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | Standalone idempotency table |
| Required fields | ✅ | `eventId`, `source`, `eventType` |
| Enum constraints | ⚠️ LOW | `source` and `eventType` have no enums |

**Recommendations:**
- Consider adding `tenantId` if webhooks need tenant-scoped isolation
- Consider enum on `source` (e.g. `['retell', 'stripe', 'sendgrid']`)

---

### 1.18 AgentRun (`src/runs/schemas/agent-run.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `tenantId` (inline), `callId` (inline), `tenantId+startedAt`, `callId+tenantId` |
| tenantId indexed | ✅ | Inline + compound |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ⚠️ HIGH | Only `tenantId` → Tenant — **missing `agentInstanceId` reference** to trace runs to agents |
| Required fields | ✅ | `tenantId`, `callId` |
| Enum constraints | ⚠️ MEDIUM | **`status` has no enum** — defaults to `'running'` but unconstrained |
| Redundant index | ⚠️ LOW | Standalone `tenantId` index is redundant with `tenantId+startedAt` compound |

**Recommendations:**
- Add `agentInstanceId` field with `{ type: Types.ObjectId, ref: 'AgentInstance', required: true }`
- Add enum on `status` (e.g. `['running', 'completed', 'failed', 'cancelled']`)
- Remove redundant standalone `tenantId` inline index
- Add `default: null` on optional fields (`tokens`, `agentVersion`, `endedAt`) for consistency

---

### 1.19 RunEvent (`src/runs/schemas/run-event.schema.ts`)

| Check | Status | Notes |
|---|---|---|
| Indexes | ✅ | `runId` (inline), `runId+timestamp` |
| tenantId indexed | ⚠️ HIGH | **No `tenantId` field** — cross-tenant isolation requires joining through `AgentRun` |
| toJSON transform | ✅ OK | No sensitive fields |
| References | ✅ | `runId` → AgentRun |
| Required fields | ✅ | `runId`, `eventType` |
| Enum constraints | ⚠️ MEDIUM | **`eventType` has no enum** |

**Recommendations:**
- Add `tenantId` field for direct tenant-scoped queries without joining through `AgentRun`
- Add enum on `eventType` (e.g. `['llm_call', 'tool_call', 'error', 'completion', ...]`)

---

## 2. Relationship Chain Verification

### 2.1 Tenant → AgentInstance (via tenantId)

```
Tenant._id  ←──  AgentInstance.tenantId (ref: 'Tenant')
```

| Check | Status |
|---|---|
| Ref declaration | ✅ Present |
| tenantId required | 🔴 **CRITICAL** — `default: null`, allows orphaned instances |
| Index on tenantId | ✅ Present |

### 2.2 Tenant → TenantStaff → User

```
Tenant._id  ←──  TenantStaff.tenantId (ref: 'Tenant', required)
User._id    ←──  TenantStaff.userId   (ref: 'User', required)
```

| Check | Status |
|---|---|
| Both refs declared | ✅ |
| Both required | ✅ |
| Unique compound index | ✅ `userId+tenantId` |
| tenantId standalone index | ✅ |

### 2.3 AgentInstance → AgentTemplate (via templateId)

```
AgentTemplate._id  ←──  AgentInstance.templateId (ref: 'AgentTemplate')
```

| Check | Status |
|---|---|
| Ref declaration | ✅ Present |
| templateId required | ⚠️ `default: null` — allows instances without templates |
| Index on templateId | ⚠️ **MISSING** — reverse lookups require full collection scan |

### 2.4 Tenant → Customer, Booking, SupportTicket, CallSession, Notification, Alert

| Schema | tenantId required | tenantId indexed | Ref correct |
|---|---|---|---|
| Customer | ✅ required | ✅ multiple compounds | ✅ |
| Booking | ✅ required | ✅ multiple compounds | ✅ |
| SupportTicket | ✅ required | ✅ multiple compounds | ✅ |
| CallSession | ✅ required | ✅ multiple compounds | ✅ |
| Notification | ⚠️ `default: null` | ✅ standalone | ✅ |
| Alert | ✅ required | ✅ multiple | ✅ |

### 2.5 Missing Relationships (Not Modeled)

| Expected Relationship | Status |
|---|---|
| AgentRun → AgentInstance | ⚠️ **MISSING** — no `agentInstanceId` field in AgentRun |
| RunEvent → Tenant | ⚠️ **MISSING** — no direct `tenantId` for tenant-scoped queries |
| AuditEntry → User | 🔴 **BROKEN** — `userId` is plain `string`, not `ObjectId` ref |

---

## 3. Critical Issues Summary (Must Fix)

### 🔴 CRITICAL-1: AgentInstance.tenantId not required
**File:** `src/agent-instances/schemas/agent-instance.schema.ts:8`
**Impact:** Agents can be created without a tenant, breaking multi-tenant data isolation.
**Fix:**
```typescript
// Before
@Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })

// After
@Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
```

### 🔴 CRITICAL-2: AuditEntry.userId is plain string
**File:** `src/audit/schemas/audit-entry.schema.ts:12`
**Impact:** No referential integrity, `.populate()` won't work, inconsistent with all other schemas.
**Fix:**
```typescript
// Before
@Prop({ required: true })
userId: string;

// After
@Prop({ type: Types.ObjectId, ref: 'User', required: true })
userId: Types.ObjectId;
```

### 🔴 CRITICAL-3: User schema lacks toObject transform
**File:** `src/users/schemas/user.schema.ts:6`
**Impact:** `passwordHash` leaks when `.toObject()` or `.lean()` is used instead of `.toJSON()`.
**Fix:**
```typescript
@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
  toObject: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.passwordHash;
      return ret;
    },
  },
})
```

---

## 4. Missing Index Summary

| Schema | Missing Index | Priority |
|---|---|---|
| RefreshToken | `{ userId: 1 }` | HIGH — needed for session management |
| AgentInstance | `{ templateId: 1 }` | HIGH — needed for template reverse lookups |
| AgentInstance | `{ tenantId: 1, status: 1 }` | MEDIUM — optimizes tenant agent listing |
| RunEvent | `{ tenantId: 1 }` (requires adding field) | HIGH — cross-tenant isolation |
| Tenant | `{ deletedAt: 1 }` (sparse) | LOW — consistency with other schemas |

---

## 5. Missing Enum Constraints

| Schema | Field | Suggested Values |
|---|---|---|
| CallSession | `sentiment` | `['positive', 'negative', 'neutral', 'unknown']` |
| AgentTemplate | `capabilityLevel` | `['L1', 'L2', 'L3']` |
| AgentChannelDeployment | `provider` | `['retell', 'vapi', 'custom']` |
| Notification | `type` | `['booking_reminder', 'system', 'alert', 'ticket_update', ...]` |
| Notification | `priority` | `['low', 'normal', 'high', 'urgent']` |
| Alert | `type` | `['agent_down', 'high_error_rate', 'missed_booking', ...]` |
| Alert | `severity` | `['low', 'medium', 'high', 'critical']` |
| AuditEntry | `action` | `['login', 'logout', 'create', 'update', 'delete', 'invite', ...]` |
| AgentRun | `status` | `['running', 'completed', 'failed', 'cancelled']` |
| RunEvent | `eventType` | `['llm_call', 'tool_call', 'error', 'completion', ...]` |
| ProcessedEvent | `source` | `['retell', 'stripe', 'sendgrid']` |

---

## 6. toJSON/toObject Transform Audit

| Schema | Sensitive Fields | Transform Present | Action Required |
|---|---|---|---|
| User | `passwordHash` | ✅ toJSON only | Add `toObject` |
| Tenant | `stripeCustomerId`, `stripeSubscriptionId` | ❌ | Add both transforms |
| RefreshToken | `token` | ❌ | Add both transforms |
| InviteToken | `token` | ❌ | Add both transforms |
| AgentInstance | `retellAgentId`, `retellLlmId` | ❌ | Add both transforms |
| CallSession | `transcript`, `recordingUrl` | ❌ | Add both transforms (PII/HIPAA) |
| Customer | `phone`, `dateOfBirth`, `email` | ❌ | Add both transforms (PII) |

---

## 7. Timestamp Conflicts

| Schema | Issue |
|---|---|
| Notification | Manual `createdAt` with `Date.now` + `timestamps: true` — redundant/conflicting |
| Alert | Manual `createdAt` with `new Date()` + `timestamps: true` — redundant/conflicting |
| AuditEntry | Uses manual `timestamp` field with `timestamps: false` — intentional and correct ✅ |

---

## 8. Prioritized Fix Order

1. **CRITICAL:** Make `AgentInstance.tenantId` required
2. **CRITICAL:** Change `AuditEntry.userId` to `Types.ObjectId` ref
3. **CRITICAL:** Add `toObject` transform to User schema
4. **HIGH:** Add `userId` index to RefreshToken
5. **HIGH:** Add `templateId` index to AgentInstance
6. **HIGH:** Add `toJSON`/`toObject` transforms to CallSession (HIPAA/PII)
7. **HIGH:** Add `toJSON`/`toObject` transforms to Customer (PII)
8. **HIGH:** Add `agentInstanceId` field to AgentRun
9. **MEDIUM:** Add all missing enum constraints (11 fields across 8 schemas)
10. **MEDIUM:** Add `toJSON` transforms to Tenant, RefreshToken, InviteToken, AgentInstance
11. **LOW:** Fix timestamp conflicts in Notification and Alert
12. **LOW:** Add `deletedAt` index to Tenant, add `email lowercase` to Customer

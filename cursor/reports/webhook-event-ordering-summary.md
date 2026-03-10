# Webhook Event Ordering Protection — Implementation Summary

## Overview

Prevents Retell call session status from being downgraded when webhook events (`call_started`, `call_ended`, `call_analyzed`) arrive out of order.

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/backend/src/webhooks/webhooks.service.ts` | Added status order map, ordering checks, optional timestamp protection, and helper methods |
| `apps/backend/src/webhooks/webhooks.service.spec.ts` | Updated `findOne` mock chain for `.select().lean()`, added 5 new tests for ordering protection |

---

## New Logic Added

### 1. Status Order Map

```typescript
const RETELL_STATUS_ORDER = {
  created: 0,
  started: 1,
  ended: 2,
  analyzed: 3
}
```

### 2. Event → Status Mapping

- `call_started` → `started`
- `call_ended` → `ended`
- `call_analyzed` → `analyzed`

### 3. Ordering Check in `upsertCallSession`

- Load existing `CallSession` by `callId` with `status` and `metadata`
- Compare `STATUS_ORDER[incomingStatus]` vs `STATUS_ORDER[currentStatus]`
- **Skip update** if `incomingOrder <= currentOrder` (stale event)
- Log at debug level: `{ callId, incomingStatus, currentStatus, message: "Ignored stale webhook event" }`

### 4. Optional Timestamp Protection

- Read `metadata.timestamp`, `metadata.event_timestamp`, or `metadata.created_at` from payload
- Store `metadata.lastEventTimestamp` in `CallSession` when updating
- If both incoming and stored timestamps exist, **skip** when `incomingTimestamp <= lastEventTimestamp`
- Supports Unix seconds or milliseconds; ISO strings parsed via `Date.parse`

### 5. Helper Methods

- `getIncomingStatusFromEvent(event)` — maps Retell event type to status
- `readEventTimestamp(payload)` — extracts timestamp from payload metadata
- `readLastEventTimestamp(metadata)` — reads stored timestamp from session metadata

---

## Tests Added

| Test | Description |
|------|-------------|
| `allows normal order: started → ended → analyzed` | Verifies correct flow: all 3 status updates applied |
| `skips out-of-order event: analyzed then ended (ended is stale)` | Session at `analyzed`; late `call_ended` is skipped |
| `skips duplicate status: second call_ended when already ended` | Same status twice → second update skipped |
| `skips when incoming timestamp is older than lastEventTimestamp` | Timestamp protection rejects older event |
| `allows update when incoming timestamp is newer` | Timestamp protection allows newer event |

---

## Verification Steps

1. **Run unit tests**
   ```bash
   cd apps/backend && npm test -- webhooks.service.spec.ts
   ```

2. **Run full backend test suite**
   ```bash
   cd apps/backend && npm test
   ```

3. **Manual verification**
   - Send Retell webhooks in normal order → status should progress
   - Send `call_ended` after `call_analyzed` → should be ignored (check logs for `Ignored stale webhook event`)
   - Send duplicate `call_ended` → second should be ignored

---

## Rollback Instructions

1. **Revert `webhooks.service.ts`**
   - Remove `RETELL_STATUS_ORDER` and `getIncomingStatusFromEvent`
   - Restore original `upsertCallSession` (no ordering check, no timestamp)
   - Remove `readEventTimestamp` and `readLastEventTimestamp`

2. **Revert `webhooks.service.spec.ts`**
   - Restore original `findOne` mock (no `.lean()` chain)
   - Remove the `webhook event ordering protection` describe block

3. **Verify**
   ```bash
   cd apps/backend && npm test
   ```

---

## Notes

- `handleRetellAlertTriggered` is unchanged; it uses `updateOne` directly and does not affect call status ordering.
- `metadata.lastEventTimestamp` is stored in `CallSession.metadata`; no schema migration required.
- No new worker file was created; logic lives in `WebhooksService` for both inline and queue processing.

# Phase 4 — Frontend Truthfulness Summary

## Overview

Ensures the frontend displays real data from backend APIs instead of placeholders. Dashboard and reports adapters now map backend responses correctly, and reports respect date filters.

---

## Already Implemented (Pre-Phase 4)

| Component | Status |
|-----------|--------|
| Dashboard backend | `getFunnel`, `getTrend`, `getRoiMetrics`, `getTenantAgentStatus`, `getTenantRecentCalls` |
| Dashboard controller | All endpoints exposed with dateFrom/dateTo |
| Reports backend | `getOutcomesByVersion`, `getPerformanceForPeriod`, `getSentimentDistribution`, `getPeakHours`, `getIntentDistribution` |
| Reports controller | All endpoints exposed |
| Dashboard adapter | Calls real API for funnel, trend, ROI, agent status, recent calls |
| Reports adapter | Calls real API for outcomes-by-version, performance, sentiment, peak hours, intent, outcomes-by-day |
| CallSession schema | Has `sentiment`, `outcome`, `metadata.intent`; indexes for tenantId+createdAt, tenantId+outcome |

---

## Enhancements Added (Phase 4 Completion)

### 1. Dashboard getMetrics — Correct Mapping

**File:** `apps/prototype/src/adapters/api/dashboard.adapter.ts`

- Maps backend `getTenantMetrics` response to `DashboardMetrics`
- `conversionRate` = booked / totalCalls × 100
- `callsHandled` = totalCalls
- `escalationRate` = escalated / totalCalls × 100
- `costSaved` = totalMinutes × 2 (derived from avgCallDurationMs × totalCalls)

### 2. Dashboard getTenantKpis — Enriched from Backend

**File:** `apps/prototype/src/adapters/api/dashboard.adapter.ts`

- `appointmentsBooked` = totalBookings
- `escalations` = callOutcomes.escalated
- `failedCalls` = callOutcomes.failed
- `avgDurationSec` = avgCallDurationMs / 1000
- `topOutcome` = max of booked, escalated, failed
- `minutesUsed` = total call minutes

### 3. Reports getOutcomes — Real API

**File:** `apps/prototype/src/adapters/api/reports.adapter.ts`

- Replaced placeholder with call to `/tenant/reports/performance`
- Transforms `callMetrics.outcomes` to `OutcomeBreakdown[]` (booked, escalated, failed with count and percentage)
- Respects dateRange via dateFrom/dateTo query params

### 4. Reports getPerformance — Date Filter for Calls

**File:** `apps/backend/src/reports/reports.service.ts`

- Call metrics (totalCalls, outcomes, avgDuration) now filtered by `createdAt` when dateFrom/dateTo provided
- Aligns call metrics with booking date range

### 5. CallSession Index for Intent

**File:** `apps/backend/src/calls/schemas/call-session.schema.ts`

- Added compound index: `{ tenantId: 1, 'metadata.intent': 1 }`
- Improves `getIntentDistribution` aggregation performance

---

## Files Modified

| File | Changes |
|------|---------|
| `apps/prototype/src/adapters/api/dashboard.adapter.ts` | getMetrics mapping, getTenantKpis enrichment |
| `apps/prototype/src/adapters/api/reports.adapter.ts` | getOutcomes wired to performance API |
| `apps/backend/src/reports/reports.service.ts` | Date filter for call metrics in getPerformance |
| `apps/backend/src/calls/schemas/call-session.schema.ts` | Index for metadata.intent |

---

## Verification Steps

1. **Backend build**
   ```bash
   cd apps/backend && npm run build
   ```

2. **Frontend with VITE_DATA_MODE=api**
   - Run prototype with `VITE_DATA_MODE=api`
   - Dashboard: metrics, funnel, trend, ROI, KPIs, agent status, recent calls show real data
   - Reports: outcomes, performance, sentiment, peak hours, intent show real data

3. **Date range**
   - Reports and dashboard respect dateFrom/dateTo
   - Call metrics in getPerformance respect date range

---

## Rollback

1. Revert dashboard.adapter.ts (restore simple getMetrics, placeholder getTenantKpis)
2. Revert reports.adapter.ts (restore placeholder getOutcomes)
3. Revert reports.service.ts (remove call date filter)
4. Revert call-session.schema.ts (remove metadata.intent index)

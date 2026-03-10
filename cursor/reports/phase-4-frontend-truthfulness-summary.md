# Phase 4 — Frontend Truthfulness Summary

**Completed:** March 2025  
**Scope:** Replace placeholder dashboard and reports adapters with real backend endpoints

---

## Files Created

None. All changes are modifications to existing files.

---

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `apps/backend/src/dashboard/dashboard.service.ts` | Added `getFunnel`, `getTrend`, `getRoiMetrics`, `getTenantAgentStatus`, `getTenantRecentCalls`; DTOs for response shapes |
| `apps/backend/src/dashboard/dashboard.controller.ts` | Added GET endpoints: `/funnel`, `/trend`, `/roi`, `/agent-status`, `/recent-calls` |
| `apps/backend/src/reports/reports.service.ts` | Added `getOutcomesByVersion`, `getPerformanceForPeriod`, `getSentimentDistribution`, `getPeakHours`, `getIntentDistribution`; DTOs |
| `apps/backend/src/reports/reports.controller.ts` | Added GET endpoints: `/outcomes-by-version`, `/performance-for-period`, `/sentiment-distribution`, `/peak-hours`, `/intent-distribution` |
| `apps/backend/src/reports/reports.module.ts` | Added `AgentInstance` model for outcomes-by-version lookup |
| `apps/backend/src/calls/schemas/call-session.schema.ts` | Added compound index `{ tenantId: 1, outcome: 1 }` |

### Frontend

| File | Changes |
|------|---------|
| `apps/prototype/src/adapters/api/dashboard.adapter.ts` | Replaced placeholder `getFunnel`, `getTrend`, `getRoiMetrics`, `getTenantAgentStatus`, `getTenantRecentCalls` with real API calls |
| `apps/prototype/src/adapters/api/reports.adapter.ts` | Replaced placeholder `getOutcomesByVersion`, `getPerformanceForPeriod`, `getSentimentDistribution`, `getPeakHours`, `getIntentDistribution`; fixed `getPerformance` to map backend response |

---

## New Indexes

| Collection | Index | Purpose |
|------------|-------|---------|
| `call_sessions` | `{ tenantId: 1, outcome: 1 }` | Efficient outcome aggregations and filters |

**Note:** `{ tenantId: 1, createdAt: -1 }` already existed on `call_sessions`.

---

## API Endpoints Added

### Dashboard (`/api/tenant/dashboard`)

| Method | Path | Query Params | Description |
|--------|------|--------------|-------------|
| GET | `/funnel` | dateFrom, dateTo | Call funnel stages (started, ended, analyzed, booked, escalated, failed) |
| GET | `/trend` | dateFrom, dateTo | Bookings per day time series |
| GET | `/roi` | dateFrom, dateTo | ROI metrics (revenue, aiCost, costSaved, roiPercent, totalMinutes) |
| GET | `/agent-status` | — | Primary voice agent status (voice, language, status, lastSyncedAt) |
| GET | `/recent-calls` | limit, dateFrom, dateTo | Recent calls with outcome, duration, createdAt |

### Reports (`/api/tenant/reports`)

| Method | Path | Query Params | Description |
|--------|------|--------------|-------------|
| GET | `/outcomes-by-version` | dateFrom, dateTo | A/B outcomes by agent template version |
| GET | `/performance-for-period` | period (thisWeek\|lastWeek\|thisMonth\|lastMonth) | Performance for predefined period |
| GET | `/sentiment-distribution` | dateFrom, dateTo | Sentiment buckets from CallSession.sentiment |
| GET | `/peak-hours` | dateFrom, dateTo | Calls per hour (0–23) |
| GET | `/intent-distribution` | dateFrom, dateTo | Intent buckets from metadata.intent |

---

## Verification Steps

### 1. Backend Build

```bash
cd apps/backend && npm run build
```

Expected: Build succeeds.

### 2. Frontend Build

```bash
cd apps/prototype && npm run build
```

Expected: Build succeeds.

### 3. Backend Tests

```bash
cd apps/backend && npm test
```

Expected: All tests pass.

### 4. Manual API Test (with running backend)

Start backend, then:

```bash
# Login to get JWT, then:
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/dashboard/funnel?dateFrom=2025-01-01&dateTo=2025-12-31"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/dashboard/trend?dateFrom=2025-01-01"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/dashboard/roi"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/dashboard/agent-status"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/dashboard/recent-calls?limit=5"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/reports/outcomes-by-version"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/reports/performance-for-period?period=thisWeek"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/reports/sentiment-distribution"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/reports/peak-hours"
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/tenant/reports/intent-distribution"
```

### 5. Dashboard Page

Log in as tenant user, navigate to dashboard. Verify:

- Conversion funnel renders (or empty state if no data)
- Trend chart renders
- ROI widget shows values
- Agent status card shows (or null if no voice agent)
- Recent calls table shows (or empty)

### 6. Reports Page

Navigate to reports. Verify:

- Outcomes by version (A/B comparison)
- Period comparison
- Sentiment distribution chart
- Peak hours chart
- Intent distribution (may be empty if metadata.intent not populated)

---

## Rollback Instructions

### Full revert

```bash
git checkout HEAD -- apps/backend/src/dashboard/dashboard.service.ts
git checkout HEAD -- apps/backend/src/dashboard/dashboard.controller.ts
git checkout HEAD -- apps/backend/src/reports/reports.service.ts
git checkout HEAD -- apps/backend/src/reports/reports.controller.ts
git checkout HEAD -- apps/backend/src/reports/reports.module.ts
git checkout HEAD -- apps/backend/src/calls/schemas/call-session.schema.ts
git checkout HEAD -- apps/prototype/src/adapters/api/dashboard.adapter.ts
git checkout HEAD -- apps/prototype/src/adapters/api/reports.adapter.ts
```

### Index removal (optional)

To remove the new index:

```javascript
db.call_sessions.dropIndex({ tenantId: 1, outcome: 1 });
```

---

## Data Notes

- **Sentiment:** Requires `CallSession.sentiment` to be populated by Retell `call_analyzed` webhook.
- **Intent:** Requires `metadata.intent` to be set on CallSession (e.g. from tool callbacks or post-processing).
- **ROI:** Uses estimated values (revenue = booked × 50, aiCost = minutes × 0.05). Adjust in service for real billing data.
- **Outcomes by version:** Groups by `AgentInstance.templateVersion`; requires calls linked to agent instances.

# Real-Time Notification Architecture

## Overview

The platform now uses a centralized notification infrastructure across backend and frontend with:

- MongoDB-backed `notifications` collection
- Socket.IO real-time push (`notification:new`)
- User, admin, and tenant room delivery
- Unread badge + live drawer updates in React
- Background monitoring and error-spike notifications

## Backend Components

- `NotificationsService`
  - canonical creator for all notifications
  - supports `source`, `severity`, `type`, `tenantId`, `metadata`
  - emits real-time socket events
  - supports list/read/unread count/clear
  - trims old data (max 5000 per user/tenant)

- `NotificationsGateway`
  - namespace: `/notifications`
  - joins rooms:
    - `user:{userId}`
    - `admin` (for admin users)
    - `tenant:{tenantId}` (for tenant-scoped users)
  - emits `notification:new` (plus legacy `notification`)

- `NotificationsController`
  - `GET /notifications`
  - `GET /notifications/unread-count`
  - `PATCH /notifications/:id/read`
  - `PATCH /notifications/read-all`
  - `DELETE /notifications/clear`
  - `DELETE /notifications/:id`

### Filters (`GET /notifications`)

- `severity`
- `source`
- `tenantId`
- `read`
- `dateFrom`
- `dateTo`
- pagination (`page`, `limit`)

## Data Model

Notification fields:

- `id`
- `title`
- `message`
- `type`
- `severity` (`critical | important | normal | info`)
- `source` (`database | retell | agents | billing | system | tenant | security | logs`, extensible)
- `createdAt`
- `read`
- `tenantId` (optional)
- `metadata`
- compatibility fields: `priority`, `meta`, `link`

Indexes:

- `tenantId`
- `read`
- `createdAt`
- `severity`
- `source`
- `userId + createdAt`

## Monitoring + Event Sources

- `SystemMonitorService` (`*/45s`)
  - MongoDB connectivity
  - Redis connectivity
  - Retell reachability
  - stale agent heartbeat
  - webhook queue backlog

- `ErrorRateMonitorService` (`*/30s`)
  - tracks 5xx errors from middleware
  - emits `logs` notification on spike

- `NotificationRetentionService`
  - periodic cleanup for old notifications

## Frontend Flow

- `useNotifications`:
  - initial fetch via API
  - unread count fetch
  - socket listeners for `notification:new`
  - optimistic read/mark-all/clear
  - bell pulse trigger

- `Header`:
  - unread numeric badge
  - pulse animation on incoming events

- `NotificationDrawer`:
  - all/unread filters
  - severity filter
  - mark single read
  - mark all read
  - clear notifications
  - severity color dot + source label

## Current Event Integrations

- tenant created
- tenant support ticket submitted
- ticket updates
- agent health degradation
- system monitor failures
- high error-rate spikes

## Extension Points

Add notification generation in:

- billing failures (`source: billing`)
- webhook failures (`source: system` / `source: retell`)
- auth/security anomalies (`source: security`)
- agent deployment/sync failures (`source: agents`)


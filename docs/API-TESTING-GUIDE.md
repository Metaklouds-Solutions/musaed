# MUSAED Backend — API Testing Guide

Complete testing guide for all 50 API endpoints. Follow the sections **in order** — each section depends on IDs created by the previous one.

---

## Prerequisites

1. **MongoDB** running (local or Atlas)
2. **Backend running:**

```powershell
cd apps/backend
pnpm run seed        # seeds admin user + subscription plans
pnpm run start:dev   # starts on http://localhost:3001
```

3. **Verify** the server is up:

```powershell
curl http://localhost:3001/health
```

Expected: `{ "status": "ok" }`

---

## Variables

As you test, **save these values** from API responses. Replace `{{VARIABLE}}` placeholders in later commands.

| Variable | Where you get it | Example |
|----------|-----------------|---------|
| `{{ADMIN_TOKEN}}` | POST /auth/login (admin) | `eyJhbGci...` |
| `{{ADMIN_REFRESH}}` | POST /auth/login (admin) | `eyJhbGci...` |
| `{{TENANT_ID}}` | POST /admin/tenants → `_id` | `683ab1...` |
| `{{OWNER_TOKEN}}` | POST /auth/login (tenant owner) | `eyJhbGci...` |
| `{{PLAN_ID}}` | GET /admin/billing/plans → first `_id` | `683ab2...` |
| `{{NEW_PLAN_ID}}` | POST /admin/billing/plans → `_id` | `683ab3...` |
| `{{TEMPLATE_ID}}` | POST /admin/templates → `_id` | `683ab4...` |
| `{{STAFF_ID}}` | POST /tenant/staff → `_id` | `683ab5...` |
| `{{CUSTOMER_ID}}` | POST /tenant/customers → `_id` | `683ab6...` |
| `{{BOOKING_ID}}` | POST /tenant/bookings → `_id` | `683ab7...` |
| `{{TICKET_ID}}` | POST /tenant/support/tickets → `_id` | `683ab8...` |
| `{{AGENT_ID}}` | GET /tenant/agents → first `_id` | `683ab9...` |

---

## Testing Order

```
1. Health
2. Auth (login admin → get token)
3. Admin: Tenants (create tenant → get TENANT_ID)
4. Admin: Billing Plans
5. Admin: Agent Templates
6. Admin: Agents
7. Admin: Overview & System
8. Admin: Support
9. Auth (login as tenant owner → get OWNER_TOKEN)
10. Tenant: Staff
11. Tenant: Customers
12. Tenant: Bookings
13. Tenant: Support Tickets
14. Tenant: Dashboard
15. Tenant: Reports
16. Tenant: Settings
17. Tenant: Agents
18. Auth: Refresh & Logout
19. Webhooks (Stripe, Retell)
```

---

# 1. Health

### GET /health

```powershell
curl http://localhost:3001/health
```

**Expected:**

```json
{ "status": "ok" }
```

---

# 2. Auth — Admin Login

### POST /auth/login

```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@musaed.com\",\"password\":\"Admin123!\"}'
```

**Expected:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "...",
    "email": "admin@musaed.com",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

**Save:** `accessToken` → `{{ADMIN_TOKEN}}`, `refreshToken` → `{{ADMIN_REFRESH}}`

---

### GET /auth/me

```powershell
curl http://localhost:3001/auth/me `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** User object (same as login response user, without passwordHash).

---

# 3. Admin — Tenants

All `/admin/*` routes require: `-H "Authorization: Bearer {{ADMIN_TOKEN}}"`

### POST /admin/tenants — Create Tenant

```powershell
curl -X POST http://localhost:3001/admin/tenants `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Riyadh Dental Clinic\",\"slug\":\"riyadh-dental\",\"ownerEmail\":\"owner@riyadh-dental.com\",\"ownerName\":\"Khalid Al-Fahad\",\"timezone\":\"Asia/Riyadh\"}'
```

**Expected:**

```json
{
  "tenant": { "_id": "...", "name": "Riyadh Dental Clinic", "slug": "riyadh-dental", "status": "ONBOARDING", ... },
  "owner": { "_id": "...", "email": "owner@riyadh-dental.com", ... },
  "staff": { ... }
}
```

**Save:** `tenant._id` → `{{TENANT_ID}}`

---

### GET /admin/tenants — List Tenants

```powershell
curl "http://localhost:3001/admin/tenants?page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**With status filter:**

```powershell
curl "http://localhost:3001/admin/tenants?status=ONBOARDING&page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** `{ "data": [...], "total": 1, "page": 1, "limit": 10 }`

---

### GET /admin/tenants/:id — Tenant Detail

```powershell
curl http://localhost:3001/admin/tenants/{{TENANT_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** Full tenant object with settings, plan, etc.

---

### PATCH /admin/tenants/:id — Update Tenant

```powershell
curl -X PATCH http://localhost:3001/admin/tenants/{{TENANT_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Riyadh Dental Clinic (Updated)\",\"locale\":\"ar\",\"settings\":{\"businessHours\":{\"mon\":\"09:00-17:00\",\"tue\":\"09:00-17:00\"}}}'
```

**Expected:** Updated tenant object.

---

### POST /admin/tenants/:id/suspend — Suspend Tenant

```powershell
curl -X POST http://localhost:3001/admin/tenants/{{TENANT_ID}}/suspend `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** Tenant with `"status": "SUSPENDED"`.

> **Note:** After testing suspend, you may want to PATCH the status back to `ACTIVE` so tenant-scoped tests work:

```powershell
curl -X PATCH http://localhost:3001/admin/tenants/{{TENANT_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"status\":\"ACTIVE\"}'
```

---

# 4. Admin — Billing & Plans

### GET /admin/billing/plans — List All Plans

```powershell
curl http://localhost:3001/admin/billing/plans `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** Array of 3 seeded plans (Starter, Professional, Enterprise).

**Save:** First plan's `_id` → `{{PLAN_ID}}`

---

### POST /admin/billing/plans — Create Plan

```powershell
curl -X POST http://localhost:3001/admin/billing/plans `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Growth\",\"monthlyPriceCents\":2900,\"maxVoiceAgents\":3,\"maxChatAgents\":3,\"maxEmailAgents\":1,\"maxStaff\":10,\"features\":{\"support\":\"standard\",\"analytics\":true},\"isActive\":true}'
```

**Expected:** Created plan object.

**Save:** `_id` → `{{NEW_PLAN_ID}}`

---

### PATCH /admin/billing/plans/:id — Update Plan

```powershell
curl -X PATCH http://localhost:3001/admin/billing/plans/{{NEW_PLAN_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Growth Plus\",\"monthlyPriceCents\":3400}'
```

**Expected:** Updated plan object.

---

### GET /admin/billing/overview — Revenue Overview

```powershell
curl http://localhost:3001/admin/billing/overview `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:**

```json
{
  "totalTenants": 1,
  "totalMrrCents": 0,
  "plans": [
    { "id": "...", "name": "Starter", "monthlyPriceCents": 0, "subscriberCount": 0 },
    ...
  ]
}
```

---

### GET /tenant/billing — Tenant Billing (admin accessing with tenantId query)

```powershell
curl "http://localhost:3001/tenant/billing?tenantId={{TENANT_ID}}" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** `{ "tenantId": "...", "plan": ..., "stripeCustomerId": null, ... }`

---

# 5. Admin — Agent Templates

### POST /admin/templates — Create Template

```powershell
curl -X POST http://localhost:3001/admin/templates `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Reception Voice Agent\",\"description\":\"Handles appointment scheduling via phone\",\"channel\":\"voice\",\"voiceConfig\":{\"language\":\"ar\",\"voice\":\"Fatima\"},\"llmConfig\":{\"model\":\"gpt-4o\",\"temperature\":0.7},\"basePrompt\":\"You are a professional clinic receptionist. Help patients book, reschedule, or cancel appointments.\",\"isDefault\":false,\"tags\":[\"reception\",\"scheduling\"]}'
```

**Expected:** Created template object.

**Save:** `_id` → `{{TEMPLATE_ID}}`

---

### GET /admin/templates — List Templates

```powershell
curl "http://localhost:3001/admin/templates?page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**With channel filter:**

```powershell
curl "http://localhost:3001/admin/templates?channel=voice&page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

---

### GET /admin/templates/:id — Template Detail

```powershell
curl http://localhost:3001/admin/templates/{{TEMPLATE_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

---

### PATCH /admin/templates/:id — Update Template

```powershell
curl -X PATCH http://localhost:3001/admin/templates/{{TEMPLATE_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}" `
  -d '{\"name\":\"Reception Voice Agent v2\",\"basePrompt\":\"You are a warm, professional clinic receptionist. Speak in Arabic and English.\",\"isDefault\":true}'
```

---

### DELETE /admin/templates/:id — Delete Template

```powershell
curl -X DELETE http://localhost:3001/admin/templates/{{TEMPLATE_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** `{ "message": "..." }` or the deleted object.

---

# 6. Admin — Agent Instances

### GET /admin/agents — List All Agent Instances

```powershell
curl "http://localhost:3001/admin/agents?page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**With status filter:**

```powershell
curl "http://localhost:3001/admin/agents?status=active&page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** `{ "data": [...], "total": 0, ... }` (empty if no agents deployed yet).

---

### GET /admin/agents/:id — Agent Instance Detail

```powershell
curl http://localhost:3001/admin/agents/{{AGENT_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

> **Note:** You need a valid agent instance ID. If none exist yet, this will return 404.

---

# 7. Admin — Overview & System

### GET /admin/overview — Platform Overview

```powershell
curl http://localhost:3001/admin/overview `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:**

```json
{
  "totalUsers": 2,
  "totalTenants": 1,
  "totalAgents": 0,
  "totalTickets": 0
}
```

---

### GET /admin/system — System Health

```powershell
curl http://localhost:3001/admin/system `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:**

```json
{
  "uptime": 123.456,
  "memory": { "rss": ..., "heapTotal": ..., "heapUsed": ..., "external": ... }
}
```

---

# 8. Admin — Support Tickets

### GET /admin/support — List All Tickets (cross-tenant)

```powershell
curl "http://localhost:3001/admin/support?page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**With status filter:**

```powershell
curl "http://localhost:3001/admin/support?status=open&page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

**Expected:** `{ "data": [...], "total": 0, "page": 1, "limit": 10 }` (empty until tickets are created).

---

### GET /admin/support/:id — Ticket Detail

```powershell
curl http://localhost:3001/admin/support/{{TICKET_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

> Test this after creating a ticket in section 13.

---

# 9. Auth — Login as Tenant Owner

When a tenant is created, the owner user gets password `ChangeMe123!`.

### POST /auth/login (tenant owner)

```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"owner@riyadh-dental.com\",\"password\":\"ChangeMe123!\"}'
```

**Expected:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "...",
    "email": "owner@riyadh-dental.com",
    "name": "Khalid Al-Fahad",
    "role": "TENANT_OWNER",
    "tenantId": "{{TENANT_ID}}",
    "tenantRole": "tenant_owner"
  }
}
```

**Save:** `accessToken` → `{{OWNER_TOKEN}}`

---

# 10. Tenant — Staff

All `/tenant/*` routes require: `-H "Authorization: Bearer {{OWNER_TOKEN}}"`

### GET /tenant/staff — List Staff

```powershell
curl http://localhost:3001/tenant/staff `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** Array with at least the owner as first staff member.

---

### POST /tenant/staff — Invite Staff

```powershell
curl -X POST http://localhost:3001/tenant/staff `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"email\":\"dr.sarah@riyadh-dental.com\",\"name\":\"Dr. Sarah Ahmed\",\"roleSlug\":\"doctor\"}'
```

**Expected:** Created staff + user object.

**Save:** `_id` → `{{STAFF_ID}}`

---

### PATCH /tenant/staff/:id — Update Staff

```powershell
curl -X PATCH http://localhost:3001/tenant/staff/{{STAFF_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"roleSlug\":\"clinic_admin\",\"status\":\"active\"}'
```

**Expected:** Updated staff object.

---

# 11. Tenant — Customers

### POST /tenant/customers — Create Customer

```powershell
curl -X POST http://localhost:3001/tenant/customers `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"name\":\"Ahmed Al-Rashid\",\"email\":\"ahmed@example.com\",\"phone\":\"+966501234567\",\"dateOfBirth\":\"1990-05-15\",\"source\":\"manual\",\"tags\":[\"vip\",\"returning\"],\"metadata\":{\"referral\":\"friend\"}}'
```

**Expected:** Created customer object.

**Save:** `_id` → `{{CUSTOMER_ID}}`

---

### Create a second customer (for testing list):

```powershell
curl -X POST http://localhost:3001/tenant/customers `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"name\":\"Fatima Noor\",\"email\":\"fatima@example.com\",\"phone\":\"+966509876543\",\"source\":\"call\"}'
```

---

### GET /tenant/customers — List Customers

```powershell
curl "http://localhost:3001/tenant/customers?page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**With search:**

```powershell
curl "http://localhost:3001/tenant/customers?search=Ahmed&page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `{ "data": [...], "total": 2, "page": 1, "limit": 10 }`

---

### GET /tenant/customers/:id — Customer Detail

```powershell
curl http://localhost:3001/tenant/customers/{{CUSTOMER_ID}} `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `{ "customer": {...}, "recentBookings": [] }`

---

### POST /tenant/customers/:id/export — GDPR Export

```powershell
curl -X POST http://localhost:3001/tenant/customers/{{CUSTOMER_ID}}/export `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:**

```json
{
  "customer": { ... },
  "bookings": [],
  "exportedAt": "2026-03-07T..."
}
```

---

### DELETE /tenant/customers/:id — Soft Delete

> Use the **second customer** ID for this test (so the first one stays for bookings).

```powershell
curl -X DELETE http://localhost:3001/tenant/customers/{{SECOND_CUSTOMER_ID}} `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `{ "message": "Customer deleted" }`

---

# 12. Tenant — Bookings

### POST /tenant/bookings — Create Booking

```powershell
curl -X POST http://localhost:3001/tenant/bookings `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"customerId\":\"{{CUSTOMER_ID}}\",\"serviceType\":\"consultation\",\"date\":\"2026-03-15\",\"timeSlot\":\"10:00\",\"durationMinutes\":30,\"notes\":\"First visit - general checkup\"}'
```

**Expected:** Created booking object.

**Save:** `_id` → `{{BOOKING_ID}}`

---

### Create a second booking:

```powershell
curl -X POST http://localhost:3001/tenant/bookings `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"customerId\":\"{{CUSTOMER_ID}}\",\"serviceType\":\"cleaning\",\"date\":\"2026-03-16\",\"timeSlot\":\"14:00\",\"durationMinutes\":45,\"status\":\"confirmed\"}'
```

---

### GET /tenant/bookings — List Bookings

```powershell
curl "http://localhost:3001/tenant/bookings?page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**With date filter:**

```powershell
curl "http://localhost:3001/tenant/bookings?date=2026-03-15&page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**With status filter:**

```powershell
curl "http://localhost:3001/tenant/bookings?status=confirmed&page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `{ "data": [...], "total": 2, "page": 1, "limit": 10 }`

---

### PATCH /tenant/bookings/:id — Update Booking

```powershell
curl -X PATCH http://localhost:3001/tenant/bookings/{{BOOKING_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"status\":\"completed\",\"notes\":\"Patient seen. All good.\"}'
```

**Expected:** Updated booking with `"status": "completed"`.

---

**Test cancel (decrements customer totalBookings):**

```powershell
curl -X PATCH http://localhost:3001/tenant/bookings/{{BOOKING_ID}} `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"status\":\"cancelled\"}'
```

---

# 13. Tenant — Support Tickets

### POST /tenant/support/tickets — Create Ticket

```powershell
curl -X POST http://localhost:3001/tenant/support/tickets `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"title\":\"Agent not responding to Arabic callers\",\"category\":\"agent\",\"priority\":\"high\",\"body\":\"Our voice agent fails to respond when patients speak Arabic. This started yesterday.\"}'
```

**Expected:** Created ticket object with embedded message.

**Save:** `_id` → `{{TICKET_ID}}`

---

### Create a second ticket:

```powershell
curl -X POST http://localhost:3001/tenant/support/tickets `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"title\":\"Billing question\",\"category\":\"billing\",\"priority\":\"low\",\"body\":\"When will next invoice be generated?\"}'
```

---

### GET /tenant/support/tickets — List Tickets

```powershell
curl "http://localhost:3001/tenant/support/tickets?page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**With status filter:**

```powershell
curl "http://localhost:3001/tenant/support/tickets?status=open&page=1&limit=10" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

---

### GET /tenant/support/tickets/:id — Ticket Detail

```powershell
curl http://localhost:3001/tenant/support/tickets/{{TICKET_ID}} `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** Ticket with populated `createdBy` and `messages` array.

---

### POST /tenant/support/tickets/:id/messages — Add Message

```powershell
curl -X POST http://localhost:3001/tenant/support/tickets/{{TICKET_ID}}/messages `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"body\":\"I have attached a screenshot of the error. The agent shows a blank screen when Arabic is detected.\"}'
```

**Expected:** Ticket with new message appended, status changed to `in_progress`.

---

Now go back and test the **admin support routes** from section 8:

```powershell
curl "http://localhost:3001/admin/support?page=1&limit=10" `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

```powershell
curl http://localhost:3001/admin/support/{{TICKET_ID}} `
  -H "Authorization: Bearer {{ADMIN_TOKEN}}"
```

---

# 14. Tenant — Dashboard

### GET /tenant/dashboard/metrics

```powershell
curl http://localhost:3001/tenant/dashboard/metrics `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:**

```json
{
  "totalCustomers": 2,
  "totalBookings": 2,
  "activeAgents": 0,
  "openTickets": 2,
  "last30Days": { ... }
}
```

---

# 15. Tenant — Reports

### GET /tenant/reports/performance

```powershell
curl http://localhost:3001/tenant/reports/performance `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**With date range:**

```powershell
curl "http://localhost:3001/tenant/reports/performance?dateFrom=2026-03-01&dateTo=2026-03-31" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:**

```json
{
  "totalBookings": 2,
  "byStatus": { "confirmed": 1, "cancelled": 1 },
  "byServiceType": { "consultation": 1, "cleaning": 1 },
  "totalCustomers": 2
}
```

---

# 16. Tenant — Settings

### GET /tenant/settings

```powershell
curl http://localhost:3001/tenant/settings `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:**

```json
{
  "timezone": "Asia/Riyadh",
  "locale": "ar",
  "settings": { "businessHours": {}, "notifications": {}, "featureFlags": {}, "locations": [] }
}
```

---

### PATCH /tenant/settings — Update Settings

```powershell
curl -X PATCH http://localhost:3001/tenant/settings `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"timezone\":\"Asia/Riyadh\",\"locale\":\"ar-SA\",\"businessHours\":{\"sun\":\"09:00-17:00\",\"mon\":\"09:00-17:00\",\"tue\":\"09:00-17:00\",\"wed\":\"09:00-17:00\",\"thu\":\"09:00-13:00\"},\"notifications\":{\"emailDigest\":true,\"ticketAlerts\":true,\"bookingReminders\":true},\"locations\":[{\"name\":\"Main Branch\",\"address\":\"King Fahd Rd, Riyadh\"},{\"name\":\"North Branch\",\"address\":\"Al Olaya, Riyadh\"}]}'
```

**Expected:** Updated tenant settings.

---

# 17. Tenant — Agent Instances

### GET /tenant/agents — List Agents

```powershell
curl http://localhost:3001/tenant/agents `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** Array of agent instances for this tenant (may be empty if none deployed).

---

### GET /tenant/agents/:id — Agent Detail

```powershell
curl http://localhost:3001/tenant/agents/{{AGENT_ID}} `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

> Requires a valid agent instance. If empty, skip to next section.

---

### PATCH /tenant/agents/:id/prompts — Update Custom Prompts

```powershell
curl -X PATCH http://localhost:3001/tenant/agents/{{AGENT_ID}}/prompts `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"customPrompts\":{\"greeting\":\"Welcome to Riyadh Dental Clinic! How can I help you today?\",\"fallback\":\"I am sorry, I did not understand. Let me connect you with a staff member.\",\"closing\":\"Thank you for calling Riyadh Dental. Have a wonderful day!\"}}'
```

---

### POST /tenant/agents/:id/sync — Force Retell Sync

```powershell
curl -X POST http://localhost:3001/tenant/agents/{{AGENT_ID}}/sync `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `{ "message": "Sync initiated (stub)" }` or similar placeholder.

---

# 18. Auth — Refresh & Logout

### POST /auth/refresh — Get New Access Token

```powershell
curl -X POST http://localhost:3001/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{\"refreshToken\":\"{{ADMIN_REFRESH}}\"}'
```

**Expected:**

```json
{
  "accessToken": "eyJ... (new token)"
}
```

---

### POST /auth/logout — Invalidate Refresh Token

```powershell
curl -X POST http://localhost:3001/auth/logout `
  -H "Content-Type: application/json" `
  -d '{\"refreshToken\":\"{{ADMIN_REFRESH}}\"}'
```

**Expected:** `{ "message": "Logged out" }`

**Verify** the refresh token is invalidated:

```powershell
curl -X POST http://localhost:3001/auth/refresh `
  -H "Content-Type: application/json" `
  -d '{\"refreshToken\":\"{{ADMIN_REFRESH}}\"}'
```

**Expected:** `401 Unauthorized` — `{ "message": "Invalid or expired refresh token" }`

---

# 19. Webhooks

### POST /webhooks/stripe — Stripe Webhook

> In production, Stripe sends this with a valid `stripe-signature` header. For local testing, use the Stripe CLI:

```powershell
# Install: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3001/webhooks/stripe
stripe trigger invoice.payment_succeeded
```

**Without Stripe CLI** (will fail signature verification, but tests the route exists):

```powershell
curl -X POST http://localhost:3001/webhooks/stripe `
  -H "Content-Type: application/json" `
  -H "stripe-signature: test" `
  -d '{\"type\":\"invoice.payment_succeeded\",\"data\":{\"object\":{\"customer\":\"cus_test123\"}}}'
```

**Expected:** `400 Bad Request` — `{ "message": "Invalid signature" }` (correct — signature verification is working).

---

### POST /webhooks/retell — Retell Webhook

```powershell
curl -X POST http://localhost:3001/webhooks/retell `
  -H "Content-Type: application/json" `
  -d '{\"event\":\"call_ended\",\"call_id\":\"call_abc123\",\"agent_id\":\"agent_xyz\",\"duration_ms\":45000}'
```

**Expected:** `{ "received": true }`

---

# Error Testing

### Test validation (missing required field)

```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@musaed.com\"}'
```

**Expected:** `400 Bad Request` — validation error about missing `password`.

---

### Test invalid enum value

```powershell
curl -X POST http://localhost:3001/tenant/staff `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer {{OWNER_TOKEN}}" `
  -d '{\"email\":\"test@test.com\",\"name\":\"Test\",\"roleSlug\":\"invalid_role\"}'
```

**Expected:** `400 Bad Request` — `roleSlug must be one of: tenant_owner, clinic_admin, doctor, receptionist, auditor, tenant_staff`.

---

### Test unauthorized access (no token)

```powershell
curl http://localhost:3001/admin/tenants
```

**Expected:** `401 Unauthorized`

---

### Test forbidden (tenant user accessing admin route)

```powershell
curl http://localhost:3001/admin/tenants `
  -H "Authorization: Bearer {{OWNER_TOKEN}}"
```

**Expected:** `403 Forbidden`

---

### Test non-whitelisted fields (extra fields stripped)

```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@musaed.com\",\"password\":\"Admin123!\",\"hackerField\":\"malicious\"}'
```

**Expected:** `400 Bad Request` — `property hackerField should not exist`.

---

# Route Summary (50 endpoints)

| # | Method | Path | Auth | Module |
|---|--------|------|------|--------|
| 1 | GET | `/health` | None | Health |
| 2 | POST | `/auth/login` | None | Auth |
| 3 | POST | `/auth/refresh` | None | Auth |
| 4 | POST | `/auth/logout` | None | Auth |
| 5 | GET | `/auth/me` | JWT | Auth |
| 6 | GET | `/admin/tenants` | Admin | Tenants |
| 7 | POST | `/admin/tenants` | Admin | Tenants |
| 8 | GET | `/admin/tenants/:id` | Admin | Tenants |
| 9 | PATCH | `/admin/tenants/:id` | Admin | Tenants |
| 10 | POST | `/admin/tenants/:id/suspend` | Admin | Tenants |
| 11 | GET | `/admin/overview` | Admin | Admin |
| 12 | GET | `/admin/system` | Admin | Admin |
| 13 | GET | `/admin/billing/overview` | Admin | Billing |
| 14 | GET | `/admin/billing/plans` | Admin | Billing |
| 15 | POST | `/admin/billing/plans` | Admin | Billing |
| 16 | PATCH | `/admin/billing/plans/:id` | Admin | Billing |
| 17 | GET | `/tenant/billing` | Tenant | Billing |
| 18 | GET | `/admin/templates` | Admin | Templates |
| 19 | POST | `/admin/templates` | Admin | Templates |
| 20 | GET | `/admin/templates/:id` | Admin | Templates |
| 21 | PATCH | `/admin/templates/:id` | Admin | Templates |
| 22 | DELETE | `/admin/templates/:id` | Admin | Templates |
| 23 | GET | `/admin/agents` | Admin | Agents |
| 24 | GET | `/admin/agents/:id` | Admin | Agents |
| 25 | GET | `/admin/support` | Admin | Support |
| 26 | GET | `/admin/support/:id` | Admin | Support |
| 27 | GET | `/tenant/staff` | Tenant | Staff |
| 28 | POST | `/tenant/staff` | Tenant | Staff |
| 29 | PATCH | `/tenant/staff/:id` | Tenant | Staff |
| 30 | GET | `/tenant/customers` | Tenant | Customers |
| 31 | GET | `/tenant/customers/:id` | Tenant | Customers |
| 32 | POST | `/tenant/customers` | Tenant | Customers |
| 33 | POST | `/tenant/customers/:id/export` | Tenant | Customers |
| 34 | DELETE | `/tenant/customers/:id` | Tenant | Customers |
| 35 | GET | `/tenant/bookings` | Tenant | Bookings |
| 36 | POST | `/tenant/bookings` | Tenant | Bookings |
| 37 | PATCH | `/tenant/bookings/:id` | Tenant | Bookings |
| 38 | GET | `/tenant/support/tickets` | Tenant | Support |
| 39 | POST | `/tenant/support/tickets` | Tenant | Support |
| 40 | GET | `/tenant/support/tickets/:id` | Tenant | Support |
| 41 | POST | `/tenant/support/tickets/:id/messages` | Tenant | Support |
| 42 | GET | `/tenant/dashboard/metrics` | Tenant | Dashboard |
| 43 | GET | `/tenant/reports/performance` | Tenant | Reports |
| 44 | GET | `/tenant/settings` | Tenant | Settings |
| 45 | PATCH | `/tenant/settings` | Tenant | Settings |
| 46 | GET | `/tenant/agents` | Tenant | Agents |
| 47 | GET | `/tenant/agents/:id` | Tenant | Agents |
| 48 | PATCH | `/tenant/agents/:id/prompts` | Tenant | Agents |
| 49 | POST | `/tenant/agents/:id/sync` | Tenant | Agents |
| 50 | POST | `/webhooks/stripe` | None (signature) | Webhooks |
| 51 | POST | `/webhooks/retell` | None | Webhooks |

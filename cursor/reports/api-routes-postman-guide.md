# MUSAED API — Complete Postman Testing Guide

**Base URL:** `http://localhost:3001`  
**Content-Type:** `application/json` (set on all requests)

---

## STEP 1 — GET YOUR TOKEN (Do This First!)

### Login as ADMIN

```
POST http://localhost:3001/auth/login
```

Body (raw JSON):

```json
{
  "email": "admin@musaed.com",
  "password": "Admin123!"
}
```

Response:

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "...",
    "email": "admin@musaed.com",
    "name": "Admin",
    "role": "ADMIN"
  }
}
```

**Copy the `accessToken`** → In Postman, set header on all subsequent requests:

```
Authorization: Bearer <paste accessToken here>
```

### Login as TENANT OWNER

```
POST http://localhost:3001/auth/login
```

```json
{
  "email": "owner@democlinic.com",
  "password": "Owner123!"
}
```

The tenant owner token gives access to `/tenant/*` routes.  
The admin token gives access to `/admin/*` routes AND `/tenant/*` routes (add `?tenantId=<id>` to tenant routes).

---

## STEP 2 — VERIFY TOKEN WORKS

```
GET http://localhost:3001/auth/me
Headers: Authorization: Bearer <accessToken>
```

No body needed. Should return your user object.

---

## ALL API ROUTES

---

## A. AUTH ROUTES (No token needed except /auth/me)

### A1. POST `/auth/login`

```
POST http://localhost:3001/auth/login
```

```json
{
  "email": "admin@musaed.com",
  "password": "Admin123!"
}
```

### A2. POST `/auth/refresh`

```
POST http://localhost:3001/auth/refresh
```

```json
{
  "refreshToken": "<your refreshToken from login>"
}
```

### A3. POST `/auth/logout`

```
POST http://localhost:3001/auth/logout
```

```json
{
  "refreshToken": "<your refreshToken from login>"
}
```

### A4. GET `/auth/me` (NEEDS TOKEN)

```
GET http://localhost:3001/auth/me
Headers: Authorization: Bearer <accessToken>
```

### A5. GET `/auth/verify-token`

```
GET http://localhost:3001/auth/verify-token?token=<invite_or_reset_token>
```

### A6. POST `/auth/setup-password`

```
POST http://localhost:3001/auth/setup-password
```

```json
{
  "token": "<invite token from tenant creation>",
  "password": "NewSecure1"
}
```

### A7. POST `/auth/forgot-password`

```
POST http://localhost:3001/auth/forgot-password
```

```json
{
  "email": "owner@democlinic.com"
}
```

### A8. POST `/auth/reset-password`

```
POST http://localhost:3001/auth/reset-password
```

```json
{
  "token": "<reset token from forgot-password flow>",
  "password": "ResetPass1"
}
```

---

## B. ADMIN ROUTES (Need ADMIN token)

All routes below need:

```
Headers:
  Authorization: Bearer <admin accessToken>
  Content-Type: application/json
```

### B1. GET `/admin/overview`

```
GET http://localhost:3001/admin/overview
```

### B2. GET `/admin/system`

```
GET http://localhost:3001/admin/system
```

---

### ADMIN > TENANTS

### B3. GET `/admin/tenants` — List all tenants

```
GET http://localhost:3001/admin/tenants?page=1&limit=20
```

Optional query params: `status=ACTIVE`, `page=1`, `limit=20`

### B4. POST `/admin/tenants` — Create a tenant

```
POST http://localhost:3001/admin/tenants
```

```json
{
  "name": "Sunrise Dental Clinic",
  "slug": "sunrise-dental",
  "ownerEmail": "owner@sunrisedental.com",
  "ownerName": "Dr. Sarah Johnson",
  "timezone": "America/New_York"
}
```

**slug rules:** lowercase letters, numbers, hyphens only. Must be unique.

### B5. GET `/admin/tenants/:id` — Get one tenant

```
GET http://localhost:3001/admin/tenants/69adef71e56f0d7d40a7f132
```

Replace the ID with an actual tenant `_id` from B3.

### B6. PATCH `/admin/tenants/:id` — Update tenant

```
PATCH http://localhost:3001/admin/tenants/69adef71e56f0d7d40a7f132
```

```json
{
  "name": "Sunrise Dental Updated",
  "status": "ACTIVE",
  "timezone": "America/Los_Angeles"
}
```

### B7. POST `/admin/tenants/:id/suspend` — Suspend tenant

```
POST http://localhost:3001/admin/tenants/69adef71e56f0d7d40a7f132/suspend
```

No body needed.

### B8. POST `/admin/tenants/:id/resend-invite` — Resend invite email

```
POST http://localhost:3001/admin/tenants/69adef71e56f0d7d40a7f132/resend-invite
```

No body needed.

---

### ADMIN > BILLING

### B9. GET `/admin/billing/overview`

```
GET http://localhost:3001/admin/billing/overview
```

### B10. GET `/admin/billing/plans` — List subscription plans

```
GET http://localhost:3001/admin/billing/plans
```

### B11. POST `/admin/billing/plans` — Create a plan

```
POST http://localhost:3001/admin/billing/plans
```

```json
{
  "name": "Professional Plan",
  "monthlyPriceCents": 9900,
  "maxVoiceAgents": 3,
  "maxChatAgents": 5,
  "maxEmailAgents": 2,
  "maxStaff": 10,
  "features": { "analytics": true },
  "isActive": true
}
```

### B12. PATCH `/admin/billing/plans/:id` — Update a plan

```
PATCH http://localhost:3001/admin/billing/plans/<planId>
```

```json
{
  "name": "Professional Plan v2",
  "monthlyPriceCents": 12900,
  "maxStaff": 15
}
```

---

### ADMIN > TEMPLATES

### B13. GET `/admin/templates` — List agent templates

```
GET http://localhost:3001/admin/templates?channel=voice&page=1&limit=20
```

### B14. POST `/admin/templates` — Create template

```
POST http://localhost:3001/admin/templates
```

```json
{
  "name": "Receptionist Voice Agent",
  "description": "Handles appointment scheduling",
  "channel": "voice",
  "basePrompt": "You are a friendly clinic receptionist. Help callers book appointments.",
  "voiceConfig": { "voiceId": "en-US-Neural2-A" },
  "llmConfig": { "model": "gpt-4" },
  "isDefault": false,
  "tags": ["reception", "voice"]
}
```

### B15. GET `/admin/templates/:id`

```
GET http://localhost:3001/admin/templates/<templateId>
```

### B16. PATCH `/admin/templates/:id` — Update template

```
PATCH http://localhost:3001/admin/templates/<templateId>
```

```json
{
  "name": "Updated Receptionist Agent",
  "basePrompt": "Updated system prompt..."
}
```

### B17. DELETE `/admin/templates/:id` — Delete template

```
DELETE http://localhost:3001/admin/templates/<templateId>
```

---

### ADMIN > AGENTS

### B18. GET `/admin/agents` — List all agents across tenants

```
GET http://localhost:3001/admin/agents?status=active&page=1&limit=20
```

### B19. GET `/admin/agents/:id`

```
GET http://localhost:3001/admin/agents/<agentId>
```

---

### ADMIN > SUPPORT

### B20. GET `/admin/support` — All support tickets

```
GET http://localhost:3001/admin/support?status=open&page=1&limit=20
```

### B21. GET `/admin/support/:id`

```
GET http://localhost:3001/admin/support/<ticketId>
```

---

## C. TENANT ROUTES (Need tenant owner token OR admin token with ?tenantId=)

If logged in as **tenant owner**: routes auto-scope to their tenant.  
If logged in as **admin**: add `?tenantId=<tenantId>` to every URL.

All routes below need:

```
Headers:
  Authorization: Bearer <accessToken>
  Content-Type: application/json
```

---

### TENANT > STAFF

### C1. GET `/tenant/staff` — List staff

```
GET http://localhost:3001/tenant/staff
```

Admin version:

```
GET http://localhost:3001/tenant/staff?tenantId=69adef71e56f0d7d40a7f132
```

### C2. POST `/tenant/staff` — Invite staff member

```
POST http://localhost:3001/tenant/staff
```

```json
{
  "email": "dr.jane@clinic.com",
  "name": "Dr. Jane Doe",
  "roleSlug": "doctor"
}
```

Valid roleSlug values: `tenant_owner`, `clinic_admin`, `doctor`, `receptionist`, `auditor`, `tenant_staff`

Admin version: `POST http://localhost:3001/tenant/staff?tenantId=<tenantId>`

### C3. PATCH `/tenant/staff/:id` — Update staff member

```
PATCH http://localhost:3001/tenant/staff/<staffId>
```

```json
{
  "roleSlug": "clinic_admin",
  "status": "active"
}
```

---

### TENANT > CUSTOMERS

### C4. GET `/tenant/customers` — List customers

```
GET http://localhost:3001/tenant/customers?page=1&limit=20&search=john
```

### C5. POST `/tenant/customers` — Create customer

```
POST http://localhost:3001/tenant/customers
```

```json
{
  "name": "John Smith",
  "email": "john.smith@email.com",
  "phone": "+1234567890",
  "dateOfBirth": "1985-06-15",
  "source": "call",
  "tags": ["vip", "returning"],
  "metadata": { "referral": "google" }
}
```

### C6. GET `/tenant/customers/:id`

```
GET http://localhost:3001/tenant/customers/<customerId>
```

### C7. POST `/tenant/customers/:id/export` — Export customer data

```
POST http://localhost:3001/tenant/customers/<customerId>/export
```

### C8. DELETE `/tenant/customers/:id` — Delete customer

```
DELETE http://localhost:3001/tenant/customers/<customerId>
```

---

### TENANT > BOOKINGS

### C9. GET `/tenant/bookings` — List bookings

```
GET http://localhost:3001/tenant/bookings?page=1&limit=20&status=confirmed
```

### C10. POST `/tenant/bookings` — Create booking

```
POST http://localhost:3001/tenant/bookings
```

```json
{
  "customerId": "<customerId from C5>",
  "providerId": "<staffId from C1>",
  "serviceType": "Dental Checkup",
  "date": "2026-03-15",
  "timeSlot": "10:00",
  "durationMinutes": 30,
  "status": "confirmed",
  "notes": "First visit, needs X-ray"
}
```

### C11. PATCH `/tenant/bookings/:id` — Update booking

```
PATCH http://localhost:3001/tenant/bookings/<bookingId>
```

```json
{
  "status": "completed",
  "notes": "Patient arrived on time"
}
```

---

### TENANT > SUPPORT TICKETS

### C12. GET `/tenant/support/tickets` — List tickets

```
GET http://localhost:3001/tenant/support/tickets?status=open&page=1&limit=20
```

### C13. POST `/tenant/support/tickets` — Create ticket

```
POST http://localhost:3001/tenant/support/tickets
```

```json
{
  "title": "Billing inquiry for March invoice",
  "category": "billing",
  "priority": "medium",
  "body": "I have a question about the charges on my last invoice."
}
```

Categories: `billing`, `technical`, `agent`, `general`  
Priorities: `low`, `medium`, `high`, `critical`

### C14. GET `/tenant/support/tickets/:id`

```
GET http://localhost:3001/tenant/support/tickets/<ticketId>
```

### C15. POST `/tenant/support/tickets/:id/messages` — Reply to ticket

```
POST http://localhost:3001/tenant/support/tickets/<ticketId>/messages
```

```json
{
  "body": "Thank you for your response. The issue is now resolved."
}
```

---

### TENANT > AGENTS

### C16. GET `/tenant/agents` — List tenant's agents

```
GET http://localhost:3001/tenant/agents
```

### C17. GET `/tenant/agents/:id`

```
GET http://localhost:3001/tenant/agents/<agentId>
```

### C18. PATCH `/tenant/agents/:id/prompts` — Update agent prompts

```
PATCH http://localhost:3001/tenant/agents/<agentId>/prompts
```

```json
{
  "customPrompts": {
    "greeting": "Hello! Welcome to our clinic. How can I help you today?",
    "closing": "Thank you for calling. Have a great day!"
  }
}
```

### C19. POST `/tenant/agents/:id/sync` — Sync agent with Retell

```
POST http://localhost:3001/tenant/agents/<agentId>/sync
```

No body needed.

---

### TENANT > BILLING

### C20. GET `/tenant/billing` — Tenant billing info

```
GET http://localhost:3001/tenant/billing
```

---

### TENANT > DASHBOARD

### C21. GET `/tenant/dashboard/metrics`

```
GET http://localhost:3001/tenant/dashboard/metrics
```

---

### TENANT > REPORTS

### C22. GET `/tenant/reports/performance`

```
GET http://localhost:3001/tenant/reports/performance?dateFrom=2026-03-01&dateTo=2026-03-31
```

---

### TENANT > SETTINGS

### C23. GET `/tenant/settings`

```
GET http://localhost:3001/tenant/settings
```

### C24. PATCH `/tenant/settings` — Update settings

```
PATCH http://localhost:3001/tenant/settings
```

```json
{
  "businessHours": {
    "monday": { "open": "09:00", "close": "17:00" },
    "tuesday": { "open": "09:00", "close": "17:00" },
    "wednesday": { "open": "09:00", "close": "17:00" },
    "thursday": { "open": "09:00", "close": "17:00" },
    "friday": { "open": "09:00", "close": "14:00" }
  },
  "notifications": { "emailReminders": true },
  "timezone": "America/New_York",
  "locale": "en-US"
}
```

---

## D. HEALTH & WEBHOOKS (No token needed)

### D1. GET `/health` — Health check

```
GET http://localhost:3001/health
```

### D2. POST `/webhooks/retell` — Retell voice webhook

```
POST http://localhost:3001/webhooks/retell
```

```json
{
  "event": "call_started",
  "call_id": "call_abc123",
  "agent_id": "agent_xyz",
  "customer_id": "cust_123"
}
```

### D3. POST `/webhooks/stripe` — Stripe webhook

```
POST http://localhost:3001/webhooks/stripe
Headers: stripe-signature: <stripe signature>
```

Needs raw body + valid Stripe signature. Test via Stripe CLI.

---

## RECOMMENDED TESTING ORDER

| Step | Route | What to do |
|------|-------|------------|
| 1 | `POST /auth/login` (admin) | Get admin token |
| 2 | `GET /auth/me` | Verify token works |
| 3 | `GET /health` | Check server is up |
| 4 | `GET /admin/tenants` | See existing tenants |
| 5 | `POST /admin/tenants` | Create a new tenant, save the `_id` |
| 6 | `GET /admin/tenants` | Verify tenant was created |
| 7 | `GET /admin/billing/plans` | See plans |
| 8 | `POST /admin/templates` | Create an agent template |
| 9 | `POST /auth/login` (tenant) | Login as tenant owner |
| 10 | `POST /tenant/customers` | Create a customer, save `_id` |
| 11 | `GET /tenant/customers` | Verify customer exists |
| 12 | `POST /tenant/bookings` | Create booking with customer ID |
| 13 | `GET /tenant/bookings` | Verify booking exists |
| 14 | `POST /tenant/staff` | Invite a staff member |
| 15 | `GET /tenant/staff` | Verify staff exists |
| 16 | `POST /tenant/support/tickets` | Create a support ticket |
| 17 | `GET /tenant/support/tickets` | Verify ticket exists |

---

## TOTAL: 53 endpoints

| Section | Count |
|---------|-------|
| Auth | 8 |
| Admin | 21 |
| Tenant | 24 |
| Health & Webhooks | 3 |

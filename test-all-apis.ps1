$ErrorActionPreference = "Continue"
$BASE = "http://localhost:3001"
$results = @()
$tmpFile = "d:\Software house projects\clinic-crm\tmp_api_body.json"

function Api($method, $endpoint, $body, $token, $label, $expectFail) {
    $args = @("-s", "-w", "`n%{http_code}", "-X", $method)
    if ($token) { $args += @("-H", "Authorization: Bearer $token") }
    if ($body) {
        [System.IO.File]::WriteAllText($script:tmpFile, $body)
        $args += @("-H", "Content-Type: application/json", "--data-binary", "@$($script:tmpFile)")
    }
    $args += "$BASE$endpoint"
    $raw = & curl.exe @args 2>&1
    $lines = ($raw -join "`n").Trim().Split("`n")
    $statusCode = $lines[-1]
    $responseBody = ($lines[0..($lines.Length-2)] -join "`n")
    $pass = if ($expectFail) { $statusCode -match "^(400|401|403|404)$" } else { $statusCode -match "^(200|201|202)$" }
    $obj = [PSCustomObject]@{
        Label = $label; Method = $method; Endpoint = $endpoint
        Status = $statusCode; Pass = $pass
        Response = if ($responseBody.Length -gt 600) { $responseBody.Substring(0,600) + "..." } else { $responseBody }
    }
    $script:results += $obj
    if ($pass) { Write-Host "[PASS $statusCode] $label" -ForegroundColor Green }
    else { Write-Host "[FAIL $statusCode] $label" -ForegroundColor Red; Write-Host "  $($responseBody.Substring(0, [Math]::Min($responseBody.Length, 300)))" -ForegroundColor Yellow }
    return $responseBody
}

Write-Host "`n========== MUSAED API TEST SUITE (ALL 50+ ENDPOINTS) ==========" -ForegroundColor Cyan

# ====================== 1. HEALTH ======================
Write-Host "`n--- 1. Health ---" -ForegroundColor Cyan
Api "GET" "/health" $null $null "GET /health"

# ====================== 2. AUTH: ADMIN LOGIN ======================
Write-Host "`n--- 2. Auth: Admin Login ---" -ForegroundColor Cyan
$loginResp = Api "POST" "/auth/login" '{"email":"admin@musaed.com","password":"Admin123!"}' $null "POST /auth/login (admin)"
$loginData = $loginResp | ConvertFrom-Json
$ADMIN_TOKEN = $loginData.accessToken
$ADMIN_REFRESH = $loginData.refreshToken
Write-Host "  Token: $($ADMIN_TOKEN.Substring(0,20))..." -ForegroundColor Gray

Api "GET" "/auth/me" $null $ADMIN_TOKEN "GET /auth/me (admin)"

# ====================== 3. ADMIN: TENANTS ======================
Write-Host "`n--- 3. Admin: Tenants ---" -ForegroundColor Cyan
$tenantBody = '{"name":"Riyadh Dental Clinic","slug":"riyadh-dental","ownerEmail":"owner@riyadh-dental.com","ownerName":"Khalid Al-Fahad","timezone":"Asia/Riyadh"}'
$tenantResp = Api "POST" "/admin/tenants" $tenantBody $ADMIN_TOKEN "POST /admin/tenants (create)"
try {
    $tenantData = $tenantResp | ConvertFrom-Json
    $TENANT_ID = $tenantData.tenant._id
    $OWNER_USER_ID = $tenantData.owner._id
    Write-Host "  Tenant ID: $TENANT_ID" -ForegroundColor Gray
    Write-Host "  Owner ID: $OWNER_USER_ID" -ForegroundColor Gray
} catch { Write-Host "  Failed to parse tenant" -ForegroundColor Red; $TENANT_ID = $null }

Api "GET" "/admin/tenants?page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/tenants (list)"

if ($TENANT_ID) {
    Api "GET" "/admin/tenants/$TENANT_ID" $null $ADMIN_TOKEN "GET /admin/tenants/:id (detail)"
    Api "PATCH" "/admin/tenants/$TENANT_ID" '{"name":"Riyadh Dental Clinic (Updated)","locale":"ar"}' $ADMIN_TOKEN "PATCH /admin/tenants/:id (update)"
    Api "POST" "/admin/tenants/$TENANT_ID/suspend" $null $ADMIN_TOKEN "POST /admin/tenants/:id/suspend"
    Api "PATCH" "/admin/tenants/$TENANT_ID" '{"status":"ACTIVE"}' $ADMIN_TOKEN "PATCH /admin/tenants/:id (reactivate)"
    Api "POST" "/admin/tenants/$TENANT_ID/resend-invite" $null $ADMIN_TOKEN "POST /admin/tenants/:id/resend-invite"
}

# ====================== 4. ADMIN: BILLING & PLANS ======================
Write-Host "`n--- 4. Admin: Billing & Plans ---" -ForegroundColor Cyan
$plansResp = Api "GET" "/admin/billing/plans" $null $ADMIN_TOKEN "GET /admin/billing/plans (list)"
try {
    $plansData = $plansResp | ConvertFrom-Json
    if ($plansData -is [array] -and $plansData.Length -gt 0) { $PLAN_ID = $plansData[0]._id; Write-Host "  Plan ID: $PLAN_ID" -ForegroundColor Gray }
} catch { $PLAN_ID = $null }

$newPlanResp = Api "POST" "/admin/billing/plans" '{"name":"Growth","monthlyPriceCents":2900,"maxVoiceAgents":3,"maxChatAgents":3,"maxEmailAgents":1,"maxStaff":10,"features":{"support":"standard","analytics":true},"isActive":true}' $ADMIN_TOKEN "POST /admin/billing/plans (create)"
try { $NEW_PLAN_ID = ($newPlanResp | ConvertFrom-Json)._id; Write-Host "  New Plan: $NEW_PLAN_ID" -ForegroundColor Gray } catch { $NEW_PLAN_ID = $null }

if ($NEW_PLAN_ID) {
    Api "PATCH" "/admin/billing/plans/$NEW_PLAN_ID" '{"name":"Growth Plus","monthlyPriceCents":3400}' $ADMIN_TOKEN "PATCH /admin/billing/plans/:id (update)"
}
Api "GET" "/admin/billing/overview" $null $ADMIN_TOKEN "GET /admin/billing/overview"
if ($TENANT_ID) {
    Api "GET" "/tenant/billing?tenantId=$TENANT_ID" $null $ADMIN_TOKEN "GET /tenant/billing (admin query)"
}

# ====================== 5. ADMIN: AGENT TEMPLATES ======================
Write-Host "`n--- 5. Admin: Agent Templates ---" -ForegroundColor Cyan
$tmplBody = '{"name":"Reception Voice Agent","description":"Handles appointment scheduling","channel":"voice","voiceConfig":{"language":"ar","voice":"Fatima"},"llmConfig":{"model":"gpt-4o","temperature":0.7},"basePrompt":"You are a professional clinic receptionist.","isDefault":false,"tags":["reception","scheduling"]}'
$tmplResp = Api "POST" "/admin/templates" $tmplBody $ADMIN_TOKEN "POST /admin/templates (create)"
try { $TEMPLATE_ID = ($tmplResp | ConvertFrom-Json)._id; Write-Host "  Template: $TEMPLATE_ID" -ForegroundColor Gray } catch { $TEMPLATE_ID = $null }

Api "GET" "/admin/templates?page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/templates (list)"
Api "GET" "/admin/templates?channel=voice&page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/templates (filter voice)"

if ($TEMPLATE_ID) {
    Api "GET" "/admin/templates/$TEMPLATE_ID" $null $ADMIN_TOKEN "GET /admin/templates/:id (detail)"
    Api "PATCH" "/admin/templates/$TEMPLATE_ID" '{"name":"Reception Voice Agent v2","isDefault":true}' $ADMIN_TOKEN "PATCH /admin/templates/:id (update)"
    Api "DELETE" "/admin/templates/$TEMPLATE_ID" $null $ADMIN_TOKEN "DELETE /admin/templates/:id"
}

# ====================== 6. ADMIN: AGENT INSTANCES ======================
Write-Host "`n--- 6. Admin: Agent Instances ---" -ForegroundColor Cyan
Api "GET" "/admin/agents?page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/agents (list)"
Api "GET" "/admin/agents?status=active&page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/agents (filter active)"

# ====================== 7. ADMIN: OVERVIEW & SYSTEM ======================
Write-Host "`n--- 7. Admin: Overview & System ---" -ForegroundColor Cyan
Api "GET" "/admin/overview" $null $ADMIN_TOKEN "GET /admin/overview"
Api "GET" "/admin/system" $null $ADMIN_TOKEN "GET /admin/system"

# ====================== 8. ADMIN: SUPPORT ======================
Write-Host "`n--- 8. Admin: Support (pre-tickets) ---" -ForegroundColor Cyan
Api "GET" "/admin/support?page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/support (list - empty)"

# ====================== 9. AUTH: TENANT OWNER ======================
Write-Host "`n--- 9. Auth: Tenant Owner Setup & Login ---" -ForegroundColor Cyan

# Get the invite token from DB and activate via setup-password
if ($OWNER_USER_ID) {
    # Get invite token using the helper script
    $INVITE_TOKEN = (node "d:\Software house projects\clinic-crm\apps\backend\get-invite-token.js" "owner@riyadh-dental.com" 2>$null).Trim()
    Write-Host "  Invite token: $($INVITE_TOKEN.Substring(0, [Math]::Min($INVITE_TOKEN.Length, 20)))..." -ForegroundColor Gray

    if ($INVITE_TOKEN -ne "NO_TOKEN") {
        # Verify token
        Api "GET" "/auth/verify-token?token=$INVITE_TOKEN" $null $null "GET /auth/verify-token (valid)"
        # Setup password
        $setupBody = "{`"token`":`"$INVITE_TOKEN`",`"password`":`"Owner123!`"}"
        $setupResp = Api "POST" "/auth/setup-password" $setupBody $null "POST /auth/setup-password (owner)"
        try {
            $setupData = $setupResp | ConvertFrom-Json
            $OWNER_TOKEN = $setupData.accessToken
            Write-Host "  Owner activated & logged in!" -ForegroundColor Green
        } catch { Write-Host "  Setup failed" -ForegroundColor Red; $OWNER_TOKEN = $null }
    } else {
        Write-Host "  No invite token found, trying direct login..." -ForegroundColor Yellow
        $ownerLogin = Api "POST" "/auth/login" '{"email":"owner@riyadh-dental.com","password":"Owner123!"}' $null "POST /auth/login (owner)"
        try { $OWNER_TOKEN = ($ownerLogin | ConvertFrom-Json).accessToken } catch { $OWNER_TOKEN = $null }
    }
} else {
    Write-Host "  Skipping - no owner user" -ForegroundColor Yellow
}

# Verify token already used
if ($INVITE_TOKEN -and $INVITE_TOKEN -ne "NO_TOKEN") {
    Api "GET" "/auth/verify-token?token=$INVITE_TOKEN" $null $null "GET /auth/verify-token (already used)"
}

if (-not $OWNER_TOKEN) {
    Write-Host "  CRITICAL: No owner token - skipping tenant tests!" -ForegroundColor Red
} else {
    Write-Host "  Owner token: $($OWNER_TOKEN.Substring(0,20))..." -ForegroundColor Gray

    # ====================== 10. TENANT: STAFF ======================
    Write-Host "`n--- 10. Tenant: Staff ---" -ForegroundColor Cyan
    Api "GET" "/tenant/staff" $null $OWNER_TOKEN "GET /tenant/staff (list)"
    $staffResp = Api "POST" "/tenant/staff" '{"email":"dr.sarah@riyadh-dental.com","name":"Dr. Sarah Ahmed","roleSlug":"doctor"}' $OWNER_TOKEN "POST /tenant/staff (invite)"
    try { $STAFF_ID = ($staffResp | ConvertFrom-Json)._id; Write-Host "  Staff: $STAFF_ID" -ForegroundColor Gray } catch { $STAFF_ID = $null }
    if ($STAFF_ID) {
        Api "PATCH" "/tenant/staff/$STAFF_ID" '{"roleSlug":"clinic_admin"}' $OWNER_TOKEN "PATCH /tenant/staff/:id (update)"
    }

    # ====================== 11. TENANT: CUSTOMERS ======================
    Write-Host "`n--- 11. Tenant: Customers ---" -ForegroundColor Cyan
    $custResp = Api "POST" "/tenant/customers" '{"name":"Ahmed Al-Rashid","email":"ahmed@example.com","phone":"+966501234567","dateOfBirth":"1990-05-15","source":"manual","tags":["vip","returning"],"metadata":{"referral":"friend"}}' $OWNER_TOKEN "POST /tenant/customers (create 1)"
    try { $CUSTOMER_ID = ($custResp | ConvertFrom-Json)._id; Write-Host "  Customer: $CUSTOMER_ID" -ForegroundColor Gray } catch { $CUSTOMER_ID = $null }

    $cust2Resp = Api "POST" "/tenant/customers" '{"name":"Fatima Noor","email":"fatima@example.com","phone":"+966509876543","source":"call"}' $OWNER_TOKEN "POST /tenant/customers (create 2)"
    try { $CUSTOMER2_ID = ($cust2Resp | ConvertFrom-Json)._id; Write-Host "  Customer2: $CUSTOMER2_ID" -ForegroundColor Gray } catch { $CUSTOMER2_ID = $null }

    Api "GET" "/tenant/customers?page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/customers (list)"
    Api "GET" "/tenant/customers?search=Ahmed&page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/customers (search)"

    if ($CUSTOMER_ID) {
        Api "GET" "/tenant/customers/$CUSTOMER_ID" $null $OWNER_TOKEN "GET /tenant/customers/:id (detail)"
        Api "POST" "/tenant/customers/$CUSTOMER_ID/export" $null $OWNER_TOKEN "POST /tenant/customers/:id/export (GDPR)"
    }
    if ($CUSTOMER2_ID) {
        Api "DELETE" "/tenant/customers/$CUSTOMER2_ID" $null $OWNER_TOKEN "DELETE /tenant/customers/:id (soft delete)"
    }

    # ====================== 12. TENANT: BOOKINGS ======================
    Write-Host "`n--- 12. Tenant: Bookings ---" -ForegroundColor Cyan
    if ($CUSTOMER_ID) {
        $bookBody = "{`"customerId`":`"$CUSTOMER_ID`",`"serviceType`":`"consultation`",`"date`":`"2026-03-15`",`"timeSlot`":`"10:00`",`"durationMinutes`":30,`"notes`":`"First visit`"}"
        $bookResp = Api "POST" "/tenant/bookings" $bookBody $OWNER_TOKEN "POST /tenant/bookings (create 1)"
        try { $BOOKING_ID = ($bookResp | ConvertFrom-Json)._id; Write-Host "  Booking: $BOOKING_ID" -ForegroundColor Gray } catch { $BOOKING_ID = $null }

        $book2Body = "{`"customerId`":`"$CUSTOMER_ID`",`"serviceType`":`"cleaning`",`"date`":`"2026-03-16`",`"timeSlot`":`"14:00`",`"durationMinutes`":45,`"status`":`"confirmed`"}"
        Api "POST" "/tenant/bookings" $book2Body $OWNER_TOKEN "POST /tenant/bookings (create 2)"
    }
    Api "GET" "/tenant/bookings?page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/bookings (list)"
    Api "GET" "/tenant/bookings?date=2026-03-15&page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/bookings (filter date)"
    Api "GET" "/tenant/bookings?status=confirmed&page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/bookings (filter status)"

    if ($BOOKING_ID) {
        Api "PATCH" "/tenant/bookings/$BOOKING_ID" '{"status":"completed","notes":"Patient seen. All good."}' $OWNER_TOKEN "PATCH /tenant/bookings/:id (complete)"
        Api "PATCH" "/tenant/bookings/$BOOKING_ID" '{"status":"cancelled"}' $OWNER_TOKEN "PATCH /tenant/bookings/:id (cancel)"
    }

    # ====================== 13. TENANT: SUPPORT TICKETS ======================
    Write-Host "`n--- 13. Tenant: Support Tickets ---" -ForegroundColor Cyan
    $ticketResp = Api "POST" "/tenant/support/tickets" '{"title":"Agent not responding to Arabic callers","category":"agent","priority":"high","body":"Our voice agent fails when Arabic is spoken."}' $OWNER_TOKEN "POST /tenant/support/tickets (create 1)"
    try { $TICKET_ID = ($ticketResp | ConvertFrom-Json)._id; Write-Host "  Ticket: $TICKET_ID" -ForegroundColor Gray } catch { $TICKET_ID = $null }

    Api "POST" "/tenant/support/tickets" '{"title":"Billing question","category":"billing","priority":"low","body":"When will next invoice be generated?"}' $OWNER_TOKEN "POST /tenant/support/tickets (create 2)"

    Api "GET" "/tenant/support/tickets?page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/support/tickets (list)"
    Api "GET" "/tenant/support/tickets?status=open&page=1&limit=10" $null $OWNER_TOKEN "GET /tenant/support/tickets (filter open)"

    if ($TICKET_ID) {
        Api "GET" "/tenant/support/tickets/$TICKET_ID" $null $OWNER_TOKEN "GET /tenant/support/tickets/:id (detail)"
        Api "POST" "/tenant/support/tickets/$TICKET_ID/messages" '{"body":"I have attached a screenshot of the error."}' $OWNER_TOKEN "POST /tenant/support/tickets/:id/messages"
    }

    # ====================== 8b. ADMIN: SUPPORT (re-test with data) ======================
    Write-Host "`n--- 8b. Admin: Support (with data) ---" -ForegroundColor Cyan
    Api "GET" "/admin/support?page=1&limit=10" $null $ADMIN_TOKEN "GET /admin/support (list with data)"
    if ($TICKET_ID) {
        Api "GET" "/admin/support/$TICKET_ID" $null $ADMIN_TOKEN "GET /admin/support/:id (detail)"
    }

    # ====================== 14. TENANT: DASHBOARD ======================
    Write-Host "`n--- 14. Tenant: Dashboard ---" -ForegroundColor Cyan
    Api "GET" "/tenant/dashboard/metrics" $null $OWNER_TOKEN "GET /tenant/dashboard/metrics"

    # ====================== 15. TENANT: REPORTS ======================
    Write-Host "`n--- 15. Tenant: Reports ---" -ForegroundColor Cyan
    Api "GET" "/tenant/reports/performance" $null $OWNER_TOKEN "GET /tenant/reports/performance"
    Api "GET" "/tenant/reports/performance?dateFrom=2026-03-01&dateTo=2026-03-31" $null $OWNER_TOKEN "GET /tenant/reports/performance (date range)"

    # ====================== 16. TENANT: SETTINGS ======================
    Write-Host "`n--- 16. Tenant: Settings ---" -ForegroundColor Cyan
    Api "GET" "/tenant/settings" $null $OWNER_TOKEN "GET /tenant/settings"
    $settingsBody = '{"timezone":"Asia/Riyadh","locale":"ar-SA","businessHours":{"sun":"09:00-17:00","mon":"09:00-17:00"},"notifications":{"emailDigest":true},"locations":[{"name":"Main Branch","address":"King Fahd Rd"}]}'
    Api "PATCH" "/tenant/settings" $settingsBody $OWNER_TOKEN "PATCH /tenant/settings (update)"

    # ====================== 17. TENANT: AGENTS ======================
    Write-Host "`n--- 17. Tenant: Agents ---" -ForegroundColor Cyan
    Api "GET" "/tenant/agents" $null $OWNER_TOKEN "GET /tenant/agents (list)"
}

# ====================== 18. AUTH: REFRESH & LOGOUT ======================
Write-Host "`n--- 18. Auth: Refresh & Logout ---" -ForegroundColor Cyan
$refreshBody = "{`"refreshToken`":`"$ADMIN_REFRESH`"}"
Api "POST" "/auth/refresh" $refreshBody $null "POST /auth/refresh"
Api "POST" "/auth/logout" $refreshBody $null "POST /auth/logout"
Api "POST" "/auth/refresh" $refreshBody $null "POST /auth/refresh (after logout - expect fail)" $true

# ====================== 19. WEBHOOKS ======================
Write-Host "`n--- 19. Webhooks ---" -ForegroundColor Cyan
# Stripe (should fail signature)
$stripeArgs = @("-s", "-w", "`n%{http_code}", "-X", "POST", "-H", "Content-Type: application/json", "-H", "stripe-signature: test")
[System.IO.File]::WriteAllText($tmpFile, '{"type":"invoice.payment_succeeded","data":{"object":{"customer":"cus_test123"}}}')
$stripeArgs += @("--data-binary", "@$tmpFile", "$BASE/webhooks/stripe")
$stripeRaw = & curl.exe @stripeArgs 2>&1
$stripeLines = ($stripeRaw -join "`n").Trim().Split("`n")
$stripeStatus = $stripeLines[-1]
$stripeBody = ($stripeLines[0..($stripeLines.Length-2)] -join "`n")
$stripePass = $stripeStatus -match "^(400|401)$"
$results += [PSCustomObject]@{Label="POST /webhooks/stripe (bad sig)"; Method="POST"; Endpoint="/webhooks/stripe"; Status=$stripeStatus; Pass=$stripePass; Response=$stripeBody}
if ($stripePass) { Write-Host "[PASS $stripeStatus] POST /webhooks/stripe (bad sig - expected)" -ForegroundColor Green }
else { Write-Host "[FAIL $stripeStatus] POST /webhooks/stripe (bad sig)" -ForegroundColor Red; Write-Host "  $stripeBody" -ForegroundColor Yellow }

Api "POST" "/webhooks/retell" '{"event":"call_ended","call_id":"call_abc123","agent_id":"agent_xyz","duration_ms":45000}' $null "POST /webhooks/retell"

# ====================== 20. ERROR CASES ======================
Write-Host "`n--- 20. Error Cases ---" -ForegroundColor Cyan
Api "POST" "/auth/login" '{"email":"admin@musaed.com"}' $null "POST /auth/login (missing password)" $true
Api "POST" "/auth/login" '{"email":"admin@musaed.com","password":"Admin123!","hackerField":"malicious"}' $null "POST /auth/login (extra field)" $true
Api "GET" "/admin/tenants" $null $null "GET /admin/tenants (no auth)" $true
if ($OWNER_TOKEN) {
    Api "GET" "/admin/tenants" $null $OWNER_TOKEN "GET /admin/tenants (owner accessing admin)" $true
}

# ====================== SUMMARY ======================
Write-Host "`n`n========== FINAL RESULTS ==========" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.Pass }).Count
$failed = ($results | Where-Object { -not $_.Pass }).Count
$total = $results.Count
Write-Host "TOTAL: $total  |  PASSED: $passed  |  FAILED: $failed" -ForegroundColor $(if ($failed -gt 0) {"Yellow"} else {"Green"})
Write-Host ""
if ($failed -gt 0) {
    Write-Host "--- FAILED TESTS ---" -ForegroundColor Red
    $results | Where-Object { -not $_.Pass } | ForEach-Object {
        Write-Host "  [$($_.Status)] $($_.Label)" -ForegroundColor Red
        Write-Host "    $($_.Response.Substring(0, [Math]::Min($_.Response.Length, 300)))" -ForegroundColor Yellow
    }
}

$results | ConvertTo-Json -Depth 5 | Out-File "d:\Software house projects\clinic-crm\api-test-results.json" -Encoding utf8
if (Test-Path $tmpFile) { Remove-Item $tmpFile }

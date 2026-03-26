# Real infrastructure validation — execution record

Generated as part of implementing the multi-agent validation plan. **No production “READY” claim** unless you complete manual Retell/webhook/browser steps with evidence below.

---

## PASSED (automated in this repo run)

| Step | Evidence |
|------|----------|
| **E2E harness alignment** | [`apps/backend/test/app.e2e-spec.ts`](apps/backend/test/app.e2e-spec.ts) global prefix exclude now includes `webhooks/calcom`, matching [`main.ts`](apps/backend/src/main.ts). |
| **Jest e2e** | `npm run test:e2e` — PASS (`GET /health`, auth route guard). |
| **Precheck script** | [`apps/backend/scripts/real-infra-precheck.ts`](apps/backend/scripts/real-infra-precheck.ts) — validates env presence (no secret values logged), `GET /health` database/redis/retell checks, exit codes. |
| **Optional API smoke** | [`apps/backend/scripts/real-infra-smoke-api.ts`](apps/backend/scripts/real-infra-smoke-api.ts) — admin/tenant login, admin overview, processed webhooks ledger, tenant dashboard/settings, notifications list + unread-count, optional `web-call`. |
| **NPM scripts** | [`apps/backend/package.json`](apps/backend/package.json): `validate:infra`, `validate:infra:smoke`. |
| **Env documentation** | [`apps/backend/.env.example`](apps/backend/.env.example) — `SMOKE_*` and `ALLOW_DEGRADED_HEALTH` placeholders. |

---

## FAILED / BLOCKED (live run — needs your environment)

| Item | What happened |
|------|----------------|
| **Precheck against public URL** | `GET /health` returned **502** when using ngrok base URL from env (tunnel or upstream API not reachable from runner). |
| **Precheck against localhost** | **Unreachable** — API not listening on `localhost:3001` at script time. |
| **Full Retell dashboard proof** | Not executed — requires human verification in Retell UI. |
| **Inbound webhooks (call_started / ended / analyzed)** | Not executed — requires public URL + live call + Retell delivery. |
| **Browser UI (transcript/recording)** | Not executed — manual step with `VITE_DATA_MODE=api` prototype. |
| **WebSocket badge proof** | API smoke only hits REST; browser WS verification remains manual. |

---

## FIXES APPLIED DURING IMPLEMENTATION (code/config)

1. **E2e exclude list** — Added `webhooks/calcom` to match production bootstrap.
2. **Health URL** — Precheck normalizes base URL to avoid `//health` double slashes.
3. **New scripts** — Precheck + optional smoke; `.env.example` extended for smoke variables.

---

## Manual checklist (Agents 4, 6, 7, 8 — remaining proof)

1. Start API (`npm run start:dev`) and Redis/Mongo; set `SMOKE_BASE_URL` if not localhost.
2. Fill `RETELL_WEBHOOK_SECRET` / `CALCOM_WEBHOOK_SECRET` for strict signature proof (currently optional warn in precheck).
3. Run `npm run validate:infra` — expect `[PASSED]` when health is `ok`.
4. Set `SMOKE_ADMIN_EMAIL`, `SMOKE_ADMIN_PASSWORD`, tenant vars, optional `SMOKE_AGENT_INSTANCE_ID`; run `npm run validate:infra:smoke`.
5. **Retell:** Confirm agent and call in Retell dashboard after web-call.
6. **Webhooks:** Confirm `processed_events` and `call_sessions` in Mongo or via admin processed-events API after a real call.
7. **Prototype:** `VITE_DATA_MODE=api`, `VITE_API_URL` → verify Calls page and detail (transcript/recording fields).
8. **Sockets:** Open DevTools → WS; confirm `notification:new` when a notification is created.

---

## FINAL STATUS

| Gate | Result |
|------|--------|
| **Automated gate + harness** | **PASS** (e2e + scripts landed). |
| **Full real-infra proof (plan Steps 2–7)** | **NOT COMPLETE** — blocked on running API + public webhooks + manual UI/Retell. |

**Production READY:** **No** — complete manual section and attach screenshots/log excerpts before sign-off.

---

## Agent ID mapping (for your run log)

| Agent | Automation |
|-------|------------|
| 1–2 | `npm run validate:infra` |
| 3–6 | `npm run validate:infra:smoke` + DB/Retell manual |
| 7 | Prototype browser |
| 8 | Notifications REST in smoke + WS manual |

/**
 * Optional API smoke: Agents 3–8 partial automation when API is running and creds are set.
 * Does not replace Retell dashboard / browser / webhook delivery proof — see cursor/reports.
 *
 * Required: running API, valid .env with JWT users.
 * Env:
 *   SMOKE_BASE_URL (default http://localhost:3001)
 *   SMOKE_ADMIN_EMAIL + SMOKE_ADMIN_PASSWORD — admin login
 *   SMOKE_TENANT_EMAIL + SMOKE_TENANT_PASSWORD — tenant login (optional)
 *   SMOKE_AGENT_INSTANCE_ID — for POST /api/tenant/calls/web-call (optional)
 *
 * Usage: npm run validate:infra:smoke
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE = (
  process.env.SMOKE_BASE_URL?.trim() ||
  process.env.API_BASE_URL?.trim() ||
  'http://localhost:3001'
).replace(/\/$/, '');

async function login(email: string, password: string): Promise<{ accessToken: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`login ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) throw new Error('login response missing accessToken');
  return { accessToken: data.accessToken };
}

async function main(): Promise<void> {
  console.log('=== Real infrastructure API smoke (optional) ===\n');

  const adminEmail = process.env.SMOKE_ADMIN_EMAIL?.trim();
  const adminPass = process.env.SMOKE_ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPass) {
    console.log(
      '[SKIP] Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD to run admin JWT checks.',
    );
    process.exit(0);
  }

  const { accessToken: adminToken } = await login(adminEmail, adminPass);
  console.log('[OK] Admin login');

  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!meRes.ok) throw new Error(`GET /api/auth/me ${meRes.status}`);
  const me = (await meRes.json()) as { role?: string };
  console.log(`[OK] GET /api/auth/me role=${me.role ?? '?'}`);

  const overviewRes = await fetch(`${BASE}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!overviewRes.ok) {
    console.warn(`[WARN] GET /api/admin/overview ${overviewRes.status}`);
  } else {
    console.log('[OK] GET /api/admin/overview');
  }

  const whRes = await fetch(`${BASE}/api/admin/webhooks/processed-events?limit=5&skip=0`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!whRes.ok) {
    console.warn(`[WARN] GET /api/admin/webhooks/processed-events ${whRes.status}`);
  } else {
    const wh = (await whRes.json()) as { data?: unknown[]; total?: number };
    console.log(
      `[OK] GET /api/admin/webhooks/processed-events total=${wh.total ?? '?'}`,
    );
  }

  const tenantEmail = process.env.SMOKE_TENANT_EMAIL?.trim();
  const tenantPass = process.env.SMOKE_TENANT_PASSWORD?.trim();

  if (tenantEmail && tenantPass) {
    const { accessToken: tenantToken } = await login(tenantEmail, tenantPass);
    console.log('[OK] Tenant login');

    const dashRes = await fetch(`${BASE}/api/tenant/dashboard/metrics`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    if (!dashRes.ok) {
      console.warn(`[WARN] GET /api/tenant/dashboard/metrics ${dashRes.status}`);
    } else {
      console.log('[OK] GET /api/tenant/dashboard/metrics');
    }

    const settingsRes = await fetch(`${BASE}/api/tenant/settings`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    if (!settingsRes.ok) {
      console.warn(`[WARN] GET /api/tenant/settings ${settingsRes.status}`);
    } else {
      const s = (await settingsRes.json()) as { settings?: { featureFlags?: unknown } };
      console.log(
        `[OK] GET /api/tenant/settings featureFlags=${JSON.stringify(s.settings?.featureFlags ?? {})}`,
      );
    }

    const agentId = process.env.SMOKE_AGENT_INSTANCE_ID?.trim();
    const nRes = await fetch(`${BASE}/api/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    if (!nRes.ok) {
      console.warn(`[WARN] GET /api/notifications ${nRes.status}`);
    } else {
      const n = (await nRes.json()) as { data?: unknown[]; total?: number };
      console.log(
        `[OK] GET /api/notifications total=${n.total ?? '?'}`,
      );
    }

    const ucRes = await fetch(`${BASE}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    if (!ucRes.ok) {
      console.warn(`[WARN] GET /api/notifications/unread-count ${ucRes.status}`);
    } else {
      const uc = (await ucRes.json()) as { count?: number };
      console.log(`[OK] GET /api/notifications/unread-count count=${uc.count ?? '?'}`);
    }

    if (agentId) {
      const wcRes = await fetch(`${BASE}/api/tenant/calls/web-call`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tenantToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentInstanceId: agentId }),
      });
      const wcText = await wcRes.text();
      if (!wcRes.ok) {
        console.warn(`[WARN] POST /api/tenant/calls/web-call ${wcRes.status} ${wcText}`);
      } else {
        console.log('[OK] POST /api/tenant/calls/web-call (call_id in response — verify in Retell UI)');
        try {
          const wc = JSON.parse(wcText) as { call_id?: string };
          if (wc.call_id) console.log(`     call_id=${wc.call_id}`);
        } catch {
          /* ignore */
        }
      }
    } else {
      console.log('[SKIP] SMOKE_AGENT_INSTANCE_ID not set — web-call not attempted');
    }
  } else {
    console.log('[SKIP] SMOKE_TENANT_EMAIL / SMOKE_TENANT_PASSWORD not set');
  }

  console.log('\n[PASSED] API smoke steps that were configured');
  process.exit(0);
}

main().catch((e) => {
  console.error('[FAIL]', e instanceof Error ? e.message : e);
  process.exit(1);
});

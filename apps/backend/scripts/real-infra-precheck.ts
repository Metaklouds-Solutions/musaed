/**
 * Agents 1–2: Pre-run infrastructure gate — env presence + GET /health.
 * Does not print secret values. Load `.env` from cwd (apps/backend).
 *
 * Usage (from apps/backend): `npm run validate:infra`
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function normalizeBase(raw: string): string {
  return raw.replace(/\/+$/, '');
}

const BASE = normalizeBase(
  process.env.SMOKE_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim() ||
    'http://localhost:3001',
);

interface HealthChecks {
  database?: { status?: string };
  redis?: { status?: string; error?: string };
  retell?: { status?: string };
}

interface HealthBody {
  status?: string;
  checks?: HealthChecks;
}

function mask(s: string | undefined): string {
  if (!s || s.length === 0) return '(empty)';
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}…${s.slice(-2)} (len=${s.length})`;
}

function requireEnv(name: string, minLen?: number): boolean {
  const v = process.env[name];
  if (!v || (minLen !== undefined && v.length < minLen)) {
    console.error(`[FAIL] ${name} missing or too short (required for production smoke)`);
    return false;
  }
  console.log(`[OK]   ${name} is set ${mask(v)}`);
  return true;
}

function optionalEnv(name: string): 'set' | 'empty' {
  const v = process.env[name];
  if (v && v.trim().length > 0) {
    console.log(`[OK]   ${name} is set ${mask(v)}`);
    return 'set';
  }
  console.warn(`[WARN] ${name} empty — signature verification or features may be skipped`);
  return 'empty';
}

async function main(): Promise<void> {
  console.log('=== Real infrastructure precheck (Agents 1–2) ===\n');
  console.log(`Health URL: ${BASE}/health\n`);

  let envOk = true;
  envOk = requireEnv('MONGODB_URI') && envOk;
  envOk = requireEnv('JWT_SECRET', 16) && envOk;
  optionalEnv('REDIS_URL');
  optionalEnv('RETELL_API_KEY');
  optionalEnv('RETELL_WEBHOOK_SECRET');
  optionalEnv('STRIPE_WEBHOOK_SECRET');
  optionalEnv('CALCOM_WEBHOOK_SECRET');

  if (!envOk) {
    console.error('\n[FAIL] Required env vars missing. Fix .env before smoke test.');
    process.exit(1);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE.replace(/\/$/, '')}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[FAIL] GET /health unreachable: ${msg}`);
    console.error('       Start the API (npm run start:dev) or set SMOKE_BASE_URL to your public API.');
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`[FAIL] GET /health HTTP ${res.status}`);
    process.exit(1);
  }

  const body = (await res.json()) as HealthBody;
  console.log('\n--- Health response ---');
  console.log(JSON.stringify(body, null, 2));

  const status = body.status;
  const db = body.checks?.database?.status;
  const redis = body.checks?.redis?.status;
  const retell = body.checks?.retell?.status;

  if (db !== 'up') {
    console.error('[FAIL] Database check is not up');
    process.exit(1);
  }

  if (redis !== 'up') {
    console.error('[FAIL] Redis check is not up (ECONNREFUSED or timeout). Fix REDIS_URL / Redis.');
    if (body.checks?.redis?.error) console.error(`       ${body.checks.redis.error}`);
    process.exit(1);
  }

  if (retell !== 'up' && retell !== 'skipped') {
    console.error('[FAIL] Retell check is not up or skipped');
    process.exit(1);
  }

  const allowDegraded = process.env.ALLOW_DEGRADED_HEALTH === 'true';
  if (status !== 'ok' && !allowDegraded) {
    console.error(`[FAIL] Overall health status is "${status}" (expected ok). Set ALLOW_DEGRADED_HEALTH=true to allow degraded.`);
    process.exit(1);
  }

  if (status === 'degraded' && allowDegraded) {
    console.warn('[WARN] Health is degraded but ALLOW_DEGRADED_HEALTH=true — continuing');
  }

  console.log('\n[PASSED] Precheck: env + GET /health');
  process.exit(0);
}

void main();

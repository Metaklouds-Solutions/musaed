/**
 * Smoke test for Retell-facing `POST /api/agents/tools/*` endpoints (x-api-key auth).
 * Run against a live local or staging API after `RETELL_TOOL_API_KEY` and an agent id are set.
 *
 * Env:
 *   AGENT_TOOLS_SMOKE_BASE_URL — API origin (default: http://localhost:3001)
 *   RETELL_TOOL_API_KEY — required; must match backend `RETELL_TOOL_API_KEY`
 *   AGENT_TOOLS_SMOKE_AGENT_ID — required; Mongo ObjectId string for a deployed agent instance
 *
 * Usage: npm run agent-tools:smoke
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE = (
  process.env.AGENT_TOOLS_SMOKE_BASE_URL?.trim() ||
  process.env.SMOKE_BASE_URL?.trim() ||
  'http://localhost:3001'
).replace(/\/$/, '');

const API_KEY = process.env.RETELL_TOOL_API_KEY?.trim();
const AGENT_ID = process.env.AGENT_TOOLS_SMOKE_AGENT_ID?.trim();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function postTool(
  pathSuffix: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `${BASE}/api/agents/${pathSuffix}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY ?? '',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function main(): Promise<number> {
  console.log('=== Agent tools HTTP smoke ===\n');

  if (!API_KEY) {
    console.error(
      '[FAIL] Set RETELL_TOOL_API_KEY in the environment or apps/backend/.env',
    );
    return 1;
  }
  if (!AGENT_ID) {
    console.error(
      '[FAIL] Set AGENT_TOOLS_SMOKE_AGENT_ID to a valid agent instance Mongo id',
    );
    return 1;
  }

  console.log(`Base URL: ${BASE}`);
  console.log(`Agent id: ${AGENT_ID}\n`);

  const listRes = await postTool('tools/list_providers', {
    agent_id: AGENT_ID,
  });
  if (!listRes.ok) {
    console.error(
      `[FAIL] list_providers HTTP ${listRes.status}: ${listRes.text}`,
    );
    return 1;
  }
  console.log(`[OK] POST .../tools/list_providers (${listRes.status})`);
  try {
    const parsed: unknown = JSON.parse(listRes.text);
    if (isRecord(parsed) && 'result' in parsed) {
      console.log('     response has `result` key');
    }
  } catch {
    console.warn('     (response was not JSON — check logs)');
  }

  const slotsRes = await postTool('tools/get_available_slots', {
    agent_id: AGENT_ID,
    preferred_date: '2099-01-15',
    preferred_time_window: 'morning',
    timezone: 'Asia/Riyadh',
  });
  if (!slotsRes.ok) {
    console.error(
      `[FAIL] get_available_slots HTTP ${slotsRes.status}: ${slotsRes.text}`,
    );
    return 1;
  }
  console.log(`[OK] POST .../tools/get_available_slots (${slotsRes.status})`);

  console.log(
    '\nManual verification: server logs should show lines containing `Tool request received:` for each tool.',
  );
  return 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[FAIL]', message);
    process.exit(1);
  });

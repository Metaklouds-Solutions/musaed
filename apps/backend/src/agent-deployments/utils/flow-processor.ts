import { BadRequestException } from '@nestjs/common';

import { validateConversationFlowNoSelfLoopEdges } from './conversation-flow-graph.validator';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

/**
 * Context values used to resolve dynamic placeholders in the flow template.
 */
export interface FlowProcessContext {
  tenantId: string;
  agentInstanceId: string;
  apiBaseUrl: string;
  retellToolApiKey?: string;
}

const RETELL_TOOL_API_KEY_PLACEHOLDER = '{{RETELL_TOOL_API_KEY}}';

/**
 * Validates a Retell flow template payload and throws if required fields are missing.
 */
export function validateFlowTemplate(flow: Record<string, unknown>): void {
  const conversationFlow = getRecord(flow.conversationFlow);
  const responseEngine = getRecord(flow.response_engine);
  const tools = conversationFlow?.tools;

  if (!responseEngine) {
    throw new BadRequestException(
      'Invalid flow template: response_engine is required',
    );
  }
  const responseEngineType =
    typeof responseEngine.type === 'string' ? responseEngine.type : null;
  if (responseEngineType === 'conversation-flow' || conversationFlow) {
    if (!conversationFlow) {
      throw new BadRequestException(
        'Invalid flow template: conversationFlow is required',
      );
    }
    if (!Array.isArray(conversationFlow.nodes)) {
      throw new BadRequestException(
        'Invalid flow template: conversationFlow.nodes must be an array',
      );
    }
    if (!Array.isArray(tools)) {
      throw new BadRequestException(
        'Invalid flow template: conversationFlow.tools must be an array',
      );
    }
    validateConversationFlowNoSelfLoopEdges(conversationFlow);
  } else if (!responseEngineType) {
    throw new BadRequestException(
      'Invalid flow template: response_engine.type is required',
    );
  }
}

/**
 * Builds a deploy-ready Retell flow by replacing placeholders and injecting dynamic variables.
 */
export function processFlowTemplate(
  flow: Record<string, unknown>,
  context: FlowProcessContext,
): Record<string, unknown> {
  validateFlowTemplate(flow);
  const apiBaseUrl = normalizeApiBaseUrl(context.apiBaseUrl);

  const replacements: Record<string, string> = {
    '{{tenantId}}': context.tenantId,
    '{{agentInstanceId}}': context.agentInstanceId,
    '{{API_BASE_URL}}': apiBaseUrl,
  };
  if (context.retellToolApiKey && context.retellToolApiKey.trim().length > 0) {
    replacements[RETELL_TOOL_API_KEY_PLACEHOLDER] =
      context.retellToolApiKey.trim();
  }

  const cloned = structuredClone(flow) as JsonValue;
  const replaced = replacePlaceholdersDeep(cloned, replacements);
  assertNoUnresolvedSecretPlaceholders(replaced);
  const result = ensureRecord(replaced);
  injectDefaultDynamicVariables(result, context);
  return result;
}

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname === '/api') {
      return `${parsed.origin}/api`;
    }
    if (!pathname || pathname === '/') {
      return `${parsed.origin}/api`;
    }
    return `${parsed.origin}${pathname}`;
  } catch {
    if (trimmed.endsWith('/api')) {
      return trimmed;
    }
    return `${trimmed}/api`;
  }
}

/**
 * Merges deploy-time defaults into `conversationFlow.default_dynamic_variables`.
 *
 * Retell also injects **system** dynamic variables at runtime (for example `{{call_id}}` on
 * phone calls per Retell docs). Those are not set here — only tenant and agent identifiers
 * from this deploy context.
 */
function injectDefaultDynamicVariables(
  flow: Record<string, unknown>,
  context: FlowProcessContext,
): void {
  const conversationFlow = getRecord(flow.conversationFlow);
  if (!conversationFlow) {
    return;
  }
  const existing = getRecord(conversationFlow.default_dynamic_variables) ?? {};
  conversationFlow.default_dynamic_variables = {
    ...existing,
    tenant_id: context.tenantId,
    agent_instance_id: context.agentInstanceId,
    agent_id: context.agentInstanceId,
  };
}

function replacePlaceholdersDeep(
  value: JsonValue,
  replacements: Record<string, string>,
): JsonValue {
  if (typeof value === 'string') {
    let output = value;
    for (const [placeholder, replacement] of Object.entries(replacements)) {
      output = output.split(placeholder).join(replacement);
    }
    return output;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholdersDeep(item, replacements));
  }

  if (value && typeof value === 'object') {
    const objectValue: JsonObject = value;
    const next: JsonObject = {};
    for (const [key, item] of Object.entries(objectValue)) {
      next[key] = replacePlaceholdersDeep(item, replacements);
    }
    return next;
  }

  return value;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function ensureRecord(value: JsonValue): Record<string, unknown> {
  const record = getRecord(value);
  if (!record) {
    throw new BadRequestException(
      'Invalid flow template: expected object payload',
    );
  }
  return record;
}

function assertNoUnresolvedSecretPlaceholders(value: JsonValue): void {
  if (containsPlaceholder(value, RETELL_TOOL_API_KEY_PLACEHOLDER)) {
    throw new BadRequestException(
      'Template requires RETELL_TOOL_API_KEY placeholder but RETELL_TOOL_API_KEY is not configured',
    );
  }
}

function containsPlaceholder(value: JsonValue, target: string): boolean {
  if (typeof value === 'string') {
    return value.includes(target);
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsPlaceholder(item, target));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) =>
      containsPlaceholder(item, target),
    );
  }
  return false;
}

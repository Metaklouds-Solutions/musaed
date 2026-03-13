const API_BASE_PLACEHOLDER = '{{API_BASE_URL}}';
const TOOL_API_KEY_PLACEHOLDER = '{{RETELL_TOOL_API_KEY}}';
const URL_PROTOCOL_PATTERN = /^[a-z]+:\/\//i;
const TEMPLATE_PLACEHOLDER_PATTERN = /^\{\{[A-Z0-9_]+\}\}$/;
const TOOL_API_KEY_HEADERS = new Set(['x-api-key', 'api-key', 'x_api_key']);

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Replaces absolute external URL origins in flow template tool definitions with {{API_BASE_URL}}.
 */
export function normalizeFlowTemplateUrls(
  flowTemplate: Record<string, unknown>,
): Record<string, unknown> {
  const cloned = structuredClone(flowTemplate) as JsonValue;
  const processed = replaceUrlsAndSecrets(cloned);
  if (!processed || typeof processed !== 'object' || Array.isArray(processed)) {
    return flowTemplate;
  }
  return processed as Record<string, unknown>;
}

function replaceUrlsAndSecrets(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => replaceUrlsAndSecrets(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const next: { [key: string]: JsonValue } = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      key === 'url' &&
      typeof item === 'string' &&
      URL_PROTOCOL_PATTERN.test(item)
    ) {
      next[key] = toPlaceholderUrl(item);
      continue;
    }
    if (key.toLowerCase() === 'headers') {
      next[key] = sanitizeToolHeaders(item);
      continue;
    }
    next[key] = replaceUrlsAndSecrets(item);
  }
  return next;
}

function sanitizeToolHeaders(value: JsonValue): JsonValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const headers = value as { [key: string]: JsonValue };
  const next: { [key: string]: JsonValue } = {};
  for (const [headerKey, headerValue] of Object.entries(headers)) {
    const normalizedKey = headerKey.toLowerCase();
    if (
      TOOL_API_KEY_HEADERS.has(normalizedKey) &&
      typeof headerValue === 'string' &&
      headerValue.trim().length > 0 &&
      !TEMPLATE_PLACEHOLDER_PATTERN.test(headerValue.trim())
    ) {
      next[headerKey] = TOOL_API_KEY_PLACEHOLDER;
      continue;
    }
    next[headerKey] = headerValue;
  }
  return next;
}

function toPlaceholderUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${API_BASE_PLACEHOLDER}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

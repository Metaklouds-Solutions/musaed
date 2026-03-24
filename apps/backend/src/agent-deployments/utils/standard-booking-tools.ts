/**
 * Standard booking tools auto-injected into every template at deployment time.
 *
 * Uses `{{API_BASE_URL}}`, `{{RETELL_TOOL_API_KEY}}`, and `{{agent_id}}`
 * placeholders that `processFlowTemplate` resolves before sending to Retell.
 * The tool URLs are resolved against the runtime API base before deployment
 * so they work whether `API_BASE_URL` already includes `/api` or not.
 *
 * Templates that already define a tool with the same `name` keep their version
 * (template-defined tools take precedence over standard ones).
 */

interface StandardCustomTool {
  tool_id: string;
  name: string;
  type: 'custom';
  description: string;
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
  speak_during_execution: boolean;
  speak_after_execution: boolean;
  execution_message_description: string;
  timeout_ms: number;
}

function normalizeToolApiBaseUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.trim().replace(/\/+$/, '');

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname || pathname === '/') {
      return `${parsed.origin}/api`;
    }
    if (pathname.endsWith('/api')) {
      return `${parsed.origin}${pathname}`;
    }
    return `${parsed.origin}${pathname}/api`;
  } catch {
    if (trimmed.endsWith('/api')) {
      return trimmed;
    }
    return `${trimmed}/api`;
  }
}

function resolveToolUrl(urlTemplate: string, apiBaseUrl: string): string {
  return urlTemplate.replace(
    '{{API_BASE_URL}}',
    normalizeToolApiBaseUrl(apiBaseUrl),
  );
}

export const STANDARD_BOOKING_TOOLS: readonly StandardCustomTool[] = [
  {
    tool_id: 'get_available_slots',
    name: 'get_available_slots',
    type: 'custom',
    description:
      'Check available appointment slots at the clinic for a specific date and time preference. Use this tool when the patient wants to book a new appointment or reschedule, and you need to find real-time available time slots.',
    url: '{{API_BASE_URL}}/agents/tools/get_available_slots',
    method: 'POST',
    headers: { 'x-api-key': '{{RETELL_TOOL_API_KEY}}' },
    parameters: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', const: '{{agent_id}}' },
        preferred_date: {
          type: 'string',
          description:
            'The preferred date in YYYY-MM-DD format, e.g. 2025-06-15',
        },
        preferred_time_window: {
          type: 'string',
          description:
            "Preferred time window such as 'morning', 'afternoon', 'evening', or a specific range like '09:00-12:00'",
        },
        timezone: { type: 'string', const: 'Asia/Riyadh' },
      },
      required: [
        'agent_id',
        'preferred_date',
        'preferred_time_window',
        'timezone',
      ],
    },
    speak_during_execution: true,
    speak_after_execution: true,
    execution_message_description:
      'Tell the patient you are checking available appointment slots in a natural, conversational way.',
    timeout_ms: 10_000,
  },
  {
    tool_id: 'book_meeting',
    name: 'book_meeting',
    type: 'custom',
    description:
      'Book a confirmed appointment for the patient after they agreed on a specific time slot and all their personal information has been collected and confirmed. Only call this after the patient explicitly confirms the appointment details.',
    url: '{{API_BASE_URL}}/agents/tools/book_meeting',
    method: 'POST',
    headers: { 'x-api-key': '{{RETELL_TOOL_API_KEY}}' },
    parameters: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', const: '{{agent_id}}' },
        email: { type: 'string', description: "Patient's email address" },
        confirmed_slot: {
          type: 'string',
          description:
            "The confirmed appointment date and time in ISO 8601 format, e.g. '2025-06-15T09:00:00'",
        },
        timezone: { type: 'string', const: 'Asia/Riyadh' },
        firstName: {
          type: 'string',
          description: "Patient's first name",
        },
        lastName: {
          type: 'string',
          description: "Patient's last name or family name",
        },
      },
      required: ['agent_id', 'email', 'confirmed_slot', 'timezone'],
    },
    speak_during_execution: true,
    speak_after_execution: true,
    execution_message_description:
      'Tell the patient you are confirming and registering their appointment in a natural, conversational way.',
    timeout_ms: 15_000,
  },
  {
    tool_id: 'cancel_booking',
    name: 'cancel_booking',
    type: 'custom',
    description:
      "Cancel an existing appointment for a patient. Use this when the patient calls to cancel their upcoming appointment. Requires the patient's email address to find the booking.",
    url: '{{API_BASE_URL}}/agents/tools/cancel_booking',
    method: 'POST',
    headers: { 'x-api-key': '{{RETELL_TOOL_API_KEY}}' },
    parameters: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', const: '{{agent_id}}' },
        email: {
          type: 'string',
          description:
            "Patient's email address to find their existing booking",
        },
        reason: {
          type: 'string',
          description:
            'Reason for cancellation if the patient provides one',
        },
      },
      required: ['agent_id', 'email'],
    },
    speak_during_execution: true,
    speak_after_execution: true,
    execution_message_description:
      'Tell the patient you are processing their cancellation in a natural, conversational way.',
    timeout_ms: 10_000,
  },
  {
    tool_id: 'reschedule_booking',
    name: 'reschedule_booking',
    type: 'custom',
    description:
      "Reschedule an existing appointment to a new time slot. Use this when the patient wants to change their appointment to a different date or time. Requires the patient's email and the new desired time slot.",
    url: '{{API_BASE_URL}}/agents/tools/reschedule_booking',
    method: 'POST',
    headers: { 'x-api-key': '{{RETELL_TOOL_API_KEY}}' },
    parameters: {
      type: 'object',
      properties: {
        agent_id: { type: 'string', const: '{{agent_id}}' },
        email: {
          type: 'string',
          description:
            "Patient's email address to find their existing booking",
        },
        new_slot: {
          type: 'string',
          description:
            "The new appointment date and time in ISO 8601 format, e.g. '2025-06-15T14:00:00'",
        },
        timezone: { type: 'string', const: 'Asia/Riyadh' },
      },
      required: ['agent_id', 'email', 'new_slot', 'timezone'],
    },
    speak_during_execution: true,
    speak_after_execution: true,
    execution_message_description:
      'Tell the patient you are rescheduling their appointment in a natural, conversational way.',
    timeout_ms: 15_000,
  },
] as const;

/**
 * Merges standard booking tools into a flow template before deployment.
 *
 * - For **conversation-flow** templates: injects into `conversationFlow.tools[]`
 * - Skips any tool whose `name` already exists in the template (no duplicates)
 * - Returns a cloned flow; the original is never mutated
 *
 * @param flow - Raw flow template from the database
 * @returns A new flow object with standard tools merged in
 */
export function injectStandardTools(
  flow: Record<string, unknown>,
  apiBaseUrl: string,
): Record<string, unknown> {
  const cloned = structuredClone(flow);

  const conversationFlow = cloned.conversationFlow;
  if (
    conversationFlow &&
    typeof conversationFlow === 'object' &&
    !Array.isArray(conversationFlow)
  ) {
    const cf = conversationFlow as Record<string, unknown>;
    const existingTools: unknown[] = Array.isArray(cf.tools) ? cf.tools : [];

    const existingNames = new Set(
      existingTools
        .filter(
          (t): t is Record<string, unknown> =>
            t !== null && typeof t === 'object' && !Array.isArray(t),
        )
        .map((t) => t.name)
        .filter((n): n is string => typeof n === 'string'),
    );

    const toolsToAdd = STANDARD_BOOKING_TOOLS.map((tool) => ({
      ...tool,
      url: resolveToolUrl(tool.url, apiBaseUrl),
    })).filter((t) => !existingNames.has(t.name));

    if (toolsToAdd.length > 0) {
      cf.tools = [...existingTools, ...toolsToAdd];
    }
  }

  return cloned;
}

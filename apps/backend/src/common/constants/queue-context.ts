/**
 * Queue job context keys for Phase 2 queue infrastructure.
 * When adding jobs to BullMQ, include these fields so workers can propagate
 * requestId for observability and log correlation.
 */
export const QUEUE_CONTEXT_KEYS = {
  /** Correlation/request ID from the originating HTTP request. */
  REQUEST_ID: 'requestId',
  /** Tenant ID when the job is tenant-scoped. */
  TENANT_ID: 'tenantId',
  /** User ID when the job was triggered by a user action. */
  USER_ID: 'userId',
} as const;

export type QueueJobContext = {
  [QUEUE_CONTEXT_KEYS.REQUEST_ID]?: string;
  [QUEUE_CONTEXT_KEYS.TENANT_ID]?: string;
  [QUEUE_CONTEXT_KEYS.USER_ID]?: string;
};

/**
 * Extracts context from an authenticated request for queue job payloads.
 * Merge the result into the job data so workers can propagate requestId in logs.
 *
 * @example
 * // In Phase 2 webhook controller:
 * await webhookQueue.add('process', { ...payload, ...extractQueueContext(req) }, { jobId: eventId });
 */
export function extractQueueContext(req: {
  headers?: Record<string, string | string[] | undefined>;
  tenantId?: string | null;
  user?: { _id?: string };
}): Partial<QueueJobContext> {
  const requestId =
    (typeof req.headers?.['x-request-id'] === 'string'
      ? req.headers['x-request-id']
      : null) ??
    (typeof req.headers?.['x-correlation-id'] === 'string'
      ? req.headers['x-correlation-id']
      : null);
  const ctx: Partial<QueueJobContext> = {};
  if (requestId) ctx[QUEUE_CONTEXT_KEYS.REQUEST_ID] = requestId;
  if (req.tenantId) ctx[QUEUE_CONTEXT_KEYS.TENANT_ID] = req.tenantId;
  if (req.user?._id) ctx[QUEUE_CONTEXT_KEYS.USER_ID] = req.user._id;
  return ctx;
}

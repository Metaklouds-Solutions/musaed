/** Queue names for BullMQ. */
export const QUEUE_NAMES = {
  WEBHOOKS: 'webhooks',
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
} as const;

/** Default job options. */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

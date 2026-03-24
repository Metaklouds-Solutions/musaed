import * as Joi from 'joi';

/** Accepts decimal env value (e.g. 0.3) as string or number. */
const decimalString = () =>
  Joi.alternatives().try(
    Joi.number().min(0).max(1),
    Joi.string().pattern(/^\d*(\.\d+)?$/),
  );

/** Boolean-like env: code compares with === 'true', so keep as string. */
const booleanString = (defaultValue: 'true' | 'false') =>
  Joi.string()
    .valid('true', 'false', '1', '0', 'yes', 'no')
    .allow('')
    .optional()
    .default(defaultValue);

const isStrictTrue = (value: unknown) =>
  typeof value === 'string' && value.trim().toLowerCase() === 'true';

/**
 * Joi validation schema for environment variables.
 * Enforces that required secrets are present at startup so the app
 * fails fast with a clear error instead of crashing later.
 * All process.env values are strings; schema accepts string form for numbers/booleans.
 */
export const envValidationSchema = Joi.object({
  // ── MongoDB ───────────────────────────────────────────────────────────
  MONGODB_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'MONGODB_URI must be a valid MongoDB connection string (mongodb:// or mongodb+srv://)',
    }),
  MONGODB_MAX_POOL_SIZE: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/))
    .optional()
    .allow(''),
  MONGODB_MIN_POOL_SIZE: Joi.alternatives()
    .try(Joi.number().integer().min(0), Joi.string().pattern(/^\d+$/))
    .optional()
    .allow(''),

  // ── Server ────────────────────────────────────────────────────────────
  PORT: Joi.alternatives()
    .try(Joi.number().integer().min(1), Joi.string().pattern(/^\d+$/))
    .default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // ── CORS ──────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: Joi.string().optional().allow(''),
  CORS_ORIGIN: Joi.string().optional().default('http://localhost:5173'),

  // ── JWT ───────────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string().min(16).required().messages({
    'string.min':
      'JWT_SECRET must be at least 16 characters (use e.g. openssl rand -base64 32)',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Redis ─────────────────────────────────────────────────────────────
  REDIS_URL: Joi.string().optional().allow(''),
  AGENT_DEPLOYMENT_QUEUE_ENABLED: booleanString('false'),
  QUEUE_WEBHOOKS_ENABLED: booleanString('false'),
  QUEUE_EMAIL_ENABLED: booleanString('false'),
  QUEUE_NOTIFICATIONS_ENABLED: booleanString('false'),
  QUEUE_DEPTH_LOGGING_ENABLED: booleanString('false'),

  // ── Stripe ────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET_LEGACY: Joi.string().optional().allow(''),

  // ── Email (SMTP) ─────────────────────────────────────────────────────
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().default('noreply@musaed.app'),
  SMTP_PRIMARY_USER: Joi.string().optional().allow(''),
  SMTP_PRIMARY_PASS: Joi.string().optional().allow(''),
  SMTP_FALLBACK_USER: Joi.string().optional().allow(''),
  SMTP_FALLBACK_PASS: Joi.string().optional().allow(''),
  EMAIL_RATE_LIMIT_PER_RECIPIENT: Joi.alternatives()
    .try(Joi.number().integer().min(0), Joi.string().pattern(/^\d+$/))
    .optional()
    .default(10),

  /** When true, allows POST /api/test-email (admin JWT + SMTP test). Default false. */
  ENABLE_TEST_EMAIL: booleanString('false'),
  /** Optional default recipient for test-email when body omits `to`. */
  TEST_EMAIL_RECIPIENT: Joi.string().optional().allow(''),

  // ── Frontend URL ─────────────────────────────────────────────────────
  FRONTEND_URL: Joi.string().optional().default('http://localhost:5173'),

  // ── Retell ────────────────────────────────────────────────────────────
  RETELL_API_KEY: Joi.string().optional().allow(''),
  RETELL_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  RETELL_WEBHOOK_SECRET_LEGACY: Joi.string().optional().allow(''),
  WEBHOOK_TIMESTAMP_MAX_AGE_SEC: Joi.alternatives()
    .try(Joi.number().integer().min(0), Joi.string().pattern(/^\d+$/))
    .optional()
    .default(0),
  API_BASE_URL: Joi.string().optional().default('http://localhost:3001'),
  RETELL_TOOL_API_KEY: Joi.string().optional().allow(''),
  AGENT_DEPLOYMENT_V2_ENABLED: booleanString('true'),
  AGENT_AUTO_DEPLOY_ON_CREATE: booleanString('true'),
  AGENT_DEPLOYMENT_FAILURE_ALERT_THRESHOLD: decimalString()
    .optional()
    .default(0.3),
  CALL_SESSION_INGEST_ENABLED: booleanString('true'),

  // ── Seed ──────────────────────────────────────────────────────────────
  ADMIN_SEED_PASSWORD: Joi.string().optional().allow(''),
  OWNER_SEED_PASSWORD: Joi.string().optional().allow(''),

  // ── Reports ───────────────────────────────────────────────────────────
  REPORT_AGGREGATION_ENABLED: booleanString('false'),

  // ── Observability ─────────────────────────────────────────────────────
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional().default('development'),
  SENTRY_RELEASE: Joi.string().optional().allow(''),

  // ── Metrics ───────────────────────────────────────────────────────────
  METRICS_API_KEY: Joi.string().optional().allow(''),
  // ── Cal.com ───────────────────────────────────────────────────────────
  CALCOM_WEBHOOK_SECRET: Joi.string().optional().allow(''),
})
  .custom((env, helpers) => {
    const nodeEnv =
      typeof env.NODE_ENV === 'string'
        ? env.NODE_ENV.trim().toLowerCase()
        : 'development';
    if (nodeEnv !== 'production') {
      return env;
    }

    if (
      typeof env.RETELL_WEBHOOK_SECRET !== 'string' ||
      env.RETELL_WEBHOOK_SECRET.trim().length === 0
    ) {
      return helpers.error('any.custom', {
        message: 'RETELL_WEBHOOK_SECRET is required in production',
      });
    }

    if (
      typeof env.CALCOM_WEBHOOK_SECRET !== 'string' ||
      env.CALCOM_WEBHOOK_SECRET.trim().length === 0
    ) {
      return helpers.error('any.custom', {
        message: 'CALCOM_WEBHOOK_SECRET is required in production',
      });
    }

    const queueFlags = [
      env.AGENT_DEPLOYMENT_QUEUE_ENABLED,
      env.QUEUE_WEBHOOKS_ENABLED,
      env.QUEUE_EMAIL_ENABLED,
      env.QUEUE_NOTIFICATIONS_ENABLED,
    ];
    const queueEnabled = queueFlags.some(isStrictTrue);
    if (
      queueEnabled &&
      (typeof env.REDIS_URL !== 'string' || env.REDIS_URL.trim().length === 0)
    ) {
      return helpers.error('any.custom', {
        message:
          'REDIS_URL is required in production when queue features are enabled',
      });
    }

    return env;
  })
  .messages({
    'any.custom': '{{#message}}',
  })
  .options({ allowUnknown: true, stripUnknown: false });

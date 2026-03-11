import * as Joi from 'joi';

/**
 * Joi validation schema for environment variables.
 * Enforces that all required secrets are present at startup so the app
 * fails fast instead of crashing at runtime on a missing key.
 */
export const envValidationSchema = Joi.object({
  // ── MongoDB ───────────────────────────────────────────────────────────
  MONGODB_URI: Joi.string().pattern(/^mongodb(\+srv)?:\/\//).required(),
  MONGODB_MAX_POOL_SIZE: Joi.number().integer().min(1).optional(),
  MONGODB_MIN_POOL_SIZE: Joi.number().integer().min(0).optional(),

  // ── Server ────────────────────────────────────────────────────────────
  PORT: Joi.number().integer().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // ── CORS ──────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: Joi.string().optional().allow(''),
  CORS_ORIGIN: Joi.string().optional().default('http://localhost:5173'),

  // ── JWT ───────────────────────────────────────────────────────────────
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Redis ─────────────────────────────────────────────────────────────
  REDIS_URL: Joi.string().optional().allow(''),
  AGENT_DEPLOYMENT_QUEUE_ENABLED: Joi.boolean().default(false),
  QUEUE_WEBHOOKS_ENABLED: Joi.boolean().default(false),
  QUEUE_EMAIL_ENABLED: Joi.boolean().default(false),
  QUEUE_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
  QUEUE_DEPTH_LOGGING_ENABLED: Joi.boolean().default(false),

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
  EMAIL_RATE_LIMIT_PER_RECIPIENT: Joi.number().integer().min(0).default(10),

  // ── Frontend URL ─────────────────────────────────────────────────────
  FRONTEND_URL: Joi.string().optional().default('http://localhost:5173'),

  // ── Retell ────────────────────────────────────────────────────────────
  RETELL_API_KEY: Joi.string().optional().allow(''),
  RETELL_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  RETELL_WEBHOOK_SECRET_LEGACY: Joi.string().optional().allow(''),
  WEBHOOK_TIMESTAMP_MAX_AGE_SEC: Joi.number().integer().min(0).default(0),
  API_BASE_URL: Joi.string().optional().default('http://localhost:3001'),
  RETELL_TOOL_API_KEY: Joi.string().optional().allow(''),
  AGENT_DEPLOYMENT_V2_ENABLED: Joi.boolean().default(true),
  AGENT_AUTO_DEPLOY_ON_CREATE: Joi.boolean().default(true),
  AGENT_DEPLOYMENT_FAILURE_ALERT_THRESHOLD: Joi.number()
    .min(0)
    .max(1)
    .default(0.3),
  CALL_SESSION_INGEST_ENABLED: Joi.boolean().default(true),

  // ── Seed ──────────────────────────────────────────────────────────────
  ADMIN_SEED_PASSWORD: Joi.string().optional().allow(''),
  OWNER_SEED_PASSWORD: Joi.string().optional().allow(''),

  // ── Reports ───────────────────────────────────────────────────────────
  REPORT_AGGREGATION_ENABLED: Joi.boolean().default(false),

  // ── Observability ─────────────────────────────────────────────────────
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional().default('development'),
  SENTRY_RELEASE: Joi.string().optional().allow(''),

  // ── Metrics ───────────────────────────────────────────────────────────
  METRICS_API_KEY: Joi.string().optional().allow(''),
}).options({ allowUnknown: true, stripUnknown: false });

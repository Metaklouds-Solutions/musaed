import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  it('accepts minimal valid env', () => {
    const { error } = envValidationSchema.validate(
      {
        MONGODB_URI: 'mongodb://localhost:27017/musaed',
        JWT_SECRET: '01234567890123456789012345678901',
      },
      { allowUnknown: true },
    );
    expect(error).toBeUndefined();
  });

  it('requires webhook secrets in production', () => {
    const { error } = envValidationSchema.validate(
      {
        MONGODB_URI: 'mongodb://localhost:27017/musaed',
        JWT_SECRET: '01234567890123456789012345678901',
        NODE_ENV: 'production',
      },
      { allowUnknown: true },
    );

    expect(error?.message).toContain(
      'RETELL_WEBHOOK_SECRET is required in production',
    );
  });

  it('requires REDIS_URL in production when queue features are enabled', () => {
    const { error } = envValidationSchema.validate(
      {
        MONGODB_URI: 'mongodb://localhost:27017/musaed',
        JWT_SECRET: '01234567890123456789012345678901',
        NODE_ENV: 'production',
        RETELL_WEBHOOK_SECRET: 'retell_whsec_xxx',
        CALCOM_WEBHOOK_SECRET: 'calcom_whsec_xxx',
        QUEUE_WEBHOOKS_ENABLED: 'true',
      },
      { allowUnknown: true },
    );

    expect(error?.message).toContain(
      'REDIS_URL is required in production when queue features are enabled',
    );
  });

  it('accepts production env without REDIS_URL when queue features are disabled', () => {
    const { error } = envValidationSchema.validate(
      {
        MONGODB_URI: 'mongodb://localhost:27017/musaed',
        JWT_SECRET: '01234567890123456789012345678901',
        NODE_ENV: 'production',
        RETELL_WEBHOOK_SECRET: 'retell_whsec_xxx',
        CALCOM_WEBHOOK_SECRET: 'calcom_whsec_xxx',
      },
      { allowUnknown: true },
    );

    expect(error).toBeUndefined();
  });
});

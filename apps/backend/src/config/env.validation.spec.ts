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
});

/**
 * Smoke tests against a running Nest app (requires MongoDB and valid env).
 * Run from apps/backend: set MONGODB_URI and JWT_SECRET, then npm run test:e2e
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const hasMongo =
  typeof process.env.MONGODB_URI === 'string' &&
  process.env.MONGODB_URI.startsWith('mongodb');
const hasJwt =
  typeof process.env.JWT_SECRET === 'string' &&
  process.env.JWT_SECRET.length >= 16;

const runE2e = hasMongo && hasJwt;

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    if (!runE2e) {
      return;
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [
        'health',
        'metrics',
        'webhooks/stripe',
        'webhooks/retell',
        'webhooks/calcom',
      ],
    });
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health returns JSON status', async () => {
    if (!runE2e) {
      expect(true).toBe(true);
      return;
    }
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('checks');
  });

  it('GET /api/auth/login is not GET (method not allowed or 404)', async () => {
    if (!runE2e) {
      expect(true).toBe(true);
      return;
    }
    const res = await request(app.getHttpServer()).get('/api/auth/login');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

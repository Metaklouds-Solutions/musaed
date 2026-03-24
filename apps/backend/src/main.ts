import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as express from 'express';

const sentryDsn = process.env.SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    enableTracing: true,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use('/webhooks/retell', express.raw({ type: 'application/json' }));
  app.use('/webhooks/calcom', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const corsOrigins = (
    process.env.ALLOWED_ORIGINS ??
    process.env.CORS_ORIGIN ??
    'http://localhost:5173'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [
      'health',
      'metrics',
      'webhooks/stripe',
      'webhooks/retell',
      'webhooks/calcom',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  new Logger('Bootstrap').log(`MUSAED API running at http://localhost:${port}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as express from 'express';

async function bootstrap() {
  // #region agent log
  fetch('http://127.0.0.1:7773/ingest/7bea03d1-de1e-4b1a-8b63-40189ee31214',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bd9a7b'},body:JSON.stringify({sessionId:'bd9a7b',runId:'pre-fix',hypothesisId:'H1',location:'main.ts:bootstrap:start',message:'Bootstrap start',data:{pid:process.pid,nodeEnv:process.env.NODE_ENV ?? null,portEnv:process.env.PORT ?? null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  app.use(helmet());

  app.setGlobalPrefix('api', { exclude: ['health', 'webhooks/stripe', 'webhooks/retell'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

  const port = process.env.PORT ?? 3001;
  // #region agent log
  fetch('http://127.0.0.1:7773/ingest/7bea03d1-de1e-4b1a-8b63-40189ee31214',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bd9a7b'},body:JSON.stringify({sessionId:'bd9a7b',runId:'pre-fix',hypothesisId:'H2',location:'main.ts:bootstrap:before_listen',message:'About to listen',data:{port},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    await app.listen(port);
    new Logger('Bootstrap').log(`MUSAED API running at http://localhost:${port}`);
    // #region agent log
    fetch('http://127.0.0.1:7773/ingest/7bea03d1-de1e-4b1a-8b63-40189ee31214',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bd9a7b'},body:JSON.stringify({sessionId:'bd9a7b',runId:'pre-fix',hypothesisId:'H3',location:'main.ts:bootstrap:listen_success',message:'Listen succeeded',data:{port},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    // #region agent log
    fetch('http://127.0.0.1:7773/ingest/7bea03d1-de1e-4b1a-8b63-40189ee31214',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bd9a7b'},body:JSON.stringify({sessionId:'bd9a7b',runId:'pre-fix',hypothesisId:'H4',location:'main.ts:bootstrap:listen_error',message:'Listen failed',data:{code:err?.code ?? null,errno:err?.errno ?? null,syscall:err?.syscall ?? null,address:(err as NodeJS.ErrnoException & { address?: string })?.address ?? null,port:(err as NodeJS.ErrnoException & { port?: number })?.port ?? null,message:err?.message ?? 'unknown'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
bootstrap();

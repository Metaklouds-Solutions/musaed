import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const CORRELATION_HEADER = 'x-correlation-id';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  /**
   * Logs request/response details with a correlation id for traceability.
   */
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const existingCorrelationId = req.header(CORRELATION_HEADER);
    const correlationId =
      typeof existingCorrelationId === 'string' && existingCorrelationId.trim().length > 0
        ? existingCorrelationId
        : randomUUID();
    req.headers[CORRELATION_HEADER] = correlationId;
    res.setHeader(CORRELATION_HEADER, correlationId);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[level](
        JSON.stringify({
          event: 'http.request',
          correlationId,
          method,
          path: originalUrl,
          statusCode,
          durationMs: duration,
        }),
      );
    });

    next();
  }
}

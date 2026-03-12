import { Injectable, NestMiddleware, Logger, Optional, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { MetricsService } from '../../metrics/metrics.service';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { ErrorRateMonitorService } from '../../notifications/error-rate-monitor.service';

const CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(
    @Optional()
    @Inject(MetricsService)
    private readonly metricsService?: MetricsService,
    @Optional()
    @Inject(ErrorRateMonitorService)
    private readonly errorRateMonitor?: ErrorRateMonitorService,
  ) {}

  /**
   * Logs request/response details with requestId, tenantId, userId for traceability.
   * Records HTTP metrics for Prometheus (excludes /metrics path).
   */
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const existingId =
      req.header(CORRELATION_HEADER) ?? req.header(REQUEST_ID_HEADER);
    const requestId =
      typeof existingId === 'string' && existingId.trim().length > 0
        ? existingId.trim()
        : randomUUID();
    req.headers[CORRELATION_HEADER] = requestId;
    req.headers[REQUEST_ID_HEADER] = requestId;
    (req as Request & { id?: string }).id = requestId;
    res.setHeader(CORRELATION_HEADER, requestId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';
      if (statusCode >= 500) {
        this.errorRateMonitor?.recordServerError();
      }

      const authReq = req as AuthenticatedRequest;
      const tenantId = authReq.tenantId ?? undefined;
      const userId = authReq.user?._id ?? undefined;

      const logPayload: Record<string, unknown> = {
        event: 'http.request',
        requestId,
        method,
        path: originalUrl,
        statusCode,
        durationMs: duration,
      };
      if (tenantId != null) logPayload.tenantId = tenantId;
      if (userId != null) logPayload.userId = userId;

      this.logger[level](JSON.stringify(logPayload));

      if (this.metricsService && !originalUrl.startsWith('/metrics')) {
        try {
          this.metricsService.recordHttpRequest(method, originalUrl, statusCode, duration);
        } catch {
          // Avoid metrics recording failure from affecting request handling
        }
      }
    });

    next();
  }
}

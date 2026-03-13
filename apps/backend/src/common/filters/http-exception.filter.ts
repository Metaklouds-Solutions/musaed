import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/node';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      const errMessage =
        exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.error(
        `${request.method} ${request.url} — ${status} — ${errMessage}`,
        exception instanceof Error ? exception.stack : undefined,
      );

      if (process.env.SENTRY_DSN) {
        const authReq = request as AuthenticatedRequest;
        Sentry.withScope((scope) => {
          scope.setTag('path', request.url);
          scope.setTag('method', request.method);
          scope.setTag('status', String(status));
          const requestId =
            request.header('x-request-id') ??
            request.header('x-correlation-id');
          if (requestId) scope.setTag('requestId', requestId);
          if (authReq.tenantId) scope.setTag('tenantId', authReq.tenantId);
          if (authReq.user?._id) scope.setUser({ id: authReq.user._id });
          Sentry.captureException(exception);
        });
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}

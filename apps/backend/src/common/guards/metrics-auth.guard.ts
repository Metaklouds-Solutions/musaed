import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { safeEqual } from '../helpers/timing-safe-equal';

/**
 * Guard for the /metrics endpoint.
 * Allows access when:
 * - METRICS_API_KEY is not set (open access — development default)
 * - Request provides a matching API key via Authorization header or query param
 */
@Injectable()
export class MetricsAuthGuard implements CanActivate {
  private readonly apiKey: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('METRICS_API_KEY', '').trim();
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.apiKey.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.header('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (safeEqual(bearerToken, this.apiKey)) return true;

    const queryKey = request.query['key'];
    if (typeof queryKey === 'string' && safeEqual(queryKey, this.apiKey)) return true;

    throw new ForbiddenException('Invalid or missing metrics API key');
  }
}

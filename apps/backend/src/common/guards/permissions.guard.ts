import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { Permission } from '../constants/permissions';

/**
 * Guard that checks if the user has the required permissions.
 * Must be applied AFTER JwtAuthGuard — depends on request.user being populated.
 * If no permissions are required (decorator not used), allows access.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndMerge<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || !Array.isArray(required) || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const permissions = (user as { permissions?: string[] }).permissions ?? [];

    if (user.role === 'ADMIN') {
      return true;
    }

    const requiredList = Array.isArray(required) ? required : [];
    const hasAll = requiredList.every((p) => permissions.includes(p));
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${requiredList.join(', ')}`,
      );
    }

    return true;
  }
}

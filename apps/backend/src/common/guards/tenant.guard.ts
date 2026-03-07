import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === 'ADMIN') {
      // Admins can optionally scope to a tenant via query param
      request.tenantId = request.query?.tenantId ?? null;
      return true;
    }

    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant access required');
    }

    request.tenantId = tenantId;
    return true;
  }
}

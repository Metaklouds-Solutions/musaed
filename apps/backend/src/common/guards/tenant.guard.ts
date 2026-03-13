import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (user?.role === 'ADMIN') {
      const queryTenantId = request.query?.tenantId;
      request.tenantId =
        typeof queryTenantId === 'string' ? queryTenantId : null;
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

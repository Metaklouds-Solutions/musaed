import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../constants/permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declares which permissions are required to access the route.
 * Use with PermissionsGuard (must be applied after JwtAuthGuard).
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

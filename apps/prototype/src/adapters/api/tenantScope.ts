import { getSavedUser } from '../../lib/apiClient';

function readRole(value: unknown): string {
  return typeof value === 'string' ? value.toUpperCase() : '';
}

export function isAdminUser(): boolean {
  const user = getSavedUser();
  return readRole(user?.role) === 'ADMIN';
}

export function withTenantScope(path: string, tenantId?: string): string {
  if (!tenantId || !isAdminUser()) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenantId=${encodeURIComponent(tenantId)}`;
}


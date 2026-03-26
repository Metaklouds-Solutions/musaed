import type { User } from '../shared/types';
import { normalizeEntityId } from './entityId';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeRole(value: unknown): User['role'] | undefined {
  const role = readString(value)?.toUpperCase();
  if (role === 'ADMIN' || role === 'TENANT_OWNER' || role === 'STAFF') {
    return role;
  }
  return undefined;
}

function normalizeTenantRole(value: unknown): User['tenantRole'] | undefined {
  const role = readString(value);
  if (
    role === 'tenant_owner' ||
    role === 'clinic_admin' ||
    role === 'receptionist' ||
    role === 'doctor' ||
    role === 'auditor' ||
    role === 'tenant_staff'
  ) {
    return role;
  }
  return undefined;
}

export function normalizeAuthUser(value: unknown): User | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeEntityId(value.id ?? value._id ?? value.sub);
  const email = readString(value.email);
  const name = readString(value.name);
  const role = normalizeRole(value.role);

  if (!id || !email || !name || !role) {
    return null;
  }

  return {
    id,
    email,
    name,
    role,
    avatarUrl: readString(value.avatarUrl),
    tenantId: normalizeEntityId(value.tenantId) ?? undefined,
    tenantRole: normalizeTenantRole(value.tenantRole),
  };
}

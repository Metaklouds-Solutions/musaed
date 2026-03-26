export const BCRYPT_SALT_ROUNDS = 10;

export const INVITE_TOKEN_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const REFRESH_TOKEN_EXPIRY = '7d';

export const DEFAULT_PAGE = 1;

export const DEFAULT_LIMIT = 20;

export const VALID_STAFF_ROLES = [
  'tenant_owner',
  'clinic_admin',
  'doctor',
  'receptionist',
  'auditor',
  'tenant_staff',
] as const;

export const VALID_STAFF_STATUSES = ['active', 'invited', 'disabled'] as const;

export const VALID_BOOKING_STATUSES = [
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
] as const;

export const VALID_TENANT_STATUSES = [
  'ONBOARDING',
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'CHURNED',
] as const;

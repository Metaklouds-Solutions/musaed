/**
 * Fine-grained permissions for RBAC.
 * Format: resource:action (e.g. calls:read, bookings:write)
 */
export const PERMISSIONS = {
  // Calls
  CALLS_READ: 'calls:read',
  CALLS_WRITE: 'calls:write',

  // Bookings
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_WRITE: 'bookings:write',

  // Customers
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',

  // Staff
  STAFF_READ: 'staff:read',
  STAFF_WRITE: 'staff:write',

  // Reports
  REPORTS_READ: 'reports:read',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // Support
  SUPPORT_READ: 'support:read',
  SUPPORT_WRITE: 'support:write',

  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Export
  EXPORT_READ: 'export:read',

  // Alerts
  ALERTS_READ: 'alerts:read',
  ALERTS_WRITE: 'alerts:write',

  // Maintenance
  MAINTENANCE_READ: 'maintenance:read',

  // Availability
  AVAILABILITY_READ: 'availability:read',
  AVAILABILITY_WRITE: 'availability:write',

  // Agent instances
  AGENTS_READ: 'agents:read',
  AGENTS_WRITE: 'agents:write',

  // Audit
  AUDIT_READ: 'audit:read',

  // Admin (platform-wide)
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** All permissions for admin users. */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/** Role slug to permissions mapping. Tenant staff get these permissions. */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  tenant_owner: ALL_PERMISSIONS.filter((p) => !p.startsWith('admin:')),
  clinic_admin: ALL_PERMISSIONS.filter((p) => !p.startsWith('admin:')),
  receptionist: [
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.BOOKINGS_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SUPPORT_READ,
    PERMISSIONS.SUPPORT_WRITE,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.CALLS_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.EXPORT_READ,
  ],
  doctor: [
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.AVAILABILITY_READ,
    PERMISSIONS.AVAILABILITY_WRITE,
    PERMISSIONS.AGENTS_READ,
    PERMISSIONS.CALLS_READ,
    PERMISSIONS.ALERTS_READ,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.EXPORT_READ,
  ],
  auditor: [
    PERMISSIONS.BOOKINGS_READ,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.CALLS_READ,
    PERMISSIONS.EXPORT_READ,
  ],
  tenant_staff: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.CALLS_READ,
  ],
};

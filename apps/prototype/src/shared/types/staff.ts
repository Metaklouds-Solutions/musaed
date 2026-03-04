/**
 * Staff list types for admin and tenant staff pages.
 */

export interface StaffRow {
  userId: string;
  name: string;
  email: string;
  roleSlug: string;
  roleLabel: string;
  tenantId: string;
  tenantName?: string;
  status: string;
}

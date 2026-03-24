/**
 * GDPR adapter: data export and delete (Right to portability, Right to erasure).
 * Prototype: export as JSON download; delete uses localStorage for soft-deleted customers.
 */

import { twoFactorAdapter } from './twoFactor.adapter';
import { seedCustomers } from '../../mock/seedData';
import { seedCalls } from '../../mock/seedData';
import { seedBookings } from '../../mock/seedData';
import type { User } from '../../shared/types';

const DELETED_CUSTOMERS_KEY = 'clinic-crm-gdpr-deleted-customers';

function parseStringArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function getDeletedCustomerIds(): Set<string> {
  const stored = localStorage.getItem(DELETED_CUSTOMERS_KEY);
  return new Set(stored ? parseStringArray(stored) : []);
}

function setDeletedCustomerIds(ids: Set<string>): void {
  localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify([...ids]));
}

export const gdprAdapter = {
  /** Check if a customer is soft-deleted. */
  isCustomerDeleted(customerId: string): boolean {
    return getDeletedCustomerIds().has(customerId);
  },

  /** Get set of deleted customer IDs (for adapters to filter). */
  getDeletedCustomerIds(): Set<string> {
    return getDeletedCustomerIds();
  },

  /**
   * Export user data (GDPR Art 20 - data portability).
   * Downloads JSON with profile and 2FA status.
   */
  async exportUserData(user: User): Promise<void> {
    const data = {
      exportedAt: new Date().toISOString(),
      type: 'user_data_export',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantRole: user.tenantRole,
      },
      twoFactorEnabled: twoFactorAdapter.isEnabled(user.id),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Export customer data (GDPR - for tenant on behalf of customer).
   * Downloads JSON with customer, calls, bookings.
   */
  async exportCustomerData(customerId: string, tenantId: string | undefined): Promise<void> {
    const customer = seedCustomers.find(
      (c) => c.id === customerId && (tenantId == null || c.tenantId === tenantId)
    );
    if (!customer) return;
    const calls = seedCalls.filter(
      (c) =>
        c.customerId === customerId &&
        (tenantId == null || c.tenantId === tenantId)
    );
    const bookings = seedBookings.filter(
      (b) =>
        b.customerId === customerId &&
        (tenantId == null || b.tenantId === tenantId)
    );
    const data = {
      exportedAt: new Date().toISOString(),
      type: 'customer_data_export',
      customer,
      calls,
      bookings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-${customerId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Delete user data (GDPR Art 17 - right to erasure).
   * Clears 2FA; caller must logout.
   */
  async deleteUserData(userId: string, onLogout: () => void): Promise<void> {
    twoFactorAdapter.disable(userId);
    onLogout();
  },

  /**
   * Delete customer data (GDPR - soft delete for prototype).
   * Customer is hidden from lists; calls/bookings remain but customer ref is anonymized in export.
   */
  async deleteCustomerData(customerId: string, _tenantId: string | undefined): Promise<void> {
    const ids = getDeletedCustomerIds();
    ids.add(customerId);
    setDeletedCustomerIds(ids);
    window.dispatchEvent(new CustomEvent('clinic-crm-gdpr-customer-deleted'));
  },
};

/**
 * Local bookings adapter. Filters by tenantId for tenant isolation.
 */

import { seedBookings } from '../../mock/seedData';
import type { Booking } from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export const bookingsAdapter = {
  getBookings(tenantId: string | undefined): Booking[] {
    return filterByTenant(seedBookings, tenantId);
  },
  getBookingById(id: string, tenantId: string | undefined): Booking | undefined {
    const bookings = filterByTenant(seedBookings, tenantId);
    return bookings.find((b) => b.id === id);
  },
};

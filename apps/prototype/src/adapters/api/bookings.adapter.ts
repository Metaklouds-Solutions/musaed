/**
 * API bookings adapter (placeholder). Replace with real API when backend exists.
 */

import type { Booking } from '../../shared/types';

export const bookingsAdapter = {
  getBookings(_tenantId: string | undefined): Booking[] {
    return [];
  },
  getBookingById(_id: string, _tenantId: string | undefined): Booking | undefined {
    return undefined;
  },
};

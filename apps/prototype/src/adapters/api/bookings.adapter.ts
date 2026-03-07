/**
 * API bookings adapter. Fetches from backend, serves cached data synchronously.
 */

import { api } from '../../lib/apiClient';
import type { Booking } from '../../shared/types';

let cachedBookings: Booking[] = [];

export const bookingsAdapter = {
  getBookings(_tenantId: string | undefined): Booking[] {
    return cachedBookings;
  },

  getBookingById(id: string, _tenantId: string | undefined): Booking | undefined {
    return cachedBookings.find((b) => b.id === id);
  },

  async refresh(): Promise<void> {
    try {
      cachedBookings = await api.get<Booking[]>('/tenant/bookings');
    } catch {
      // keep cache as-is
    }
  },

  async updateStatus(id: string, status: string): Promise<Booking | null> {
    try {
      const updated = await api.patch<Booking>(`/tenant/bookings/${id}`, { status });
      cachedBookings = cachedBookings.map((b) => (b.id === id ? updated : b));
      return updated;
    } catch {
      return null;
    }
  },
};

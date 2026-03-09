/**
 * API bookings adapter. Fetches from backend.
 */

import { api } from '../../lib/apiClient';
import type { Booking } from '../../shared/types';
import type { CalendarAppointment, CalendarAvailability } from '../local/bookings.adapter';

function mapBooking(b: any): Booking {
  return {
    id: b._id,
    tenantId: b.tenantId,
    customerId: typeof b.customerId === 'string' ? b.customerId : b.customerId?._id ?? '',
    callId: b.callId ?? undefined,
    amount: b.amount ?? 0,
    status: b.status,
    createdAt: b.createdAt,
  };
}

export const bookingsAdapter = {
  async getCalendarAppointments(
    tenantId: string | undefined,
    start: Date,
    end: Date
  ): Promise<CalendarAppointment[]> {
    if (!tenantId) return [];
    try {
      const resp = await api.get<{ data: any[] }>('/tenant/bookings?limit=200');
      const items = resp.data ?? [];
      const startMs = start.getTime();
      const endMs = end.getTime();
      return items
        .filter((b) => b.tenantId === tenantId || String(b.tenantId) === tenantId)
        .map((b) => {
          const d = b.date ? new Date(b.date) : new Date(b.createdAt);
          const ms = d.getTime();
          if (ms < startMs || ms > endMs) return null;
          const timeSlot = b.timeSlot ?? '09:00';
          const [h, m] = timeSlot.split(':').map(Number);
          const startDate = new Date(d);
          startDate.setHours(h ?? 9, m ?? 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + (b.durationMinutes ?? 30));
          const customerName = b.customerId?.name ?? 'Customer';
          return {
            id: `apt-${b._id}`,
            type: 'appointment' as const,
            title: customerName,
            start: startDate,
            end: endDate,
            bookingId: b._id,
            customerId: typeof b.customerId === 'string' ? b.customerId : b.customerId?._id ?? '',
            status: b.status ?? 'confirmed',
          };
        })
        .filter((a): a is CalendarAppointment => a !== null);
    } catch {
      return [];
    }
  },

  getAvailabilitySlots(
    _tenantId: string | undefined,
    _start: Date,
    _end: Date
  ): CalendarAvailability[] {
    return [];
  },

  async getBookings(tenantId: string | undefined, filters?: { status?: string; date?: string }): Promise<Booking[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.date) params.date = filters.date;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[] }>(`/tenant/bookings?${qs}`);
      return (resp.data ?? []).map(mapBooking);
    } catch {
      return [];
    }
  },

  async getBookingById(id: string, tenantId: string | undefined): Promise<Booking | undefined> {
    try {
      const b = await api.get<any>(`/tenant/bookings/${id}`);
      return mapBooking(b);
    } catch {
      return undefined;
    }
  },

  async updateStatus(id: string, status: string): Promise<Booking | null> {
    try {
      const updated = await api.patch<any>(`/tenant/bookings/${id}`, { status });
      return mapBooking(updated);
    } catch {
      return null;
    }
  },

  async createBooking(data: Partial<Booking>): Promise<Booking | null> {
    try {
      const created = await api.post<any>('/tenant/bookings', data);
      return mapBooking(created);
    } catch {
      return null;
    }
  },
};

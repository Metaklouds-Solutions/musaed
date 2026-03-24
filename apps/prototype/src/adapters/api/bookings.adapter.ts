/**
 * API bookings adapter. Fetches from backend.
 */

import { api } from '../../lib/apiClient';
import type { Booking } from '../../shared/types';
import type { CalendarAppointment, CalendarAvailability } from '../local/bookings.adapter';

function mapBooking(b: {
  _id: string;
  tenantId?: string;
  customerId?: { _id: string; name?: string; email?: string; phone?: string } | string;
  providerId?: { _id: string; name?: string } | string | null;
  date?: string | Date;
  timeSlot?: string;
  durationMinutes?: number;
  serviceType?: string;
  status?: string;
  createdAt?: string;
  callId?: string;
  amount?: number;
  notes?: string;
  source?: string;
}): Booking {
  const customerId =
    typeof b.customerId === 'string'
      ? b.customerId
      : b.customerId?._id ?? b.customerId ?? '';
  const customer =
    typeof b.customerId === 'object' && b.customerId
      ? b.customerId
      : null;
  const provider =
    typeof b.providerId === 'object' && b.providerId ? b.providerId : null;
  const date = b.date
    ? typeof b.date === 'string'
      ? b.date
      : (b.date as Date).toISOString().slice(0, 10)
    : undefined;
  return {
    id: b._id,
    tenantId: b.tenantId ?? '',
    customerId,
    callId: b.callId ?? undefined,
    amount: b.amount ?? 0,
    status: b.status ?? 'confirmed',
    createdAt: b.createdAt ?? new Date().toISOString(),
    date,
    timeSlot: b.timeSlot,
    durationMinutes: b.durationMinutes,
    serviceType: b.serviceType,
    providerId: provider?._id ?? (typeof b.providerId === 'string' ? b.providerId : undefined),
    providerName: provider?.name,
    customerName: customer?.name,
    customerEmail: customer?.email ?? undefined,
    customerPhone: customer?.phone ?? undefined,
    notes: b.notes ?? undefined,
    source: b.source,
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

  async getAvailabilitySlots(
    tenantId: string | undefined,
    start: Date,
    end: Date
  ): Promise<CalendarAvailability[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });
      const data = await api.get<CalendarAvailability[]>(`/tenant/availability?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getBookings(
    tenantId: string | undefined,
    filters?: { status?: string; date?: string; start?: string; end?: string }
  ): Promise<Booking[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.date) params.date = filters.date;
      if (filters?.start) params.start = filters.start;
      if (filters?.end) params.end = filters.end;
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: unknown[] }>(`/tenant/bookings?${qs}`);
      return (resp.data ?? []).map((b) => mapBooking(b as Parameters<typeof mapBooking>[0]));
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

  async cancelBooking(id: string): Promise<Booking | null> {
    return this.updateStatus(id, 'cancelled');
  },

  async rescheduleBooking(
    id: string,
    date: string,
    timeSlot: string
  ): Promise<Booking | null> {
    try {
      const updated = await api.patch<any>(`/tenant/bookings/${id}`, {
        date,
        timeSlot,
      });
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

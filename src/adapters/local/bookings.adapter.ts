/**
 * Local bookings adapter. Filters by tenantId for tenant isolation.
 * Calendar: appointments and availability from staff_profiles.
 */

import { seedBookings, seedStaffUsers, seedCustomers } from '../../mock/seedData';
import { staffProfileAdapter } from './staffProfile.adapter';
import type { Booking } from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export interface CalendarAppointment {
  id: string;
  type: 'appointment';
  title: string;
  start: Date;
  end: Date;
  bookingId: string;
  customerId: string;
  status: string;
}

export interface CalendarAvailability {
  id: string;
  type: 'availability';
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  day: string;
}

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function getCustomerName(customerId: string): string {
  return seedCustomers.find((c) => c.id === customerId)?.name ?? customerId;
}

function getStaffName(userId: string): string {
  return seedStaffUsers.find((u) => u.userId === userId)?.name ?? userId;
}

export const bookingsAdapter = {
  getBookings(tenantId: string | undefined): Booking[] {
    return filterByTenant(seedBookings, tenantId);
  },
  getBookingById(id: string, tenantId: string | undefined): Booking | undefined {
    const bookings = filterByTenant(seedBookings, tenantId);
    return bookings.find((b) => b.id === id);
  },

  /** Appointments for calendar (from bookings). */
  getCalendarAppointments(
    tenantId: string | undefined,
    start: Date,
    end: Date
  ): CalendarAppointment[] {
    const bookings = filterByTenant(seedBookings, tenantId);
    const startMs = start.getTime();
    const endMs = end.getTime();
    return bookings
      .map((b) => {
        const d = new Date(b.createdAt);
        const ms = d.getTime();
        if (ms < startMs || ms > endMs) return null;
        const endDate = new Date(d);
        endDate.setMinutes(endDate.getMinutes() + 30);
        return {
          id: `apt-${b.id}`,
          type: 'appointment' as const,
          title: getCustomerName(b.customerId),
          start: d,
          end: endDate,
          bookingId: b.id,
          customerId: b.customerId,
          status: b.status,
        };
      })
      .filter((a): a is CalendarAppointment => a !== null);
  },

  /** Availability blocks from staff_profiles (doctor schedules). */
  getAvailabilitySlots(
    tenantId: string | undefined,
    start: Date,
    end: Date
  ): CalendarAvailability[] {
    const profiles = tenantId ? staffProfileAdapter.getProfiles(tenantId) : [];
    const slots: CalendarAvailability[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    while (cur <= endDate) {
      const dayStr = DAY_MAP[cur.getDay()];
      for (const p of profiles) {
        const av = p.availability?.find((a) => a.day === dayStr);
        if (!av) continue;
        const [sh, sm] = av.start.split(':').map(Number);
        const [eh, em] = av.end.split(':').map(Number);
        const slotStart = new Date(cur);
        slotStart.setHours(sh, sm, 0, 0);
        const slotEnd = new Date(cur);
        slotEnd.setHours(eh, em, 0, 0);
        slots.push({
          id: `avail-${p.userId}-${cur.toISOString().slice(0, 10)}`,
          type: 'availability',
          staffId: p.userId,
          staffName: getStaffName(p.userId),
          start: slotStart,
          end: slotEnd,
          day: dayStr,
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return slots;
  },
};

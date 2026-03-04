/**
 * Transforms adapter data to FullCalendar event format.
 */

import { bookingsAdapter } from '../../adapters';
import type { EventInput } from '@fullcalendar/core';

export function getCalendarEvents(
  tenantId: string | undefined,
  start: Date,
  end: Date
): EventInput[] {
  if (!tenantId) return [];

  const appointments = bookingsAdapter.getCalendarAppointments(tenantId, start, end);
  const availability = bookingsAdapter.getAvailabilitySlots(tenantId, start, end);

  const appointmentEvents: EventInput[] = appointments.map((a) => ({
    id: a.id,
    title: a.title,
    start: a.start,
    end: a.end,
    backgroundColor: 'var(--ds-primary)',
    borderColor: 'var(--ds-primary)',
    textColor: '#fff',
    extendedProps: { type: 'appointment', bookingId: a.bookingId, status: a.status },
  }));

  const availabilityEvents: EventInput[] = availability.map((a) => ({
    id: a.id,
    title: `${a.staffName} (available)`,
    start: a.start,
    end: a.end,
    display: 'background',
    backgroundColor: 'var(--bg-hover)',
    extendedProps: { type: 'availability', staffId: a.staffId, staffName: a.staffName },
  }));

  return [...appointmentEvents, ...availabilityEvents];
}

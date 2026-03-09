/**
 * Transforms adapter data to FullCalendar event format.
 */

import { bookingsAdapter } from '../../adapters';
import type { EventInput } from '@fullcalendar/core';

export async function getCalendarEvents(
  tenantId: string | undefined,
  start: Date,
  end: Date
): Promise<EventInput[]> {
  if (!tenantId) return [];

  const appointments = await Promise.resolve(
    bookingsAdapter.getCalendarAppointments(tenantId, start, end)
  );
  const availability = await Promise.resolve(
    bookingsAdapter.getAvailabilitySlots(tenantId, start, end)
  );
  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const availabilityList = Array.isArray(availability) ? availability : [];

  const appointmentEvents: EventInput[] = appointmentsList.map((a) => ({
    id: a.id,
    title: a.title,
    start: a.start,
    end: a.end,
    backgroundColor: 'var(--ds-primary)',
    borderColor: 'var(--ds-primary)',
    textColor: '#fff',
    extendedProps: { type: 'appointment', bookingId: a.bookingId, status: a.status },
  }));

  const availabilityEvents: EventInput[] = availabilityList.map((a) => ({
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

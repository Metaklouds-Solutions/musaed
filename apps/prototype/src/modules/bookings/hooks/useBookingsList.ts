/**
 * Bookings list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { bookingsAdapter } from '../../../adapters';

export function useBookingsList() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const bookings = useMemo(() => bookingsAdapter.getBookings(tenantId), [tenantId]);
  const conversionSummary = useMemo(() => {
    const fromCalls = bookings.filter((b) => b.callId).length;
    return { totalBookings: bookings.length, fromCalls };
  }, [bookings]);

  return { user, bookings, conversionSummary };
}

/**
 * Bookings list hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { bookingsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Booking } from '../../../shared/types';

export function useBookingsList() {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: bookings, loading, refetch } = useAsyncData(
    () => bookingsAdapter.getBookings(tenantId),
    [tenantId],
    [] as Booking[],
  );
  const conversionSummary = useMemo(() => {
    const fromCalls = bookings.filter((b) => b.callId).length;
    return { totalBookings: bookings.length, fromCalls };
  }, [bookings]);

  return { user, bookings, conversionSummary, loading, refetch };
}

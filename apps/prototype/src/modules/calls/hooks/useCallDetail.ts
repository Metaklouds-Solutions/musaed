/**
 * Call detail hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { callsAdapter, bookingsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Booking, Call } from '../../../shared/types';

/** Returns current user, selected call, and booking linkage for call-detail view. */
export function useCallDetail(callId: string | undefined) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: call, isLoading } = useAsyncData(
    () => (callId ? callsAdapter.getCallById(callId, tenantId) : Promise.resolve(undefined)),
    [callId, tenantId],
    undefined as Call | undefined,
  );

  const { data: linkedBooking } = useAsyncData(
    () =>
      call?.bookingId
        ? bookingsAdapter.getBookingById(call.bookingId, tenantId)
        : undefined,
    [call?.bookingId, tenantId],
    undefined as Booking | undefined,
  );

  return { user, call, linkedBooking, isLoading };
}

/**
 * Call detail hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { callsAdapter, bookingsAdapter } from '../../../adapters';

/** Returns current user, selected call, and booking linkage for call-detail view. */
export function useCallDetail(callId: string | undefined) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const call = useMemo(
    () => (callId ? callsAdapter.getCallById(callId, tenantId) : undefined),
    [callId, tenantId]
  );
  const linkedBooking = useMemo(
    () =>
      call?.bookingId
        ? bookingsAdapter.getBookingById(call.bookingId, tenantId)
        : undefined,
    [call?.bookingId, tenantId]
  );

  return { user, call, linkedBooking };
}

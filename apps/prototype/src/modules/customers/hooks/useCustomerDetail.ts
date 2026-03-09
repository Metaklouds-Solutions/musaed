/**
 * Customer detail hook. Adapters only; tenantId from session.
 */

import { useMemo } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { customersAdapter, callsAdapter, bookingsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { Customer } from '../../../shared/types';
import type { Booking } from '../../../shared/types';

export function useCustomerDetail(customerId: string | undefined) {
  const { user } = useSession();
  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return undefined;
    return user.tenantId;
  }, [user]);

  const { data: customer } = useAsyncData(
    () => (customerId ? customersAdapter.getCustomerById(customerId, tenantId) : undefined),
    [customerId, tenantId],
    undefined as Customer | undefined,
  );

  const calls = useMemo(() => {
    const all = callsAdapter.getCalls(tenantId);
    return customerId ? all.filter((c) => c.customerId === customerId) : [];
  }, [tenantId, customerId]);

  const { data: bookings } = useAsyncData(
    () => {
      const allPromise = bookingsAdapter.getBookings(tenantId);
      return allPromise.then((all) =>
        customerId ? all.filter((b) => b.customerId === customerId) : []
      );
    },
    [tenantId, customerId],
    [] as Booking[],
  );

  const timeline = useMemo(() => {
    const items: { date: string; type: 'call' | 'booking'; id: string; label: string }[] = [];
    calls.forEach((c) => {
      items.push({
        date: c.createdAt,
        type: 'call',
        id: c.id,
        label: `Call ${Math.floor(c.duration / 60)}m`,
      });
    });
    bookings.forEach((b) => {
      items.push({
        date: b.createdAt,
        type: 'booking',
        id: b.id,
        label: `Booking ${b.id}`,
      });
    });
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items;
  }, [calls, bookings]);

  const followUpRecommended = useMemo(() => {
    const hasEscalation = calls.some((c) => c.escalationFlag);
    const recentBooking = bookings.length > 0;
    return hasEscalation && !recentBooking;
  }, [calls, bookings]);

  return { user, customer, calls, bookings, timeline, followUpRecommended };
}

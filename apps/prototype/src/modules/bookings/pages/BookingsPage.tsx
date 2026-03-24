/**
 * Bookings page. Layout only; data from useBookingsList hook.
 * TableFilters for status. Cancel and Reschedule actions.
 */

import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, EmptyState, TableFilters, TableSkeleton, Button } from '../../../shared/ui';
import { useBookingsList } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { BookingsTable } from '../components/BookingsTable';
import { ConversionSummary } from '../components/ConversionSummary';
import { bookingsAdapter } from '../../../adapters';
import { Calendar } from 'lucide-react';

export function BookingsPage() {
  const { user, bookings, conversionSummary, refetch } = useBookingsList();
  const ready = useDelayedReady();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (!statusFilter) return bookings;
    return bookings.filter((b) => b.status.toLowerCase() === statusFilter.toLowerCase());
  }, [bookings, statusFilter]);

  const statuses = useMemo(() => {
    const set = new Set(bookings.map((b) => b.status));
    return Array.from(set).map((s) => ({ value: s.toLowerCase(), label: s }));
  }, [bookings]);

  const handleCancel = useCallback(
    async (id: string) => {
      const result = await bookingsAdapter.cancelBooking(id);
      if (result !== null) await refetch();
    },
    [refetch]
  );

  const handleReschedule = useCallback(
    async (id: string, date: string, timeSlot: string) => {
      const result = await bookingsAdapter.rescheduleBooking(id, date, timeSlot);
      if (result !== null) await refetch();
    },
    [refetch]
  );

  if (!user) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sign in to view bookings"
        description="Select a role on the login page to see bookings."
      />
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bookings" description="Booking list and conversion from AI calls." />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No bookings yet"
        description="Bookings will appear when data is available from the adapter."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHeader
          title="Bookings"
          description="Booking list and conversion from AI calls."
        />
        <Link to="/bookings/calendar">
          <Button variant="secondary">View calendar</Button>
        </Link>
      </div>
      <ConversionSummary
        totalBookings={conversionSummary.totalBookings}
        fromCalls={conversionSummary.fromCalls}
      />
      <TableFilters
        statuses={statuses}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <BookingsTable
        bookings={filteredBookings}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />
    </div>
  );
}

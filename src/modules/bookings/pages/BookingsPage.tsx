/**
 * Bookings page. Layout only; data from useBookingsList hook.
 */

import { PageHeader, EmptyState } from '../../../shared/ui';
import { useBookingsList } from '../hooks';
import { BookingsTable } from '../components/BookingsTable';
import { ConversionSummary } from '../components/ConversionSummary';
import { Calendar } from 'lucide-react';

export function BookingsPage() {
  const { user, bookings, conversionSummary } = useBookingsList();

  if (!user) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sign in to view bookings"
        description="Select a role on the login page to see bookings."
      />
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
    <>
      <PageHeader
        title="Bookings"
        description="Booking list and conversion from AI calls."
      />
      <div className="space-y-6">
        <ConversionSummary
          totalBookings={conversionSummary.totalBookings}
          fromCalls={conversionSummary.fromCalls}
        />
        <BookingsTable bookings={bookings} />
      </div>
    </>
  );
}

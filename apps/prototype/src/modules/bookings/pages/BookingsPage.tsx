/**
 * Bookings page. Layout only; data from useBookingsList hook.
 * TableFilters for status. Cancel and Reschedule actions.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableSkeleton, Button, UnifiedFilterBar } from '../../../shared/ui';
import { useBookingsList } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { BookingsTable } from '../components/BookingsTable';
import { ConversionSummary } from '../components/ConversionSummary';
import { bookingsAdapter } from '../../../adapters';
import { Calendar, FlaskConical } from 'lucide-react';
import type { Booking } from '../../../shared/types';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useUrlQueryState } from '../../../shared/hooks/useUrlQueryState';

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: 'sample-bk-1',
    tenantId: 'sample-tenant',
    customerId: 'sample-c-1',
    customerName: 'Sara Ahmed',
    customerEmail: 'sara.ahmed@example.com',
    providerId: 'sample-d-1',
    providerName: 'Dr. Khalid Al-Fahad',
    serviceType: 'Dental Cleaning',
    date: '2026-03-28',
    timeSlot: '10:30',
    durationMinutes: 30,
    status: 'confirmed',
    callId: 'sample-call-101',
    amount: 220,
    source: 'retell',
    notes: 'First-time patient. Requested morning slot.',
    createdAt: '2026-03-26T09:15:00.000Z',
  },
  {
    id: 'sample-bk-2',
    tenantId: 'sample-tenant',
    customerId: 'sample-c-2',
    customerName: 'Omar Hasan',
    customerEmail: 'omar.hasan@example.com',
    providerId: 'sample-d-2',
    providerName: 'Dr. Lina Morsi',
    serviceType: 'Root Canal Follow-up',
    date: '2026-03-29',
    timeSlot: '14:00',
    durationMinutes: 45,
    status: 'completed',
    callId: 'sample-call-102',
    amount: 480,
    source: 'retell',
    notes: 'Follow-up after last visit, pain reduced.',
    createdAt: '2026-03-25T11:40:00.000Z',
  },
  {
    id: 'sample-bk-3',
    tenantId: 'sample-tenant',
    customerId: 'sample-c-3',
    customerName: 'Mariam Yousif',
    customerEmail: 'mariam.yousif@example.com',
    providerId: 'sample-d-1',
    providerName: 'Dr. Khalid Al-Fahad',
    serviceType: 'Orthodontic Consultation',
    date: '2026-03-30',
    timeSlot: '17:15',
    durationMinutes: 30,
    status: 'no_show',
    callId: undefined,
    amount: 0,
    source: 'manual',
    notes: 'No check-in after 20 min grace period.',
    createdAt: '2026-03-24T08:05:00.000Z',
  },
];

export function BookingsPage() {
  const { user, bookings, conversionSummary, refetch } = useBookingsList();
  const ready = useDelayedReady();
  const { state, patchState, resetState } = useUrlQueryState({
    tab: 'upcoming',
    q: '',
  });
  const viewFilter = state.tab as 'upcoming' | 'unconfirmed' | 'recurring' | 'past' | 'cancelled';
  const searchQuery = state.q;
  const enableSampleDataUi = import.meta.env.VITE_ENABLE_SAMPLE_DATA_UI === 'true';
  const [useSampleData, setUseSampleData] = useState(false);
  const [sampleBookings, setSampleBookings] = useState<Booking[]>(SAMPLE_BOOKINGS);
  const { saved, saveCurrent, apply, deleteFilter } = useSavedFilters({
    pageKey: 'tenant-bookings',
    currentFilters: { tab: state.tab, q: state.q },
    onApply: (filters) => {
      patchState({
        tab: typeof filters.tab === 'string' ? filters.tab : 'upcoming',
        q: typeof filters.q === 'string' ? filters.q : '',
      });
    },
  });

  const activeBookings = useMemo(
    () => (useSampleData ? sampleBookings : bookings),
    [useSampleData, sampleBookings, bookings],
  );
  const activeSummary = useMemo(() => {
    if (!useSampleData) {
      return conversionSummary;
    }
    return {
      totalBookings: sampleBookings.length,
      fromCalls: sampleBookings.filter((b) => b.callId).length,
    };
  }, [useSampleData, conversionSummary, sampleBookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const base = activeBookings.filter((b) => {
      const status = (b.status ?? '').toLowerCase();
      const startsAt = new Date(
        `${(b.date ?? b.createdAt).slice(0, 10)}T${b.timeSlot ?? '00:00'}:00`,
      );
      const isPast = !Number.isNaN(startsAt.getTime()) && startsAt < now;

      if (viewFilter === 'cancelled') return status === 'cancelled';
      if (viewFilter === 'unconfirmed') return status === 'pending' || status === 'unconfirmed';
      if (viewFilter === 'recurring') return status === 'recurring';
      if (viewFilter === 'past') {
        return isPast || status === 'completed' || status === 'no_show';
      }
      return !isPast && status !== 'cancelled' && status !== 'completed' && status !== 'no_show';
    });

    if (!searchQuery.trim()) return base;
    const q = searchQuery.trim().toLowerCase();
    return base.filter((b) =>
      [b.customerName, b.customerEmail, b.providerName, b.serviceType, b.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [activeBookings, viewFilter, searchQuery]);

  const handleCancel = useCallback(
    async (id: string) => {
      if (useSampleData) {
        setSampleBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)),
        );
        return;
      }
      const result = await bookingsAdapter.cancelBooking(id);
      if (result !== null) await refetch();
    },
    [refetch, useSampleData]
  );

  const handleReschedule = useCallback(
    async (id: string, date: string, timeSlot: string) => {
      if (useSampleData) {
        setSampleBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, date, timeSlot, status: b.status === 'cancelled' ? 'confirmed' : b.status }
              : b,
          ),
        );
        return;
      }
      const result = await bookingsAdapter.rescheduleBooking(id, date, timeSlot);
      if (result !== null) await refetch();
    },
    [refetch, useSampleData]
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

  if (activeBookings.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Calendar}
          title="No bookings yet"
          description="Bookings will appear when data is available from the adapter."
        />
        <div className="flex justify-center">
          {enableSampleDataUi && (
            <Button
              variant="secondary"
              onClick={() => setUseSampleData(true)}
              className="flex items-center gap-2"
            >
              <FlaskConical size={16} />
              Load sample bookings
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Bookings"
          description="See upcoming and past events booked through your clinic assistant."
        />
        <div className="flex gap-2">
          {enableSampleDataUi && !useSampleData && (
            <Button
              variant="secondary"
              onClick={() => setUseSampleData(true)}
              className="flex items-center gap-2"
            >
              <FlaskConical size={16} />
              Show sample data
            </Button>
          )}
          {enableSampleDataUi && useSampleData && (
            <Button
              variant="ghost"
              onClick={() => {
                setUseSampleData(false);
                setSampleBookings(SAMPLE_BOOKINGS);
              }}
            >
              Back to live data
            </Button>
          )}
        </div>
      </div>
      <ConversionSummary
        totalBookings={activeSummary.totalBookings}
        fromCalls={activeSummary.fromCalls}
      />
      <UnifiedFilterBar
        tabs={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'unconfirmed', label: 'Unconfirmed' },
          { value: 'recurring', label: 'Recurring' },
          { value: 'past', label: 'Past' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        activeTab={viewFilter}
        onTabChange={(tab) => patchState({ tab })}
        query={searchQuery}
        onQueryChange={(q) => patchState({ q })}
        searchPlaceholder="Search by patient, doctor, service, or booking ID..."
        savedFilters={saved}
        onSaveFilter={saveCurrent}
        onApplyFilter={apply}
        onDeleteFilter={deleteFilter}
        activeFilterCount={viewFilter === 'upcoming' ? 0 : 1}
        onReset={() => resetState()}
      />
      <BookingsTable
        bookings={filteredBookings}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />
    </div>
  );
}

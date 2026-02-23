/**
 * Customer detail page. Layout only; data from useCustomerDetail hook.
 */

import { useParams, Link } from 'react-router-dom';
import { EmptyState, Button } from '../../../shared/ui';
import { useCustomerDetail } from '../hooks';
import { InteractionTimeline } from '../components/InteractionTimeline';
import { BookingHistory } from '../components/BookingHistory';
import { CallHistory } from '../components/CallHistory';
import { SentimentTrend } from '../components/SentimentTrend';
import { FollowUpIndicator } from '../components/FollowUpIndicator';
import { Users } from 'lucide-react';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, customer, calls, bookings, timeline, followUpRecommended } =
    useCustomerDetail(id);

  if (!user) {
    return (
      <EmptyState icon={Users} title="Sign in to view customer" description="Select a role on the login page">
        <Link to="/customers" className="mt-6 inline-block">
          <Button variant="secondary">Back to customers</Button>
        </Link>
      </EmptyState>
    );
  }

  if (!customer) {
    return (
      <EmptyState
        icon={Users}
        title="Customer not found"
        description={id ? `No customer found for ID "${id}".` : 'Missing customer ID.'}
      >
        <Link to="/customers" className="mt-6 inline-block">
          <Button variant="secondary">Back to customers</Button>
        </Link>
      </EmptyState>
    );
  }

  const lastContact =
    timeline.length > 0 ? timeline[0].date : undefined;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {customer.name}
          </h1>
          {customer.email && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {customer.email}
            </p>
          )}
        </div>
        <Link to="/customers">
          <Button variant="secondary">Back to customers</Button>
        </Link>
      </div>

      <div className="space-y-6">
        <FollowUpIndicator
          recommended={followUpRecommended}
          lastContactDate={lastContact}
        />
        <InteractionTimeline items={timeline} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BookingHistory bookings={bookings} />
          <CallHistory calls={calls} />
        </div>
        <SentimentTrend calls={calls} />
      </div>
    </>
  );
}

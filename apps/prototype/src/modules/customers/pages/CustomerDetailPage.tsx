/**
 * Customer detail page. Layout only; data from useCustomerDetail hook.
 * PII (name, email) masked by default; auditors can reveal.
 * GDPR: Export / Delete customer (tenant_owner, clinic_admin).
 */

import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState, Button } from '../../../shared/ui';
import { useCustomerDetail } from '../hooks';
import { usePiiMask } from '../../../shared/hooks/usePiiMask';
import { gdprAdapter } from '../../../adapters';
import { InteractionTimeline } from '../components/InteractionTimeline';
import { BookingHistory } from '../components/BookingHistory';
import { CallHistory } from '../components/CallHistory';
import { SentimentTrend } from '../components/SentimentTrend';
import { FollowUpIndicator } from '../components/FollowUpIndicator';
import { Users, Download, Trash2 } from 'lucide-react';

function canManageCustomer(user: { role: string; tenantRole?: string }): boolean {
  return (
    user.role === 'ADMIN' ||
    user.tenantRole === 'tenant_owner' ||
    user.tenantRole === 'clinic_admin'
  );
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, customer, calls, bookings, timeline, followUpRecommended } =
    useCustomerDetail(id);
  const { maskName, maskEmail, canViewUnmaskedPII, showUnmasked, toggleUnmasked } = usePiiMask();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleExportCustomer = useCallback(async () => {
    if (!id || !customer) return;
    try {
      await gdprAdapter.exportCustomerData(id, user?.tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      toast.error(message);
    }
  }, [id, customer, user?.tenantId]);

  const handleDeleteCustomer = useCallback(async () => {
    if (!id || !customer) return;
    try {
      await gdprAdapter.deleteCustomerData(id, customer.tenantId);
      navigate('/customers');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  }, [id, customer, navigate]);

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {maskName(customer.name)}
            </h1>
            {canViewUnmaskedPII && (
              <button
                type="button"
                onClick={toggleUnmasked}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label={showUnmasked ? 'Mask PII' : 'Reveal PII'}
              >
                {showUnmasked ? 'Mask' : 'Reveal'} PII
              </button>
            )}
          </div>
          {customer.email && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {maskEmail(customer.email)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageCustomer(user) && (
            <>
              <Button
                variant="secondary"
                className="cursor-pointer flex items-center gap-2"
                onClick={handleExportCustomer}
              >
                <Download size={16} />
                Export data
              </Button>
              {deleteConfirm ? (
                <>
                  <Button
                    variant="danger"
                    className="cursor-pointer"
                    onClick={handleDeleteCustomer}
                  >
                    Confirm delete
                  </Button>
                  <Button
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                  Delete customer
                </Button>
              )}
            </>
          )}
          <Link to="/customers">
            <Button variant="secondary">Back to customers</Button>
          </Link>
        </div>
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

/**
 * Bookings list with responsive rows and action menu.
 * Keeps cancel/reschedule flows wired to adapter callbacks.
 */

import { useCallback, useMemo, useState } from 'react';
import { MoreHorizontal, Phone } from 'lucide-react';
import { Button, Modal, ModalHeader, PillTag, ViewButton } from '../../../../shared/ui';
import type { Booking } from '../../../../shared/types';
import type { PillTagVariant } from '../../../../shared/ui';

interface BookingsTableProps {
  bookings: Booking[];
  onCancel?: (id: string) => Promise<void>;
  onReschedule?: (id: string, date: string, timeSlot: string) => Promise<void>;
}

function formatDateLabel(date: string | undefined): string {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(slot?: string): string {
  if (!slot) return '—';
  const [h, m] = slot.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return slot;
  const dt = new Date();
  dt.setHours(h, m, 0, 0);
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function statusToVariant(status: string): PillTagVariant {
  const s = status?.toLowerCase() ?? '';
  if (s === 'confirmed') return 'status';
  if (s === 'cancelled') return 'outcomeFailed';
  if (s === 'completed') return 'role';
  if (s === 'no_show' || s === 'pending' || s === 'unconfirmed') return 'outcomeEscalated';
  return 'default';
}

export function BookingsTable({ bookings, onCancel, onReschedule }: BookingsTableProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [loading, setLoading] = useState(false);

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const at = new Date(`${(a.date ?? a.createdAt).slice(0, 10)}T${a.timeSlot ?? '00:00'}:00`).getTime();
      const bt = new Date(`${(b.date ?? b.createdAt).slice(0, 10)}T${b.timeSlot ?? '00:00'}:00`).getTime();
      return at - bt;
    });
  }, [bookings]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelModal || !onCancel) return;
    setLoading(true);
    try {
      await onCancel(cancelModal.id);
      setCancelModal(null);
      setMenuId(null);
    } finally {
      setLoading(false);
    }
  }, [cancelModal, onCancel]);

  const handleRescheduleConfirm = useCallback(async () => {
    if (!rescheduleModal || !onReschedule || !rescheduleDate || !rescheduleTime) return;
    setLoading(true);
    try {
      await onReschedule(rescheduleModal.id, rescheduleDate, rescheduleTime);
      setRescheduleModal(null);
      setMenuId(null);
    } finally {
      setLoading(false);
    }
  }, [rescheduleModal, onReschedule, rescheduleDate, rescheduleTime]);

  if (sorted.length === 0) {
    return (
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">No bookings in this view</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Try switching tabs or updating filters to find matching bookings.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] text-xs tracking-[0.08em] font-semibold text-[var(--text-muted)] uppercase">
          Next
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {sorted.map((b) => {
            const isCancelled = (b.status ?? '').toLowerCase() === 'cancelled';
            return (
              <article key={b.id} className="px-4 py-4 sm:px-5 sm:py-5">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-start">
                  <div className="space-y-1">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                      {formatDateLabel(b.date ?? b.createdAt)}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatTimeLabel(b.timeSlot)}
                      {b.durationMinutes ? ` (${b.durationMinutes}m)` : ''}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-[var(--text-primary)] break-words">
                        {b.customerName ?? 'Unknown patient'}
                        {b.providerName ? ` with ${b.providerName}` : ''}
                      </h4>
                      <PillTag variant={statusToVariant(b.status)}>{b.status}</PillTag>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {b.serviceType ?? 'General Consultation'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)] inline-flex items-center gap-1">
                      <Phone size={14} />
                      {b.customerEmail ?? 'No contact email'}
                    </p>
                    {b.callId ? (
                      <div className="mt-2">
                        <ViewButton to={`/calls/${b.callId}`}>View session details</ViewButton>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative justify-self-end">
                    <button
                      type="button"
                      onClick={() => setMenuId((prev) => (prev === b.id ? null : b.id))}
                      className="h-10 w-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      aria-label="Open booking actions"
                    >
                      <MoreHorizontal size={16} className="mx-auto" />
                    </button>
                    {menuId === b.id ? (
                      <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleModal(b);
                            setRescheduleDate(b.date ?? '');
                            setRescheduleTime(b.timeSlot ?? '09:00');
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                          disabled={isCancelled}
                        >
                          Reschedule booking
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        >
                          Request reschedule
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        >
                          Edit location
                        </button>
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        >
                          Add guests
                        </button>
                        <div className="my-1 border-t border-[var(--border-subtle)]" />
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        >
                          Mark as no-show
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelModal(b)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--error)] hover:bg-[var(--error)]/10 disabled:opacity-50"
                          disabled={isCancelled}
                        >
                          Cancel event
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {cancelModal ? (
        <Modal
          open={!!cancelModal}
          onClose={() => !loading && setCancelModal(null)}
          title="Cancel appointment"
        >
          <ModalHeader title="Cancel appointment" onClose={() => !loading && setCancelModal(null)} />
          <div className="px-5 py-4 space-y-4">
            <p className="text-[var(--text-secondary)] text-sm">
              Cancel appointment for <strong className="text-[var(--text-primary)]">{cancelModal.customerName ?? 'this patient'}</strong> on{' '}
              {formatDateLabel(cancelModal.date ?? cancelModal.createdAt)} at {formatTimeLabel(cancelModal.timeSlot)}?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCancelModal(null)} disabled={loading}>
                Keep booking
              </Button>
              <Button variant="danger" onClick={handleCancelConfirm} loading={loading}>
                Cancel appointment
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {rescheduleModal ? (
        <Modal
          open={!!rescheduleModal}
          onClose={() => !loading && setRescheduleModal(null)}
          title="Reschedule appointment"
        >
          <ModalHeader title="Reschedule appointment" onClose={() => !loading && setRescheduleModal(null)} />
          <div className="px-5 py-4 space-y-4">
            <p className="text-[var(--text-secondary)] text-sm">
              Update time for <strong className="text-[var(--text-primary)]">{rescheduleModal.customerName ?? 'this patient'}</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-sm text-[var(--text-secondary)]">Date</span>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-[var(--text-secondary)]">Time</span>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRescheduleModal(null)} disabled={loading}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleRescheduleConfirm}
                loading={loading}
                disabled={!rescheduleDate || !rescheduleTime}
              >
                Save schedule
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

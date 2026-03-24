/**
 * Bookings table. Date/Time, Patient, Service, Provider, Status, Actions.
 * Cancel and Reschedule buttons with confirmation modals.
 */

import { useState, useCallback } from 'react';
import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ViewButton,
  PillTag,
  Button,
  Modal,
  ModalHeader,
} from '../../../../shared/ui';
import type { Booking } from '../../../../shared/types';
import type { PillTagVariant } from '../../../../shared/ui';

interface BookingsTableProps {
  bookings: Booking[];
  onCancel?: (id: string) => Promise<void>;
  onReschedule?: (id: string, date: string, timeSlot: string) => Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: string | undefined, timeSlot: string | undefined): string {
  if (!date && !timeSlot) return '—';
  const d = date ? new Date(date) : null;
  const dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const timeStr = timeSlot ?? '';
  return [dateStr, timeStr].filter(Boolean).join(' at ') || '—';
}

function statusToVariant(status: string): PillTagVariant {
  const s = status?.toLowerCase() ?? '';
  if (s === 'confirmed') return 'status';
  if (s === 'cancelled') return 'outcomeFailed';
  if (s === 'completed') return 'role';
  if (s === 'no_show') return 'outcomeEscalated';
  return 'default';
}

export function BookingsTable({
  bookings,
  onCancel,
  onReschedule,
}: BookingsTableProps) {
  const [cancelModal, setCancelModal] = useState<Booking | null>(null);
  const [rescheduleModal, setRescheduleModal] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancelClick = useCallback((b: Booking) => {
    setCancelModal(b);
  }, []);

  const handleRescheduleClick = useCallback((b: Booking) => {
    setRescheduleModal(b);
    setRescheduleDate(b.date ?? '');
    setRescheduleTime(b.timeSlot ?? '09:00');
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelModal || !onCancel) return;
    setLoading(true);
    try {
      await onCancel(cancelModal.id);
      setCancelModal(null);
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
    } finally {
      setLoading(false);
    }
  }, [rescheduleModal, onReschedule, rescheduleDate, rescheduleTime]);

  if (bookings.length === 0) return null;

  return (
    <>
      <DataTable minWidth="min-w-[640px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Linked call</TableHead>
              {(onCancel || onReschedule) && <TableHead aria-label="Actions" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-[var(--text-primary)] text-sm">
                  {formatDateTime(b.date ?? b.createdAt, b.timeSlot)}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)] text-sm">
                  {b.customerName ?? '—'}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)] text-sm">
                  {b.serviceType ?? '—'}
                </TableCell>
                <TableCell className="text-[var(--text-secondary)] text-sm">
                  {b.providerName ?? '—'}
                </TableCell>
                <TableCell>
                  <PillTag variant={statusToVariant(b.status)}>{b.status}</PillTag>
                </TableCell>
                <TableCell>
                  {b.callId ? (
                    <ViewButton to={`/calls/${b.callId}`} aria-label="View call">
                      View call
                    </ViewButton>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
                  )}
                </TableCell>
                {(onCancel || onReschedule) && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onReschedule && b.status?.toLowerCase() !== 'cancelled' && (
                        <Button
                          variant="outline"
                          className="min-h-8 px-3 py-1.5 text-sm"
                          onClick={() => handleRescheduleClick(b)}
                          aria-label={`Reschedule ${b.customerName ?? 'booking'}`}
                        >
                          Reschedule
                        </Button>
                      )}
                      {onCancel && b.status?.toLowerCase() !== 'cancelled' && (
                        <Button
                          variant="outline"
                          className="min-h-8 px-3 py-1.5 text-sm border-[var(--error)] text-[var(--error)] hover:bg-[var(--error)]/10"
                          onClick={() => handleCancelClick(b)}
                          aria-label={`Cancel ${b.customerName ?? 'booking'}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      {cancelModal && (
        <Modal
          open={!!cancelModal}
          onClose={() => !loading && setCancelModal(null)}
          title="Cancel appointment"
        >
          <ModalHeader
            title="Cancel appointment"
            onClose={() => !loading && setCancelModal(null)}
          />
          <div className="px-5 py-4 space-y-4">
            <p className="text-[var(--text-secondary)] text-sm">
              Are you sure you want to cancel the appointment for{' '}
              <strong className="text-[var(--text-primary)]">
                {cancelModal.customerName ?? 'this patient'}
              </strong>{' '}
              on {formatDateTime(cancelModal.date, cancelModal.timeSlot)}? The patient will
              receive an email notification.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setCancelModal(null)}
                disabled={loading}
              >
                Keep
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelConfirm}
                loading={loading}
              >
                Cancel appointment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {rescheduleModal && (
        <Modal
          open={!!rescheduleModal}
          onClose={() => !loading && setRescheduleModal(null)}
          title="Reschedule appointment"
        >
          <ModalHeader
            title="Reschedule appointment"
            onClose={() => !loading && setRescheduleModal(null)}
          />
          <div className="px-5 py-4 space-y-4">
            <p className="text-[var(--text-secondary)] text-sm">
              Reschedule for{' '}
              <strong className="text-[var(--text-primary)]">
                {rescheduleModal.customerName ?? 'this patient'}
              </strong>
              . The patient will receive an email with the new time.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reschedule-date"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="reschedule-time"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Time
                </label>
                <input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-[var(--radius-input)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setRescheduleModal(null)}
                disabled={loading}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleRescheduleConfirm}
                loading={loading}
                disabled={!rescheduleDate || !rescheduleTime}
              >
                Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

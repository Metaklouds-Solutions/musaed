/**
 * Call detail page. Layout only; data from useCallDetail hook.
 * Run events (debug console) visible to auditors only.
 */

import { useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { EmptyState, Button } from '../../../shared/ui';
import { useCallDetail, useCallRunEvents } from '../hooks';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { CallMetaPanel } from '../components/CallMetaPanel';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { CallReplayViewer } from '../components/CallReplayViewer';
import { SentimentBadge } from '../components/SentimentBadge';
import { AudioMockPlayer } from '../components/AudioMockPlayer';
import { RunEventsViewer } from '../../admin/components/RunEventsViewer';
import { Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Renders detailed call audit view with transcript modes and optional run events. */
export function CallDetailPage() {
  const params = useParams<{ id?: string; callId?: string }>();
  const resolvedCallId = params.callId ?? params.id;
  const { pathname } = useLocation();
  const { user, call, linkedBooking, isLoading } = useCallDetail(resolvedCallId);
  const isAdminContext = pathname.startsWith('/admin');
  const callsPath =
    isAdminContext && params.id
      ? `/admin/tenants/${params.id}`
      : isAdminContext
        ? '/admin/calls'
        : '/calls';
  const { canAccessRunEvents } = usePermissions();
  const retellCallId = call?.callId ?? call?.id;
  const { events } = useCallRunEvents(retellCallId, user?.tenantId, canAccessRunEvents);
  const [transcriptMode, setTranscriptMode] = useState<'replay' | 'full'>('replay');
  const hasValidCustomerId = /^[a-fA-F0-9]{24}$/.test(call?.customerId ?? '');

  if (!user) {
    return (
      <EmptyState
        icon={Phone}
        title="Sign in to view call"
        description="Select a role on the login page."
      >
        <Link to={callsPath} className="mt-6 inline-block">
          <Button variant="secondary">Back to calls</Button>
        </Link>
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
        Loading call details...
      </div>
    );
  }

  if (!call) {
    return (
      <EmptyState
        icon={Phone}
        title="Call not found"
        description={resolvedCallId ? `No call found for ID "${resolvedCallId}".` : 'Missing call ID.'}
      >
        <Link to={callsPath} className="mt-6 inline-block">
          <Button variant="secondary">Back to calls</Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Call detail
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {(() => {
              const parsed = new Date(call.createdAt);
              if (Number.isNaN(parsed.getTime())) return '—';
              return parsed.toLocaleString();
            })()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAdminContext && hasValidCustomerId && (
            <Link to={`/customers/${call.customerId}`}>
              <Button variant="secondary">View customer</Button>
            </Link>
          )}
          <Link to={callsPath}>
            <Button variant="secondary">{isAdminContext && params.id ? 'Back to tenant' : 'Back to calls'}</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <SentimentBadge score={call.sentimentScore} />
          {call.escalationFlag && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                color: 'var(--warning)',
              }}
            >
              Escalated
            </span>
          )}
        </div>

        {call.recordingUrl ? (
          <div className="rounded-[var(--radius-card)] card-glass p-5 flex items-center justify-center">
            <audio controls src={call.recordingUrl} className="w-full max-w-2xl outline-none" />
          </div>
        ) : (
          <AudioMockPlayer durationSeconds={call.duration} />
        )}

        {call.summary && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-[var(--text-secondary)]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
              {call.summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CallMetaPanel call={call} linkedBooking={linkedBooking ?? undefined} />
          {linkedBooking && (
            <div
              className="rounded-[var(--radius-card)] card-glass p-5"
              style={{ minHeight: '120px' }}
            >
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Linked booking
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {linkedBooking.id} — ${linkedBooking.amount} ({linkedBooking.status})
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setTranscriptMode('replay')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                transcriptMode === 'replay'
                  ? 'bg-[var(--ds-primary)]/20 text-[var(--ds-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Replay
            </button>
            <button
              type="button"
              onClick={() => setTranscriptMode('full')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                transcriptMode === 'full'
                  ? 'bg-[var(--ds-primary)]/20 text-[var(--ds-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Full transcript
            </button>
          </div>
          {transcriptMode === 'replay' ? (
            <CallReplayViewer transcript={call.transcript} />
          ) : (
            <TranscriptViewer transcript={call.transcript} />
          )}
        </div>

        {canAccessRunEvents && (
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Run events (auditor)
            </h3>
            <RunEventsViewer events={events} />
          </div>
        )}
      </div>
    </>
  );
}

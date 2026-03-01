/**
 * Call detail page. Layout only; data from useCallDetail hook.
 * Run events (debug console) visible to auditors only.
 */

import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EmptyState, Button } from '../../../shared/ui';
import { useCallDetail } from '../hooks';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { runsAdapter } from '../../../adapters';
import { CallMetaPanel } from '../components/CallMetaPanel';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { CallReplayViewer } from '../components/CallReplayViewer';
import { SentimentBadge } from '../components/SentimentBadge';
import { AudioMockPlayer } from '../components/AudioMockPlayer';
import { RunEventsViewer } from '../../admin/components/RunEventsViewer';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, call, linkedBooking } = useCallDetail(id);
  const { canAccessRunEvents } = usePermissions();
  const runEvents = useMemo(
    () =>
      call && user?.tenantId && canAccessRunEvents
        ? runsAdapter.getRunByCallId(call.id, user.tenantId)
        : null,
    [call, user?.tenantId, canAccessRunEvents]
  );
  const events = useMemo(
    () => (runEvents ? runsAdapter.getRunEvents(runEvents.id) : []),
    [runEvents]
  );
  const [transcriptMode, setTranscriptMode] = useState<'replay' | 'full'>('replay');

  if (!user) {
    return (
      <EmptyState
        icon={Phone}
        title="Sign in to view call"
        description="Select a role on the login page."
      >
        <Link to="/calls" className="mt-6 inline-block">
          <Button variant="secondary">Back to calls</Button>
        </Link>
      </EmptyState>
    );
  }

  if (!call) {
    return (
      <EmptyState
        icon={Phone}
        title="Call not found"
        description={id ? `No call found for ID "${id}".` : 'Missing call ID.'}
      >
        <Link to="/calls" className="mt-6 inline-block">
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
            {new Date(call.createdAt).toLocaleString()}
          </p>
        </div>
        <Link to="/calls">
          <Button variant="secondary">Back to calls</Button>
        </Link>
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

        <AudioMockPlayer durationSeconds={call.duration} />

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

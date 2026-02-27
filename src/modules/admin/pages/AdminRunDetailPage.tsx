/**
 * Admin run detail page. Run events debug console.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button } from '../../../shared/ui';
import { RunEventsViewer } from '../components/RunEventsViewer';
import { runsAdapter } from '../../../adapters';
import { tenantsAdapter } from '../../../adapters';

export function AdminRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const run = id ? runsAdapter.getRun(id) : null;
  const events = id ? runsAdapter.getRunEvents(id) : [];
  const tenantName = run
    ? tenantsAdapter.getAllTenants().find((t) => t.id === run.tenantId)?.name ?? run.tenantId
    : '';

  if (!id || !run) {
    return (
      <div className="space-y-6">
        <PageHeader title="Run not found" description="The requested run does not exist." />
        <Button variant="ghost" onClick={() => navigate('/admin/runs')}>
          Back to Runs
        </Button>
      </div>
    );
  }

  const cost = run.usage?.cost ?? 0;
  const tokens = run.usage?.tokens;

  return (
    <div className="space-y-6">
      <PageHeader
        title={run.id}
        description={`${tenantName} · Call ${run.callId} · $${cost.toFixed(2)}${tokens != null ? ` · ${tokens.toLocaleString()} tokens` : ''}`}
      />
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/admin/runs')}>
          Back to Runs
        </Button>
        <Button variant="ghost" onClick={() => navigate(`/admin/calls/${run.callId}`)}>
          View Call
        </Button>
      </div>
      <RunEventsViewer events={events} />
    </div>
  );
}

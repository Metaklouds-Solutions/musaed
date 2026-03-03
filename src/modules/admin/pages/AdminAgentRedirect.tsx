/**
 * Redirects /admin/agents/:id to /admin/tenants/:tenantId/agents/:id when agent is assigned.
 * For unassigned agents, redirects to agents list.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agentsAdapter } from '../../../adapters';

export function AdminAgentRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      navigate('/admin/agents', { replace: true });
      return;
    }
    const agent = agentsAdapter.getDetails(id);
    if (agent?.tenantId) {
      navigate(`/admin/tenants/${agent.tenantId}/agents/${id}`, { replace: true });
    } else {
      navigate('/admin/agents', { replace: true });
    }
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center p-8 text-[var(--text-muted)] text-sm">
      Redirecting…
    </div>
  );
}

/**
 * Redirects /admin/agents/:id to /admin/tenants/:tenantId/agents/:id when agent is assigned.
 * For unassigned agents, redirects to agents list.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAgentRedirect } from '../hooks';

/** Redirects legacy admin agent route to tenant-scoped detail when assigned. */
export function AdminAgentRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const targetPath = useAdminAgentRedirect(id);

  useEffect(() => {
    navigate(targetPath, { replace: true });
  }, [navigate, targetPath]);

  return (
    <div className="flex items-center justify-center p-8 text-[var(--text-muted)] text-sm">
      Redirecting…
    </div>
  );
}

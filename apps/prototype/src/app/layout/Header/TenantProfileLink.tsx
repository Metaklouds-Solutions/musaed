/**
 * Shows clinic name for tenant users, linking to /tenants/me (tenant profile).
 * Hidden for admins.
 */

import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useSession } from '../../session/SessionContext';
import { tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

export function TenantProfileLink() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const isTenant = user?.role !== 'ADMIN' && tenantId;

  const { data: tenant } = useAsyncData(
    () => (tenantId ? tenantsAdapter.getTenantDetailFull(tenantId) : null),
    [tenantId],
    null,
  );

  if (!isTenant) return null;

  const clinicName = tenant?.profile?.clinicName ?? 'Clinic';

  return (
    <Link
      to="/tenants/me"
      className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors min-w-0 max-w-[200px]"
      title="View clinic profile"
    >
      <Building2 size={18} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
      <span className="truncate font-medium text-sm">{clinicName}</span>
    </Link>
  );
}

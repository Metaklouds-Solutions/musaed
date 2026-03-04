/**
 * Redirects to dashboard when the required feature flag is disabled for the tenant.
 * Admins bypass (no tenantId). Tenant users without tenantId see children (fallback).
 */

import { Navigate } from 'react-router-dom';
import { useSession } from '../session/SessionContext';
import { featureFlagsAdapter } from '../../adapters';
import type { FeatureFlagKey } from '../../adapters/local/featureFlags.adapter';

interface FeatureFlagGuardProps {
  flag: FeatureFlagKey;
  children: React.ReactNode;
}

export function FeatureFlagGuard({ flag, children }: FeatureFlagGuardProps) {
  const { user } = useSession();
  const tenantId = user?.tenantId;

  if (!tenantId || user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  const flags = featureFlagsAdapter.getFeatureFlags(tenantId);
  if (flags[flag] === false) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

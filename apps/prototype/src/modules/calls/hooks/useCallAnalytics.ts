/**
 * Call analytics hook. Fetches analytics from backend or local adapter.
 * Detects admin vs tenant route and calls the appropriate endpoint.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '../../../app/session/SessionContext';
import { analyticsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { AnalyticsQuery } from '../../../adapters/api/analytics.adapter';
import type { CallAnalyticsResponse } from '../../../adapters/api/analytics.adapter';

const DEFAULT_ANALYTICS: CallAnalyticsResponse = {
  totalCalls: 0,
  conversationRate: 0,
  avgDuration: 0,
  outcomes: {
    booked: 0,
    escalated: 0,
    failed: 0,
    info_only: 0,
    unknown: 0,
  },
  sentiment: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
};

/**
 * Fetches call analytics for the current route (tenant or admin).
 * Uses GET /tenant/calls/analytics when path contains /calls (tenant),
 * GET /admin/calls/analytics when path contains /admin.
 *
 * @param dateRange - Optional start/end dates for filtering
 */
export function useCallAnalytics(dateRange?: { start: Date; end: Date }) {
  const location = useLocation();
  const { user } = useSession();
  const isAdmin = location.pathname.includes('/admin');

  const tenantId = useMemo(() => {
    if (!user || user.role === 'ADMIN') return '';
    return user.tenantId ?? '';
  }, [user]);

  const query: AnalyticsQuery | undefined = useMemo(() => {
    if (!dateRange) return undefined;
    return {
      from: dateRange.start.toISOString(),
      to: dateRange.end.toISOString(),
    };
  }, [dateRange]);

  const fetcher = useMemo(() => {
    if (isAdmin) {
      return () => analyticsAdapter.getAdminCallAnalytics(query);
    }
    return () => analyticsAdapter.getTenantCallAnalytics(tenantId, query);
  }, [isAdmin, tenantId, query]);

  const { data, loading, error, refetch } = useAsyncData(
    fetcher,
    [isAdmin, tenantId, query],
    DEFAULT_ANALYTICS,
  );

  return { analytics: data, isLoading: loading, error, refetch };
}

/**
 * API admin adapter. Fetches admin overview from backend.
 */

import { api } from '../../lib/apiClient';
import type {
  AdminTenantRow,
  AdminSupportSnapshot,
  AdminPulseKpis,
  AdminHealth,
} from '../../shared/types';

const defaultKpis: AdminPulseKpis = {
  activeTenants: 0,
  activeAgents: 0,
  callsToday: 0,
  calls7d: 0,
  bookedPercent: 0,
  escalationPercent: 0,
  aiMinutesUsed: 0,
  estimatedCostUsd: 0,
};

const defaultHealth: AdminHealth = {
  retellSync: 'ok',
  webhooks: 'ok',
  uptimeSeconds: 0,
};

interface AdminCallsResponse {
  data?: Array<Record<string, unknown>>;
  total?: number;
}

export interface AdminDashboardSummaryResponse {
  signal?: {
    status?: 'healthy' | 'warning' | 'empty';
    reason?: string;
  };
  health?: AdminHealth;
  kpis?: AdminPulseKpis;
  recentTenants?: Array<{
    id: string;
    name: string;
    plan: string;
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
    createdAt: string;
    onboardingProgress: number;
  }>;
  supportSnapshot?: AdminSupportSnapshot;
  recentCalls?: Array<{
    id: string;
    tenantId: string;
    tenantName: string;
    agentName: string;
    outcome: 'booked' | 'escalated' | 'failed' | 'pending';
    duration: number;
    startedAt: string;
  }>;
}

export const adminAdapter = {
  async getDashboardSummary(): Promise<AdminDashboardSummaryResponse> {
    try {
      return await api.get<AdminDashboardSummaryResponse>('/admin/dashboard/summary');
    } catch {
      return {
        signal: { status: 'empty', reason: 'Dashboard summary unavailable.' },
        health: defaultHealth,
        kpis: defaultKpis,
        recentTenants: [],
        supportSnapshot: { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 },
        recentCalls: [],
      };
    }
  },

  async getTenants(): Promise<AdminTenantRow[]> {
    try {
      const resp = await api.get<{ data: unknown[] }>('/admin/tenants?page=1&limit=100');
      return ((resp.data ?? []) as Array<{ _id: string; name: string; planId?: { name?: string } }>).map(
        (t) => ({
          id: t._id,
          name: t.name,
          plan: t.planId?.name ?? '—',
        })
      );
    } catch {
      return [];
    }
  },

  async getSupportSnapshot(): Promise<AdminSupportSnapshot> {
    try {
      const resp = await api.get<{ data?: unknown[] }>('/admin/support?page=1&limit=100');
      const tickets = Array.isArray(resp.data) ? resp.data : [];
      const openTickets = tickets.filter(
        (t: { status?: string }) => t?.status === 'open' || t?.status === 'in_progress'
      );
      const criticalCount = openTickets.filter(
        (t: { priority?: string }) => t?.priority === 'critical'
      ).length;
      const oldestWaitingDays = openTickets.reduce((max: number, t: { createdAt?: string }) => {
        const created = new Date(String(t?.createdAt ?? ''));
        if (Number.isNaN(created.getTime())) return max;
        const age = Math.floor((Date.now() - created.getTime()) / 86400000);
        return Math.max(max, age);
      }, 0);
      return { openCount: openTickets.length, criticalCount, oldestWaitingDays };
    } catch {
      return { openCount: 0, criticalCount: 0, oldestWaitingDays: 0 };
    }
  },

  async getRecentTenants(limit = 5) {
    try {
      const resp = await api.get<{ data?: unknown[] }>('/admin/tenants?page=1&limit=100');
      const rows = Array.isArray(resp.data) ? resp.data : [];
      return (rows as Array<{ _id?: string; name?: string; planId?: { name?: string }; status?: string; createdAt?: string; onboardingStep?: number }>)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
        .slice(0, limit)
        .map((t) => ({
          id: String(t._id ?? ''),
          name: String(t.name ?? ''),
          plan: String(t.planId?.name ?? '—'),
          status:
            t.status === 'ACTIVE' || t.status === 'SUSPENDED' ? t.status : 'TRIAL',
          createdAt: String(t.createdAt ?? ''),
          onboardingProgress:
            typeof t.onboardingStep === 'number'
              ? Math.min(100, Math.max(0, t.onboardingStep * 25))
              : 0,
        }));
    } catch {
      return [];
    }
  },

  async getRecentCalls(limit = 5) {
    try {
      const resp = await api.get<AdminCallsResponse>(`/admin/calls?page=1&limit=${limit}`);
      const rows = Array.isArray(resp.data) ? resp.data : [];
      return (rows as Array<{
        _id?: string;
        tenantId?: { _id?: string; name?: string } | string;
        agentInstanceId?: { name?: string } | null;
        outcome?: string;
        durationMs?: number | null;
        startedAt?: string;
        createdAt?: string;
      }>).map((call) => ({
        id: String(call._id ?? ''),
        tenantId:
          typeof call.tenantId === 'object' && call.tenantId !== null
            ? String((call.tenantId as { _id?: string })._id ?? '')
            : String(call.tenantId ?? ''),
        tenantName:
          typeof call.tenantId === 'object' && call.tenantId !== null
            ? String((call.tenantId as { name?: string }).name ?? '—')
            : '—',
        agentName:
          typeof call.agentInstanceId === 'object' && call.agentInstanceId !== null
            ? String((call.agentInstanceId as { name?: string }).name ?? '—')
            : '—',
        outcome:
          call.outcome === 'booked' || call.outcome === 'escalated' || call.outcome === 'failed'
            ? call.outcome
            : 'pending',
        duration: call.durationMs != null ? Math.round(Number(call.durationMs) / 1000) : 0,
        startedAt: String(call.startedAt ?? call.createdAt ?? ''),
      }));
    } catch {
      return [];
    }
  },

  getBillingOverview() {
    return [];
  },
};

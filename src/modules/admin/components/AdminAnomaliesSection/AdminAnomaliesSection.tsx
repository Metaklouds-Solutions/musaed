/**
 * Admin usage anomalies and churn risk list.
 */

import { AlertTriangle } from 'lucide-react';
import type { UsageAnomaly, ChurnRisk } from '../../../../shared/types';

interface AdminAnomaliesSectionProps {
  usageAnomalies: UsageAnomaly[];
  churnRiskList: ChurnRisk[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function AdminAnomaliesSection({ usageAnomalies, churnRiskList }: AdminAnomaliesSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Usage anomalies & churn risk
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
          style={{ minHeight: '120px' }}
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
            Usage anomalies
          </h3>
          {usageAnomalies.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No anomalies</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {usageAnomalies.map((a) => (
                <li key={a.id} className="flex flex-wrap gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{a.tenantName}</span>
                  <span className="text-[var(--text-secondary)]">{a.description}</span>
                  <span
                    className="capitalize text-xs px-2 py-0.5 rounded"
                    style={{
                      background: a.severity === 'high' ? 'rgba(239,68,68,0.1)' : a.severity === 'medium' ? 'rgba(234,179,8,0.1)' : 'var(--bg-subtle)',
                      color: a.severity === 'high' ? 'var(--error)' : a.severity === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
                    }}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[var(--text-muted)]">{formatDate(a.detectedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
          style={{ minHeight: '120px' }}
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Churn risk list
          </h3>
          {churnRiskList.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No high-risk tenants</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {churnRiskList.map((c) => (
                <li key={c.tenantId} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{c.tenantName}</span>
                  <span className="text-[var(--text-secondary)]">{c.reason}</span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded"
                    style={{
                      background: c.score >= 70 ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                      color: c.score >= 70 ? 'var(--error)' : 'var(--warning)',
                    }}
                  >
                    Score {c.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Admin usage anomalies and churn risk list.
 * Animated rows, pulse for high severity, clickable items.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LottiePlayer, LOTTIE_ASSETS } from '../../../../shared/ui';
import type { UsageAnomaly, ChurnRisk } from '../../../../shared/types';

interface AdminAnomaliesSectionProps {
  usageAnomalies: UsageAnomaly[];
  churnRiskList: ChurnRisk[];
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Renders anomaly and churn-risk lists with severity highlighting and links. */
export function AdminAnomaliesSection({ usageAnomalies, churnRiskList }: AdminAnomaliesSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Usage anomalies & churn risk
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-[var(--radius-card)] card-glass p-5 min-h-[120px]"
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
            Usage anomalies
          </h3>
          {usageAnomalies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)]"
            >
              <LottiePlayer src={LOTTIE_ASSETS.success} width={64} height={64} loop={false} className="mb-2" />
              <p className="text-sm">No anomalies</p>
            </motion.div>
          ) : (
            <ul className="space-y-2 text-sm">
              {usageAnomalies.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 + i * 0.05 }}
                  className="flex flex-wrap gap-2 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)]">{a.tenantName}</span>
                  <span className="text-[var(--text-secondary)]">{a.description}</span>
                  <motion.span
                    className="capitalize text-xs px-2 py-0.5 rounded font-medium"
                    animate={a.severity === 'high' ? { opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 2, repeat: a.severity === 'high' ? Infinity : 0 }}
                    style={{
                      background: a.severity === 'high' ? 'rgba(239,68,68,0.15)' : a.severity === 'medium' ? 'rgba(234,179,8,0.15)' : 'var(--bg-subtle)',
                      color: a.severity === 'high' ? 'var(--error)' : a.severity === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
                    }}
                  >
                    {a.severity}
                  </motion.span>
                  <span className="text-[var(--text-muted)]">{formatDate(a.detectedAt)}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-[var(--radius-card)] card-glass p-5 min-h-[120px]"
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Churn risk list
          </h3>
          {churnRiskList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6 text-[var(--text-muted)]"
            >
              <LottiePlayer src={LOTTIE_ASSETS.success} width={64} height={64} loop={false} className="mb-2" />
              <p className="text-sm">No high-risk tenants</p>
            </motion.div>
          ) : (
            <ul className="space-y-2 text-sm">
              {churnRiskList.map((c, i) => (
                <motion.li
                  key={c.tenantId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    to="/admin/tenants"
                    className="flex flex-wrap items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors block"
                  >
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
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </section>
  );
}

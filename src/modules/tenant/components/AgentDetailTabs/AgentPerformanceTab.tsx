import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard } from '../../../../shared/ui';
import type { AgentPerformanceMetrics } from '../../../../shared/types';

interface AgentPerformanceTabProps {
  performance: AgentPerformanceMetrics;
}

/** Renders agent operational performance KPI cards. */
export function AgentPerformanceTab({ performance }: AgentPerformanceTabProps) {
  const p = performance;
  const sentimentVal = typeof p.avgSentimentScore === 'number' ? p.avgSentimentScore.toFixed(2) : p.avgSentimentScore;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card variant="glass">
        <CardHeader className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Performance metrics
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard label="Total calls" value={p.totalCalls} />
            <StatCard label="Avg handle time" value={p.avgHandleTime} />
            <StatCard label="Successful bookings" value={p.successfulBookings} />
            <StatCard label="Escalations" value={p.escalations} />
            <StatCard label="Avg sentiment score" value={sentimentVal} />
            <StatCard label="First call resolution %" value={p.firstCallResolution} />
            <StatCard label="Interruption rate %" value={p.interruptionRate} />
            <StatCard label="Silence rate %" value={p.silenceRate} />
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

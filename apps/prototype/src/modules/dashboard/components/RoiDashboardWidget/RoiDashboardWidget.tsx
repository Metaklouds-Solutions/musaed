/**
 * ROI dashboard widget. Revenue, AI cost, cost saved, ROI %.
 * Uses shadcn charts for cost breakdown.
 */

import { PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { RoiMetrics } from '../../../../shared/types';

interface RoiDashboardWidgetProps {
  roi: RoiMetrics | null | undefined;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--success)' },
  aiCost: { label: 'AI Cost', color: 'var(--warning)' },
  costSaved: { label: 'Cost Saved', color: 'var(--ds-primary)' },
} satisfies Record<string, { label: string; color: string }>;

export function RoiDashboardWidget({ roi }: RoiDashboardWidgetProps) {
  if (!roi || (roi.revenue === 0 && roi.aiCost === 0 && roi.costSaved === 0)) {
    return (
      <div className="rounded-xl card-glass p-6 min-h-[200px] flex flex-col items-center justify-center text-[var(--text-muted)]">
        <p className="text-sm">No ROI data yet</p>
        <p className="text-xs mt-1">Data will appear when calls and bookings are available</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Revenue', value: roi.revenue, fill: 'var(--success)' },
    { name: 'AI Cost', value: roi.aiCost, fill: 'var(--warning)' },
    { name: 'Cost Saved', value: roi.costSaved, fill: 'var(--ds-primary)' },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl card-glass overflow-hidden">
      <div className="p-5 border-b border-[var(--border-subtle)]">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">ROI Overview</h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Revenue vs AI cost for the selected period
        </p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-[var(--bg-elevated)]/70 p-3 border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">Revenue</p>
            <p className="text-lg font-bold text-[var(--success)] tabular-nums">{formatCurrency(roi.revenue)}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)]/70 p-3 border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">AI Cost</p>
            <p className="text-lg font-bold text-[var(--warning)] tabular-nums">{formatCurrency(roi.aiCost)}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)]/70 p-3 border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">Cost Saved</p>
            <p className="text-lg font-bold text-[var(--ds-primary)] tabular-nums">{formatCurrency(roi.costSaved)}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-elevated)]/70 p-3 border border-[var(--border-subtle)] transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
            <p className="text-xs font-medium text-[var(--text-muted)]">ROI</p>
            <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{roi.roiPercent}%</p>
          </div>
        </div>

        {pieData.length > 0 && (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

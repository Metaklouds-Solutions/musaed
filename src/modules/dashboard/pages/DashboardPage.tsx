/**
 * Dashboard page: layout only. Data from useDashboard hook.
 */

import { motion } from 'motion/react';
import { PageHeader, EmptyState, LottiePlayer, LOTTIE_ASSETS } from '../../../shared/ui';
import { HeroMetrics } from '../components/HeroMetrics';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { AgentIntelligence } from '../components/AgentIntelligence';
import { TrendChart } from '../components/TrendChart';
import { QuickActions } from '../components/QuickActions';
import { useDashboard } from '../hooks';
import { LayoutDashboard } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user, metrics, funnel, trend } = useDashboard();

  if (!user) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Sign in to view dashboard"
        description="Select a role on the login page to see metrics."
        lottieSrc={LOTTIE_ASSETS.empty}
      />
    );
  }

  const displayName = user.name ?? user.email ?? 'there';

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none -translate-y-8 translate-x-8">
          <LottiePlayer src={LOTTIE_ASSETS.chart} width={128} height={128} loop />
        </div>
        <PageHeader
          title="Dashboard"
          description="Revenue impact and conversion from your AI calls."
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <p className="text-[var(--text-secondary)] text-sm">
            {getGreeting()}, {displayName}
          </p>
          <QuickActions />
        </div>
      </motion.header>
      <div className="space-y-6">
        <HeroMetrics metrics={metrics} trend={trend} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel stages={funnel} />
          <AgentIntelligence metrics={metrics} />
        </div>
        <TrendChart points={trend} />
      </div>
    </>
  );
}

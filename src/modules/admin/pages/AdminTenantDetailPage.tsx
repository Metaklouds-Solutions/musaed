/**
 * Admin tenant detail page. Profile, settings, onboarding.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../shared/ui';
import { TenantProfileSection, TenantSettingsSection, TenantOnboardingSection } from '../components/TenantDetail';
import { useAdminTenantDetail } from '../hooks';

export function AdminTenantDetailPage() {
  const { tenant, isLoading } = useAdminTenantDetail();

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Details" description="Loading…" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {tenant === null && !isLoading ? 'Tenant not found.' : 'Loading tenant…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/admin/tenants"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tenants
        </Link>
        <PageHeader
          title={tenant.name}
          description={`Tenant ${tenant.id} · ${tenant.plan}`}
        />
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="space-y-6"
      >
        <TenantProfileSection tenant={tenant} />
        <TenantSettingsSection tenant={tenant} />
        <TenantOnboardingSection tenant={tenant} />
      </motion.div>
    </div>
  );
}

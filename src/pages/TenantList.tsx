/**
 * Admin view: list of all tenants (clinics). Supports create and open-detail.
 * Responsive grid and padding; card actions have aria-labels.
 */

import React from 'react';
import type { Tenant } from '../types';
import Plus from 'lucide-react/dist/esm/icons/plus';
import MoreVertical from 'lucide-react/dist/esm/icons/more-vertical';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { motion } from 'motion/react';

interface TenantListProps {
  tenants: Tenant[];
  onViewTenant: (id: string) => void;
  onCreateTenant: () => void;
}

/** Format tenant created date for display (locale-aware). */
function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

export const TenantList: React.FC<TenantListProps> = ({ tenants, onViewTenant, onCreateTenant }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Tenants</h2>
          <p className="text-zinc-500 text-sm sm:text-base">Manage and monitor your active organizations</p>
        </div>
        <button
          type="button"
          onClick={onCreateTenant}
          className="btn-primary flex items-center justify-center gap-2 shrink-0"
          aria-label="Create new tenant"
        >
          <Plus size={18} aria-hidden />
          Create Tenant
        </button>
      </div>

      <div className="grid gap-4">
        {tenants.length === 0 ? (
          <div className="card text-center text-zinc-500 py-12">
            <p>No tenants yet. Create one to get started.</p>
          </div>
        ) : (
          tenants.map((tenant, index) => (
            <motion.article
              key={tenant.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-primary/30 transition-colors group cursor-pointer touch-manipulation"
              onClick={() => onViewTenant(tenant.id)}
            >
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-primary shrink-0" aria-hidden>
                  {tenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">{tenant.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {tenant.status}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Shield size={12} aria-hidden /> {tenant.plan}
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock size={12} aria-hidden /> {formatCreatedAt(tenant.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium tabular-nums">{tenant.members.length} Members</p>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    {tenant.integrations.filter((i) => i.status === 'CONNECTED').length} Integrations
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="p-2 text-zinc-500 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="More options"
                  >
                    <MoreVertical size={20} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-zinc-500 hover:text-primary rounded-lg focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Open tenant"
                    onClick={() => onViewTenant(tenant.id)}
                  >
                    <ExternalLink size={20} aria-hidden />
                  </button>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
};

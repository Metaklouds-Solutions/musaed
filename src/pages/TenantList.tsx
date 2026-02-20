import React from 'react';
import { Tenant } from '../types';
import { Plus, MoreVertical, ExternalLink, Shield, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TenantListProps {
  tenants: Tenant[];
  onViewTenant: (id: string) => void;
  onCreateTenant: () => void;
}

export const TenantList: React.FC<TenantListProps> = ({ tenants, onViewTenant, onCreateTenant }) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tenants</h2>
          <p className="text-zinc-500">Manage and monitor your active organizations</p>
        </div>
        <button 
          onClick={onCreateTenant}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create Tenant
        </button>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant, index) => (
          <motion.div
            key={tenant.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card flex items-center justify-between hover:border-primary/30 transition-all group cursor-pointer"
            onClick={() => onViewTenant(tenant.id)}
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-primary">
                {tenant.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{tenant.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {tenant.status}
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Shield size={12} /> {tenant.plan}
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={12} /> {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm font-medium">{tenant.members.length} Members</p>
                <p className="text-xs text-zinc-500">{tenant.integrations.filter(i => i.status === 'CONNECTED').length} Integrations</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
                <button className="p-2 text-zinc-500 hover:text-primary transition-colors">
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

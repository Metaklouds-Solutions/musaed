import React, { useState } from 'react';
import { Tenant } from '../types';
import { 
  ArrowLeft, 
  Users, 
  Bot, 
  Shield, 
  Wrench, 
  Link as LinkIcon, 
  BarChart3,
  Check,
  X,
  Plus,
  Save,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { PopoverSelect } from '../shared/ui';

interface TenantDetailProps {
  tenant: Tenant;
  onBack: () => void;
  onUpdate: (id: string, patch: Partial<Tenant>) => void;
}

export const TenantDetail: React.FC<TenantDetailProps> = ({ tenant, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState(tenant.agentProfile.language);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'agent', label: 'Agent Profile', icon: Bot },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'tools', label: 'Tool Registry', icon: Wrench },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">{tenant.name}</h2>
          <p className="text-zinc-500 flex items-center gap-2">
            ID: <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">{tenant.id}</code>
            <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
            {tenant.plan} Plan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border-dark overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 px-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'tab-active' : 'tab-inactive'
            }`}
          >
            <tab.icon size={18} />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="card space-y-4">
              <h3 className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Onboarding Status</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{tenant.onboarding.complete ? 'Complete' : `Step ${tenant.onboarding.step}/4`}</span>
                <div className={`w-3 h-3 rounded-full ${tenant.onboarding.complete ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${(tenant.onboarding.step / 4) * 100}%` }}></div>
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Active Sessions</h3>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <BarChart3 size={12} /> +20% from last hour
              </p>
            </div>

            <div className="card space-y-4">
              <h3 className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Daily Quota</h3>
              <div className="text-2xl font-bold">45%</div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-zinc-500">90 / {tenant.quotas.callsPerDay} calls used</p>
            </div>

            <div className="col-span-2 card">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border-dark last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                        <Bot size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Session Ended</p>
                        <p className="text-xs text-zinc-500">Phone call via Twilio</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500">2 mins ago</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center justify-between group">
                  Rotate API Keys <ChevronRight size={16} className="text-zinc-600 group-hover:text-primary" />
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center justify-between group">
                  Export Usage Data <ChevronRight size={16} className="text-zinc-600 group-hover:text-primary" />
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition-colors text-sm flex items-center justify-between group text-red-400">
                  Disable Tenant <ChevronRight size={16} className="text-zinc-600 group-hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold">Team Members</h3>
              <button className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Add Member
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-zinc-500 text-sm border-b border-border-dark">
                  <th className="pb-4 font-medium">Email</th>
                  <th className="pb-4 font-medium">Role</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {tenant.members.map((member) => (
                  <tr key={member.id} className="group">
                    <td className="py-4 text-sm">{member.email}</td>
                    <td className="py-4">
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{member.role}</span>
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Active
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-zinc-500 hover:text-white transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'agent' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="card space-y-6">
              <h3 className="font-semibold">Identity & Persona</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Agent Name</label>
                  <input type="text" defaultValue={tenant.agentProfile.name} className="input-field w-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Persona Description</label>
                  <textarea defaultValue={tenant.agentProfile.persona} className="input-field w-full h-32 resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Language</label>
                  <PopoverSelect
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="card space-y-6">
              <h3 className="font-semibold">Default Behaviors</h3>
              <div className="space-y-3">
                {tenant.agentProfile.defaultBehaviors.map((behavior, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-black border border-border-dark rounded-lg">
                    <span className="text-sm">{behavior}</span>
                    <button className="text-zinc-500 hover:text-red-400"><X size={16} /></button>
                  </div>
                ))}
                <button className="w-full border border-dashed border-zinc-700 p-3 rounded-lg text-sm text-zinc-500 hover:border-primary hover:text-primary transition-all">
                  + Add Behavior
                </button>
              </div>
              <div className="pt-6 border-t border-border-dark flex justify-end">
                <button className="btn-primary flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="max-w-2xl mx-auto card space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Data Privacy & Retention</h3>
                <p className="text-sm text-zinc-500">Configure how we handle sensitive information</p>
              </div>
              <Shield className="text-primary" size={24} />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-black border border-border-dark rounded-xl">
                <div>
                  <p className="font-medium">PII Masking</p>
                  <p className="text-xs text-zinc-500">Automatically redact names, emails, and phone numbers from logs</p>
                </div>
                <button className={`w-12 h-6 rounded-full transition-all relative ${tenant.policies.piiMasking ? 'bg-primary' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tenant.policies.piiMasking ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-500">Retention Period (Days)</label>
                <input type="number" defaultValue={tenant.policies.retentionDays} className="input-field w-full" />
              </div>

              <div className="space-y-3">
                <label className="text-sm text-zinc-500">Allowed Channels</label>
                <div className="flex gap-4">
                  {['phone', 'web', 'kiosk'].map((channel) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        tenant.policies.allowedChannels.includes(channel) ? 'bg-primary border-primary' : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}>
                        {tenant.policies.allowedChannels.includes(channel) && <Check size={12} className="text-black" />}
                      </div>
                      <span className="text-sm capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold">Tool Registry</h3>
                <p className="text-sm text-zinc-500">Manage which external tools the agent can call</p>
              </div>
              <button className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Register Tool
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tenant.tools.map((tool) => (
                <div key={tool.key} className="p-4 bg-black border border-border-dark rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Wrench size={20} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-zinc-500">Key: {tool.key}</p>
                    </div>
                  </div>
                  <button className={`w-12 h-6 rounded-full transition-all relative ${tool.enabled ? 'bg-primary' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tool.enabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid grid-cols-3 gap-6">
            {tenant.integrations.map((integration) => (
              <div key={integration.type} className="card flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <LinkIcon size={24} className="text-zinc-400" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    integration.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {integration.status}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold capitalize text-lg mb-1">{integration.type}</h4>
                  <p className="text-xs text-zinc-500 mb-6">Connect your {integration.type} account to sync data and automate workflows.</p>
                  <button className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
                    integration.status === 'CONNECTED' 
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' 
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}>
                    {integration.status === 'CONNECTED' ? 'Configure' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
            <button className="border-2 border-dashed border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:border-primary/50 hover:text-primary transition-all">
              <Plus size={32} />
              <span className="font-medium">Browse Marketplace</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};



import React, { useState } from 'react';
import { storage } from '../services/storage';
import { Tenant } from '../types';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  Info, 
  Users, 
  Link as LinkIcon, 
  Shield, 
  Zap,
  Layout,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PopoverSelect } from '../shared/ui';

interface TenantWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

export const TenantWizard: React.FC<TenantWizardProps> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    plan: 'PRO',
    timezone: 'UTC',
    members: [{ email: '', role: 'MANAGER' }],
    integrations: { twilio: false, shopify: false, crm: false }
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: Info },
    { id: 2, title: 'Team', icon: Users },
    { id: 3, title: 'Integrations', icon: LinkIcon },
    { id: 4, title: 'Review', icon: Shield }
  ];

  const handleCreate = () => {
    const newTenant: Tenant = {
      id: `t_${Date.now()}`,
      name: formData.name,
      status: 'ACTIVE',
      plan: formData.plan as any,
      timezone: formData.timezone,
      locale: 'en-US',
      createdAt: new Date().toISOString(),
      onboarding: { step: 4, complete: true },
      members: formData.members.map((m, i) => ({ id: `m_${i}`, email: m.email, role: m.role as any })),
      agentProfile: {
        name: 'New Assistant',
        persona: 'Helpful assistant',
        language: 'en',
        defaultBehaviors: []
      },
      policies: {
        piiMasking: true,
        retentionDays: 30,
        allowedChannels: ['phone', 'web']
      },
      quotas: {
        callsPerDay: 100,
        concurrentSessions: 5,
        tokensPerMin: 50000
      },
      tools: [],
      integrations: Object.entries(formData.integrations)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => ({ type, status: 'CONNECTED' }))
    };

    storage.createTenant(newTenant);
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card-dark border border-border-dark rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">Create New Tenant</h2>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={`w-8 h-1 rounded-full transition-all ${step >= s.id ? 'bg-primary' : 'bg-zinc-800'}`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border-dark p-6 space-y-4">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === s.id ? 'bg-primary/10 text-primary' : step > s.id ? 'text-emerald-500' : 'text-zinc-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  step === s.id ? 'border-primary' : step > s.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800'
                }`}>
                  {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <span className="font-medium text-sm">{s.title}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Organization Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="input-field w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Plan</label>
                      <PopoverSelect
                        value={formData.plan}
                        onChange={(v) => setFormData({ ...formData, plan: v })}
                        options={[
                          { value: 'FREE', label: 'Free' },
                          { value: 'PRO', label: 'Pro' },
                          { value: 'ENTERPRISE', label: 'Enterprise' },
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Timezone</label>
                      <PopoverSelect
                        value={formData.timezone}
                        onChange={(v) => setFormData({ ...formData, timezone: v })}
                        options={[
                          { value: 'UTC', label: 'UTC' },
                          { value: 'Asia/Karachi', label: 'Asia/Karachi' },
                          { value: 'America/New_York', label: 'America/New_York' },
                        ]}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    {formData.members.map((member, i) => (
                      <div key={i} className="flex gap-4">
                        <input 
                          type="email" 
                          placeholder="Email address"
                          value={member.email}
                          onChange={(e) => {
                            const newMembers = [...formData.members];
                            newMembers[i].email = e.target.value;
                            setFormData({ ...formData, members: newMembers });
                          }}
                          className="input-field flex-1"
                        />
                        <PopoverSelect
                          value={member.role}
                          onChange={(v) => {
                            const newMembers = [...formData.members];
                            newMembers[i].role = v;
                            setFormData({ ...formData, members: newMembers });
                          }}
                          options={[
                            { value: 'ADMIN', label: 'Admin' },
                            { value: 'MANAGER', label: 'Manager' },
                            { value: 'AGENT_VIEWER', label: 'Viewer' },
                          ]}
                          triggerClassName="w-40"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => setFormData({ ...formData, members: [...formData.members, { email: '', role: 'MANAGER' }] })}
                      className="text-primary text-sm font-medium flex items-center gap-2 hover:underline"
                    >
                      <PlusCircle size={16} /> Add another member
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {Object.keys(formData.integrations).map((key) => (
                    <button
                      key={key}
                      onClick={() => setFormData({
                        ...formData,
                        integrations: { ...formData.integrations, [key]: !formData.integrations[key as keyof typeof formData.integrations] }
                      })}
                      className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                        formData.integrations[key as keyof typeof formData.integrations] 
                          ? 'border-primary bg-primary/5' 
                          : 'border-zinc-800 bg-black'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Layout size={20} className="text-zinc-400" />
                        </div>
                        <span className="font-medium capitalize">{key}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.integrations[key as keyof typeof formData.integrations] ? 'bg-primary border-primary' : 'border-zinc-700'
                      }`}>
                        {formData.integrations[key as keyof typeof formData.integrations] && <Check size={12} className="text-black" />}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-black border border-border-dark rounded-xl p-6 space-y-4">
                    <div className="flex justify-between border-b border-border-dark pb-4">
                      <span className="text-zinc-500">Organization</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dark pb-4">
                      <span className="text-zinc-500">Plan</span>
                      <span className="font-medium text-primary">{formData.plan}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dark pb-4">
                      <span className="text-zinc-500">Team Size</span>
                      <span className="font-medium">{formData.members.length} members</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Integrations</span>
                      <span className="font-medium">
                        {Object.values(formData.integrations).filter(Boolean).length} active
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-dark flex justify-between">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-6 py-2 text-zinc-400 hover:text-white disabled:opacity-0 transition-all"
          >
            Back
          </button>
          {step < 4 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !formData.name}
              className="btn-primary flex items-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleCreate}
              className="btn-primary bg-emerald-500 text-white flex items-center gap-2"
            >
              Create Tenant <Check size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Clinic Settings: agent profile, policies, tools, integrations, quotas.
 * Tabbed layout; Save is local state only until persistence is wired.
 */
import React from 'react';
import { PopoverSelect } from '../shared/ui';
import { User, Shield, Wrench, Link as LinkIcon, BarChart, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'policies' | 'tools' | 'integrations' | 'quotas'>('profile');
  const [saved, setSaved] = React.useState(false);
  const [language, setLanguage] = React.useState('en-US');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Clinic Settings</h2>
          <p className="text-zinc-500 text-sm sm:text-base">Configure this clinic&apos;s AI agent and policies.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="btn-primary flex items-center gap-2 shrink-0"
          aria-label={saved ? 'Saved' : 'Save changes'}
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-4 sm:gap-8 border-b border-border-dark overflow-x-auto">
        {[
          { id: 'profile', label: 'Agent Profile', icon: User },
          { id: 'policies', label: 'Policies', icon: Shield },
          { id: 'tools', label: 'Tools', icon: Wrench },
          { id: 'integrations', label: 'Integrations', icon: LinkIcon },
          { id: 'quotas', label: 'Quotas', icon: BarChart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 font-medium flex items-center gap-2 transition-all ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl space-y-8">
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-semibold">Agent Persona</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Greeting Message</label>
                  <textarea 
                    className="input-field w-full h-24 resize-none"
                    defaultValue="Hello, thank you for calling Downtown Clinic. I'm your AI assistant. How can I help you today?"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Agent Name / Persona</label>
                  <input className="input-field w-full" defaultValue="Alex (Professional & Empathetic)" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Language</label>
                  <PopoverSelect
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: 'en-US', label: 'English (US)' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                    ]}
                  />
                </div>
              </div>
            </div>
            <div className="card space-y-4">
              <h3 className="font-semibold">Booking Questions</h3>
              <p className="text-xs text-zinc-500">Questions the agent must ask before confirming a booking.</p>
              <div className="space-y-2">
                {['Full Name', 'Date of Birth', 'Reason for Visit', 'Insurance Provider'].map((q, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-border-dark">
                    <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center text-xs font-bold text-zinc-500">{i+1}</div>
                    <span className="text-sm flex-1">{q}</span>
                    <input type="checkbox" defaultChecked className="accent-primary" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'policies' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-semibold">Data & Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-border-dark">
                  <div>
                    <p className="text-sm font-medium">Consent Required</p>
                    <p className="text-xs text-zinc-500">Ask for recording consent at start of call</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-10 h-5 accent-primary" />
                </div>
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-border-dark">
                  <div>
                    <p className="text-sm font-medium">PII Masking</p>
                    <p className="text-xs text-zinc-500">Automatically mask sensitive data in transcripts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-10 h-5 accent-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-500">Data Retention (Days)</label>
                  <input type="number" className="input-field w-full" defaultValue="90" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tools' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-semibold">Agent Capabilities</h3>
              <div className="space-y-3">
                {[
                  { name: 'Calendar Lookup', desc: 'Check provider availability in real-time' },
                  { name: 'Create Booking', desc: 'Allow agent to insert new appointments' },
                  { name: 'CRM Upsert', desc: 'Update patient records automatically' },
                  { name: 'Insurance Verification', desc: 'Validate insurance details via API' },
                ].map((tool) => (
                  <div key={tool.name} className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-border-dark">
                    <div>
                      <p className="text-sm font-medium">{tool.name}</p>
                      <p className="text-xs text-zinc-500">{tool.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-10 h-5 accent-primary" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Twilio', status: 'Connected', icon: '📞' },
                { name: 'Google Calendar', status: 'Connected', icon: '📅' },
                { name: 'Epic EHR', status: 'Disconnected', icon: '🏥' },
                { name: 'Stripe', status: 'Disconnected', icon: '💳' },
              ].map((int) => (
                <div key={int.name} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{int.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{int.name}</p>
                      <p className={`text-[10px] font-bold uppercase ${int.status === 'Connected' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {int.status}
                      </p>
                    </div>
                  </div>
                  <button className="text-xs text-primary font-medium hover:underline">
                    {int.status === 'Connected' ? 'Configure' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'quotas' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="card space-y-6">
              <h3 className="font-semibold">Usage & Limits</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Calls per Day</span>
                    <span className="font-medium">45 / 100</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Concurrent Sessions</span>
                    <span className="font-medium">2 / 5</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border-dark">
                  <p className="text-xs text-zinc-500">Quotas are managed by the platform administrator. Contact support to request an increase.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

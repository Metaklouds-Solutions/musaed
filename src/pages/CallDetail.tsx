import React from 'react';
import { CallSession, Patient } from '../types';
import { 
  ArrowLeft, 
  Phone, 
  User, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  MessageSquare, 
  Activity,
  Copy,
  FileText,
  CheckCircle2,
  Play
} from 'lucide-react';
import { motion } from 'motion/react';

interface CallDetailProps {
  session: CallSession;
  patient?: Patient;
  onBack: () => void;
}

export const CallDetail: React.FC<CallDetailProps> = ({ session, patient, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'transcript' | 'audio' | 'timeline' | 'data'>('transcript');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold">Call Detail</h2>
          <p className="text-zinc-500">Session ID: {session.id}</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Phone size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Caller</p>
            <p className="font-semibold">{session.callerPhone}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <User size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Patient</p>
            <p className="font-semibold">{patient?.name || 'New Patient'}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Outcome</p>
            <p className="font-semibold">{session.outcome}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Duration</p>
            <p className="font-semibold">{Math.floor(session.duration / 60)}m {session.duration % 60}s</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          <div className="flex gap-8 border-b border-border-dark">
            {['transcript', 'audio', 'timeline', 'data'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-2 font-medium capitalize transition-all ${activeTab === tab ? 'tab-active' : 'tab-inactive'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'transcript' && (
              <div className="space-y-6">
                {session.transcript?.map((line, i) => (
                  <div key={i} className={`flex gap-4 ${line.speaker === 'AGENT' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      line.speaker === 'AGENT' ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {line.speaker === 'AGENT' ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      line.speaker === 'AGENT' ? 'bg-zinc-900 border border-border-dark rounded-tl-none' : 'bg-primary text-black rounded-tr-none'
                    }`}>
                      <p className="text-sm">{line.text}</p>
                      <span className={`text-[10px] mt-1 block ${line.speaker === 'AGENT' ? 'text-zinc-500' : 'text-black/60'}`}>
                        {line.ts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="card flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                  <Play size={32} className="text-black fill-black ml-1" />
                </div>
                <div className="w-full max-w-md space-y-2">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/3"></div>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>1:02</span>
                    <span>3:05</span>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm italic">Mock audio player - markers would appear here</p>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4 pl-4 border-l-2 border-border-dark ml-4">
                <div className="relative">
                  <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-bg-dark"></div>
                  <p className="text-sm font-medium">Session Started</p>
                  <p className="text-xs text-zinc-500">10:10:01</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-bg-dark"></div>
                  <p className="text-sm font-medium">Intent Detected: {session.intent}</p>
                  <p className="text-xs text-zinc-500">10:10:15</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-bg-dark"></div>
                  <p className="text-sm font-medium">Tool Call: create_booking</p>
                  <p className="text-xs text-zinc-500">10:12:45</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-bg-dark"></div>
                  <p className="text-sm font-medium">Session Ended</p>
                  <p className="text-xs text-zinc-500">10:13:05</p>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="card space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User size={16} className="text-primary" /> Patient Capture
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(session.entities || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm py-2 border-b border-border-dark last:border-0">
                        <span className="text-zinc-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" /> Field Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-2 bg-emerald-500/10 text-emerald-500 rounded">
                      <span>Full Name</span>
                      <span>Verified</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 bg-emerald-500/10 text-emerald-500 rounded">
                      <span>Booking Type</span>
                      <span>Verified</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 bg-amber-500/10 text-amber-500 rounded">
                      <span>Insurance ID</span>
                      <span>Missing</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot size={18} className="text-primary" /> AI Insights
            </h3>
            <div className="space-y-3">
              {session.summary?.map((point, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300">{point}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border-dark space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Confidence</span>
                <span className="text-emerald-400 font-bold">High (98%)</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-semibold">Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-all">
                <Copy size={16} /> Copy Summary
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-all">
                <FileText size={16} /> Send to CRM Notes
              </button>
              <button className="w-full flex items-center gap-3 p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-all">
                <CheckCircle2 size={16} /> Mark Reviewed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Bot = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
  </svg>
);

import React from 'react';
import { Patient, CallSession, Booking } from '../types';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Clock, 
  ChevronRight,
  MessageSquare,
  FileText,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

interface PatientDetailProps {
  patient: Patient;
  sessions: CallSession[];
  bookings: Booking[];
  onBack: () => void;
  onViewCall: (id: string) => void;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patient, sessions, bookings, onBack, onViewCall }) => {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'interactions' | 'bookings' | 'notes'>('profile');

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold border border-primary/20">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{patient.name}</h2>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded flex items-center gap-1">
                  <Shield size={10} /> CONSENT GIVEN
                </span>
              </div>
              <p className="text-zinc-500 text-sm">Patient since {new Date(patient.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors">View Last Call</button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create Booking
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-border-dark">
        {['profile', 'interactions', 'bookings', 'notes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-4 px-2 font-medium capitalize transition-all ${activeTab === tab ? 'tab-active' : 'tab-inactive'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="card grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Demographics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Date of Birth</span>
                      <span>{patient.dob || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Phone</span>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Email</span>
                      <span>{patient.email}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Insurance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Provider</span>
                      <span>{patient.insurance || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <span className="text-emerald-500 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-primary/5 border-primary/20 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield size={18} className="text-primary" /> AI Patient Snapshot
                </h3>
                <p className="text-sm text-zinc-300 italic">
                  "Patient is a frequent visitor with high reliability. Usually prefers morning appointments with Dr. Smith. No known allergies recorded in recent calls."
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">Missing Address</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">Insurance Verified</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interactions' && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/30 border-b border-border-dark">
                  <tr className="text-left text-[10px] text-zinc-500 uppercase font-bold">
                    <th className="p-4">Date</th>
                    <th className="p-4">Intent</th>
                    <th className="p-4">Outcome</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {sessions?.map((session) => (
                    <tr key={session.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onViewCall(session.id)}>
                      <td className="p-4 text-sm">{new Date(session.startedAt).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">{session.intent}</td>
                      <td className="p-4 text-sm">{session.outcome}</td>
                      <td className="p-4 text-right">
                        <ChevronRight size={16} className="text-zinc-700 group-hover:text-primary ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings?.map((booking) => (
                <div key={booking.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-primary">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">{booking.type}</p>
                      <p className="text-xs text-zinc-500">{booking.provider} • {booking.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(booking.scheduledAt!).toLocaleDateString()}</p>
                    <p className="text-xs text-emerald-500">{booking.status}</p>
                  </div>
                </div>
              ))}
              {(bookings?.length || 0) === 0 && <p className="text-center py-12 text-zinc-500">No bookings found.</p>}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="card space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary uppercase">AI Summary</span>
                  <span className="text-[10px] text-zinc-500">Feb 20, 2026</span>
                </div>
                <p className="text-sm text-zinc-300">Patient called to reschedule follow-up. Expressed concern about recovery time. Agent successfully moved appointment to Tuesday.</p>
              </div>
              <div className="card space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Staff Note</span>
                  <span className="text-[10px] text-zinc-500">Jan 15, 2026</span>
                </div>
                <p className="text-sm text-zinc-300">Patient prefers text reminders over phone calls.</p>
              </div>
              <button className="w-full border border-dashed border-zinc-800 p-4 rounded-xl text-sm text-zinc-500 hover:border-primary hover:text-primary transition-all">
                + Add Staff Note
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="font-semibold">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Total Calls</span>
                <span className="font-bold">{sessions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Total Bookings</span>
                <span className="font-bold">{bookings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Reliability</span>
                <span className="text-emerald-500 font-bold">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

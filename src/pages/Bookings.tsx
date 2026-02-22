/**
 * Bookings list: appointments created by the agent or manually.
 * Responsive table; optional patient lookup for display.
 */
import React from 'react';
import type { Booking, Patient } from '../types';
import { Search, Filter, MapPin, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface BookingsProps {
  bookings: Booking[];
  patients: Patient[];
}

export const Bookings: React.FC<BookingsProps> = ({ bookings, patients }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Bookings</h2>
          <p className="text-zinc-500 text-sm sm:text-base">Operational list of bookings created by the agent.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} aria-hidden />
            <input
              type="search"
              placeholder="Search patients, providers…"
              aria-label="Search bookings"
              className="input-field pl-10 text-sm w-full sm:w-64"
            />
          </div>
          <button type="button" className="px-4 py-2 bg-zinc-800 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary">
            <Filter size={16} aria-hidden /> Filters
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full min-w-[700px]" role="grid">
          <thead>
            <tr className="text-left text-zinc-500 text-[10px] uppercase tracking-wider border-b border-border-dark bg-black/30">
              <th className="p-4 font-semibold">Created</th>
              <th className="p-4 font-semibold">Patient</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Provider / Location</th>
              <th className="p-4 font-semibold">Scheduled For</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {bookings?.map((booking, i) => {
              const patient = patients?.find(p => p.id === booking.patientId);
              return (
                <motion.tr 
                  key={booking.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4 text-xs text-zinc-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] text-primary font-bold">
                        {patient?.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{patient?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                      {booking.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium">{booking.provider}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <MapPin size={10} /> {booking.location}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium">{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString() : 'Pending'}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Clock size={10} /> {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold ${
                      booking.status === 'CONFIRMED' ? 'text-emerald-400' : 
                      booking.status === 'PENDING' ? 'text-amber-400' : 
                      'text-red-400'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-zinc-500 hover:text-primary transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

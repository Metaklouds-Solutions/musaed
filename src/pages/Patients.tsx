import React from 'react';
import { Patient } from '../types';
import { 
  Search, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronRight,
  Filter,
  Tag
} from 'lucide-react';
import { motion } from 'motion/react';

interface PatientsProps {
  patients: Patient[];
  onViewPatient: (id: string) => void;
}

export const Patients: React.FC<PatientsProps> = ({ patients, onViewPatient }) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Patient Directory</h2>
          <p className="text-zinc-500">Searchable lightweight CRM for your clinic.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search name, phone, email..." 
              className="input-field pl-10 text-sm w-64"
            />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Patient
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-zinc-500 text-[10px] uppercase tracking-wider border-b border-border-dark bg-black/30">
              <th className="p-4 font-semibold">Patient Name</th>
              <th className="p-4 font-semibold">Contact</th>
              <th className="p-4 font-semibold">Last Interaction</th>
              <th className="p-4 font-semibold">Tags</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {patients?.map((patient, i) => (
              <motion.tr 
                key={patient.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => onViewPatient(patient.id)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-primary font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{patient.name}</p>
                      <p className="text-[10px] text-zinc-500">ID: {patient.id}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Phone size={12} /> {patient.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Mail size={12} /> {patient.email}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-xs text-zinc-400">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-1">
                    {patient.tags?.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-zinc-500 group-hover:text-primary transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

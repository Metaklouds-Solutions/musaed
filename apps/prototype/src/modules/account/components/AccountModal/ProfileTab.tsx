/**
 * Account modal profile tab. User info, emails, connected accounts, GDPR actions.
 */

import { useState, useRef } from 'react';
import { User, Download, Camera } from 'lucide-react';
import { Button } from '../../../../shared/ui';
import { toast } from 'sonner';
import type { User as SessionUser } from '../../../../shared/types';

interface ProfileTabProps {
  user: SessionUser;
  onExportMyData: () => void;
  onUpdateProfile?: (updates: { name?: string; avatarUrl?: string }) => Promise<void>;
}

export function ProfileTab({ user, onExportMyData, onUpdateProfile }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!onUpdateProfile) return;
    try {
      setIsSaving(true);
      await onUpdateProfile({ name: editName });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateProfile) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile photo must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        setIsSaving(true);
        await onUpdateProfile({ avatarUrl: base64 });
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 space-y-6">
      <h3 className="font-semibold text-[var(--text-primary)]">Profile details</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div 
          className="relative w-14 h-14 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white shrink-0 group cursor-pointer overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <User size={28} />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded px-2 py-1 w-full max-w-[200px]"
              autoFocus
            />
          ) : (
            <p className="font-medium text-[var(--text-primary)] truncate">{user.name}</p>
          )}
          <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Button variant="ghost" className="text-sm py-2 min-h-0" onClick={() => { setIsEditing(false); setEditName(user.name); }}>
              Cancel
            </Button>
            <Button variant="primary" className="text-sm py-2 min-h-0" onClick={handleSave} disabled={isSaving}>
              Save
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="ml-auto text-sm py-2 min-h-0 shrink-0 cursor-pointer" onClick={() => setIsEditing(true)}>
            Update profile
          </Button>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
          Email addresses
        </label>
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="text-sm text-[var(--text-primary)] truncate">{user.email}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] shrink-0">
            Primary
          </span>
          <button type="button" className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer" aria-label="Options">
            <span className="text-lg leading-none">⋯</span>
          </button>
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
        <p className="text-xs text-[var(--text-muted)]">GDPR: export or delete your data.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="cursor-pointer flex items-center gap-2"
            onClick={onExportMyData}
          >
            <Download size={16} />
            Export my data
          </Button>
        </div>
      </div>
    </div>
  );
}

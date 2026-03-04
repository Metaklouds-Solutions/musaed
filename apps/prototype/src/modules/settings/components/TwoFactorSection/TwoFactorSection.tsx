/**
 * 2FA section in Settings. Enable/disable for Admin and Tenant Owner.
 */

import { useState } from 'react';
import { Shield, ShieldCheck } from 'lucide-react';
import { twoFactorAdapter } from '@/adapters';
import { Button } from '@/shared/ui';
import { TwoFactorSetup } from '@/modules/auth/components/TwoFactorSetup';

interface TwoFactorSectionProps {
  userId: string;
  userEmail: string;
}

export function TwoFactorSection({ userId, userEmail }: TwoFactorSectionProps) {
  const [showSetup, setShowSetup] = useState(false);
  const [enabled, setEnabled] = useState(() => twoFactorAdapter.isEnabled(userId));

  const handleSetupComplete = () => {
    setShowSetup(false);
    setEnabled(true);
  };

  const handleDisable = () => {
    twoFactorAdapter.disable(userId);
    setEnabled(false);
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        userId={userId}
        userEmail={userEmail}
        onComplete={handleSetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h3 className="font-semibold text-[var(--text-primary)]">Two-Factor Authentication</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Add an extra layer of security by requiring a code from your authenticator app when signing in.
      </p>
      {enabled ? (
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[var(--success)]" aria-hidden />
          <span className="text-sm text-[var(--text-secondary)]">2FA is enabled</span>
          <Button variant="danger" onClick={handleDisable}>
            Disable
          </Button>
        </div>
      ) : (
        <Button onClick={() => setShowSetup(true)}>Enable 2FA</Button>
      )}
    </div>
  );
}

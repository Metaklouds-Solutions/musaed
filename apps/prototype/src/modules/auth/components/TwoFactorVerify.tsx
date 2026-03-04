/**
 * 2FA verification step for login. Prompts for TOTP code.
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { twoFactorAdapter } from '@/adapters';
import { Button } from '@/shared/ui';
import type { User } from '@/shared/types';

interface TwoFactorVerifyProps {
  user: User;
  onVerify: () => void;
  onBack: () => void;
}

export function TwoFactorVerify({ user, onVerify, onBack }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter a 6-digit code');
      return;
    }
    setLoading(true);
    const isValid = await twoFactorAdapter.verifyCode(user.id, code);
    setLoading(false);
    if (isValid) {
      onVerify();
    } else {
      setError('Invalid code. Try again.');
    }
  }, [code, user.id, onVerify]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-card)] card-glass p-6 max-w-sm mx-auto"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Two-Factor Authentication</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Enter the 6-digit code from your authenticator app for {user.email}
      </p>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        className="w-full px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30 mb-4"
        aria-label="Verification code"
      />
      {error && <p className="text-sm text-[var(--error)] mb-4">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={code.length !== 6} loading={loading}>
          Verify
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </motion.div>
  );
}

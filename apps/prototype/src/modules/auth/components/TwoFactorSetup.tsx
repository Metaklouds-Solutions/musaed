/**
 * 2FA setup flow: QR code, secret, verify with TOTP code.
 */

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Shield, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { twoFactorAdapter } from '@/adapters';
import { Button } from '@/shared/ui';

interface TwoFactorSetupProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ userId, userEmail, onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [secret, setSecret] = useState<string>(() => twoFactorAdapter.generateSecret());
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    const uri = twoFactorAdapter.generateURI('AgentOs', userEmail, secret);
    const dataUrl = await QRCode.toDataURL(uri, { width: 200, margin: 2 });
    setQrDataUrl(dataUrl);
  }, [secret, userEmail]);

  if (qrDataUrl === null && step === 'qr') {
    generateQR();
  }

  const handleCopySecret = useCallback(() => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [secret]);

  const handleVerify = useCallback(async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('Enter a 6-digit code');
      return;
    }
    const { verify } = await import('otplib');
    const result = await verify({ secret, token: code });
    const isValid = result.valid;
    if (isValid) {
      twoFactorAdapter.enable(userId, secret);
      onComplete();
    } else {
      setError('Invalid code. Try again.');
    }
  }, [code, userId, secret, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-card)] card-glass p-6 max-w-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enable Two-Factor Authentication</h2>
      </div>

      {step === 'qr' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          {qrDataUrl && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img src={qrDataUrl} alt="QR code for authenticator" width={200} height={200} />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Or enter this secret manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-sm font-mono break-all">
                {secret}
              </code>
              <button
                type="button"
                onClick={handleCopySecret}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Copy secret"
              >
                {copied ? <Check size={18} className="text-[var(--success)]" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setStep('verify')}>Continue</Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Enter the 6-digit code from your authenticator app to verify setup.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30"
            aria-label="Verification code"
          />
          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={handleVerify} disabled={code.length !== 6}>
              Verify & Enable
            </Button>
            <Button variant="secondary" onClick={() => setStep('qr')}>
              Back
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

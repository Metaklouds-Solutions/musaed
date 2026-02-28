/**
 * 2FA / MFA adapter. TOTP setup and verification. Stores per-user in localStorage.
 */

import { generateSecret, generate, verify, generateURI } from 'otplib';

const TWO_FACTOR_KEY = 'clinic-crm-2fa';

interface User2FAState {
  enabled: boolean;
  secret: string;
}

function load(): Record<string, User2FAState> {
  try {
    const stored = localStorage.getItem(TWO_FACTOR_KEY);
    return stored ? (JSON.parse(stored) as Record<string, User2FAState>) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, User2FAState>): void {
  try {
    localStorage.setItem(TWO_FACTOR_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const twoFactorAdapter = {
  /** Check if 2FA is enabled for a user. */
  isEnabled(userId: string): boolean {
    const data = load();
    return data[userId]?.enabled === true;
  },

  /** Get secret for a user (for setup verification). Returns null if not set. */
  getSecret(userId: string): string | null {
    const data = load();
    return data[userId]?.secret ?? null;
  },

  /** Enable 2FA for a user with a new secret. Call after setup verification. */
  enable(userId: string, secret: string): void {
    const data = load();
    data[userId] = { enabled: true, secret };
    save(data);
  },

  /** Disable 2FA for a user. */
  disable(userId: string): void {
    const data = load();
    delete data[userId];
    save(data);
  },

  /** Generate a new secret for setup. */
  generateSecret(): string {
    return generateSecret();
  },

  /** Generate TOTP token for a secret (for testing). */
  async generateToken(secret: string): Promise<string> {
    return generate({ secret });
  },

  /** Verify TOTP code against user's secret. */
  async verifyCode(userId: string, token: string): Promise<boolean> {
    const secret = this.getSecret(userId);
    if (!secret) return false;
    const result = await verify({ secret, token });
    return result.valid;
  },

  /** Generate otpauth URI for QR code (issuer, label, secret). */
  generateURI(issuer: string, label: string, secret: string): string {
    return generateURI({ issuer, label, secret });
  },
};

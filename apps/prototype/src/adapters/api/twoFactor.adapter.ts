/**
 * Authenticator MFA is not enforced by the API in this deployment; UI gates setup in API mode.
 */

export const twoFactorAdapter = {
  isEnabled(): boolean {
    return false;
  },

  getSecret(): string | null {
    return null;
  },

  enable(): void {},

  disable(): void {},

  generateSecret(): string {
    return '';
  },

  async generateToken(_secret: string): Promise<string> {
    return '';
  },

  async verifyCode(): Promise<boolean> {
    return false;
  },

  generateURI(issuer: string, label: string, secret: string): string {
    return `otpauth://totp/${encodeURIComponent(label)}?issuer=${encodeURIComponent(issuer)}&secret=${secret}`;
  },
};

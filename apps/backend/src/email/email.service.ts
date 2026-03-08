import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SENDGRID_API_KEY not set — emails will be logged but not sent');
    }
    this.fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL', 'noreply@musaed.app');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  async sendInviteEmail(to: string, name: string, token: string): Promise<void> {
    const setupUrl = `${this.frontendUrl}/auth/setup-password?token=${token}`;
    const msg = {
      to,
      from: this.fromEmail,
      subject: 'You have been invited to MUSAED',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MUSAED, ${name}!</h2>
          <p>You have been invited to join the platform. Click the button below to set up your password and activate your account.</p>
          <p style="margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Set Up Your Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.</p>
          <p style="color: #999; font-size: 12px;">— The MUSAED Team</p>
        </div>
      `,
    };

    await this.send(msg);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    const msg = {
      to,
      from: this.fromEmail,
      subject: 'Reset your MUSAED password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${name}, we received a request to reset your password. Click the button below to choose a new password.</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 48 hours. If you did not request a password reset, you can safely ignore this email.</p>
          <p style="color: #999; font-size: 12px;">— The MUSAED Team</p>
        </div>
      `,
    };

    await this.send(msg);
  }

  private async send(msg: sgMail.MailDataRequired): Promise<void> {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.log(`[DEV] Email to ${msg.to}: ${msg.subject}`);
      this.logger.log(`[DEV] Would send: ${JSON.stringify(msg, null, 2)}`);
      return;
    }

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${msg.to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${msg.to}`, err instanceof Error ? err.stack : err);
    }
  }
}

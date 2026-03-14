import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { EmailJobType, EmailJobPayloadMap } from './email.queue.service';
import { EmailQueueService } from './email.queue.service';
import { MetricsService } from '../metrics/metrics.service';

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_RATE_LIMIT_PER_RECIPIENT = 10;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly frontendUrl: string;
  private primaryTransporter: nodemailer.Transporter | null = null;
  private fallbackTransporter: nodemailer.Transporter | null = null;
  private readonly rateLimitPerRecipient: number;
  private readonly recipientCounts = new Map<string, RateLimitEntry>();

  constructor(
    private config: ConfigService,
    @Optional() private emailQueue: EmailQueueService | null,
    @Optional() private metrics: MetricsService | null,
  ) {
    this.fromEmail = this.config.get<string>('SMTP_FROM', 'noreply@musaed.app');
    this.frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const limit = this.config.get<string>('EMAIL_RATE_LIMIT_PER_RECIPIENT');
    this.rateLimitPerRecipient = limit
      ? parseInt(limit, 10)
      : DEFAULT_RATE_LIMIT_PER_RECIPIENT;

    const primaryUser =
      this.config.get<string>('SMTP_PRIMARY_USER') ??
      this.config.get<string>('SMTP_USER');
    const primaryPass =
      this.config.get<string>('SMTP_PRIMARY_PASS') ??
      this.config.get<string>('SMTP_PASS');
    if (primaryUser && primaryPass) {
      this.primaryTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: primaryUser, pass: primaryPass },
      });
      this.logger.log(
        `Email primary transport ready (Gmail SMTP via ${primaryUser})`,
      );
    } else {
      this.logger.warn(
        'SMTP not configured: invite and password-reset emails will NOT be sent. ' +
          'Set SMTP_USER and SMTP_PASS in .env (use a Gmail App Password, not your normal password).',
      );
    }

    const fallbackUser = this.config.get<string>('SMTP_FALLBACK_USER');
    const fallbackPass = this.config.get<string>('SMTP_FALLBACK_PASS');
    if (
      fallbackUser &&
      fallbackPass &&
      (fallbackUser !== primaryUser || fallbackPass !== primaryPass)
    ) {
      this.fallbackTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: fallbackUser, pass: fallbackPass },
      });
      this.logger.log(
        `Email fallback transport ready (Gmail SMTP via ${fallbackUser})`,
      );
      this.verifyFallbackTransport();
    }
  }

  /** Validates fallback transport on startup; logs warning if verification fails. */
  private verifyFallbackTransport(): void {
    if (!this.fallbackTransporter) return;
    this.fallbackTransporter
      .verify()
      .then(() => this.logger.log('Email fallback transport verified'))
      .catch((err) =>
        this.logger.warn(
          `Email fallback transport verification failed — will retry on send: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
  }

  /**
   * Sends email via queue when enabled, otherwise sends directly.
   * Callers use this method.
   */
  async sendInviteEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<string> {
    const setupUrl = `${this.frontendUrl}/auth/setup-password?token=${token}`;
    const msg = this.buildInviteMessage(to, name, token);
    await this.enqueueOrSend('invite', { to, name, token }, msg);
    return setupUrl;
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const msg = this.buildPasswordResetMessage(to, name, token);
    await this.enqueueOrSend('password_reset', { to, name, token }, msg);
  }

  async sendAppointmentReminder(
    to: string,
    customerName: string,
    appointmentDate: Date,
    timeSlot: string,
  ): Promise<void> {
    const dateStr = appointmentDate.toLocaleDateString();
    const msg = this.buildAppointmentReminderMessage(
      to,
      customerName,
      dateStr,
      timeSlot,
    );
    await this.enqueueOrSend(
      'appointment_reminder',
      { to, customerName, appointmentDate: dateStr, timeSlot },
      msg,
    );
  }

  /**
   * Checks per-recipient rate limit. Throws if exceeded.
   */
  private checkRateLimit(to: string): void {
    if (this.rateLimitPerRecipient <= 0) return;
    const now = Date.now();
    const entry = this.recipientCounts.get(to);
    if (!entry) {
      this.recipientCounts.set(to, { count: 1, windowStart: now });
      return;
    }
    if (now - entry.windowStart >= ONE_HOUR_MS) {
      this.recipientCounts.set(to, { count: 1, windowStart: now });
      return;
    }
    entry.count += 1;
    if (entry.count > this.rateLimitPerRecipient) {
      throw new Error(
        `Email rate limit exceeded for ${to} (max ${this.rateLimitPerRecipient} per hour)`,
      );
    }
  }

  /**
   * Internal send method. Tries primary transport, then fallback on failure.
   * Used by worker and when queue is disabled.
   *
   * @param msg - Email message to send
   * @param type - Optional email type for metrics (used when queue disabled)
   */
  async sendInternal(msg: EmailMessage, type?: EmailJobType): Promise<void> {
    this.checkRateLimit(msg.to);

    if (!this.primaryTransporter && !this.fallbackTransporter) {
      this.logger.log({
        event: 'email_sent',
        to: msg.to,
        subject: msg.subject,
        mode: 'dev_log',
      });
      const linkMatch = msg.html.match(/href="([^"]+)"/);
      if (linkMatch) {
        this.logger.warn(
          `[DEV] Copy this invite link manually: ${linkMatch[1]}`,
        );
      }
      if (type && this.metrics) this.metrics.recordEmailSent(type);
      return;
    }

    let lastError: Error | null = null;
    const transporters = [
      this.primaryTransporter,
      this.fallbackTransporter,
    ].filter(Boolean);

    for (const transporter of transporters) {
      if (!transporter) continue;
      try {
        await transporter.sendMail(msg);
        this.logger.log({
          event: 'email_sent',
          to: msg.to,
          subject: msg.subject,
        });
        if (type && this.metrics) this.metrics.recordEmailSent(type);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn({
          event: 'email_retry',
          to: msg.to,
          error: lastError.message,
          message: 'Falling back to next transport',
        });
      }
    }

    this.logger.error({
      event: 'email_failed',
      to: msg.to,
      subject: msg.subject,
      error: lastError?.message ?? 'Unknown error',
    });
    if (type && this.metrics) this.metrics.recordEmailFailed(type);
    throw lastError ?? new Error('Failed to send email');
  }

  /**
   * Builds message from job payload and sends. Used by worker.
   */
  async sendInternalFromJob(
    type: EmailJobType,
    payload: EmailJobPayloadMap[EmailJobType],
  ): Promise<void> {
    const msg = this.buildMessageFromJob(type, payload);
    await this.sendInternal(msg);
  }

  private buildMessageFromJob(
    type: EmailJobType,
    payload: EmailJobPayloadMap[EmailJobType],
  ): EmailMessage {
    if (type === 'invite' && this.isInvitePayload(payload)) {
      return this.buildInviteMessage(payload.to, payload.name, payload.token);
    }
    if (type === 'password_reset' && this.isPasswordResetPayload(payload)) {
      return this.buildPasswordResetMessage(
        payload.to,
        payload.name,
        payload.token,
      );
    }
    if (
      type === 'appointment_reminder' &&
      this.isAppointmentReminderPayload(payload)
    ) {
      return this.buildAppointmentReminderMessage(
        payload.to,
        payload.customerName,
        payload.appointmentDate,
        payload.timeSlot,
      );
    }
    throw new Error(`Unknown or invalid email type: ${type}`);
  }

  private isInvitePayload(p: unknown): p is EmailJobPayloadMap['invite'] {
    if (typeof p !== 'object' || p === null) return false;
    const q = p as Record<string, unknown>;
    return (
      typeof q.to === 'string' &&
      typeof q.name === 'string' &&
      typeof q.token === 'string'
    );
  }

  private isPasswordResetPayload(
    p: unknown,
  ): p is EmailJobPayloadMap['password_reset'] {
    if (typeof p !== 'object' || p === null) return false;
    const q = p as Record<string, unknown>;
    return (
      typeof q.to === 'string' &&
      typeof q.name === 'string' &&
      typeof q.token === 'string'
    );
  }

  private isAppointmentReminderPayload(
    p: unknown,
  ): p is EmailJobPayloadMap['appointment_reminder'] {
    if (typeof p !== 'object' || p === null) return false;
    const q = p as Record<string, unknown>;
    return (
      typeof q.to === 'string' &&
      typeof q.customerName === 'string' &&
      typeof q.appointmentDate === 'string' &&
      typeof q.timeSlot === 'string'
    );
  }

  /** Escapes HTML special chars to prevent injection in email templates. */
  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildInviteMessage(
    to: string,
    name: string,
    token: string,
  ): EmailMessage {
    const setupUrl = `${this.frontendUrl}/auth/setup-password?token=${token}`;
    const safeName = this.escapeHtml(name);
    return {
      to,
      from: this.fromEmail,
      subject: "You're invited to the Clinic CRM platform",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to MUSAED, ${safeName}!</h2>
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
  }

  private buildPasswordResetMessage(
    to: string,
    name: string,
    token: string,
  ): EmailMessage {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    const safeName = this.escapeHtml(name);
    return {
      to,
      from: this.fromEmail,
      subject: 'Reset your MUSAED password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hi ${safeName}, we received a request to reset your password. Click the button below to choose a new password.</p>
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
  }

  private buildAppointmentReminderMessage(
    to: string,
    customerName: string,
    dateStr: string,
    timeSlot: string,
  ): EmailMessage {
    const safeName = this.escapeHtml(customerName);
    const safeDate = this.escapeHtml(dateStr);
    const safeSlot = this.escapeHtml(timeSlot);
    return {
      to,
      from: this.fromEmail,
      subject: `Appointment reminder: ${dateStr} at ${timeSlot}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>Hi ${safeName}, this is a reminder that you have an appointment on ${safeDate} at ${safeSlot}.</p>
          <p style="color: #666; font-size: 14px;">Please arrive a few minutes early. If you need to reschedule, contact the clinic.</p>
          <p style="color: #999; font-size: 12px;">— The MUSAED Team</p>
        </div>
      `,
    };
  }

  private async enqueueOrSend<T extends EmailJobType>(
    type: T,
    payload: EmailJobPayloadMap[T],
    msg: EmailMessage,
  ): Promise<void> {
    if (this.emailQueue?.isEnabled?.()) {
      const jobId = await this.emailQueue.enqueueEmail(type, payload);
      if (jobId) {
        this.logger.debug({
          event: 'email_queued',
          type,
          to: payload.to,
          jobId,
        });
        return;
      }
    }
    await this.sendInternal(msg, type);
  }
}

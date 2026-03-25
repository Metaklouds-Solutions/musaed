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
  private readonly isProduction: boolean;
  private primaryTransporter: nodemailer.Transporter | null = null;
  private fallbackTransporter: nodemailer.Transporter | null = null;
  private readonly rateLimitPerRecipient: number;
  private readonly recipientCounts = new Map<string, RateLimitEntry>();

  constructor(
    private config: ConfigService,
    @Optional() private emailQueue: EmailQueueService | null,
    @Optional() private metrics: MetricsService | null,
  ) {
    this.fromEmail =
      this.getConfiguredValue('SMTP_FROM', 'GMAIL_SMTP_FROM') ??
      'noreply@musaed.app';
    this.frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    this.isProduction = this.config.get<string>('NODE_ENV', 'development') === 'production';
    const limit = this.config.get<string>('EMAIL_RATE_LIMIT_PER_RECIPIENT');
    this.rateLimitPerRecipient = limit
      ? parseInt(limit, 10)
      : DEFAULT_RATE_LIMIT_PER_RECIPIENT;

    const primaryUser = this.getConfiguredValue(
      'SMTP_PRIMARY_USER',
      'SMTP_USER',
      'GMAIL_SMTP_PRIMARY_USER',
      'GMAIL_SMTP_USER',
    );
    const primaryPass = this.getConfiguredValue(
      'SMTP_PRIMARY_PASS',
      'SMTP_PASS',
      'GMAIL_SMTP_PRIMARY_PASS',
      'GMAIL_SMTP_PASS',
    );
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

    const fallbackUser = this.getConfiguredValue(
      'SMTP_FALLBACK_USER',
      'GMAIL_SMTP_FALLBACK_USER',
    );
    const fallbackPass = this.getConfiguredValue(
      'SMTP_FALLBACK_PASS',
      'GMAIL_SMTP_FALLBACK_PASS',
    );
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

  private getConfiguredValue(...keys: string[]): string | null {
    for (const key of keys) {
      const value = this.config.get<string>(key);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
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

  /**
   * Sends a one-off SMTP connectivity test (admin diagnostics; not queued).
   *
   * @param to - Verified recipient address
   * @param subject - Email subject line
   */
  async sendSmtpTestEmail(to: string, subject: string): Promise<void> {
    const msg: EmailMessage = {
      to,
      from: this.fromEmail,
      subject,
      html: '<p>SMTP test message from Clinic CRM backend.</p>',
    };
    await this.sendInternal(msg);
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
   * Simple plain-text email sender for direct transactional messages.
   */
  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const smtpUser =
      this.getConfiguredValue(
        'SMTP_USER',
        'SMTP_PRIMARY_USER',
        'GMAIL_SMTP_USER',
        'GMAIL_SMTP_PRIMARY_USER',
      ) ??
      process.env.SMTP_USER ??
      process.env.GMAIL_SMTP_USER;
    const smtpPass =
      this.getConfiguredValue(
        'SMTP_PASS',
        'SMTP_PRIMARY_PASS',
        'GMAIL_SMTP_PASS',
        'GMAIL_SMTP_PRIMARY_PASS',
      ) ??
      process.env.SMTP_PASS ??
      process.env.GMAIL_SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER/SMTP_PASS are missing');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        text,
      });
      this.logger.log(`Simple email sent to ${to} with subject "${subject}"`);
    } catch (error) {
      this.logger.error(
        `Failed to send simple email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Sends booking cancellation email to the patient.
   */
  async sendBookingCancellation(
    to: string,
    customerName: string,
    appointmentDate: string,
    timeSlot: string,
    clinicName: string,
  ): Promise<void> {
    const msg = this.buildBookingCancellationMessage(
      to,
      customerName,
      appointmentDate,
      timeSlot,
      clinicName,
    );
    await this.enqueueOrSend(
      'booking_cancellation',
      { to, customerName, appointmentDate, timeSlot, clinicName },
      msg,
    );
  }

  /**
   * Sends booking reschedule email to the patient.
   */
  async sendBookingReschedule(
    to: string,
    customerName: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    clinicName: string,
  ): Promise<void> {
    const msg = this.buildBookingRescheduleMessage(
      to,
      customerName,
      oldDate,
      oldTime,
      newDate,
      newTime,
      clinicName,
    );
    await this.enqueueOrSend(
      'booking_reschedule',
      { to, customerName, oldDate, oldTime, newDate, newTime, clinicName },
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
      const misconfiguredSmtpError = new Error(
        'SMTP is not configured. Set SMTP_USER and SMTP_PASS (or SMTP_PRIMARY_USER and SMTP_PRIMARY_PASS) before sending email in production.',
      );
      if (this.isProduction) {
        this.logger.error({
          event: 'email_failed',
          to: msg.to,
          subject: msg.subject,
          error: misconfiguredSmtpError.message,
        });
        if (type && this.metrics) this.metrics.recordEmailFailed(type);
        throw misconfiguredSmtpError;
      }
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
    if (
      type === 'booking_cancellation' &&
      this.isBookingCancellationPayload(payload)
    ) {
      return this.buildBookingCancellationMessage(
        payload.to,
        payload.customerName,
        payload.appointmentDate,
        payload.timeSlot,
        payload.clinicName,
      );
    }
    if (
      type === 'booking_reschedule' &&
      this.isBookingReschedulePayload(payload)
    ) {
      return this.buildBookingRescheduleMessage(
        payload.to,
        payload.customerName,
        payload.oldDate,
        payload.oldTime,
        payload.newDate,
        payload.newTime,
        payload.clinicName,
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

  private isBookingCancellationPayload(
    p: unknown,
  ): p is EmailJobPayloadMap['booking_cancellation'] {
    if (typeof p !== 'object' || p === null) return false;
    const q = p as Record<string, unknown>;
    return (
      typeof q.to === 'string' &&
      typeof q.customerName === 'string' &&
      typeof q.appointmentDate === 'string' &&
      typeof q.timeSlot === 'string' &&
      typeof q.clinicName === 'string'
    );
  }

  private isBookingReschedulePayload(
    p: unknown,
  ): p is EmailJobPayloadMap['booking_reschedule'] {
    if (typeof p !== 'object' || p === null) return false;
    const q = p as Record<string, unknown>;
    return (
      typeof q.to === 'string' &&
      typeof q.customerName === 'string' &&
      typeof q.oldDate === 'string' &&
      typeof q.oldTime === 'string' &&
      typeof q.newDate === 'string' &&
      typeof q.newTime === 'string' &&
      typeof q.clinicName === 'string'
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
    const safeSetupUrl = this.escapeHtml(setupUrl);
    return {
      to,
      from: this.fromEmail,
      subject: "Complete your MUSAED account setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your workspace is ready, ${safeName}</h2>
          <p>You were invited to MUSAED. To finish onboarding, set your password and activate your account.</p>
          <p style="margin: 30px 0;">
            <a href="${setupUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Set Password and Sign In
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">This secure link expires in 48 hours and can only be used once.</p>
          <p style="color: #666; font-size: 14px; margin-top: 0;">If the button does not work, copy and paste this URL into your browser:</p>
          <p style="color: #444; font-size: 13px; word-break: break-all; background: #f8fafc; padding: 10px; border-radius: 8px;">${safeSetupUrl}</p>
          <p style="color: #666; font-size: 14px;">If you were not expecting this invite, you can ignore this email.</p>
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

  private buildBookingCancellationMessage(
    to: string,
    customerName: string,
    appointmentDate: string,
    timeSlot: string,
    clinicName: string,
  ): EmailMessage {
    const safeName = this.escapeHtml(customerName);
    const safeDate = this.escapeHtml(appointmentDate);
    const safeSlot = this.escapeHtml(timeSlot);
    const safeClinic = this.escapeHtml(clinicName);
    return {
      to,
      from: this.fromEmail,
      subject: `Appointment cancelled: ${appointmentDate} at ${timeSlot}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Cancelled</h2>
          <p>Hi ${safeName}, your appointment on ${safeDate} at ${safeSlot} has been cancelled.</p>
          <p style="color: #666; font-size: 14px;">Please contact ${safeClinic} to rebook at a time that works for you.</p>
          <p style="color: #999; font-size: 12px;">— The MUSAED Team</p>
        </div>
      `,
    };
  }

  private buildBookingRescheduleMessage(
    to: string,
    customerName: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    clinicName: string,
  ): EmailMessage {
    const safeName = this.escapeHtml(customerName);
    const safeOldDate = this.escapeHtml(oldDate);
    const safeOldTime = this.escapeHtml(oldTime);
    const safeNewDate = this.escapeHtml(newDate);
    const safeNewTime = this.escapeHtml(newTime);
    const safeClinic = this.escapeHtml(clinicName);
    return {
      to,
      from: this.fromEmail,
      subject: `Appointment rescheduled: ${newDate} at ${newTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Rescheduled</h2>
          <p>Hi ${safeName}, your appointment has been moved from ${safeOldDate} at ${safeOldTime} to ${safeNewDate} at ${safeNewTime}.</p>
          <p style="color: #666; font-size: 14px;">If this does not work for you, please contact ${safeClinic} to arrange another time.</p>
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

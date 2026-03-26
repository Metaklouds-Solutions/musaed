import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { EmailService } from './email.service';

/**
 * Admin-only SMTP test endpoint. Disabled unless ENABLE_TEST_EMAIL=true.
 * Use for staging diagnostics only; keep false in production unless needed.
 */
@Controller('test-email')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TestEmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    const enabled = this.config.get<string>('ENABLE_TEST_EMAIL', 'false');
    if (enabled !== 'true' && enabled !== '1') {
      throw new ForbiddenException(
        'Test email endpoint is disabled (set ENABLE_TEST_EMAIL=true to enable)',
      );
    }

    const defaultTo = this.config
      .get<string>('TEST_EMAIL_RECIPIENT', '')
      .trim();
    const to = (dto.to ?? defaultTo).trim();
    if (!to) {
      throw new ForbiddenException(
        'Provide `to` in the request body or set TEST_EMAIL_RECIPIENT in environment',
      );
    }

    const subject = dto.subject?.trim() || 'Email system test (Clinic CRM)';

    try {
      await this.emailService.sendSmtpTestEmail(to, subject);
      return {
        success: true,
        message: 'Test email sent',
        to,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        to,
      };
    }
  }
}

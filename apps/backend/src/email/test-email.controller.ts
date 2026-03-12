import { Controller, Post } from '@nestjs/common';
import { sendEmail } from './sendEmail';

@Controller('test-email')
export class TestEmailController {
  @Post()
  async sendTestEmail() {
    try {
      await sendEmail(
        'agent@metakloud.com',
        'Email System Test',
        'Nodemailer test email from Clinic CRM',
      );

      return {
        success: true,
        message: 'Test email sent',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
      };
    }
  }
}


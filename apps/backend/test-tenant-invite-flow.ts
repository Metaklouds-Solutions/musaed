import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from './src/app.module';
import { TenantsService } from './src/tenants/tenants.service';
import { EmailService } from './src/email/email.service';
import { User, UserDocument } from './src/users/schemas/user.schema';
import { Tenant, TenantDocument } from './src/tenants/schemas/tenant.schema';

dotenv.config({ path: '.env' });
process.env.QUEUE_EMAIL_ENABLED = 'false';

async function run(): Promise<void> {
  const inviteEmail = 'agent@metaklouds.com';
  const testEmail = 'agent@metakloud.com';
  const timestamp = Date.now();
  const slug = `metaklouds-${timestamp}`;

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const tenantsService = app.get(TenantsService);
  const emailService = app.get(EmailService);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const tenantModel = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));

  console.log('--- Email/Invite Test Flow Started ---');
  console.log(`SMTP_FROM=${process.env.SMTP_FROM ?? '(not set)'}`);
  console.log(`SMTP_USER=${process.env.SMTP_USER ?? process.env.SMTP_PRIMARY_USER ?? '(not set)'}`);
  console.log(`QUEUE_EMAIL_ENABLED=${process.env.QUEUE_EMAIL_ENABLED}`);

  try {
    console.log(`\n[1/2] Triggering tenant invite process for ${inviteEmail} ...`);
    let tenantResult = await tenantsService.create({
      name: `Metaklouds Clinic ${timestamp}`,
      slug,
      ownerEmail: inviteEmail,
      ownerName: 'Metaklouds Agent',
      timezone: 'Asia/Karachi',
    });

    console.log('[SUCCESS] Invite flow completed.');
    console.log(`Tenant ID: ${tenantResult.tenant._id.toString()}`);
    console.log(`Owner ID: ${tenantResult.owner._id.toString()}`);
    if (tenantResult.inviteSetupUrl) {
      console.log(`Setup Link: ${tenantResult.inviteSetupUrl}`);
    } else {
      console.log('Setup Link: (not returned)');
    }
  } catch (error) {
    console.error('[WARN] Tenant create flow failed, trying resend-invite fallback.');
    console.error('Create flow error:', error);

    try {
      const owner = await userModel.findOne({ email: inviteEmail, deletedAt: null }).lean();

      if (!owner?._id) {
        throw new Error(`No owner user found for ${inviteEmail}`);
      }

      const tenant = await tenantModel.findOne({
        ownerId: owner._id,
        deletedAt: null,
      }).lean();

      if (!tenant?._id) {
        throw new Error(`No tenant found for owner ${inviteEmail}`);
      }

      const resend = await tenantsService.resendInvite(tenant._id.toString());
      console.log('[SUCCESS] Fallback resend-invite completed.');
      console.log(`Tenant ID: ${tenant._id.toString()}`);
      console.log(`Setup Link: ${resend.inviteSetupUrl ?? '(not returned)'}`);
    } catch (fallbackError) {
      console.error('[FAILED] Tenant invite process failed.');
      console.error('Exact Nodemailer/SMTP error (if mail-related):', fallbackError);
    }
  }

  try {
    console.log(`\n[2/2] Sending simple SMTP test email to ${testEmail} ...`);
    await emailService.sendInternal({
      to: testEmail,
      from: process.env.SMTP_FROM ?? 'noreply@clinic-crm.local',
      subject: 'Email System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email System Test</h2>
          <p>This is a test email confirming that the Clinic CRM email system is working.</p>
        </div>
      `,
    });
    console.log('[SUCCESS] Test email sent successfully.');
  } catch (error) {
    console.error('[FAILED] Test email failed.');
    console.error('Exact Nodemailer/SMTP error:', error);
  } finally {
    await app.close();
    console.log('\n--- Email/Invite Test Flow Finished ---');
  }
}

run().catch((error) => {
  console.error('Fatal error while running test flow:', error);
  process.exitCode = 1;
});

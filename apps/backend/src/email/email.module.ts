import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProcessor } from './workers/email.worker';
import { QueueModule } from '../queue/queue.module';
import { TestEmailController } from './test-email.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [QueueModule.forRoot(), AuthModule],
  controllers: [TestEmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}

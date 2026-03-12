import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProcessor } from './workers/email.worker';
import { QueueModule } from '../queue/queue.module';
import { TestEmailController } from './test-email.controller';

@Global()
@Module({
  imports: [QueueModule.forRoot()],
  controllers: [TestEmailController],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}

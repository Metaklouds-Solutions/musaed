import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailProcessor } from './workers/email.worker';
import { QueueModule } from '../queue/queue.module';

@Global()
@Module({
  imports: [QueueModule.forRoot()],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}

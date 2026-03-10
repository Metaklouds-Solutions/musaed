import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RetellClient } from './retell.client';

/**
 * Retell integration module that exposes the Retell client.
 */
@Module({
  imports: [ConfigModule],
  providers: [RetellClient],
  exports: [RetellClient],
})
export class RetellModule {}

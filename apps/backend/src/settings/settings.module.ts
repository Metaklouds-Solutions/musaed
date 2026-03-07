import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}

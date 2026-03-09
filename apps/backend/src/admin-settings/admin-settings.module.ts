import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminConfig, AdminConfigSchema } from './schemas/admin-config.schema';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AdminConfig.name, schema: AdminConfigSchema }]),
  ],
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
})
export class AdminSettingsModule {}

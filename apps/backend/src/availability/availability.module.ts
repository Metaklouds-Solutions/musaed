import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderAvailability, ProviderAvailabilitySchema } from './schemas/provider-availability.schema';
import { TenantStaff, TenantStaffSchema } from '../tenants/schemas/tenant-staff.schema';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderAvailability.name, schema: ProviderAvailabilitySchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}

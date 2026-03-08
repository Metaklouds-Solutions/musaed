import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { TenantStaff, TenantStaffSchema } from '../tenants/schemas/tenant-staff.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}

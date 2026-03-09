import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantStaff, TenantStaffSchema } from './schemas/tenant-staff.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    AuditModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [MongooseModule, TenantsService],
})
export class TenantsModule {}

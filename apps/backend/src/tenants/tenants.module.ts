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
import { AgentInstance, AgentInstanceSchema } from '../agent-instances/schemas/agent-instance.schema';
import { AgentDeploymentsModule } from '../agent-deployments/agent-deployments.module';
import { AgentTemplate, AgentTemplateSchema } from '../agent-templates/schemas/agent-template.schema';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    AuditModule,
    AgentDeploymentsModule,
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: TenantStaff.name, schema: TenantStaffSchema },
      { name: User.name, schema: UserSchema },
      { name: AgentInstance.name, schema: AgentInstanceSchema },
      { name: AgentTemplate.name, schema: AgentTemplateSchema },
    ]),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [MongooseModule, TenantsService],
})
export class TenantsModule {}

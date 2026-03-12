import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { requireTenantId } from '../common/helpers/require-tenant-id';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('tenant/staff')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.STAFF_READ)
  findAll(@Request() req: AuthenticatedRequest) {
    // Admin can list cross-tenant staff (tenantId may be null). Tenant users are scoped by TenantGuard.
    const tenantId = req.tenantId ?? null;
    return this.staffService.findAllForTenant(tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.STAFF_WRITE)
  invite(@Request() req: AuthenticatedRequest, @Body() dto: InviteStaffDto) {
    const tenantId = requireTenantId(req);
    return this.staffService.invite(tenantId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.STAFF_WRITE)
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateStaffDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.staffService.update(id, tenantId, dto, req.user._id.toString());
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.STAFF_WRITE)
  remove(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.staffService.remove(id, tenantId, req.user._id.toString());
  }
}

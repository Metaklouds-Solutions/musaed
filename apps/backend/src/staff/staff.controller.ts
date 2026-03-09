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
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller('tenant/staff')
@UseGuards(JwtAuthGuard, TenantGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.staffService.findAllForTenant(req.tenantId);
  }

  @Post()
  invite(@Request() req: any, @Body() dto: InviteStaffDto) {
    return this.staffService.invite(req.tenantId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, req.tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}

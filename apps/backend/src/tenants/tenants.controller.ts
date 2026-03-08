import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tenantsService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/resend-invite')
  resendInvite(@Param('id') id: string) {
    return this.tenantsService.resendInvite(id);
  }
}

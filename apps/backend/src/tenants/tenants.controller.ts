import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
  }> {
    const pagination = parsePagination({ page, limit });
    return this.tenantsService.findAll({
      status,
      search,
      ...pagination,
    });
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto, req.user._id.toString());
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Post(':id/suspend')
  suspend(@Request() req: AuthenticatedRequest, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.suspend(id, req.user._id.toString());
  }

  @Post(':id/disable')
  disable(@Request() req: AuthenticatedRequest, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.disable(id, req.user._id.toString());
  }

  @Post(':id/enable')
  enable(@Request() req: AuthenticatedRequest, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.enable(id, req.user._id.toString());
  }

  @Post(':id/resend-invite')
  resendInvite(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.resendInvite(id);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.remove(id, req.user._id.toString());
  }
}

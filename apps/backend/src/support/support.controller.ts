import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';
import { requireTenantId } from '../common/helpers/require-tenant-id';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('tenant/support/tickets')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SupportTenantController {
  constructor(private supportService: SupportService) {}

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = requireTenantId(req);
    const pagination = parsePagination({ page, limit });
    return this.supportService.findAllForTenant(tenantId, {
      status,
      ...pagination,
    });
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    const tenantId = requireTenantId(req);
    return this.supportService.create(tenantId, req.user._id.toString(), dto);
  }

  @Get(':id')
  findById(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const tenantId = requireTenantId(req);
    return this.supportService.findById(id, tenantId);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.supportService.updateStatus(id, dto.status, tenantId);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddMessageDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.supportService.addMessage(
      id,
      req.user._id.toString(),
      dto,
      tenantId,
    );
  }
}

@Controller('admin/support')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SupportAdminController {
  constructor(private supportService: SupportService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    return this.supportService.findAllAdmin({
      status,
      ...pagination,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.supportService.findById(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateStatus(id, dto.status);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user._id.toString(), dto);
  }
}

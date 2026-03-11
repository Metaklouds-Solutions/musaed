import {
  Controller,
  Get,
  Post,
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
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';

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
    const pagination = parsePagination({ page, limit });
    return this.supportService.findAllForTenant(req.tenantId!, {
      status,
      ...pagination,
    });
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    return this.supportService.create(req.tenantId!, req.user._id.toString(), dto);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.supportService.findById(id, req.tenantId!);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user._id.toString(), dto, req.tenantId!);
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
  findById(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(id, req.user._id.toString(), dto);
  }
}

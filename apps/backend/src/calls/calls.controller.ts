import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CallsService } from './calls.service';
import { ListCallsDto } from './dto/list-calls.dto';
import { AnalyticsCallsDto } from './dto/analytics-calls.dto';
import { CreateWebCallDto } from './dto/create-web-call.dto';
import { parsePagination } from '../common/helpers/parse-pagination';
import { requireTenantId } from '../common/helpers/require-tenant-id';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('tenant/calls')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantCallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest, @Query() query: ListCallsDto) {
    const tenantId = requireTenantId(req);
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });
    return this.callsService.listForTenant(tenantId, {
      ...pagination,
      from: query.from,
      to: query.to,
      outcome: query.outcome,
      agentId: query.agentId,
    });
  }

  @Get('analytics')
  analytics(
    @Request() req: AuthenticatedRequest,
    @Query() query: AnalyticsCallsDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.callsService.getAnalyticsForTenant(tenantId, {
      from: query.from,
      to: query.to,
      agentId: query.agentId,
    });
  }

  @Get('data-quality')
  dataQuality(@Request() req: AuthenticatedRequest) {
    const tenantId = requireTenantId(req);
    return this.callsService.getTenantDataQuality(tenantId);
  }

  @Post('web-call')
  createWebCall(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateWebCallDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.callsService.createWebCall(dto.agentInstanceId, tenantId);
  }

  @Get('by-retell/:callId')
  detailByRetell(
    @Request() req: AuthenticatedRequest,
    @Param('callId') callId: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.callsService.getByRetellIdForTenant(callId, tenantId);
  }

  @Get(':id')
  detail(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('enrich') enrich?: string,
  ) {
    const tenantId = requireTenantId(req);
    return this.callsService.getByIdForTenant(id, tenantId, enrich === 'true');
  }
}

@Controller('admin/calls')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(@Query() query: ListCallsDto) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });
    return this.callsService.listForAdmin({
      tenantId: query.tenantId,
      ...pagination,
      from: query.from,
      to: query.to,
      outcome: query.outcome,
      agentId: query.agentId,
    });
  }

  @Get('analytics')
  analytics(@Query() query: AnalyticsCallsDto) {
    return this.callsService.getAnalyticsForAdmin({
      from: query.from,
      to: query.to,
      agentId: query.agentId,
      tenantId: query.tenantId,
    });
  }

  @Post('sync')
  syncFromRetell() {
    return this.callsService.syncAllFromRetell();
  }

  @Get('by-retell/:callId')
  detailByRetell(@Param('callId') callId: string) {
    return this.callsService.getByRetellIdForAdmin(callId);
  }

  @Get(':id')
  detail(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('enrich') enrich?: string,
  ) {
    return this.callsService.getByIdForAdmin(id, enrich === 'true');
  }
}

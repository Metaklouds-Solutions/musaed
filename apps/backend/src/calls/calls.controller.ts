import {
  BadRequestException,
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

@Controller('tenant/calls')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantCallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest, @Query() query: ListCallsDto) {
    const tenantId = this.requireTenantId(req);
    return this.callsService.listForTenant(tenantId, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      from: query.from,
      to: query.to,
      outcome: query.outcome,
      agentId: query.agentId,
    });
  }

  @Post('web-call')
  createWebCall(
    @Request() req: AuthenticatedRequest,
    @Body() body: { agentInstanceId: string },
  ) {
    const tenantId = this.requireTenantId(req);
    return this.callsService.createWebCall(body.agentInstanceId, tenantId);
  }

  @Get('by-retell/:callId')
  detailByRetell(@Request() req: AuthenticatedRequest, @Param('callId') callId: string) {
    const tenantId = this.requireTenantId(req);
    return this.callsService.getByRetellIdForTenant(callId, tenantId);
  }

  @Get(':id')
  detail(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('enrich') enrich?: string,
  ) {
    const tenantId = this.requireTenantId(req);
    return this.callsService.getByIdForTenant(id, tenantId, enrich === 'true');
  }

  private requireTenantId(req: AuthenticatedRequest): string {
    if (!req.tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    return req.tenantId;
  }
}

@Controller('admin/calls')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get()
  list(@Query() query: ListCallsDto) {
    return this.callsService.listForAdmin({
      tenantId: query.tenantId,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      from: query.from,
      to: query.to,
      outcome: query.outcome,
      agentId: query.agentId,
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
  detail(@Param('id') id: string, @Query('enrich') enrich?: string) {
    return this.callsService.getByIdForAdmin(id, enrich === 'true');
  }
}

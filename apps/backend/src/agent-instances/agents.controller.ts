import {
  Controller,
  Get,
  Patch,
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
import { Throttle } from '@nestjs/throttler';
import { AgentsService } from './agents.service';
import { UpdatePromptsDto } from './dto/update-prompts.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateAgentInstanceDto } from './dto/create-agent-instance.dto';
import { StartConversationDto } from './dto/start-conversation.dto';

@Controller('tenant/agents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AgentsTenantController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.agentsService.findAllForTenant(req.tenantId!);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.findById(id, req.tenantId!);
  }

  @Patch(':id/prompts')
  updatePrompts(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePromptsDto,
  ) {
    return this.agentsService.updatePrompts(id, req.tenantId!, dto);
  }

  @Post(':id/sync')
  syncAgent(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.syncAgent(id, req.tenantId!);
  }

  @Get(':id/deployments')
  getDeployments(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.getDeploymentsForTenant(id, req.tenantId!);
  }

  @Post(':id/conversations/start')
  startConversation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: StartConversationDto,
  ) {
    return this.agentsService.startConversationForTenant(id, req.tenantId!, dto);
  }
}

@Controller('admin/agents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AgentsAdminController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.findAllAdmin({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('tenants/:tenantId')
  findAllByTenant(@Param('tenantId') tenantId: string) {
    return this.agentsService.findAllForAdminTenant(tenantId);
  }

  @Post('tenants/:tenantId')
  createForTenant(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAgentInstanceDto,
  ) {
    return this.agentsService.createForTenant(tenantId, dto);
  }

  @Post(':id/deploy')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  deploy(@Param('id') id: string) {
    return this.agentsService.deployForAdmin(id);
  }

  @Get(':id/deployments')
  getDeployments(@Param('id') id: string) {
    return this.agentsService.getDeploymentsForAdmin(id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.agentsService.findById(id);
  }
}

@Controller('v1/admin/agents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AgentsAdminV1Controller {
  constructor(private agentsService: AgentsService) {}

  @Post(':id/deploy')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  deploy(@Param('id') id: string) {
    return this.agentsService.deployForAdmin(id);
  }
}

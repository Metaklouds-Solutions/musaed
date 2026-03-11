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
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { Throttle } from '@nestjs/throttler';
import { AgentsService } from './agents.service';
import { AgentHealthService } from './agent-health.service';
import { UpdatePromptsDto } from './dto/update-prompts.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateAgentInstanceDto } from './dto/create-agent-instance.dto';
import { StartConversationDto } from './dto/start-conversation.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { parsePagination } from '../common/helpers/parse-pagination';

@Controller('tenant/agents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AgentsTenantController {
  constructor(
    private agentsService: AgentsService,
    private agentHealthService: AgentHealthService,
  ) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.agentsService.findAllForTenant(req.tenantId!);
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.findById(id, req.tenantId!);
  }

  @Patch(':id/prompts')
  updatePrompts(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdatePromptsDto,
  ) {
    return this.agentsService.updatePrompts(id, req.tenantId!, dto);
  }

  @Post(':id/sync')
  syncAgent(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.syncAgent(id, req.tenantId!);
  }

  @Get(':id/deployments')
  getDeployments(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.agentsService.getDeploymentsForTenant(id, req.tenantId!);
  }

  @Post(':id/conversations/start')
  startConversation(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: StartConversationDto,
  ) {
    return this.agentsService.startConversationForTenant(id, req.tenantId!, dto);
  }
  @Get('chats/:chatId')
  getChat(
    @Param('chatId') chatId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.agentsService.getChatForTenant(chatId, req.tenantId!);
  }

  @Post('chats/:chatId/messages')
  sendChatMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendChatMessageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.agentsService.sendChatMessageForTenant(chatId, dto.content, req.tenantId!);
  }

  @Get(':id/analytics')
  getAnalytics(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.agentHealthService.getAnalytics(
      id,
      req.tenantId!,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get(':id/health')
  getHealth(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.agentHealthService.getHealth(id, req.tenantId!);
  }
}

@Controller('admin/agents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AgentsAdminController {
  constructor(
    private agentsService: AgentsService,
    private agentHealthService: AgentHealthService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    return this.agentsService.findAllAdmin({
      status,
      ...pagination,
    });
  }

  @Get('tenants/:tenantId')
  findAllByTenant(@Param('tenantId', ParseObjectIdPipe) tenantId: string) {
    return this.agentsService.findAllForAdminTenant(tenantId);
  }

  @Post('tenants/:tenantId')
  createForTenant(
    @Param('tenantId', ParseObjectIdPipe) tenantId: string,
    @Body() dto: CreateAgentInstanceDto,
  ) {
    return this.agentsService.createForTenant(tenantId, dto);
  }

  @Post()
  createUnassigned(@Body() dto: CreateAgentInstanceDto) {
    return this.agentsService.createUnassigned(dto);
  }

  @Post(':id/assign')
  assign(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: AssignAgentDto) {
    return this.agentsService.assignToTenant(id, dto.tenantId);
  }

  @Post(':id/unassign')
  unassign(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.unassignFromTenant(id);
  }

  @Post(':id/deploy')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  deploy(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.deployForAdmin(id);
  }

  @Get(':id/deployments')
  getDeployments(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.getDeploymentsForAdmin(id);
  }

  @Get(':id/retell-config')
  getRetellConfig(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.syncAgentAdmin(id);
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Get(':id/analytics')
  getAnalytics(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.agentHealthService.getAnalytics(
      id,
      undefined,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get(':id/health')
  getHealth(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentHealthService.getHealth(id);
  }
}

@Controller('v1/admin/agents')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AgentsAdminV1Controller {
  constructor(private agentsService: AgentsService) {}

  @Post(':id/deploy')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  deploy(@Param('id', ParseObjectIdPipe) id: string) {
    return this.agentsService.deployForAdmin(id);
  }
}

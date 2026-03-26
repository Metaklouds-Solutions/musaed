import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import {
  AgentIdDto,
  BookMeetingDto,
  CancelBookingDto,
  CreateTicketDto,
  InvokeSkillDto,
  LeadDto,
  PastTicketsDto,
  RescheduleBookingDto,
  ResendInviteDto,
} from './dto/tool-requests.dto';

type ToolHeaders = Record<string, string | undefined>;

@Controller('agents')
export class AgentToolsController {
  private readonly logger = new Logger(AgentToolsController.name);

  constructor(private readonly toolsService: AgentToolsService) {}

  @Post('tools/get_agent_config')
  getAgentConfig(@Body() body: AgentIdDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('get_agent_config', body, () =>
      this.toolsService.getAgentConfig(body.agent_id),
    );
  }

  @Post('tools/list_providers')
  listProviders(@Body() body: AgentIdDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('list_providers', body, () =>
      this.toolsService.listProviders(body.agent_id),
    );
  }

  @Post('tools/get_past_tickets')
  getPastTickets(
    @Body() body: PastTicketsDto,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.executeTool('get_past_tickets', body, () =>
      this.toolsService.getPastTickets(
        body.agent_id,
        body.user_email,
        body.minutes_threshold,
      ),
    );
  }

  @Post('tools/create_a_ticket')
  createTicket(@Body() body: CreateTicketDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('create_a_ticket', body, () =>
      this.toolsService.createTicket(
        body.agent_id,
        body.user_email,
        body.subject,
        body.problem,
      ),
    );
  }

  @Get(':agentId/skills')
  getAvailableSkills(
    @Param('agentId') agentId: string,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.executeTool('get_available_skills', { agent_id: agentId }, () =>
      this.toolsService.getAvailableSkills(agentId),
    );
  }

  @Post('skills/:skillName/invoke')
  invokeSkill(
    @Param('skillName') skillName: string,
    @Body() body: InvokeSkillDto,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.executeTool(`invoke_skill:${skillName}`, body, () =>
      this.toolsService.invokeSkill(body.agent_id, skillName, body.params ?? {}),
    );
  }

  @Post('tools/create_zoho_lead')
  createLead(@Body() body: LeadDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('create_zoho_lead', body, () =>
      this.toolsService.createLead(body.agent_id, { ...body }),
    );
  }

  @Post('tools/get_available_slots')
  getAvailableSlots(
    @Body() body: Record<string, unknown>,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    const payload = this.unwrapArgsBody(body);
    const agentId = this.readString(payload.agent_id);
    const preferredDate = this.readString(payload.preferred_date);
    const preferredTimeWindow = this.readString(payload.preferred_time_window);
    const timezone = this.readString(payload.timezone);
    return this.executeTool('get_available_slots', payload, () =>
      this.toolsService.getAvailableSlots(
        agentId,
        preferredDate,
        preferredTimeWindow,
        timezone,
      ),
    );
  }

  @Post('tools/book_meeting')
  bookMeeting(@Body() body: BookMeetingDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('book_meeting', body, () =>
      this.toolsService.bookMeeting(
        body.agent_id,
        body.email,
        body.confirmed_slot,
        body.timezone,
        { ...body },
      ),
    );
  }

  @Post('tools/resend_invite')
  resendInvite(@Body() body: ResendInviteDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.executeTool('resend_invite', body, () =>
      this.toolsService.resendInvite(
        body.agent_id,
        body.email,
        body.meeting_id,
      ),
    );
  }

  @Post('tools/cancel_booking')
  cancelBooking(
    @Body() body: CancelBookingDto,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.executeTool('cancel_booking', body, () =>
      this.toolsService.cancelBooking(body.agent_id, body.email, body.meeting_id),
    );
  }

  @Post('tools/reschedule_booking')
  rescheduleBooking(
    @Body() body: RescheduleBookingDto,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.executeTool('reschedule_booking', body, () =>
      this.toolsService.rescheduleBooking(
        body.agent_id,
        body.email,
        body.new_slot,
        body.timezone,
        body.meeting_id,
      ),
    );
  }

  private async executeTool<T>(
    toolName: string,
    payload: unknown,
    handler: () => Promise<T> | T,
  ): Promise<T> {
    this.logger.log(
      `Tool request received: ${toolName} payload=${JSON.stringify(payload)}`,
    );
    try {
      const result = await handler();
      this.logger.log(
        `Tool request completed: ${toolName} response=${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Tool request failed: ${toolName} payload=${JSON.stringify(payload)} error=${message}`,
        stack,
      );
      throw error;
    }
  }

  private validateApiKey(headers: ToolHeaders) {
    const key = headers['x-api-key'];
    this.toolsService.validateToolApiKey(key);
  }

  private unwrapArgsBody(
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    const args = body.args;
    if (args && typeof args === 'object' && !Array.isArray(args)) {
      return args as Record<string, unknown>;
    }
    return body;
  }

  private readString(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return '';
    }
    return value.trim();
  }
}

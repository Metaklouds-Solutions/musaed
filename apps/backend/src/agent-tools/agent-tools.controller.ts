import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { AgentToolsService } from './agent-tools.service';
import {
  AgentIdDto,
  AvailableSlotsDto,
  BookMeetingDto,
  CreateTicketDto,
  InvokeSkillDto,
  LeadDto,
  PastTicketsDto,
  ResendInviteDto,
} from './dto/tool-requests.dto';

type ToolHeaders = Record<string, string | undefined>;

@Controller('agents')
export class AgentToolsController {
  constructor(private readonly toolsService: AgentToolsService) {}

  @Post('tools/get_agent_config')
  getAgentConfig(@Body() body: AgentIdDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.getAgentConfig(body.agent_id);
  }

  @Post('tools/get_past_tickets')
  getPastTickets(@Body() body: PastTicketsDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.getPastTickets(
      body.agent_id,
      body.user_email,
      body.minutes_threshold,
    );
  }

  @Post('tools/create_a_ticket')
  createTicket(@Body() body: CreateTicketDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.createTicket(
      body.agent_id,
      body.user_email,
      body.subject,
      body.problem,
    );
  }

  @Get(':agentId/skills')
  getAvailableSkills(@Param('agentId') agentId: string, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.getAvailableSkills(agentId);
  }

  @Post('skills/:skillName/invoke')
  invokeSkill(
    @Param('skillName') skillName: string,
    @Body() body: InvokeSkillDto,
    @Headers() headers: ToolHeaders,
  ) {
    this.validateApiKey(headers);
    return this.toolsService.invokeSkill(body.agent_id, skillName, body.params ?? {});
  }

  @Post('tools/create_zoho_lead')
  createLead(@Body() body: LeadDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.createLead(body.agent_id, { ...body });
  }

  @Post('tools/get_available_slots')
  getAvailableSlots(@Body() body: AvailableSlotsDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.getAvailableSlots(
      body.agent_id,
      body.preferred_date,
      body.preferred_time_window,
      body.timezone,
    );
  }

  @Post('tools/book_meeting')
  bookMeeting(@Body() body: BookMeetingDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.bookMeeting(
      body.agent_id,
      body.email,
      body.confirmed_slot,
      body.timezone,
      { ...body },
    );
  }

  @Post('tools/resend_invite')
  resendInvite(@Body() body: ResendInviteDto, @Headers() headers: ToolHeaders) {
    this.validateApiKey(headers);
    return this.toolsService.resendInvite(body.agent_id, body.email, body.meeting_id);
  }

  private validateApiKey(headers: ToolHeaders) {
    const key = headers['x-api-key'];
    this.toolsService.validateToolApiKey(key);
  }
}

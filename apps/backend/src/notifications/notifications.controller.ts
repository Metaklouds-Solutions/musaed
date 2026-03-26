import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('read') read?: string,
    @Query('severity') severity?: string,
    @Query('source') source?: string,
    @Query('tenantId') tenantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const userId = req.user._id.toString();
    const pagination = parsePagination({ page, limit });
    return this.notificationsService.findAllForUser(userId, {
      ...pagination,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      severity,
      source,
      tenantId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const userId = req.user._id.toString();
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: AuthenticatedRequest) {
    const userId = req.user._id.toString();
    await this.notificationsService.markAllAsRead(userId);
    return { ok: true };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user._id.toString();
    await this.notificationsService.markAsRead(id, userId);
    return { ok: true };
  }

  @Delete('clear')
  async clear(
    @Request() req: AuthenticatedRequest,
    @Query('read') read?: string,
    @Query('severity') severity?: string,
    @Query('source') source?: string,
    @Query('tenantId') tenantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const userId = req.user._id.toString();
    const deleted = await this.notificationsService.clearForUser(userId, {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      severity,
      source,
      tenantId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
    return { ok: true, deleted };
  }

  @Delete('dedupe')
  async dedupe(
    @Request() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    const userId = req.user._id.toString();
    const parsed = Number.parseInt(days ?? '30', 10);
    const lookbackDays = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
    const deleted = await this.notificationsService.cleanupDuplicatesForUser(
      userId,
      lookbackDays,
    );
    return { ok: true, deleted, lookbackDays };
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user._id.toString();
    await this.notificationsService.delete(id, userId);
    return { ok: true };
  }
}

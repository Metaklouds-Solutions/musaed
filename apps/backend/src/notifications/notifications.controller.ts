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
  ) {
    const userId = req.user._id.toString();
    const pagination = parsePagination({ page, limit });
    return this.notificationsService.findAllForUser(userId, {
      ...pagination,
      read: read === 'true' ? true : read === 'false' ? false : undefined,
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
  async markAsRead(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user._id.toString();
    await this.notificationsService.markAsRead(id, userId);
    return { ok: true };
  }

  @Delete(':id')
  async delete(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user._id.toString();
    await this.notificationsService.delete(id, userId);
    return { ok: true };
  }
}

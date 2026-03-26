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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { parsePagination } from '../common/helpers/parse-pagination';
import { requireTenantId } from '../common/helpers/require-tenant-id';

@Controller('tenant/bookings')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@RequirePermissions(PERMISSIONS.BOOKINGS_READ)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const tenantId = requireTenantId(req);
    const pagination = parsePagination({ page, limit });
    return this.bookingsService.findAllForTenant(tenantId, {
      ...pagination,
      date,
      status,
      start,
      end,
    });
  }

  @Post()
  @RequirePermissions(PERMISSIONS.BOOKINGS_WRITE)
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateBookingDto) {
    const tenantId = requireTenantId(req);
    return this.bookingsService.create(tenantId, dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const tenantId = requireTenantId(req);
    return this.bookingsService.findOneForTenant(id, tenantId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.BOOKINGS_WRITE)
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateBookingDto,
  ) {
    const tenantId = requireTenantId(req);
    return this.bookingsService.update(id, tenantId, dto);
  }
}

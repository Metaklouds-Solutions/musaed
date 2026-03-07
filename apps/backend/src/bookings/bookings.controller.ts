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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('tenant/bookings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAllForTenant(req.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      date,
      status,
    });
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.tenantId, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, req.tenantId, dto);
  }
}

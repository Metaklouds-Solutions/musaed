import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('tenant/customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAllForTenant(req.tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: any) {
    return this.customersService.findById(id, req.tenantId);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.tenantId, dto);
  }

  @Post(':id/export')
  exportData(@Param('id') id: string, @Request() req: any) {
    return this.customersService.exportData(id, req.tenantId);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Request() req: any) {
    return this.customersService.softDelete(id, req.tenantId);
  }
}

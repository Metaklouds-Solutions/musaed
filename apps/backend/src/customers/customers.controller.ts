import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('tenant/customers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAllForTenant(req.tenantId!, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.customersService.findById(id, req.tenantId!);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.tenantId!, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, req.tenantId!, dto);
  }

  @Post(':id/export')
  exportData(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.customersService.exportData(id, req.tenantId!);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.customersService.softDelete(id, req.tenantId!);
  }
}

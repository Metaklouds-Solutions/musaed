import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { BillingService } from './billing.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('admin/billing')
@UseGuards(JwtAuthGuard, AdminGuard)
export class BillingAdminController {
  constructor(private billingService: BillingService) {}

  @Get('overview')
  getOverview() {
    return this.billingService.getOverview();
  }

  @Get('plans')
  getPlans() {
    return this.billingService.getAllPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.billingService.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.billingService.updatePlan(id, dto);
  }
}

@Controller('tenant/billing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BillingTenantController {
  constructor(private billingService: BillingService) {}

  @Get()
  getTenantBilling(@Request() req: AuthenticatedRequest) {
    return this.billingService.getTenantBilling(req.tenantId!);
  }
}

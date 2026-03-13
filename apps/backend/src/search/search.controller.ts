import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @Request() req: AuthenticatedRequest,
    @Query('q') q: string,
    @Query('types') typesParam?: string,
  ) {
    const user = req.user;
    const isAdmin = user?.role === 'ADMIN';
    const tenantId = isAdmin
      ? (req.tenantId ?? null)
      : (req.tenantId ?? user?.tenantId ?? null);

    if (!isAdmin && !tenantId) {
      throw new ForbiddenException('Tenant context is required for search');
    }

    const types = typesParam
      ? typesParam.split(',').map((t) => t.trim().toLowerCase())
      : ['tenants', 'staff', 'tickets'];

    return this.searchService.search(q ?? '', {
      tenantId,
      isAdmin,
      types,
    });
  }
}

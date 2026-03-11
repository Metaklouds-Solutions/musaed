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
import { AdminGuard } from '../common/guards/admin.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ImportTemplateDto } from './dto/import-template.dto';
import { parsePagination } from '../common/helpers/parse-pagination';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('admin/templates')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll(
    @Query('channel') channel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination({ page, limit });
    return this.templatesService.findAll({
      channel,
      ...pagination,
    });
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @Request() req: AuthenticatedRequest) {
    return this.templatesService.create(dto, req.user._id.toString());
  }

  @Post('import')
  importTemplate(@Body() dto: ImportTemplateDto, @Request() req: AuthenticatedRequest) {
    return this.templatesService.importTemplate(dto, req.user._id.toString());
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.templatesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.templatesService.remove(id);
  }
}

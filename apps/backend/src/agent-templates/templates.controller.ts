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
    return this.templatesService.findAll({
      channel,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
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
  findById(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }
}

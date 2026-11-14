import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@ApiTags('catalog')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  tree(@RequestLocale() locale: Locale) {
    return this.categories.getTree(locale);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string, @RequestLocale() locale: Locale) {
    return this.categories.getBySlug(slug, locale);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.adminList();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.adminGet(id);
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(admin.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categories.update(admin.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() admin: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.categories.remove(admin.id, id);
  }
}

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
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AppError } from '../common/errors';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { ContentService } from './content.service';
import {
  CONTENT_KEY_PATTERN,
  CreateBannerDto,
  UpdateBannerDto,
  UpsertSiteContentDto,
} from './dto/content.dto';

function assertKey(key: string) {
  if (!CONTENT_KEY_PATTERN.test(key) || key.length > 100) {
    throw AppError.badRequest(
      'INVALID_CONTENT_KEY',
      'Key may contain lowercase letters, digits, "." and "-"'
    );
  }
}

@ApiTags('content')
@Public()
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('banners')
  banners(@RequestLocale() locale: Locale) {
    return this.content.activeBanners(locale);
  }

  @Get(':key')
  get(@Param('key') key: string, @RequestLocale() locale: Locale) {
    assertKey(key);
    return this.content.getByKey(key, locale);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get('banners')
  banners() {
    return this.content.adminBanners();
  }

  @Post('banners')
  createBanner(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateBannerDto) {
    return this.content.createBanner(admin.id, dto);
  }

  @Patch('banners/:id')
  updateBanner(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto
  ) {
    return this.content.updateBanner(admin.id, id, dto);
  }

  @Delete('banners/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBanner(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    await this.content.removeBanner(admin.id, id);
  }

  @Get('blocks')
  blocks() {
    return this.content.adminContent();
  }

  @Put('blocks/:key')
  upsert(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: UpsertSiteContentDto
  ) {
    assertKey(key);
    return this.content.upsertContent(admin.id, key, dto);
  }
}

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
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { CreateFaqItemDto, FaqQueryDto, UpdateFaqItemDto } from './dto/faq.dto';
import { FaqService } from './faq.service';

@ApiTags('faq')
@Public()
@Controller('faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  list(@RequestLocale() locale: Locale, @Query() query: FaqQueryDto) {
    return this.faq.publicList(locale, query);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/faq')
export class AdminFaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  list() {
    return this.faq.adminList();
  }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateFaqItemDto) {
    return this.faq.create(admin.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFaqItemDto
  ) {
    return this.faq.update(admin.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() admin: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.faq.remove(admin.id, id);
  }
}

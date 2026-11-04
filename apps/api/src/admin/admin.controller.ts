import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Locale, LOCALES } from '../common/utils/locale';

import { AdminService } from './admin.service';

class DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days: number = 30;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(@Query() query: DashboardQueryDto, @RequestLocale() locale: Locale) {
    return this.admin.dashboard(query.days, locale);
  }
}

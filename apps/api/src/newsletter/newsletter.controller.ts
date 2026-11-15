import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';

import {
  AdminNewsletterQueryDto,
  ConfirmSubscriptionDto,
  SubscribeDto,
} from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

const STRICT_LIMIT = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('newsletter')
@Public()
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle(STRICT_LIMIT)
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle(STRICT_LIMIT)
  confirm(@Body() dto: ConfirmSubscriptionDto) {
    return this.newsletter.confirm(dto.token);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Get()
  list(@Query() query: AdminNewsletterQueryDto) {
    return this.newsletter.adminList(query);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="newsletter.csv"')
  export() {
    return this.newsletter.exportActiveCsv();
  }

  @Post(':id/unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    await this.newsletter.unsubscribe(admin.id, id);
  }
}

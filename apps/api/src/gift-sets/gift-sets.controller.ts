import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { QuoteGiftSetDto, SaveGiftSetDto } from './dto/gift-sets.dto';
import { GiftSetsService } from './gift-sets.service';

@ApiTags('gift-sets')
@Controller('gift-sets')
export class GiftSetsController {
  constructor(private readonly giftSets: GiftSetsService) {}

  /** Prices a set from the current catalog (works for guests too). */
  @Public()
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() dto: QuoteGiftSetDto, @RequestLocale() locale: Locale) {
    return this.giftSets.quote(dto.items, locale);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.giftSets.list(user.id, locale);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveGiftSetDto,
    @RequestLocale() locale: Locale
  ) {
    return this.giftSets.create(user.id, dto, locale);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.giftSets.remove(user.id, id);
  }
}

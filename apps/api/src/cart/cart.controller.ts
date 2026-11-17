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
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { CartService } from './cart.service';
import {
  AddCartItemDto,
  MergeCartDto,
  PreviewCartDto,
  SetCartItemQuantityDto,
} from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.cart.getCart(user.id, locale);
  }

  @Post('items')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
    @RequestLocale() locale: Locale
  ) {
    return this.cart.addItem(user.id, dto, locale);
  }

  @Patch('items/:productId')
  setQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: SetCartItemQuantityDto,
    @RequestLocale() locale: Locale
  ) {
    return this.cart.setQuantity(user.id, productId, dto.quantity, locale);
  }

  @Delete('items/:productId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @RequestLocale() locale: Locale
  ) {
    return this.cart.removeItem(user.id, productId, locale);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(@CurrentUser() user: AuthenticatedUser) {
    await this.cart.clear(user.id);
  }

  /** Checks a guest cart against the catalog (no account needed). */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@Body() dto: PreviewCartDto, @RequestLocale() locale: Locale) {
    return this.cart.preview(dto, locale);
  }

  /** Removes unavailable lines, lowers quantities to the stock and accepts the new prices. */
  @Post('fix')
  @HttpCode(HttpStatus.OK)
  fix(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.cart.fix(user.id, locale);
  }

  @Post('merge')
  merge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MergeCartDto,
    @RequestLocale() locale: Locale
  ) {
    return this.cart.merge(user.id, dto, locale);
  }
}

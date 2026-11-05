import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.favorites.list(user.id, locale);
  }

  /** Product ids only — lets the catalog mark hearts without loading full cards. */
  @Get('ids')
  ids(@CurrentUser() user: AuthenticatedUser) {
    return this.favorites.ids(user.id);
  }

  @Put(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string
  ) {
    await this.favorites.add(user.id, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string
  ) {
    await this.favorites.remove(user.id, productId);
  }
}

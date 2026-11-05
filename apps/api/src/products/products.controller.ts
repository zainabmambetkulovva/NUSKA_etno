import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../common/decorators/public.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { LocaleQueryDto } from '../common/dto/locale-query.dto';
import { Locale } from '../common/utils/locale';

import { ProductsQueryDto } from './dto/products.dto';
import { ProductsService } from './products.service';

@ApiTags('catalog')
@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: ProductsQueryDto, @RequestLocale() locale: Locale) {
    return this.products.list(query, locale);
  }

  @Get(':slug')
  get(
    @Param('slug') slug: string,
    @Query() _query: LocaleQueryDto,
    @RequestLocale() locale: Locale
  ) {
    return this.products.getBySlug(slug, locale);
  }

  @Get(':slug/related')
  related(
    @Param('slug') slug: string,
    @Query() _query: LocaleQueryDto,
    @RequestLocale() locale: Locale
  ) {
    return this.products.related(slug, locale);
  }
}

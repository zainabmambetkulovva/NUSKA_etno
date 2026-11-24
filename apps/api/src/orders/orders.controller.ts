import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestLocale } from '../common/decorators/request-locale.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Locale } from '../common/utils/locale';

import {
  AdminOrdersQueryDto,
  CancelOrderDto,
  ChangeOrderStatusDto,
  CreateOrderDto,
} from './dto/orders.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
    @RequestLocale() locale: Locale
  ) {
    return this.orders.create(user.id, dto, locale);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.orders.listForUser(user.id, query.limit, query.offset);
  }

  /** A new Finik payment page for an unpaid online order. */
  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  pay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @RequestLocale() locale: Locale
  ) {
    return this.orders.payOnline(user.id, id, locale);
  }

  /** The receipt of a paid online order as a PDF file. */
  @Get(':id/receipt.pdf')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async receipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @RequestLocale() locale: Locale,
    @Res({ passthrough: true }) res: Response
  ) {
    const { buffer, filename } = await this.orders.receiptPdf(user.id, id, locale);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(buffer);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getForUser(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto
  ) {
    return this.orders.cancelByUser(user.id, id, dto.comment);
  }

  @Post(':id/repeat')
  @HttpCode(HttpStatus.OK)
  repeat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @RequestLocale() locale: Locale
  ) {
    return this.orders.repeat(user.id, id, locale);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Query() query: AdminOrdersQueryDto) {
    return this.orders.adminList(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.adminGet(id);
  }

  @Patch(':id/status')
  changeStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeOrderStatusDto
  ) {
    return this.orders.adminChangeStatus(admin.id, id, dto);
  }
}

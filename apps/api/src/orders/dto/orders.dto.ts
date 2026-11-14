import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LOCALES, Locale } from '../../common/utils/locale';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Items are taken from the user's server-side cart, never from the request body. */
export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  pickupLocationId!: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  customerName!: string;

  @ApiProperty({ example: '+996555123456' })
  @IsString()
  @MaxLength(32)
  customerPhone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Preferred pickup time (ISO 8601), if the shop supports it' })
  @IsOptional()
  @IsDateString({ strict: true })
  pickupTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  customerComment?: string;

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}

export class AdminOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Order number, customer name, phone or e-mail' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ChangeOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  comment?: string;
}

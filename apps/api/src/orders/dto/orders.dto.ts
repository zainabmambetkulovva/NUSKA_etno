import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod, OrderStatus, PaymentMethod } from '@prisma/client';
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
  ValidateIf,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LOCALES, Locale } from '../../common/utils/locale';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Items are taken from the user's server-side cart, never from the request body. */
export class CreateOrderDto {
  @ApiPropertyOptional({ enum: DeliveryMethod, default: DeliveryMethod.PICKUP })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Required for PICKUP' })
  @ValidateIf((o: CreateOrderDto) => (o.deliveryMethod ?? DeliveryMethod.PICKUP) === 'PICKUP')
  @IsUUID()
  pickupLocationId?: string;

  @ApiPropertyOptional({ description: 'City or settlement; required for DELIVERY' })
  @ValidateIf((o: CreateOrderDto) => o.deliveryMethod === 'DELIVERY')
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  deliveryCity?: string;

  @ApiPropertyOptional({ description: 'Street, house, apartment; required for DELIVERY' })
  @ValidateIf((o: CreateOrderDto) => o.deliveryMethod === 'DELIVERY')
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
    description: 'ONLINE is refused until an online payment provider is connected',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

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

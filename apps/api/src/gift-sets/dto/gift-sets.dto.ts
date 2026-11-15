import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { MAX_ITEM_QUANTITY } from '../../cart/dto/cart.dto';

export const MAX_SET_LINES = 30;

export class GiftSetItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_ITEM_QUANTITY })
  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}

export class QuoteGiftSetDto {
  @ApiProperty({ type: [GiftSetItemDto] })
  @IsArray()
  @ArrayMaxSize(MAX_SET_LINES)
  @ValidateNested({ each: true })
  @Type(() => GiftSetItemDto)
  items!: GiftSetItemDto[];
}

export class SaveGiftSetDto extends QuoteGiftSetDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ type: [GiftSetItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SET_LINES)
  @ValidateNested({ each: true })
  @Type(() => GiftSetItemDto)
  declare items: GiftSetItemDto[];
}

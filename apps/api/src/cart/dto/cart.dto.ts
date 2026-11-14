import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export const MAX_ITEM_QUANTITY = 99;

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_ITEM_QUANTITY })
  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}

export class SetCartItemQuantityDto {
  @ApiProperty({ minimum: 1, maximum: MAX_ITEM_QUANTITY })
  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}

/** Guest cart kept in the browser, merged into the account cart after login. */
export class MergeCartDto {
  @ApiProperty({ type: [AddCartItemDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AddCartItemDto)
  items!: AddCartItemDto[];
}

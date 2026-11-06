import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { PackagingModel, ProductStatus, ProductType, StockMovementType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotEquals,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LOCALES, Locale } from '../../common/utils/locale';
import { SLUG_PATTERN } from '../../common/validation';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const nullableText = (max: number) => [
  IsOptional(),
  ValidateIf((_: unknown, value: unknown) => value !== null),
  IsString(),
  MaxLength(max),
];
function NullableText(max: number): PropertyDecorator {
  return (target, key) => nullableText(max).forEach((decorator) => decorator(target, key));
}

// --- Public query -----------------------------------------------------------

export const PRODUCT_SORTS = ['default', 'price_asc', 'price_desc', 'popular', 'newest'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;

  @ApiPropertyOptional({ description: 'Search by product name (RU or KY)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Category slug (includes sub-categories)' })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  category?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort: ProductSort = 'default';

  @ApiPropertyOptional({ description: 'Only products that can be ordered now' })
  @IsOptional()
  @IsIn(['true', 'false'])
  inStock?: 'true' | 'false';

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['true', 'false'])
  featured?: 'true' | 'false';
}

// --- Admin -------------------------------------------------------------------

export class CharacteristicDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  value!: string;
}

export class ProductTranslationDto {
  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @NullableText(500)
  shortDescription?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @NullableText(10000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @NullableText(3000)
  ingredients?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @NullableText(2000)
  storageInstructions?: string | null;

  @ApiPropertyOptional({ type: [CharacteristicDto], nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  characteristics?: CharacteristicDto[] | null;
}

export class ProductUnitDto {
  @ApiProperty({ example: 'Упаковка' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  unitName!: string;

  @ApiProperty({ example: 0.5 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(1_000_000)
  quantityValue!: number;

  @ApiProperty({ example: 'кг' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  quantityUnit!: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'NAVAT-0.5' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9][A-Z0-9._-]*$/, {
    message: 'sku may contain latin letters, digits, ".", "_" and "-"',
  })
  @MaxLength(64)
  sku!: string;

  @ApiProperty({ example: 'navat-0-5' })
  @Transform(trim)
  @Matches(SLUG_PATTERN, {
    message: 'slug must contain lowercase latin letters, digits and dashes',
  })
  @MaxLength(150)
  slug!: string;

  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ description: 'Price in tyiyn (1 som = 100 tyiyn)', example: 10000 })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Initial stock, recorded as an IN movement' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  initialStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: PackagingModel,
    nullable: true,
    description: '3D packaging on the product page',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(PackagingModel)
  packaging3d?: PackagingModel | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  categoryIds?: string[];

  @ApiProperty({ type: [ProductTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LOCALES.length)
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  translations!: ProductTranslationDto[];

  @ApiPropertyOptional({ type: [ProductUnitDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ProductUnitDto)
  units?: ProductUnitDto[];
}

/**
 * Stock is not editable here (use /stock). Given translations are upserted per
 * locale; categoryIds and units, when given, replace the current set.
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['initialStock'] as const)
) {}

export class AdminProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class StockAdjustmentDto {
  @ApiProperty({ enum: [StockMovementType.IN, StockMovementType.ADJUSTMENT] })
  @IsIn([StockMovementType.IN, StockMovementType.ADJUSTMENT])
  type!: 'IN' | 'ADJUSTMENT';

  @ApiProperty({ description: 'IN: positive amount received. ADJUSTMENT: signed correction.' })
  @IsInt()
  @NotEquals(0)
  @Min(-1_000_000)
  @Max(1_000_000)
  quantity!: number;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  reason!: string;
}

export class UpdateProductImageDto {
  @ApiPropertyOptional({ nullable: true })
  @NullableText(300)
  alt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Make this the primary image' })
  @IsOptional()
  @IsIn([true])
  isPrimary?: true;
}

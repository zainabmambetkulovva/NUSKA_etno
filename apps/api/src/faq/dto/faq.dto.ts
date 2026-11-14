import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { LOCALES, Locale } from '../../common/utils/locale';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const FAQ_CATEGORY_PATTERN = /^[a-z][a-z0-9-]*$/;

export class FaqTranslationDto {
  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  question!: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  answer!: string;
}

export class CreateFaqItemDto {
  @ApiPropertyOptional({ example: 'orders' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  @Matches(FAQ_CATEGORY_PATTERN, {
    message: 'category must be lowercase latin letters, digits, "-"',
  })
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [FaqTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LOCALES.length)
  @ValidateNested({ each: true })
  @Type(() => FaqTranslationDto)
  translations!: FaqTranslationDto[];
}

export class UpdateFaqItemDto extends PartialType(CreateFaqItemDto) {}

export class FaqQueryDto extends LocaleQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @Matches(FAQ_CATEGORY_PATTERN)
  category?: string;
}

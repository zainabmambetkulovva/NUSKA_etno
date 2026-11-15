import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { LOCALES, Locale } from '../../common/utils/locale';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const CONTENT_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export class BannerTranslationDto {
  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  subtitle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  buttonLabel?: string | null;
}

export class CreateBannerDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Absolute URL or a site path starting with /',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^(https?:\/\/|\/(?!\/))\S*$/, {
    message: 'linkUrl must be an http(s) URL or a path starting with /',
  })
  @MaxLength(2048)
  linkUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  endsAt?: string | null;

  @ApiProperty({ type: [BannerTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LOCALES.length)
  @ValidateNested({ each: true })
  @Type(() => BannerTranslationDto)
  translations!: BannerTranslationDto[];
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class SiteContentTranslationDto {
  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(300)
  title?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(20000)
  body?: string | null;
}

export class UpsertSiteContentDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Non-translatable values: phones, e-mail, links',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsObject()
  data?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [SiteContentTranslationDto] })
  @IsArray()
  @ArrayMaxSize(LOCALES.length)
  @ValidateNested({ each: true })
  @Type(() => SiteContentTranslationDto)
  translations!: SiteContentTranslationDto[];
}

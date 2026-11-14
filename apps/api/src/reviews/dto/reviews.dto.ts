import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Locale, LOCALES } from '../../common/utils/locale';

export class CreateReviewDto {
  @ApiProperty({ description: 'Purchased order item being reviewed' })
  @IsUUID()
  orderItemId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class LatestReviewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 6;

  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}

export class AdminReviewsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: [ReviewStatus.APPROVED, ReviewStatus.REJECTED] })
  @IsIn([ReviewStatus.APPROVED, ReviewStatus.REJECTED])
  status!: 'APPROVED' | 'REJECTED';
}

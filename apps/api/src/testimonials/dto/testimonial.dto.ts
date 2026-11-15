import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const httpsUrl = { protocols: ['https'], require_protocol: true };

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Айдана Теребаева' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  authorName!: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  text!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: '2026-10-28', description: 'Date of the review (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'reviewDate must be YYYY-MM-DD' })
  reviewDate!: string;

  @ApiPropertyOptional({ description: 'Photo of the product or the customer (https)' })
  @IsOptional()
  @IsUrl(httpsUrl)
  @MaxLength(500)
  photoUrl?: string | null;

  @ApiPropertyOptional({ description: 'Avatar of the customer (https)' })
  @IsOptional()
  @IsUrl(httpsUrl)
  @MaxLength(500)
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'Бал' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  productName?: string | null;

  @ApiPropertyOptional({ example: 'https://www.instagram.com/p/...' })
  @IsOptional()
  @IsUrl(httpsUrl)
  @Matches(/^https:\/\/(www\.)?instagram\.com\//, {
    message: 'instagramUrl must be an Instagram link',
  })
  @MaxLength(500)
  instagramUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Sample entry: shown with a "sample" note' })
  @IsOptional()
  @IsBoolean()
  isDemo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

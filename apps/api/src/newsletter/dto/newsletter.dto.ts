import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsletterStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { Equals, IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { LOCALES, Locale } from '../../common/utils/locale';

export class SubscribeDto {
  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ description: 'Explicit consent to receive messages (must be true)' })
  @Equals(true, { message: 'consent must be given' })
  consent!: boolean;

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}

export class ConfirmSubscriptionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  token!: string;
}

export class AdminNewsletterQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NewsletterStatus)
  status?: NewsletterStatus;
}

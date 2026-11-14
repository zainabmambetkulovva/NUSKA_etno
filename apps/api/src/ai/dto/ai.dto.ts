import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { LOCALES, Locale } from '../../common/utils/locale';
import { GiftSetItemDto, MAX_SET_LINES } from '../../gift-sets/dto/gift-sets.dto';

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_HISTORY = 12;

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  content!: string;
}

export class AiChatDto {
  @ApiProperty({
    type: [ChatMessageDto],
    description: 'Conversation so far; the last one is the question',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_HISTORY)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;

  @ApiPropertyOptional({ type: [GiftSetItemDto], description: 'Current cart (context only)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SET_LINES)
  @ValidateNested({ each: true })
  @Type(() => GiftSetItemDto)
  cart?: GiftSetItemDto[];
}

export class AiSettingsDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

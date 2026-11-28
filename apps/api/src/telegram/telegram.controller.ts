import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { IsString, Matches, MaxLength } from 'class-validator';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';

import { TelegramService } from './telegram.service';

const CHAT_ID = /^-?\d{1,20}$/;

export class ConnectChatDto {
  @IsString()
  @Matches(CHAT_ID)
  id!: string;

  @IsString()
  @MaxLength(128)
  title!: string;
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('admin/telegram')
export class AdminTelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Get()
  status() {
    return this.telegram.status();
  }

  @Post('discover')
  @HttpCode(HttpStatus.OK)
  discover() {
    return this.telegram.discover();
  }

  @Post('chats')
  @HttpCode(HttpStatus.OK)
  connect(@CurrentUser() admin: AuthenticatedUser, @Body() dto: ConnectChatDto) {
    return this.telegram.connect(admin.id, dto);
  }

  @Delete('chats/:id')
  disconnect(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.telegram.disconnect(admin.id, id);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  test() {
    return this.telegram.sendTest();
  }
}

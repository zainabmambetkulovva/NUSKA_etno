import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user';

import { AiService } from './ai.service';
import { AiChatDto, AiSettingsDto } from './dto/ai.dto';

@ApiTags('ai')
@Public()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Whether the assistant is on and whether a language model is connected. */
  @Get('status')
  status() {
    return this.ai.status();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  chat(@Body() dto: AiChatDto) {
    return this.ai.chat(dto);
  }
}

@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin/ai')
export class AdminAiController {
  constructor(private readonly ai: AiService) {}

  @Get('settings')
  settings() {
    return this.ai.adminSettings();
  }

  @Put('settings')
  update(@CurrentUser() admin: AuthenticatedUser, @Body() dto: AiSettingsDto) {
    return this.ai.updateSettings(admin.id, dto.enabled);
  }
}

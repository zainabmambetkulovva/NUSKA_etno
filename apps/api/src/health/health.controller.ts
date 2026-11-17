import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        statusCode: 503,
        status: 'unhealthy',
        database: 'down',
      });
    }
    return { status: 'healthy', database: 'up', timestamp: new Date().toISOString() };
  }

  /** Liveness only (no database): used by the keep-awake ping. */
  @Get('live')
  live() {
    return { status: 'live', timestamp: new Date().toISOString() };
  }
}

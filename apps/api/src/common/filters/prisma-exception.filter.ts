import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Maps Prisma errors to HTTP responses so database errors never leak as 500s
 * with internal details.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const mapping: Record<string, { status: number; code: string; message: string }> = {
      P2002: {
        status: HttpStatus.CONFLICT,
        code: 'UNIQUE_CONSTRAINT',
        message: 'Resource already exists',
      },
      P2003: {
        status: HttpStatus.CONFLICT,
        code: 'FOREIGN_KEY_CONSTRAINT',
        message: 'Related resource constraint failed',
      },
      P2025: { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Resource not found' },
    };

    const mapped = mapping[exception.code];
    if (!mapped) {
      this.logger.error(`Unhandled Prisma error ${exception.code}`, exception.stack);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      });
      return;
    }

    const target = exception.meta?.target;
    response.status(mapped.status).json({
      statusCode: mapped.status,
      code: mapped.code,
      message: mapped.message,
      ...(mapped.code === 'UNIQUE_CONSTRAINT' && target ? { fields: target } : {}),
    });
  }
}

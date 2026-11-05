import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

type Details = Record<string, unknown>;

/**
 * Errors carry a stable machine-readable `code` so the frontend can show a
 * localised message (TZ §15); `message` is for developers.
 * Body: { statusCode, code, message, ...details }.
 */
export const AppError = {
  badRequest: (code: string, message: string, details?: Details) =>
    new BadRequestException({ statusCode: HttpStatus.BAD_REQUEST, code, message, ...details }),
  unauthorized: (code: string, message: string) =>
    new UnauthorizedException({ statusCode: HttpStatus.UNAUTHORIZED, code, message }),
  forbidden: (code: string, message: string) =>
    new ForbiddenException({ statusCode: HttpStatus.FORBIDDEN, code, message }),
  notFound: (code: string, message: string) =>
    new NotFoundException({ statusCode: HttpStatus.NOT_FOUND, code, message }),
  conflict: (code: string, message: string, details?: Details) =>
    new ConflictException({ statusCode: HttpStatus.CONFLICT, code, message, ...details }),
};

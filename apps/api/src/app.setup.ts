import {
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

export const API_PREFIX = 'api';

/** Flattens nested class-validator errors into [{ field: 'translations.0.name', messages: [...] }]. */
function flattenValidationErrors(
  errors: ValidationError[],
  parent = ''
): { field: string; messages: string[] }[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/** Shared by main.ts and the e2e tests so both run the same configuration. */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);
  const express = app as NestExpressApplication;

  if (config.get<boolean>('TRUST_PROXY')) express.set('trust proxy', 1);
  express.disable('x-powered-by');

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string[]>('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Locale'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Unknown fields are rejected, not silently dropped: protects against mass assignment.
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new UnprocessableEntityException({
          statusCode: 422,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          errors: flattenValidationErrors(errors),
        }),
    })
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();

  if (config.get<boolean>('SWAGGER_ENABLED')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('NUSKA_etno API')
        .setDescription(
          'Amounts are integers in tyiyn (1 som = 100 tyiyn). Auth uses httpOnly cookies.'
        )
        .setVersion('1.0')
        .addCookieAuth('nuska_access')
        .build()
    );
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }
}

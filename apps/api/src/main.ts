import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { API_PREFIX, configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on port ${port} (prefix /${API_PREFIX})`);
  if (config.get<boolean>('SWAGGER_ENABLED')) logger.log(`Swagger: /${API_PREFIX}/docs`);
}

void bootstrap();

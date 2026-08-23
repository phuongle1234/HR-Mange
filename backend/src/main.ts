import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { validationExceptionFactory } from './common/pipes/validation-exception-factory';
import { AppLoggerService } from './common/logger/app-logger.service';
import { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Lets @IsEmployeeCodeUnique()/@IsEmployeeEmailUnique() (and any future
  // async DTO validator) resolve dependencies through Nest's DI container.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AppConfig>);

  app.enableCors({
    origin: configService.get('app.frontendUrl', { infer: true }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.setGlobalPrefix('api');

  const port = configService.get('app.port', { infer: true }) ?? 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`, 'Bootstrap');
}

bootstrap();

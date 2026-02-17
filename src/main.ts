import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

async function sum(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(requestIdMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Tire Code API')
    .setDescription('API for tire mapping, lookup, and management')
    .setVersion('1.0.0')
    .addTag('Lookup', 'Public tire lookup endpoints')
    .addTag('Admin', 'Admin tire mapping management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  await app.listen(process.env.PORT ?? 8080);
}

void sum();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function sum(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    const reqWithId = req as unknown as Record<string, unknown>;
    reqWithId.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

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

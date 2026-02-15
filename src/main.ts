import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function sum() {
  const app = await NestFactory.create(AppModule);
  app.use((req, res, next) => {
    const requestId = uuidv4();
    req.requestId = requestId;
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
  await app.listen(process.env.PORT ?? 3000);
}
sum();

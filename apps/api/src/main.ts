import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // sau proxy của Railway/Nginx: lấy IP thật của người dùng (để giới hạn đăng nhập đúng người)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

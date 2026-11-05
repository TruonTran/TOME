import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BooksProcessor } from './books.processor';
import { storageDir } from './books.storage';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'books' }),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: storageDir(config, 'uploads'),
          filename: (_req, file, cb) => cb(null, randomUUID() + extname(file.originalname).toLowerCase()),
        }),
        limits: { fileSize: 100 * 1024 * 1024 },
      }),
    }),
  ],
  controllers: [BooksController],
  providers: [BooksService, BooksProcessor],
})
export class BooksModule {}

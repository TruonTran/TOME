import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { ReadingModule } from './reading/reading.module';
import { redisOptions } from './redis/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ connection: redisOptions(config) }),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    BooksModule,
    ReadingModule,
  ],
})
export class AppModule {}

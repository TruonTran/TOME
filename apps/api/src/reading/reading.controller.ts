import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, UserId } from '../auth/auth.guard';
import { ReadingService } from './reading.service';
import { SessionDto } from './reading.dto';

@UseGuards(AuthGuard)
@Controller()
export class ReadingController {
  constructor(private readonly reading: ReadingService) {}

  @Post('sessions')
  log(@UserId() userId: string, @Body() dto: SessionDto) {
    return this.reading.logSession(userId, dto);
  }

  @Get('stats')
  stats(@UserId() userId: string, @Query('today') today?: string) {
    const valid = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : new Date().toISOString().slice(0, 10);
    return this.reading.stats(userId, valid);
  }
}

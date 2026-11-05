import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import { SessionDto } from './reading.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const statsKey = (userId: string) => `stats:${userId}`;

/** Cộng/trừ ngày trên chuỗi YYYY-MM-DD (tính theo UTC nên không lệch múi giờ). */
function shiftDay(day: string, delta: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày liên tiếp có đọc, tính lùi từ hôm nay (nếu hôm nay chưa đọc thì tính từ hôm qua). */
function streakOf(daysDesc: string[], today: string) {
  const set = new Set(daysDesc);
  let cursor = set.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

@Injectable()
export class ReadingService {
  constructor(private readonly prisma: PrismaService, @Inject(REDIS) private readonly redis: Redis) {}

  async logSession(userId: string, dto: SessionDto) {
    const book = await this.prisma.book.findFirst({ where: { id: dto.bookId, userId }, select: { id: true } });
    if (!book) throw new NotFoundException('Không tìm thấy sách');
    await this.prisma.readingSession.create({
      data: { userId, bookId: book.id, seconds: dto.seconds, pages: dto.pages ?? 0, day: dto.day },
    });
    await this.redis.del(statsKey(userId)); // dữ liệu đổi nên xoá cache
    return { ok: true };
  }

  /** Thống kê cho trang chủ. Cache 60 giây trong Redis, xoá khi có phiên đọc mới. */
  async stats(userId: string, today: string) {
    const key = statsKey(userId);
    const hit = await this.redis.hget(key, today);
    if (hit) return JSON.parse(hit);

    const since = shiftDay(today, -6);
    const [user, perDay, allDays, total, finished] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { dailyGoalMinutes: true } }),
      this.prisma.readingSession.groupBy({
        by: ['day'],
        where: { userId, day: { gte: since, lte: today } },
        _sum: { seconds: true },
      }),
      this.prisma.readingSession.groupBy({ by: ['day'], where: { userId }, orderBy: { day: 'desc' }, take: 400 }),
      this.prisma.readingSession.aggregate({ where: { userId }, _sum: { seconds: true } }),
      this.prisma.book.count({ where: { userId, finishedAt: { not: null } } }),
    ]);

    const byDay = new Map(perDay.map((r) => [r.day, r._sum.seconds ?? 0]));
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = shiftDay(since, i);
      return { day, seconds: byDay.get(day) ?? 0 };
    });

    const result = {
      goalMinutes: user.dailyGoalMinutes,
      todaySeconds: byDay.get(today) ?? 0,
      streak: streakOf(allDays.map((r) => r.day), today),
      week,
      totalSeconds: total._sum.seconds ?? 0,
      finishedBooks: finished,
    };
    await this.redis.hset(key, today, JSON.stringify(result));
    await this.redis.expire(key, 60);
    return result;
  }
}

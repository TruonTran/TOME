import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

/**
 * Cấu hình kết nối Redis, dùng chung cho ioredis và BullMQ.
 * Ưu tiên REDIS_URL (kiểu redis://user:pass@host:port, nền tảng cloud hay cấp sẵn),
 * không có thì dùng REDIS_HOST / REDIS_PORT (chạy trên máy).
 */
export function redisOptions(config: ConfigService): RedisOptions {
  const url = config.get<string>('REDIS_URL');
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 6379),
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      tls: u.protocol === 'rediss:' ? {} : undefined,
      family: 0, // mạng nội bộ của Railway cần phân giải được cả IPv6
    };
  }
  return {
    host: config.get('REDIS_HOST', '127.0.0.1'),
    port: Number(config.get('REDIS_PORT', 6379)),
  };
}

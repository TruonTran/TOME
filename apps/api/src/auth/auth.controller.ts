import { Body, Controller, Get, HttpException, Inject, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.module';
import { AuthService } from './auth.service';
import { AuthGuard, UserId } from './auth.guard';
import { LoginDto, RegisterDto, UpdateMeDto } from './auth.dto';
import { COOKIE_MAX_AGE_MS, COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, @Inject(REDIS) private readonly redis: Redis) {}

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  /** Giới hạn tối đa 10 lần đăng nhập/đăng ký mỗi phút cho mỗi IP (đếm bằng Redis). */
  private async throttle(req: Request) {
    const key = `rl:auth:${req.ip}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    if (count > 10) throw new HttpException('Thử quá nhiều lần, vui lòng đợi một phút', 429);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.throttle(req);
    const { user, token } = await this.auth.register(dto);
    this.setCookie(res, token);
    return user;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.throttle(req);
    const { user, token } = await this.auth.login(dto);
    this.setCookie(res, token);
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@UserId() userId: string) {
    return this.auth.me(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  update(@UserId() userId: string, @Body() dto: UpdateMeDto) {
    return this.auth.update(userId, dto);
  }
}

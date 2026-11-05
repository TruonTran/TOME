import { NextResponse, type NextRequest } from 'next/server';

// Chỉ kiểm tra có cookie đăng nhập hay chưa để chuyển trang cho nhanh.
// Việc xác thực thật sự do API đảm nhiệm (cookie hết hạn thì /auth/me trả 401).
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('tome_token');
  const isLogin = req.nextUrl.pathname === '/login';
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };

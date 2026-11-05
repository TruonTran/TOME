export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Init = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit | null };

/** fetch có sẵn cookie đăng nhập, tự đọc thông báo lỗi từ API. */
export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const { json, headers, body, ...rest } = init;
  const res = await fetch(API_URL + path, {
    credentials: 'include',
    ...rest,
    headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  });
  if (!res.ok) {
    let message = 'Có lỗi xảy ra, thử lại sau nhé';
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message[0] : (data.message ?? message);
    } catch {}
    throw new ApiError(res.status, message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Ngày hiện tại theo giờ máy của người dùng, dạng YYYY-MM-DD. */
export function localDay(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

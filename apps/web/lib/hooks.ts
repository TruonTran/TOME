'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR, { type SWRConfiguration } from 'swr';
import { api, localDay } from './api';

export function useApi<T>(key: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(key, (path: string) => api<T>(path), config);
}

/** Lưu tiến độ đọc (đợi 1 giây sau lần đổi cuối), và gửi nốt khi rời trang. */
export function useSaveProgress(bookId: string) {
  const pending = useRef<{ page: number; percent: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const send = useCallback(
    (keepalive = false) => {
      const body = pending.current;
      if (!body) return;
      pending.current = null;
      api(`/books/${bookId}/progress`, { method: 'PUT', json: body, keepalive }).catch(() => {});
    },
    [bookId],
  );

  useEffect(() => {
    const onHide = () => send(true);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      clearTimeout(timer.current);
      send(true);
    };
  }, [send]);

  return useCallback(
    (page: number, percent: number) => {
      pending.current = { page, percent };
      clearTimeout(timer.current);
      timer.current = setTimeout(() => send(), 1000);
    },
    [send],
  );
}

/**
 * Đếm thời gian đọc thật: chỉ cộng khi tab đang mở và có thao tác trong 60 giây gần nhất.
 * Cứ 30 giây gửi lên API một lần, và gửi nốt khi rời trang.
 */
export function useReadingTimer(bookId: string) {
  const seconds = useRef(0);
  const pages = useRef(0);

  useEffect(() => {
    let lastActive = Date.now();
    const mark = () => (lastActive = Date.now());
    const events = ['scroll', 'keydown', 'pointermove', 'pointerdown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const tick = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActive < 60_000) seconds.current += 1;
    }, 1000);

    const flush = (keepalive = false) => {
      const s = seconds.current;
      if (s < (keepalive ? 1 : 5)) return;
      const body = { bookId, seconds: s, pages: pages.current, day: localDay() };
      seconds.current = 0;
      pages.current = 0;
      api('/sessions', { method: 'POST', json: body, keepalive }).catch(() => {});
    };

    const interval = setInterval(() => flush(), 30_000);
    const onHide = () => flush(true);
    const onVisibility = () => document.visibilityState === 'hidden' && flush(true);
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach((e) => window.removeEventListener(e, mark));
      clearInterval(tick);
      clearInterval(interval);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flush(true);
    };
  }, [bookId]);

  return { addPages: (n: number) => (pages.current += n) };
}

export type ReaderTheme = 'paper' | 'sepia' | 'night';
type Prefs = { theme: ReaderTheme; size: number };
const DEFAULT_PREFS: Prefs = { theme: 'paper', size: 19 };

/** Giao diện đọc (nền, cỡ chữ) nhớ lại trong localStorage. */
export function useReaderPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tome:reader');
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem('tome:reader', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return [prefs, update] as const;
}

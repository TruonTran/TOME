'use client';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useReaderPrefs, useReadingTimer, useSaveProgress } from '@/lib/hooks';
import type { Book } from '@/lib/types';
import { ReaderBar } from './ReaderBar';

export function DocxReader({ book }: { book: Book }) {
  const [prefs, setPrefs] = useReaderPrefs();
  const [html, setHtml] = useState<string>();
  const [error, setError] = useState(false);
  const [percent, setPercent] = useState(book.percent);
  const save = useSaveProgress(book.id);
  useReadingTimer(book.id);
  const restored = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/books/${book.id}/html`, { credentials: 'include' })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setHtml)
      .catch(() => setError(true));
  }, [book.id]);

  // quay lại đúng chỗ đã đọc dở
  useEffect(() => {
    if (!html || restored.current) return;
    restored.current = true;
    requestAnimationFrame(() => {
      window.scrollTo(0, book.percent * (document.documentElement.scrollHeight - window.innerHeight));
    });
  }, [html, book.percent]);

  useEffect(() => {
    if (!html) return;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
      setPercent(p);
      save(Math.max(1, Math.round(p * 100)), p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [html, save]);

  return (
    <div className="reader min-h-dvh" data-theme={prefs.theme}>
      <ReaderBar title={book.title} percent={percent} theme={prefs.theme} onTheme={(theme) => setPrefs({ theme })}>
        <div role="group" aria-label="Cỡ chữ" className="flex items-center">
          <button aria-label="Giảm cỡ chữ" onClick={() => setPrefs({ size: Math.max(14, prefs.size - 1) })} className="grid size-8 place-items-center rounded-md hover:bg-black/5">
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-7 text-center text-xs tabular-nums">{prefs.size}</span>
          <button aria-label="Tăng cỡ chữ" onClick={() => setPrefs({ size: Math.min(28, prefs.size + 1) })} className="grid size-8 place-items-center rounded-md hover:bg-black/5">
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </ReaderBar>

      <main className="px-5 py-10 sm:py-14">
        {error && <p className="text-center">Không tải được nội dung sách.</p>}
        {!html && !error && <p className="text-center text-[var(--r-muted)]">Đang mở sách…</p>}
        {html && <article className="reader-doc" style={{ fontSize: prefs.size }} dangerouslySetInnerHTML={{ __html: html }} />}
      </main>
    </div>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { useReaderPrefs, useReadingTimer, useSaveProgress } from '@/lib/hooks';
import type { Book } from '@/lib/types';
import { ReaderBar } from './ReaderBar';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const FILTERS = { paper: undefined, sepia: 'sepia(0.35)', night: 'invert(0.92) hue-rotate(180deg)' } as const;

export default function PdfReader({ book }: { book: Book }) {
  const [prefs, setPrefs] = useReaderPrefs();
  const [numPages, setNumPages] = useState(book.totalPages ?? 0);
  const [page, setPage] = useState(Math.max(1, book.page));
  const [width, setWidth] = useState(800);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const save = useSaveProgress(book.id);
  const { addPages } = useReadingTimer(book.id);

  const file = useMemo(() => ({ url: `${API_URL}/books/${book.id}/file`, withCredentials: true }), [book.id]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.min(880, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (target: number) => {
      if (!numPages) return;
      const next = Math.min(numPages, Math.max(1, target));
      if (next === page) return;
      if (next === page + 1) addPages(1);
      setPage(next);
      save(next, next / numPages);
      window.scrollTo(0, 0);
    },
    [numPages, page, save, addPages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea')) return;
      if (['ArrowRight', 'PageDown'].includes(e.key)) go(page + 1);
      if (['ArrowLeft', 'PageUp'].includes(e.key)) go(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, page]);

  return (
    <div className="reader min-h-dvh pb-24" data-theme={prefs.theme}>
      <ReaderBar title={book.title} percent={numPages ? page / numPages : 0} theme={prefs.theme} onTheme={(theme) => setPrefs({ theme })} />

      <main ref={box} className="mx-auto max-w-5xl px-4 py-6">
        {failed ? (
          <p className="text-center">Không mở được file PDF này.</p>
        ) : (
          <div className="mx-auto w-fit shadow-lg" style={{ filter: FILTERS[prefs.theme] }}>
            <Document file={file} onLoadSuccess={(pdf) => setNumPages(pdf.numPages)} onLoadError={() => setFailed(true)} loading={<p className="p-10">Đang mở sách…</p>}>
              <Page pageNumber={page} width={width} renderAnnotationLayer />
            </Document>
          </div>
        )}
      </main>

      <nav aria-label="Chuyển trang" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--r-line)] bg-[var(--r-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <button aria-label="Trang trước" onClick={() => go(page - 1)} disabled={page <= 1} className="grid size-10 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30">
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <input
            type="range"
            aria-label="Chọn trang"
            min={1}
            max={Math.max(1, numPages)}
            value={page}
            onChange={(e) => go(Number(e.target.value))}
            className="h-2 flex-1 accent-[var(--color-ink)]"
          />
          <span className="w-20 text-center text-sm tabular-nums">
            {page} / {numPages || '…'}
          </span>
          <button aria-label="Trang sau" onClick={() => go(page + 1)} disabled={!numPages || page >= numPages} className="grid size-10 place-items-center rounded-md hover:bg-black/5 disabled:opacity-30">
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </nav>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReaderTheme } from '@/lib/hooks';

const THEMES: { id: ReaderTheme; label: string }[] = [
  { id: 'paper', label: 'Sáng' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'night', label: 'Tối' },
];

export function ReaderBar({
  title,
  percent,
  theme,
  onTheme,
  children,
}: {
  title: string;
  percent: number;
  theme: ReaderTheme;
  onTheme: (t: ReaderTheme) => void;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--r-line)] bg-[var(--r-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link href="/" aria-label="Về thư viện" className="grid size-9 place-items-center rounded-md hover:bg-black/5">
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h1>
        {children}
        <div role="group" aria-label="Màu nền" className="flex rounded-md border border-[var(--r-line)] p-0.5 text-xs font-semibold">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => onTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`rounded px-2 py-1 ${theme === t.id ? 'bg-mark text-ink' : 'text-[var(--r-muted)]'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-1 bg-black/5" aria-hidden>
        <div className="mark-swipe h-full transition-[width] duration-300" style={{ width: `${Math.round(percent * 100)}%` }} />
      </div>
    </header>
  );
}

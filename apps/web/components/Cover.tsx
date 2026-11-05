import { Check } from 'lucide-react';
import type { Book } from '@/lib/types';

// Màu "mực" cho bìa sách, chọn theo tên sách nên mỗi cuốn luôn giữ một màu
const DYES = ['#16215c', '#6d1f3c', '#14523a', '#43287d', '#0e4a5a', '#7e3510', '#3a3f58', '#7a2230'];

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function Cover({ book, className = '' }: { book: Pick<Book, 'title' | 'author' | 'format' | 'finishedAt'>; className?: string }) {
  const color = DYES[hash(book.title) % DYES.length];
  return (
    <div
      className={`relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-l-sm rounded-r-md p-3 pl-5 text-white shadow-[0_6px_18px_-8px] ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 8px 20px -10px ${color}`,
        backgroundImage:
          'linear-gradient(90deg, rgba(0,0,0,.3) 0 5%, rgba(255,255,255,.1) 5% 6%, transparent 6% 100%)',
      }}
    >
      <p className="font-serif text-[0.95rem] font-bold leading-snug [overflow-wrap:anywhere] line-clamp-5">{book.title}</p>
      <div className="flex items-end justify-between gap-2 text-[0.7rem] text-white/75">
        <span className="line-clamp-2">{book.author ?? ''}</span>
        <span className="shrink-0 rounded-sm bg-white/15 px-1.5 py-0.5 font-medium text-white/90">{book.format}</span>
      </div>
      {book.finishedAt && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-mark text-ink" title="Đã đọc xong">
          <Check className="size-3" strokeWidth={3} aria-label="Đã đọc xong" />
        </span>
      )}
    </div>
  );
}

'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { mutate } from 'swr';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Book } from '@/lib/types';
import { Cover } from './Cover';
import { HighlightBar } from './HighlightBar';

function UploadTile() {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  async function upload(files: FileList | File[]) {
    setBusy(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        await api('/books', { method: 'POST', body });
      }
      await mutate('/books');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        disabled={busy}
        className={`flex aspect-[2/3] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-3 text-center text-sm transition-colors ${
          over ? 'border-ink bg-mark/30' : 'border-line bg-sheet/60 hover:border-ink/50'
        }`}
      >
        {busy ? <Loader2 className="size-6 animate-spin text-ink" aria-hidden /> : <Plus className="size-6 text-ink" aria-hidden />}
        <span className="font-semibold text-ink">{busy ? 'Đang tải lên…' : 'Thêm sách'}</span>
        <span className="text-muted">Chọn hoặc kéo thả file PDF, DOCX</span>
      </button>
      <input ref={input} type="file" accept=".pdf,.docx" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
      {error && (
        <p role="alert" className="mt-2 flex gap-1.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </li>
  );
}

function BookTile({ book }: { book: Book }) {
  async function remove() {
    if (!window.confirm(`Xoá "${book.title}" khỏi thư viện?`)) return;
    await api(`/books/${book.id}`, { method: 'DELETE' });
    await mutate('/books');
  }

  const cover = <Cover book={book} className={book.status !== 'READY' ? 'opacity-60' : ''} />;
  return (
    <li className="group relative">
      {book.status === 'READY' ? (
        <Link href={`/read/${book.id}`} aria-label={`Đọc ${book.title}`} className="block">
          {cover}
        </Link>
      ) : (
        cover
      )}
      <div className="mt-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-body">{book.title}</p>
        {book.status === 'READY' && <HighlightBar value={book.percent} className="mt-2 h-2" label={`Đã đọc ${Math.round(book.percent * 100)}%`} />}
        {book.status === 'PROCESSING' && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Loader2 className="size-3 animate-spin" aria-hidden /> Đang xử lý…
          </p>
        )}
        {book.status === 'FAILED' && <p className="mt-1 text-xs text-red-700">{book.error ?? 'Không đọc được file này'}</p>}
      </div>
      <button
        onClick={remove}
        aria-label={`Xoá ${book.title}`}
        className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-md bg-white/90 text-ink opacity-0 shadow-sm transition-opacity hover:bg-white focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

export function Library({ books }: { books: Book[] }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-bold text-ink">
        Thư viện <span className="ml-1 text-base font-medium text-muted">{books.length} cuốn</span>
      </h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <UploadTile />
        {books.map((b) => (
          <BookTile key={b.id} book={b} />
        ))}
      </ul>
    </section>
  );
}

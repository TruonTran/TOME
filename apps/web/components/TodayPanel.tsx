'use client';
import Link from 'next/link';
import { mutate } from 'swr';
import { BookOpen } from 'lucide-react';
import { api, localDay } from '@/lib/api';
import type { Book, Stats, User } from '@/lib/types';
import { Cover } from './Cover';
import { HighlightBar } from './HighlightBar';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const GOALS = [10, 20, 30, 45, 60, 90];

export function ContinueReading({ book }: { book?: Book }) {
  if (!book) {
    return (
      <section className="flex flex-col justify-center">
        <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">Thư viện còn trống</h1>
        <p className="mt-3 max-w-md text-muted">
          Thêm cuốn sách đầu tiên (PDF hoặc Word) ở ô &ldquo;Thêm sách&rdquo; bên dưới, rồi đọc vài trang mỗi ngày.
        </p>
      </section>
    );
  }
  const where = book.format === 'PDF' && book.totalPages ? `trang ${book.page} / ${book.totalPages}` : 'đang đọc dở';
  return (
    <section className="flex items-center gap-5 sm:gap-7">
      <Link href={`/read/${book.id}`} className="w-28 shrink-0 sm:w-36" aria-label={`Mở ${book.title}`}>
        <Cover book={book} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">Đọc tiếp</p>
        <h1 className="mt-1 line-clamp-3 text-2xl font-bold leading-tight text-ink sm:text-3xl">{book.title}</h1>
        {book.author && <p className="mt-1 text-muted">{book.author}</p>}
        <div className="mt-4 max-w-sm">
          <HighlightBar value={book.percent} label={`Đã đọc ${Math.round(book.percent * 100)}%`} />
          <p className="mt-1.5 text-sm text-muted">
            {where}, {Math.round(book.percent * 100)}%
          </p>
        </div>
        <Link
          href={`/read/${book.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
        >
          <BookOpen className="size-4" aria-hidden /> Đọc tiếp
        </Link>
      </div>
    </section>
  );
}

export function TodayGoal({ stats, user }: { stats?: Stats; user?: User }) {
  const goal = stats?.goalMinutes ?? user?.dailyGoalMinutes ?? 20;
  const minutes = Math.floor((stats?.todaySeconds ?? 0) / 60);
  const today = localDay();

  async function setGoal(value: number) {
    await api('/auth/me', { method: 'PATCH', json: { dailyGoalMinutes: value } });
    await Promise.all([mutate('/auth/me'), mutate((key) => typeof key === 'string' && key.startsWith('/stats'))]);
  }

  return (
    <section className="rounded-lg bg-sheet p-5 ring-1 ring-line sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Hôm nay</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          Mục tiêu
          <select
            value={GOALS.includes(goal) ? goal : ''}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="rounded-md border border-line bg-white px-2 py-1 text-ink"
          >
            {!GOALS.includes(goal) && <option value="">{goal} phút</option>}
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g} phút
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
        {minutes} <span className="text-xl font-semibold text-muted">/ {goal} phút</span>
      </p>
      <div className="mt-3">
        <HighlightBar value={minutes / goal} label="Tiến độ mục tiêu hôm nay" />
      </div>
      <p className="mt-2 text-sm text-muted">
        {minutes >= goal ? 'Đủ mục tiêu hôm nay rồi.' : `Còn ${goal - minutes} phút nữa là đủ mục tiêu.`}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
        <p className="text-sm text-muted">
          <span className="text-2xl font-bold text-ink">{stats?.streak ?? 0}</span> ngày liên tiếp
        </p>
        <ul className="flex gap-1.5" aria-label="7 ngày gần nhất">
          {(stats?.week ?? []).map((d) => {
            const read = d.seconds > 0;
            return (
              <li key={d.day} className="flex flex-col items-center gap-1" title={`${d.day}: ${Math.round(d.seconds / 60)} phút`}>
                <span className={`block h-5 w-5 rounded-sm ${read ? 'mark-swipe' : 'bg-ink/10'} ${d.day === today ? 'ring-2 ring-ink ring-offset-1' : ''}`} />
                <span className="text-[0.65rem] text-muted">{WEEKDAYS[new Date(`${d.day}T00:00:00`).getDay()]}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { localDay } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { Book, Stats, User } from '@/lib/types';
import { Header } from '@/components/Header';
import { ContinueReading, TodayGoal } from '@/components/TodayPanel';
import { Library } from '@/components/Library';

export default function Home() {
  const router = useRouter();
  const today = useMemo(() => localDay(), []);
  const { data: user, error } = useApi<User>('/auth/me');
  const { data: stats } = useApi<Stats>(`/stats?today=${today}`);
  const { data: books } = useApi<Book[]>('/books', {
    // đang có sách xử lý thì hỏi lại API mỗi 2 giây
    refreshInterval: (latest) => (latest?.some((b) => b.status === 'PROCESSING') ? 2000 : 0),
  });

  useEffect(() => {
    if (error && (error as { status?: number }).status === 401) router.replace('/login');
  }, [error, router]);

  // sách đang đọc dở gần nhất (chưa xong, đã xử lý xong)
  const current = books?.find((b) => b.status === 'READY' && b.lastReadAt && !b.finishedAt) ?? books?.find((b) => b.status === 'READY' && !b.finishedAt);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-6xl space-y-14 px-5 pb-20 pt-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <ContinueReading book={current} />
          <TodayGoal stats={stats} user={user} />
        </div>
        <Library books={books ?? []} />
      </main>
    </>
  );
}

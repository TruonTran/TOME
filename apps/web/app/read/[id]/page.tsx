'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/hooks';
import type { Book } from '@/lib/types';
import { DocxReader } from '@/components/DocxReader';

// pdf.js chỉ chạy được ở trình duyệt nên tắt SSR cho trình đọc PDF
const PdfReader = dynamic(() => import('@/components/PdfReader'), {
  ssr: false,
  loading: () => <p className="p-8 text-muted">Đang mở sách…</p>,
});

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md p-8">
      <p className="text-ink">{children}</p>
      <Link href="/" className="mt-4 inline-block font-semibold text-ink underline underline-offset-4">
        Về thư viện
      </Link>
    </main>
  );
}

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { data: book, error } = useApi<Book>(`/books/${id}`);

  if (error) return <Notice>Không tìm thấy cuốn sách này.</Notice>;
  if (!book) return <p className="p-8 text-muted">Đang mở sách…</p>;
  if (book.status !== 'READY') return <Notice>Sách vẫn đang được xử lý, quay lại sau ít giây nhé.</Notice>;
  return book.format === 'PDF' ? <PdfReader book={book} /> : <DocxReader book={book} />;
}

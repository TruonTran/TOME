'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { HighlightBar } from '@/components/HighlightBar';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        json: {
          email: form.get('email'),
          password: form.get('password'),
          ...(mode === 'register' && form.get('name') ? { name: form.get('name') } : {}),
        },
      });
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field = 'mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-body placeholder:text-muted/60';

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl items-center gap-12 px-6 py-12 md:grid-cols-2">
      <section>
        <p className="text-2xl font-extrabold tracking-[0.18em] text-ink">TOME</p>
        <h1 className="mt-8 text-4xl font-bold leading-tight text-ink sm:text-5xl">Mỗi ngày đọc vài trang.</h1>
        <p className="mt-4 max-w-sm text-muted">Tải sách PDF hoặc Word của bạn lên, đọc ngay trên web và giữ nhịp đọc mỗi ngày.</p>
        <div className="mt-8 max-w-xs">
          <HighlightBar value={0.62} className="h-4" label="Minh hoạ tiến độ đọc" />
        </div>
      </section>

      <form onSubmit={submit} className="rounded-lg bg-sheet p-6 ring-1 ring-line sm:p-8">
        <div className="mb-6 grid grid-cols-2 rounded-md bg-ink/5 p-1 text-sm font-semibold" role="tablist">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError('');
              }}
              className={`rounded-[5px] py-2 ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
            >
              {m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <label className="mb-4 block text-sm font-medium">
            Tên hiển thị
            <input name="name" autoComplete="nickname" maxLength={60} className={field} />
          </label>
        )}
        <label className="mb-4 block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block text-sm font-medium">
          Mật khẩu
          <input
            name="password"
            type="password"
            required
            minLength={mode === 'register' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className={field}
          />
          {mode === 'register' && <span className="mt-1 block text-xs font-normal text-muted">Ít nhất 8 ký tự.</span>}
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={busy} className="mt-6 w-full rounded-md bg-ink py-2.5 font-semibold text-white hover:bg-ink/90 disabled:opacity-60">
          {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
      </form>
    </main>
  );
}

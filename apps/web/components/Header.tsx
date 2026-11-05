'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

export function Header({ user }: { user?: User }) {
  const router = useRouter();
  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  }
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <span className="text-2xl font-extrabold tracking-[0.18em] text-ink">TOME</span>
      <div className="flex items-center gap-4 text-sm text-muted">
        <span className="hidden sm:inline">{user?.name || user?.email}</span>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-ink hover:bg-ink/5">
          <LogOut className="size-4" aria-hidden /> Đăng xuất
        </button>
      </div>
    </header>
  );
}

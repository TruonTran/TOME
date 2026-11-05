import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Literata } from 'next/font/google';
import './globals.css';

const be = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be',
  display: 'swap',
});
const literata = Literata({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-literata',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TOME',
  description: 'Thư viện cá nhân để đọc PDF và Word mỗi ngày.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${be.variable} ${literata.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

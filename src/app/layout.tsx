import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Maiztros Platform',
  description: 'POS + Dashboard + KDS for Maiztros',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>{children}</body>
    </html>
  );
}

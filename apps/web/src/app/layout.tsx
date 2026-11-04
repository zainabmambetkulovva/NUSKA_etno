import type { ReactNode } from 'react';
import '../styles/globals.css';
import { i18n } from '@/i18n/config';

interface RootLayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'NUSKA_etno — Натуральные кыргызские продукты',
  description: 'Премиальный интернет-магазин натуральных и традиционных кыргызских продуктов',
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={i18n.defaultLanguage}>
      <body className="antialiased bg-background text-text">
        {children}
      </body>
    </html>
  );
}

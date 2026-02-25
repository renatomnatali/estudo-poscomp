import type { Metadata } from 'next';

import { AppProviders } from '@/components/auth/app-providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'POSCOMP Visual Lab',
  description: 'Plataforma de estudo POSCOMP - V1 Autômatos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

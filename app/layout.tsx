import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProviders } from '@/components/auth/app-providers';

import './globals.css';
import '@/components/marketing/aprovado-tokens.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--fd',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--fm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'aprovado.xyz · estude para o POSCOMP de um jeito que faz sentido',
  description:
    '25 tópicos do edital POSCOMP em trilhas visuais. Autômatos animados, simulados reais, flashcards com repetição espaçada — tudo em português.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${geistMono.variable}`}
      style={{ ['--fb' as string]: 'var(--fd)' }}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

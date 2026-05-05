import type { Metadata } from 'next';
import { DM_Mono, DM_Sans, Geist, Geist_Mono, Syne } from 'next/font/google';

import { AppProviders } from '@/components/auth/app-providers';

import './globals.css';
import '@/components/marketing/aprovado-tokens.css';

// Landing pública (aprovado.xyz)
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

// Área logada (mockups POSCOMP Visual Lab)
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'aprovado.xyz · estude para o POSCOMP de um jeito que faz sentido',
  description:
    '25 tópicos do edital POSCOMP em trilhas visuais. Autômatos animados, simulados reais, flashcards com repetição espaçada — tudo em português.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVariables = [
    geist.variable,
    geistMono.variable,
    syne.variable,
    dmSans.variable,
    dmMono.variable,
  ].join(' ');

  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

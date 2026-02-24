import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POSCOMP Visual Lab',
  description: 'Plataforma de estudo POSCOMP - V1 Autômatos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

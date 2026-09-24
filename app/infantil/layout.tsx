import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Base para canonical/OG das páginas do curso infantil (mesma origem do sitemap). */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aprovado.xyz'),
};

/**
 * Pass-through: as páginas do infantil renderizam dentro do StudyShell
 * (o padrão do site), então o layout só carrega a metadataBase comum —
 * sem header/footer próprios.
 */
export default function InfantilLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

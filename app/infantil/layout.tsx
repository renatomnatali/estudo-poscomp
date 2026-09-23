import type { ReactNode } from 'react';
import Link from 'next/link';

import { Lockup } from '@/components/marketing/lockup';

/**
 * Chrome público do curso infantil: páginas gratuitas e anônimas, sem auth —
 * o mesmo rodapé/lockup da área pública do site.
 */
export default function InfantilLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-n-50">
      <header className="border-b border-n-200 bg-white">
        <div className="mx-auto flex w-full max-w-[920px] items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="aprovado.xyz — página inicial">
            <Lockup size="sm" />
          </Link>
          <Link href="/infantil" className="text-sm font-semibold text-sap hover:underline">
            Curso Infantil
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-n-200 bg-white">
        <div className="mx-auto w-full max-w-[920px] px-4 py-6 text-xs text-n-500 sm:px-6">
          © 2026 aprovado.xyz · aulas de matemática gratuitas para estudar em casa
        </div>
      </footer>
    </div>
  );
}

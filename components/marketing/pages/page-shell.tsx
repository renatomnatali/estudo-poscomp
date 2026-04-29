import type { ReactNode } from 'react';
import Link from 'next/link';

import { Icon } from '../icon';
import { Lockup } from '../lockup';

import '../landing.css';
import '../pages.css';

const PAGE_LINKS: { href: string; label: string }[] = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
  { href: '/termos', label: 'Termos' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/cookies', label: 'Cookies' },
];

interface PageShellProps {
  current: '/sobre' | '/contato' | '/termos' | '/privacidade' | '/cookies';
  children: ReactNode;
}

export function PageShell({ current, children }: PageShellProps) {
  return (
    <div className="marketing page-shell">
      <nav className="page-nav">
        <div className="page-nav-inner">
          <Link href="/" aria-label="aprovado.xyz">
            <Lockup size="sm" />
          </Link>
          <Link href="/" className="back">
            <Icon name="arrow-left" size={14} /> voltar para a landing
          </Link>
        </div>
      </nav>

      {children}

      <footer className="page-foot">
        <span>© 2026 aprovado.xyz · independente · não afiliado à SBC</span>
        <div>
          {PAGE_LINKS.filter((l) => l.href !== current).map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

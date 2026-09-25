import type { ReactNode } from 'react';
import Link from 'next/link';

import { Icon } from '@/components/marketing/icon';
import { Lockup } from '@/components/marketing/lockup';

import './auth.css';
import '../marketing/pages.css';

const FOOT_LINKS: { href: string; label: string }[] = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
  { href: '/termos', label: 'Termos' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/cookies', label: 'Cookies' },
];

/**
 * Chrome público das telas de conta — nav sticky (lockup + voltar para a
 * home) e rodapé padrão, iguais ao mockup (Spec/mockup/auth/*.html) e ao
 * PageShell das páginas institucionais. O conteúdo (eyebrow, título,
 * formulário/estado) é responsabilidade de cada tela.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <nav className="page-nav" aria-label="Navegação principal">
        <div className="page-nav-inner">
          <Link href="/" style={{ textDecoration: 'none' }} aria-label="aprovado — página inicial">
            <Lockup size="sm" />
          </Link>
          <Link href="/" className="back">
            <Icon name="arrow-left" size={14} /> voltar para a home
          </Link>
        </div>
      </nav>

      <main className="auth-main">
        <div className="auth-wrap">{children}</div>
      </main>

      <footer className="page-foot">
        <span>© 2026 aprovado.xyz · independente · não afiliado à SBC</span>
        <div>
          {FOOT_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

import Link from 'next/link';

import { Icon } from '../icon';
import { Lockup } from '../lockup';

export function NavLanding() {
  return (
    <nav className="nav on-dark">
      <div className="wrap nav-inner">
        <Link href="/" aria-label="aprovado.xyz">
          <Lockup size="sm" dark />
        </Link>
        <div className="nav-links">
          <a href="#por-que" className="nav-link">
            Por que visual
          </a>
          <a href="#curriculo" className="nav-link">
            Currículo
          </a>
          <a href="#tour" className="nav-link">
            Por dentro
          </a>
          <a href="#planos" className="nav-link">
            Planos
          </a>
          <Link href="/cadastro" className="nav-cta">
            Começar grátis <Icon name="arrow-right" size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

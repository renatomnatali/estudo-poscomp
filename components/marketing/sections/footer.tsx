import Link from 'next/link';

import { Lockup } from '../lockup';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Lockup size="sm" />
          <div className="footer-domain">aprovado.xyz</div>
          <div className="footer-tag">
            Estude para o POSCOMP de um jeito que faz sentido. Baseado no edital SBC 2025.
          </div>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <div className="footer-col-ttl">Produto</div>
            <a href="#por-que">Por que visual</a>
            <a href="#curriculo">Currículo</a>
            <a href="#tour">Por dentro</a>
            <a href="#planos">Planos</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-ttl">Empresa</div>
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>
          </div>
          <div className="footer-col">
            <div className="footer-col-ttl">Legal</div>
            <Link href="/termos">Termos</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
      <div className="footer-foot wrap">
        <span>© 2026 aprovado.xyz · todos os direitos reservados</span>
        <span>independente · não afiliado à SBC</span>
      </div>
    </footer>
  );
}

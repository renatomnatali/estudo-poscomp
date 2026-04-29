import Link from 'next/link';

import { Icon } from '../icon';

export function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <h2>
          Pronto pra estudar o POSCOMP <span className="em">de verdade?</span>
        </h2>
        <p>
          Linguagens Formais completa, gratuita, agora. Em menos de 2 minutos você está
          rodando o primeiro AFD.
        </p>
        <div className="actions">
          <Link href="/cadastro" className="btn-primary">
            Criar conta grátis <Icon name="arrow-right" size={16} />
          </Link>
          <a href="#curriculo" className="btn-ghost-dark">
            Ver currículo completo
          </a>
        </div>
        <div className="final-cta-domain">→ aprovado.xyz</div>
      </div>
    </section>
  );
}

import Link from 'next/link';

import { Icon } from '../icon';

export function Pricing() {
  return (
    <section className="section pricing-section" id="planos">
      <div className="wrap">
        <div className="section-hd center">
          <span className="eyebrow">Planos</span>
          <h2>
            Comece grátis. <span className="em">Continue se valer a pena</span>.
          </h2>
          <p>
            Linguagens Formais completo no free, sem cartão. Premium libera tudo e financia
            novos módulos.
          </p>
        </div>

        <div className="plans">
          <div className="plan free">
            <div className="plan-head">
              <span className="plan-tag free-tag">Free</span>
              <h3>Para começar</h3>
            </div>
            <div className="plan-price">
              R$0<span className="per">/sempre</span>
            </div>
            <div className="plan-price-sub">Sem cartão de crédito</div>
            <ul>
              <li>
                <Icon name="check" size={16} className="check" />F6 · Linguagens Formais (9
                módulos completos)
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                47 flashcards de F6 com spaced rep.
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Simulado parcial (20 questões)
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Dashboard com progresso básico
              </li>
              <li className="muted">
                <Icon name="lock" size={16} className="lock" />
                Demais 24 tópicos do edital
              </li>
              <li className="muted">
                <Icon name="lock" size={16} className="lock" />
                Simulado completo (70 questões)
              </li>
            </ul>
            <Link href="/cadastro" className="btn-plan">
              Criar conta grátis
            </Link>
            <div className="plan-fineprint">2 minutos · sem cartão</div>
          </div>

          <div className="plan featured">
            <div className="plan-head">
              <span className="plan-tag pop-tag">
                <Icon
                  name="sparkles"
                  size={11}
                  style={{
                    display: 'inline-block',
                    verticalAlign: '-2px',
                    marginRight: '4px',
                  }}
                />
                Mais escolhido
              </span>
              <h3>Premium</h3>
            </div>
            <div className="plan-price">
              R$39<span className="per">/mês</span>
            </div>
            <div className="plan-price-sub">ou R$299/ano · economize 36%</div>
            <ul>
              <li>
                <Icon name="check" size={16} className="check" />
                Todos os 25 tópicos conforme liberados
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Todos os flashcards + spaced rep.
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Simulado completo (70 questões)
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Analytics detalhado por tópico
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Histórico de simulados ilimitado
              </li>
              <li>
                <Icon name="check" size={16} className="check" />
                Acesso antecipado a novos módulos
              </li>
            </ul>
            <Link href="/premium" className="btn-plan">
              Assinar Premium <Icon name="arrow-right" size={14} />
            </Link>
            <div className="plan-fineprint">Sem fidelidade · reembolso total em 7 dias</div>
          </div>
        </div>
      </div>
    </section>
  );
}

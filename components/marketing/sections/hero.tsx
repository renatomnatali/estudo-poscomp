import Link from 'next/link';

import { Icon } from '../icon';
import { BubbleSortSim } from '../sims/bubble-sort-sim';

interface StatProps {
  val: string;
  unit?: string;
  label: string;
}

function Stat({ val, unit, label }: StatProps) {
  return (
    <div className="stat-cell">
      <div className="stat-val tabular">
        {val}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero-slab">
      <div className="hero">
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="dot" /> aprovado.xyz · Edital SBC 2025 · POSCOMP
          </span>
          <h1>
            Estude para o<br />
            POSCOMP de um<br />
            jeito que <span className="em">faz sentido</span>.
          </h1>
          <p className="hero-sub">
            25 tópicos do edital em trilhas visuais. Autômatos animados, simulados reais,
            flashcards com repetição espaçada — tudo em português, baseado nos livros da SBC.
          </p>
          <div className="hero-actions">
            <Link href="/cadastro" className="btn-primary">
              Começar grátis <Icon name="arrow-right" size={16} />
            </Link>
            <a href="#por-que" className="btn-ghost-dark">
              <Icon name="play" size={12} /> Ver simulador ao vivo
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <span className="check">✓</span> Sem cartão de crédito
            </span>
            <span>
              <span className="check">✓</span> Linguagens Formais 100% no plano free
            </span>
            <span>
              <span className="check">✓</span> Sem fidelidade
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <BubbleSortSim />
        </div>
      </div>

      <div className="stats-strip wrap">
        <Stat val="25" label="tópicos do edital cobertos" />
        <Stat val="9" label="módulos interativos de Linguagens Formais" />
        <Stat val="70" label="questões no simulado oficial" />
        <Stat val="100" unit="%" label="baseado no edital SBC" />
      </div>
    </section>
  );
}

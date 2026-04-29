import { Icon, type IconName } from '../icon';

type Tone = 'sap' | 'em' | 'amb' | 'coral';

interface FeatureItem {
  icon: IconName;
  tone: Tone;
  eyebrow: string;
  ttl: string;
  sub: string;
}

const ITEMS: FeatureItem[] = [
  {
    icon: 'route',
    tone: 'sap',
    eyebrow: 'Trilha',
    ttl: 'O caminho pelo edital',
    sub: '25 tópicos organizados como o edital SBC. Você sempre sabe onde está e o que falta.',
  },
  {
    icon: 'workflow',
    tone: 'em',
    eyebrow: 'Visualizações',
    ttl: 'Teoria interativa',
    sub: 'Autômatos animados, diagramas de estado clicáveis, algoritmos passo a passo.',
  },
  {
    icon: 'timer',
    tone: 'amb',
    eyebrow: 'Simulado',
    ttl: 'Fiel ao real',
    sub: '70 questões, 4 horas, mesma distribuição do POSCOMP. Gabarito comentado e análise por área.',
  },
  {
    icon: 'layers',
    tone: 'coral',
    eyebrow: 'Flashcards',
    ttl: 'Repetição espaçada',
    sub: 'Algoritmo prioriza o que você está esquecendo. 15 minutos por dia funciona.',
  },
  {
    icon: 'trending-up',
    tone: 'sap',
    eyebrow: 'Progresso',
    ttl: 'Onde você está fraco',
    sub: 'Heatmap por área e subtópico mostra exatamente o que revisar antes da prova.',
  },
  {
    icon: 'book-open',
    tone: 'em',
    eyebrow: 'Conteúdo',
    ttl: '100% em português',
    sub: 'Sem depender de tradução do Sipser ou apostilas xerocadas de universidade.',
  },
];

export function Features() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">O que tem dentro</span>
          <h2>
            Tudo que você <span className="em">precisa</span>.
          </h2>
        </div>
        <div className="features-grid">
          {ITEMS.map((it) => (
            <div className="feat-card" key={it.eyebrow + it.ttl}>
              <div className={`icon-tile ${it.tone}`}>
                <Icon name={it.icon} size={20} />
              </div>
              <div
                className={`feat-eyebrow ${
                  it.tone === 'em'
                    ? 'em-c'
                    : it.tone === 'amb'
                      ? 'amb-c'
                      : it.tone === 'coral'
                        ? 'coral-c'
                        : ''
                }`}
              >
                {it.eyebrow}
              </div>
              <h3>{it.ttl}</h3>
              <p>{it.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

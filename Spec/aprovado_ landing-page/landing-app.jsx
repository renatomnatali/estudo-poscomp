/* global React, AutomatonSim */
const { useState, useMemo } = React;

/* ============================================================
   ICON — minimal Lucide-style stroke icons
   stroke=1.75, 24x24, currentColor
   ============================================================ */
function Icon({ name, size = 20, ...rest }) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.75,
    strokeLinecap: 'round', strokeLinejoin: 'round', ...rest,
  };
  switch (name) {
    case 'route':
      return <svg {...props}><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>;
    case 'workflow':
      return <svg {...props}><rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>;
    case 'timer':
      return <svg {...props}><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>;
    case 'layers':
      return <svg {...props}><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>;
    case 'trending-up':
      return <svg {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    case 'book-open':
      return <svg {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
    case 'flame':
      return <svg {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
    case 'sparkles':
      return <svg {...props}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    case 'check':
      return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'arrow-right':
      return <svg {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case 'play':
      return <svg {...props}><polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/></svg>;
    case 'lock':
      return <svg {...props}><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
    case 'eye':
      return <svg {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'circle-help':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
    case 'menu':
      return <svg {...props}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
    default: return null;
  }
}

/* ============================================================
   APROVADO LOCKUP
   ============================================================ */
function Lockup({ size = 'sm', dark = false }) {
  const cls = `aprovado-lockup is-${size} ${dark ? 'on-dark' : ''}`;
  return (
    <span className={cls}>
      <span className="aprovado-ring"><Icon name="check" size={size === 'sm' ? 14 : 18} strokeWidth={3} /></span>
      <span className="aprovado-word">aprov<span className="a">a</span>do</span>
    </span>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Nav() {
  return (
    <nav className="nav on-dark">
      <div className="wrap nav-inner">
        <a href="#"><Lockup size="sm" dark /></a>
        <div className="nav-links">
          <a href="#por-que" className="nav-link">Por que visual</a>
          <a href="#curriculo" className="nav-link">Currículo</a>
          <a href="#tour" className="nav-link">Por dentro</a>
          <a href="#planos" className="nav-link">Planos</a>
          <a href="#planos" className="nav-cta">Começar grátis <Icon name="arrow-right" size={14} /></a>
        </div>
      </div>
    </nav>
  );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  return (
    <section className="hero-slab">
      <div className="hero">
        <div className="hero-copy">
          <span className="hero-pill"><span className="dot" /> aprovado.xyz · Edital SBC 2025 · POSCOMP</span>
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
            <a href="#planos" className="btn-primary">
              Começar grátis <Icon name="arrow-right" size={16} />
            </a>
            <a href="#por-que" className="btn-ghost-dark">
              <Icon name="play" size={12} /> Ver simulador ao vivo
            </a>
          </div>
          <div className="hero-trust">
            <span><span className="check">✓</span> Sem cartão de crédito</span>
            <span><span className="check">✓</span> Linguagens Formais 100% no plano free</span>
            <span><span className="check">✓</span> Sem fidelidade</span>
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
function Stat({ val, unit, label }) {
  return (
    <div className="stat-cell">
      <div className="stat-val tabular">{val}{unit && <span className="unit">{unit}</span>}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ============================================================
   REFS STRIP
   ============================================================ */
function RefsStrip() {
  return (
    <div className="refs-strip">
      <div className="refs-inner">
        <span className="refs-label">Baseado em</span>
        <div className="refs-divider" />
        <span className="ref-pill">Edital SBC 2025</span>
        <span className="ref-pill">Sipser 3ª ed.</span>
        <span className="ref-pill">Cormen / CLRS 4ª</span>
        <span className="ref-pill">Tanenbaum</span>
        <span className="ref-pill">Hopcroft</span>
        <div className="refs-divider" />
        <span className="refs-label">70 questões · 4 áreas · 4 horas</span>
      </div>
    </div>
  );
}

/* ============================================================
   POR QUE VISUAL
   ============================================================ */
function PorQue() {
  return (
    <section className="section why-section" id="por-que">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Por que visual</span>
          <h2 style={{maxWidth: '720px'}}>Não é PDF. Não é videoaula.<br/>É teoria que você vê <span className="em">funcionando</span>.</h2>
          <p style={{maxWidth:'620px'}}>
            Você acabou de testar um AFD lá em cima — esse é o nosso conteúdo,
            não uma demo de marketing. Cada conceito do edital tem uma visualização
            que você manipula. Entender vira muscle memory.
          </p>
        </div>

        <div className="why-grid">
          <div className="why-copy">
            <div className="quote">
              "Eu construí o aprovado pra me ajudar a estudar pro POSCOMP.
              <span className="em"> Funcionou pra mim antes de funcionar pra qualquer um</span>."
            </div>
            <div className="meta">— Renato Natali, criador · candidato POSCOMP</div>

            <div className="why-bullets">
              <div className="b">
                <span className="icon-tile"><Icon name="play" size={14} /></span>
                <div>
                  <strong>Manipule, não memorize</strong>
                  Edite a string de entrada, clique nos estados, veja a transição em tempo real.
                </div>
              </div>
              <div className="b em-tile">
                <span className="icon-tile"><Icon name="check" size={14} /></span>
                <div>
                  <strong>Cobertura real do edital</strong>
                  Começamos por Linguagens Formais — 9 módulos completos. Análise de Algoritmos e Lógica Matemática chegam em seguida.
                </div>
              </div>
              <div className="b amb-tile">
                <span className="icon-tile"><Icon name="timer" size={14} /></span>
                <div>
                  <strong>Sessões de 30–45 min</strong>
                  Cada módulo tem visualização, exemplo guiado e 5 exercícios. Cabe num intervalo.
                </div>
              </div>
            </div>
          </div>

          <PorDentroDoBubble />
        </div>
      </div>
    </section>
  );
}

function PorDentroDoBubble() {
  return <AutomatonSim />;
}

/* ============================================================
   FEATURES
   ============================================================ */
function Features() {
  const items = [
    { icon: 'route', tone: 'sap', eyebrow: 'Trilha', ttl: 'O caminho pelo edital', sub: '25 tópicos organizados como o edital SBC. Você sempre sabe onde está e o que falta.' },
    { icon: 'workflow', tone: 'em', eyebrow: 'Visualizações', ttl: 'Teoria interativa', sub: 'Autômatos animados, diagramas de estado clicáveis, algoritmos passo a passo.' },
    { icon: 'timer', tone: 'amb', eyebrow: 'Simulado', ttl: 'Fiel ao real', sub: '70 questões, 4 horas, mesma distribuição do POSCOMP. Gabarito comentado e análise por área.' },
    { icon: 'layers', tone: 'coral', eyebrow: 'Flashcards', ttl: 'Repetição espaçada', sub: 'Algoritmo prioriza o que você está esquecendo. 15 minutos por dia funciona.' },
    { icon: 'trending-up', tone: 'sap', eyebrow: 'Progresso', ttl: 'Onde você está fraco', sub: 'Heatmap por área e subtópico mostra exatamente o que revisar antes da prova.' },
    { icon: 'book-open', tone: 'em', eyebrow: 'Conteúdo', ttl: '100% em português', sub: 'Sem depender de tradução do Sipser ou apostilas xerocadas de universidade.' },
  ];
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">O que tem dentro</span>
          <h2>Tudo que você <span className="em">precisa</span>.</h2>
        </div>
        <div className="features-grid">
          {items.map((it, i) => (
            <div className="feat-card" key={i}>
              <div className={`icon-tile ${it.tone}`}><Icon name={it.icon} size={20} /></div>
              <div className={`feat-eyebrow ${it.tone === 'em' ? 'em-c' : it.tone === 'amb' ? 'amb-c' : it.tone === 'coral' ? 'coral-c' : ''}`}>{it.eyebrow}</div>
              <h3>{it.ttl}</h3>
              <p>{it.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CURRICULUM 5x5 (actually 8 cols, 3 rows by area)
   ============================================================ */
const TOPICS = {
  F1: { area: 'fund', name: 'Análise de Algoritmos', desc: 'Complexidade assintótica, recorrências, master theorem, classes P/NP.', mods: ['Notação O, Ω, Θ', 'Recorrências e árvores', 'Divisão e conquista', 'Programação dinâmica', 'NP-completude'], status: 'soon' },
  F2: { area: 'fund', name: 'Algoritmos e Estruturas de Dados', desc: 'Listas, árvores, hashes, grafos. Os blocos que aparecem em metade da prova.', mods: ['Listas e pilhas', 'Árvores balanceadas', 'Hash tables', 'Grafos e busca'], status: 'soon' },
  F3: { area: 'fund', name: 'Arquitetura de Computadores', desc: 'Pipeline, memória cache, hierarquia, ISA. O lado físico do código.', mods: ['Pipeline MIPS', 'Hierarquia de memória', 'Cache e localidade'], status: 'soon' },
  F4: { area: 'fund', name: 'Circuitos Digitais', desc: 'Lógica combinacional e sequencial, mapas de Karnaugh, flip-flops.', mods: ['Álgebra booleana', 'Karnaugh', 'Flip-flops'], status: 'soon' },
  F5: { area: 'fund', name: 'Sistemas Operacionais', desc: 'Processos, threads, escalonamento, deadlock, memória virtual.', mods: ['Processos & threads', 'Escalonamento', 'Sincronização', 'Memória virtual'], status: 'soon' },
  F6: { area: 'fund', name: 'Linguagens Formais e Autômatos', desc: 'AFDs, AFNs, expressões regulares, gramáticas livres de contexto, máquinas de Turing.', mods: ['Conceitos básicos', 'AFDs', 'AFD que reconhece "ab"', 'Lema do Bombeamento', 'AFN e equivalência', 'Expressões regulares', 'Gramáticas livres de contexto', 'Autômato de pilha', 'Máquinas de Turing'], status: 'free' },
  M1: { area: 'mat', name: 'Análise Combinatória', desc: 'Permutações, combinações, princípio da inclusão-exclusão.', mods: ['Permutações', 'Combinações', 'Inclusão-exclusão'], status: 'soon' },
  M2: { area: 'mat', name: 'Álgebra Linear', desc: 'Espaços vetoriais, transformações lineares, autovalores.', mods: ['Espaços vetoriais', 'Transformações', 'Autovalores'], status: 'soon' },
  M3: { area: 'mat', name: 'Cálculo Diferencial e Integral', desc: 'Limites, derivadas, integrais — o cálculo que cai no POSCOMP.', mods: ['Limites', 'Derivadas', 'Integrais'], status: 'soon' },
  M4: { area: 'mat', name: 'Lógica Matemática', desc: 'Lógica proposicional e de predicados, dedução natural, tableaux.', mods: ['Proposicional', 'Predicados', 'Dedução natural'], status: 'soon' },
  M5: { area: 'mat', name: 'Matemática Discreta', desc: 'Conjuntos, relações, funções, indução, grafos.', mods: ['Conjuntos & relações', 'Indução', 'Teoria dos grafos'], status: 'soon' },
  M6: { area: 'mat', name: 'Probabilidade e Estatística', desc: 'Espaços amostrais, distribuições, estimadores.', mods: ['Probabilidade', 'Distribuições', 'Estatística inferencial'], status: 'soon' },
  M7: { area: 'mat', name: 'Geometria Analítica', desc: 'Vetores, retas, planos, cônicas no R² e R³.', mods: ['Vetores', 'Retas e planos', 'Cônicas'], status: 'soon' },
  T1: { area: 'tec', name: 'Banco de Dados', desc: 'Modelo relacional, SQL, normalização, transações.', mods: ['Relacional', 'SQL', 'Normalização', 'Transações'], status: 'soon' },
  T2: { area: 'tec', name: 'Computação Gráfica', desc: 'Pipeline gráfico, transformações, rasterização, iluminação.', mods: ['Transformações 2D/3D', 'Rasterização', 'Iluminação'], status: 'soon' },
  T3: { area: 'tec', name: 'Engenharia de Software', desc: 'Processos, requisitos, padrões, testes, qualidade.', mods: ['Processos ágeis', 'Padrões de projeto', 'Testes'], status: 'soon' },
  T4: { area: 'tec', name: 'Inteligência Artificial', desc: 'Busca, lógica, aprendizado de máquina, redes neurais.', mods: ['Busca heurística', 'Aprendizado supervisionado', 'Redes neurais'], status: 'soon' },
  T5: { area: 'tec', name: 'Linguagens de Programação', desc: 'Paradigmas, semântica, tipos, compiladores.', mods: ['Paradigmas', 'Sistema de tipos', 'Compiladores'], status: 'soon' },
  T6: { area: 'tec', name: 'Redes de Computadores', desc: 'Modelo OSI/TCP-IP, protocolos, roteamento, segurança.', mods: ['Camadas', 'TCP/IP', 'Roteamento'], status: 'soon' },
  T7: { area: 'tec', name: 'Sistemas Distribuídos', desc: 'Comunicação, consenso, consistência, tolerância a falhas.', mods: ['RPC', 'Consenso', 'Consistência'], status: 'soon' },
  T8: { area: 'tec', name: 'Programação', desc: 'Estruturas de controle, modularização, depuração.', mods: ['Estruturas básicas', 'Modularização', 'Boas práticas'], status: 'soon' },
};

const AREAS = [
  { id: 'fund', name: 'Fundamentos da Computação', codes: ['F1','F2','F3','F4','F5','F6'], color: 'var(--sap)' },
  { id: 'mat',  name: 'Matemática para Computação', codes: ['M1','M2','M3','M4','M5','M6','M7'], color: 'var(--amb)' },
  { id: 'tec',  name: 'Tecnologia da Computação', codes: ['T1','T2','T3','T4','T5','T6','T7','T8'], color: 'var(--coral)' },
];

function Curriculum() {
  const [selected, setSelected] = useState('F6');
  const t = TOPICS[selected];
  return (
    <section className="section curriculum-section" id="curriculo">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Currículo</span>
          <h2>25 tópicos do edital.<br/>Um caminho <span className="em">claro</span>.</h2>
          <p>Linguagens Formais está liberado no plano free, completo. Os outros chegam em ondas — assinantes premium acessam em primeira mão.</p>
        </div>

        <div className="curriculum-grid">
          <div className="edital-map">
            <div className="edital-areas">
              {AREAS.map(a => (
                <div className="edital-area-row" key={a.id}>
                  <div className="edital-area-head">
                    <div className="edital-area-name">
                      <span className="edital-area-dot" style={{background:a.color}} />
                      {a.name}
                    </div>
                    <span className="edital-area-count">{a.codes.length} tópicos</span>
                  </div>
                  <div className="edital-tiles">
                    {a.codes.map(code => {
                      const isFree = TOPICS[code].status === 'free';
                      const isSel = selected === code;
                      const cls = ['edital-tile', isFree ? 'free' : '', isSel ? 'selected' : ''].filter(Boolean).join(' ');
                      return (
                        <button key={code} className={cls} onMouseEnter={() => setSelected(code)} onClick={() => setSelected(code)}>
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="edital-legend">
              <span className="lg"><span className="swatch free"/> Liberado no free</span>
              <span className="lg"><span className="swatch locked"/> Premium ou em breve</span>
              <span className="lg" style={{marginLeft:'auto'}}>passe o mouse para ver detalhes</span>
            </div>
          </div>

          <div className="topic-detail">
            <div className="td-eyebrow">{selected} · {AREAS.find(a => a.id === t.area).name}</div>
            <h3>{t.name}</h3>
            <div className={`td-status ${t.status === 'free' ? 'free' : 'premium'}`}>
              {t.status === 'free' ? <><Icon name="check" size={12} /> Free · 100% disponível</> : <><Icon name="lock" size={12} /> Premium · em construção</>}
            </div>
            <div className="td-desc">{t.desc}</div>
            <div className="td-modules">
              <div className="ttl">Módulos previstos · {t.mods.length}</div>
              {t.mods.map((m, i) => (
                <div className="td-mod" key={i}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="name">{m}</span>
                  <span className="dur">{t.status === 'free' ? '~35 min' : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TOUR — 3 product mini-mocks
   ============================================================ */
function Tour() {
  return (
    <section className="section" id="tour">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Por dentro</span>
          <h2>Três telas, um <span className="em">fluxo</span>.</h2>
          <p>Diagnóstico, módulos visuais, simulado. O ciclo que você repete até o dia da prova.</p>
        </div>

        <div className="tour-grid">
          <div className="tour-card">
            <div className="tour-mock lit">
              <div className="tour-mock-inner">
                <div className="mock-eyebrow">Dashboard · semana 4</div>
                <div className="dash-row">
                  <div className="dash-tile"><div className="v tabular">12<span style={{fontSize:'0.6em', color:'var(--on-dark-3)'}}>/25</span></div><div className="l">tópicos</div></div>
                  <div className="dash-tile"><div className="v tabular">68<span className="em">%</span></div><div className="l">acerto</div></div>
                </div>
                <div className="dash-progress">
                  <div className="lbl"><span>F6 · Linguagens Formais</span><span className="em" style={{color:'var(--em)'}}>78%</span></div>
                  <div className="dash-bar"><div style={{width:'78%'}} /></div>
                </div>
                <div className="dash-progress">
                  <div className="lbl"><span>M5 · Matemática Discreta</span><span>32%</span></div>
                  <div className="dash-bar"><div style={{width:'32%', background:'var(--sap-l)'}} /></div>
                </div>
                <div className="dash-streak">
                  <Icon name="flame" size={18} className="flame" style={{color:'var(--amb)'}} />
                  <div className="txt"><strong>14 dias seguidos</strong> · seu recorde é 18</div>
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">01 · Diagnóstico</span>
              <h3>Saiba onde você está</h3>
              <p>Três perguntas montam seu plano. Dashboard mostra progresso por área, dia a dia.</p>
            </div>
          </div>

          <div className="tour-card">
            <div className="tour-mock lit">
              <div className="tour-mock-inner mod-mock">
                <div className="mock-eyebrow">F6 · módulo 3 de 9</div>
                <div className="mod-card-mini">
                  <div className="code">Autômatos finitos determinísticos</div>
                  <div className="ttl">AFD que reconhece "ab"</div>
                </div>
                <div className="mini-aut">
                  <div className="mini-state init">q₀</div>
                  <div className="mini-arrow"><span className="lbl">a</span><span className="ln" /></div>
                  <div className="mini-state norm">q₁</div>
                  <div className="mini-arrow"><span className="lbl">b</span><span className="ln" /></div>
                  <div className="mini-state acc">q₂</div>
                </div>
                <div style={{fontFamily:'var(--fm)', fontSize:'0.7rem', color:'var(--on-dark-2)', textAlign:'center', marginTop:'auto'}}>
                  M = (E, Σ, δ, e₀, F)
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">02 · Módulo visual</span>
              <h3>Aprenda manipulando</h3>
              <p>Cada módulo tem visualização interativa, exemplo guiado e 5 exercícios. 35 a 45 min.</p>
            </div>
          </div>

          <div className="tour-card">
            <div className="tour-mock lit">
              <div className="tour-mock-inner">
                <div className="sim-timer">
                  <div className="t tabular">02:43:18</div>
                  <div className="q">Q. 27 / 70</div>
                </div>
                <div className="sim-q">
                  Considere o AFD <span className="code">M = (E, Σ, δ, q₀, F)</span> com Σ = {'{a, b}'}. Qual linguagem M reconhece?
                </div>
                <div className="sim-opts">
                  <div className="sim-opt"><span className="letter">A</span>strings com nº par de a</div>
                  <div className="sim-opt selected"><span className="letter">B</span>strings terminadas em "ab"</div>
                  <div className="sim-opt"><span className="letter">C</span>palíndromos sobre {'{a,b}'}</div>
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">03 · Simulado</span>
              <h3>Ensaie a prova real</h3>
              <p>70 questões, 4 horas, mesma distribuição do POSCOMP. Relatório de erros aponta o módulo certo pra revisar.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRICING
   ============================================================ */
function Pricing() {
  return (
    <section className="section pricing-section" id="planos">
      <div className="wrap">
        <div className="section-hd center">
          <span className="eyebrow">Planos</span>
          <h2>Comece grátis. <span className="em">Continue se valer a pena</span>.</h2>
          <p>Linguagens Formais completo no free, sem cartão. Premium libera tudo e financia novos módulos.</p>
        </div>

        <div className="plans">
          <div className="plan free">
            <div className="plan-head">
              <span className="plan-tag free-tag">Free</span>
              <h3>Para começar</h3>
            </div>
            <div className="plan-price">R$0<span className="per">/sempre</span></div>
            <div className="plan-price-sub">Sem cartão de crédito</div>
            <ul>
              <li><Icon name="check" size={16} className="check" />F6 · Linguagens Formais (9 módulos completos)</li>
              <li><Icon name="check" size={16} className="check" />47 flashcards de F6 com spaced rep.</li>
              <li><Icon name="check" size={16} className="check" />Simulado parcial (20 questões)</li>
              <li><Icon name="check" size={16} className="check" />Dashboard com progresso básico</li>
              <li className="muted"><Icon name="lock" size={16} className="lock" />Demais 24 tópicos do edital</li>
              <li className="muted"><Icon name="lock" size={16} className="lock" />Simulado completo (70 questões)</li>
            </ul>
            <a href="#" className="btn-plan">Criar conta grátis</a>
            <div className="plan-fineprint">2 minutos · sem cartão</div>
          </div>

          <div className="plan featured">
            <div className="plan-head">
              <span className="plan-tag pop-tag"><Icon name="sparkles" size={11} style={{display:'inline-block', verticalAlign:'-2px', marginRight:'4px'}} />Mais escolhido</span>
              <h3>Premium</h3>
            </div>
            <div className="plan-price">R$39<span className="per">/mês</span></div>
            <div className="plan-price-sub">ou R$299/ano · economize 36%</div>
            <ul>
              <li><Icon name="check" size={16} className="check" />Todos os 25 tópicos conforme liberados</li>
              <li><Icon name="check" size={16} className="check" />Todos os flashcards + spaced rep.</li>
              <li><Icon name="check" size={16} className="check" />Simulado completo (70 questões)</li>
              <li><Icon name="check" size={16} className="check" />Analytics detalhado por tópico</li>
              <li><Icon name="check" size={16} className="check" />Histórico de simulados ilimitado</li>
              <li><Icon name="check" size={16} className="check" />Acesso antecipado a novos módulos</li>
            </ul>
            <a href="#" className="btn-plan">Assinar Premium <Icon name="arrow-right" size={14} /></a>
            <div className="plan-fineprint">Sem fidelidade · reembolso total em 7 dias</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA
   ============================================================ */
function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="final-cta-inner">
        <h2>Pronto pra estudar o POSCOMP <span className="em">de verdade?</span></h2>
        <p>Linguagens Formais completa, gratuita, agora. Em menos de 2 minutos você está rodando o primeiro AFD.</p>
        <div className="actions">
          <a href="#" className="btn-primary">Criar conta grátis <Icon name="arrow-right" size={16} /></a>
          <a href="#curriculo" className="btn-ghost-dark">Ver currículo completo</a>
        </div>
        <div className="final-cta-domain">→ aprovado.xyz</div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
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
            <a href="pages/sobre.html">Sobre</a>
            <a href="pages/contato.html">Contato</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-ttl">Legal</div>
            <a href="pages/termos.html">Termos</a>
            <a href="pages/privacidade.html">Privacidade</a>
            <a href="pages/cookies.html">Cookies</a>
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

/* ============================================================
   APP
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mood": "studio",
  "density": "comfort",
  "playfulness": 65
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweaks as data-attrs on <html> + a CSS var for the slider.
  React.useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-mood', t.mood);
    r.setAttribute('data-density', t.density);
    r.style.setProperty('--play', String(t.playfulness / 100));
  }, [t.mood, t.density, t.playfulness]);

  return (
    <>
      <Nav />
      <Hero />
      <RefsStrip />
      <PorQue />
      <Features />
      <Curriculum />
      <Tour />
      <Pricing />
      <FinalCTA />
      <Footer />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Mood">
          <TweakRadio
            label="Color & weight system"
            value={t.mood}
            options={[
              { value: 'studio',    label: 'Studio' },
              { value: 'arcade',    label: 'Arcade' },
              { value: 'editorial', label: 'Editorial' },
            ]}
            onChange={(v) => setTweak('mood', v)}
          />
        </TweakSection>
        <TweakSection label="Density">
          <TweakRadio
            label="Spacing & type scale"
            value={t.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfort', label: 'Comfort' },
              { value: 'cozy',    label: 'Cozy' },
            ]}
            onChange={(v) => setTweak('density', v)}
          />
        </TweakSection>
        <TweakSection label="Playfulness">
          <TweakSlider
            label="Wobble · glow · pulse"
            value={t.playfulness}
            min={0} max={100} step={5} unit="%"
            onChange={(v) => setTweak('playfulness', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

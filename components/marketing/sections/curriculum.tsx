'use client';

import { useState } from 'react';

import { Icon } from '../icon';

type AreaId = 'fund' | 'mat' | 'tec';
type Status = 'free' | 'soon';

interface Topic {
  area: AreaId;
  name: string;
  desc: string;
  mods: string[];
  status: Status;
}

const TOPICS: Record<string, Topic> = {
  F1: {
    area: 'fund',
    name: 'Análise de Algoritmos',
    desc: 'Complexidade assintótica, recorrências, master theorem, classes P/NP.',
    mods: [
      'Notação O, Ω, Θ',
      'Recorrências e árvores',
      'Divisão e conquista',
      'Programação dinâmica',
      'NP-completude',
    ],
    status: 'soon',
  },
  F2: {
    area: 'fund',
    name: 'Algoritmos e Estruturas de Dados',
    desc: 'Listas, árvores, hashes, grafos. Os blocos que aparecem em metade da prova.',
    mods: ['Listas e pilhas', 'Árvores balanceadas', 'Hash tables', 'Grafos e busca'],
    status: 'soon',
  },
  F3: {
    area: 'fund',
    name: 'Arquitetura de Computadores',
    desc: 'Pipeline, memória cache, hierarquia, ISA. O lado físico do código.',
    mods: ['Pipeline MIPS', 'Hierarquia de memória', 'Cache e localidade'],
    status: 'soon',
  },
  F4: {
    area: 'fund',
    name: 'Circuitos Digitais',
    desc: 'Lógica combinacional e sequencial, mapas de Karnaugh, flip-flops.',
    mods: ['Álgebra booleana', 'Karnaugh', 'Flip-flops'],
    status: 'soon',
  },
  F5: {
    area: 'fund',
    name: 'Sistemas Operacionais',
    desc: 'Processos, threads, escalonamento, deadlock, memória virtual.',
    mods: ['Processos & threads', 'Escalonamento', 'Sincronização', 'Memória virtual'],
    status: 'soon',
  },
  F6: {
    area: 'fund',
    name: 'Linguagens Formais e Autômatos',
    desc:
      'AFDs, AFNs, expressões regulares, gramáticas livres de contexto, máquinas de Turing.',
    mods: [
      'Conceitos básicos',
      'AFDs',
      'AFD que reconhece "ab"',
      'Lema do Bombeamento',
      'AFN e equivalência',
      'Expressões regulares',
      'Gramáticas livres de contexto',
      'Autômato de pilha',
      'Máquinas de Turing',
    ],
    status: 'free',
  },
  M1: {
    area: 'mat',
    name: 'Análise Combinatória',
    desc: 'Permutações, combinações, princípio da inclusão-exclusão.',
    mods: ['Permutações', 'Combinações', 'Inclusão-exclusão'],
    status: 'soon',
  },
  M2: {
    area: 'mat',
    name: 'Álgebra Linear',
    desc: 'Espaços vetoriais, transformações lineares, autovalores.',
    mods: ['Espaços vetoriais', 'Transformações', 'Autovalores'],
    status: 'soon',
  },
  M3: {
    area: 'mat',
    name: 'Cálculo Diferencial e Integral',
    desc: 'Limites, derivadas, integrais — o cálculo que cai no POSCOMP.',
    mods: ['Limites', 'Derivadas', 'Integrais'],
    status: 'soon',
  },
  M4: {
    area: 'mat',
    name: 'Lógica Matemática',
    desc: 'Lógica proposicional e de predicados, dedução natural, tableaux.',
    mods: ['Proposicional', 'Predicados', 'Dedução natural'],
    status: 'soon',
  },
  M5: {
    area: 'mat',
    name: 'Matemática Discreta',
    desc: 'Conjuntos, relações, funções, indução, grafos.',
    mods: ['Conjuntos & relações', 'Indução', 'Teoria dos grafos'],
    status: 'soon',
  },
  M6: {
    area: 'mat',
    name: 'Probabilidade e Estatística',
    desc: 'Espaços amostrais, distribuições, estimadores.',
    mods: ['Probabilidade', 'Distribuições', 'Estatística inferencial'],
    status: 'soon',
  },
  M7: {
    area: 'mat',
    name: 'Geometria Analítica',
    desc: 'Vetores, retas, planos, cônicas no R² e R³.',
    mods: ['Vetores', 'Retas e planos', 'Cônicas'],
    status: 'soon',
  },
  T1: {
    area: 'tec',
    name: 'Banco de Dados',
    desc: 'Modelo relacional, SQL, normalização, transações.',
    mods: ['Relacional', 'SQL', 'Normalização', 'Transações'],
    status: 'soon',
  },
  T2: {
    area: 'tec',
    name: 'Computação Gráfica',
    desc: 'Pipeline gráfico, transformações, rasterização, iluminação.',
    mods: ['Transformações 2D/3D', 'Rasterização', 'Iluminação'],
    status: 'soon',
  },
  T3: {
    area: 'tec',
    name: 'Engenharia de Software',
    desc: 'Processos, requisitos, padrões, testes, qualidade.',
    mods: ['Processos ágeis', 'Padrões de projeto', 'Testes'],
    status: 'soon',
  },
  T4: {
    area: 'tec',
    name: 'Inteligência Artificial',
    desc: 'Busca, lógica, aprendizado de máquina, redes neurais.',
    mods: ['Busca heurística', 'Aprendizado supervisionado', 'Redes neurais'],
    status: 'soon',
  },
  T5: {
    area: 'tec',
    name: 'Linguagens de Programação',
    desc: 'Paradigmas, semântica, tipos, compiladores.',
    mods: ['Paradigmas', 'Sistema de tipos', 'Compiladores'],
    status: 'soon',
  },
  T6: {
    area: 'tec',
    name: 'Redes de Computadores',
    desc: 'Modelo OSI/TCP-IP, protocolos, roteamento, segurança.',
    mods: ['Camadas', 'TCP/IP', 'Roteamento'],
    status: 'soon',
  },
  T7: {
    area: 'tec',
    name: 'Sistemas Distribuídos',
    desc: 'Comunicação, consenso, consistência, tolerância a falhas.',
    mods: ['RPC', 'Consenso', 'Consistência'],
    status: 'soon',
  },
  T8: {
    area: 'tec',
    name: 'Programação',
    desc: 'Estruturas de controle, modularização, depuração.',
    mods: ['Estruturas básicas', 'Modularização', 'Boas práticas'],
    status: 'soon',
  },
};

interface Area {
  id: AreaId;
  name: string;
  codes: string[];
  color: string;
}

const AREAS: Area[] = [
  {
    id: 'fund',
    name: 'Fundamentos da Computação',
    codes: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
    color: 'var(--sap)',
  },
  {
    id: 'mat',
    name: 'Matemática para Computação',
    codes: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'],
    color: 'var(--amb)',
  },
  {
    id: 'tec',
    name: 'Tecnologia da Computação',
    codes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'],
    color: 'var(--coral)',
  },
];

export function Curriculum() {
  const [selected, setSelected] = useState('F6');
  const t = TOPICS[selected];
  const area = AREAS.find((a) => a.id === t.area)!;

  return (
    <section className="section curriculum-section" id="curriculo">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Currículo</span>
          <h2>
            25 tópicos do edital.
            <br />
            Um caminho <span className="em">claro</span>.
          </h2>
          <p>
            Linguagens Formais está liberado no plano free, completo. Os outros chegam em
            ondas — assinantes premium acessam em primeira mão.
          </p>
        </div>

        <div className="curriculum-grid">
          <div className="edital-map">
            <div className="edital-areas">
              {AREAS.map((a) => (
                <div className="edital-area-row" key={a.id}>
                  <div className="edital-area-head">
                    <div className="edital-area-name">
                      <span className="edital-area-dot" style={{ background: a.color }} />
                      {a.name}
                    </div>
                    <span className="edital-area-count">{a.codes.length} tópicos</span>
                  </div>
                  <div className="edital-tiles">
                    {a.codes.map((code) => {
                      const isFree = TOPICS[code].status === 'free';
                      const isSel = selected === code;
                      const cls = [
                        'edital-tile',
                        isFree ? 'free' : '',
                        isSel ? 'selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      return (
                        <button
                          key={code}
                          type="button"
                          className={cls}
                          onMouseEnter={() => setSelected(code)}
                          onClick={() => setSelected(code)}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="edital-legend">
              <span className="lg">
                <span className="swatch free" /> Liberado no free
              </span>
              <span className="lg">
                <span className="swatch locked" /> Premium ou em breve
              </span>
              <span className="lg" style={{ marginLeft: 'auto' }}>
                passe o mouse para ver detalhes
              </span>
            </div>
          </div>

          <div className="topic-detail">
            <div className="td-eyebrow">
              {selected} · {area.name}
            </div>
            <h3>{t.name}</h3>
            <div className={`td-status ${t.status === 'free' ? 'free' : 'premium'}`}>
              {t.status === 'free' ? (
                <>
                  <Icon name="check" size={12} /> Free · 100% disponível
                </>
              ) : (
                <>
                  <Icon name="lock" size={12} /> Premium · em construção
                </>
              )}
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

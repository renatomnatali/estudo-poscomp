import type { Metadata } from 'next';
import Image from 'next/image';

import { PageShell } from '@/components/marketing/pages/page-shell';

export const metadata: Metadata = {
  title: 'aprovado.xyz · sobre',
  description:
    'O aprovado.xyz começou como ferramenta pessoal pra estudar pro POSCOMP — e como experimento de até onde dá pra ir construindo software com IA hoje.',
};

export default function SobrePage() {
  return (
    <PageShell current="/sobre">
      <header className="page-hd">
        <span className="eyebrow">Sobre</span>
        <h1>Construí pra mim. Funcionou. Agora compartilho.</h1>
        <p className="lead">
          O aprovado.xyz começou como uma ferramenta pessoal pra estudar pro POSCOMP — e como
          um experimento de até onde dá pra ir construindo software com IA hoje.
        </p>
      </header>

      <article className="about-body">
        <p>
          Em 2025 me peguei de novo tentando estudar Linguagens Formais e Autômatos por PDF.
          Tudo que eu encontrava era ou denso demais (livro acadêmico, em inglês, sem
          exercício), ou raso demais (videoaula que cobre 30 minutos do edital em 2 horas), ou
          pago demais (cursinho R$2.000 que ainda assim não tem visualização). Frustrante.
        </p>

        <p>
          A teoria de autômatos é <strong>visualmente bonita</strong>. Estados, transições,
          strings sendo lidas símbolo por símbolo — é praticamente uma animação esperando pra
          acontecer. Mas todo mundo ensina como página de PDF. Não fazia sentido.
        </p>

        <p className="pull">
          &ldquo;Se eu construir o jeito que eu queria estudar, talvez ajude outras
          pessoas.&rdquo;
        </p>

        <p>
          Comecei pequeno: um simulador de AFD em React, um quiz, um mapa do edital. Em
          algumas semanas tinha 9 módulos completos de Linguagens Formais. O processo me
          deixou óbvio que o produto que eu queria existir <em>tinha</em> que existir —
          visual, em português, baseado no edital, com simulado real.
        </p>

        <p>
          O nome <strong>aprovado</strong> é literal: o objetivo é só esse. E o{' '}
          <strong> .xyz</strong> é piada de programador — quase um{' '}
          <code className="mono">.foo.bar</code> oficial.
        </p>

        <p>
          Hoje a versão grátis cobre Linguagens Formais inteira, sem cartão. Os outros 24
          tópicos do edital chegam em ondas, e quem quer acesso antecipado assina o premium.
          Sem fidelidade, sem investidor, sem rede social. Vai bem assim.
        </p>
      </article>

      <section className="credits">
        <div className="credits-card">
          <div className="credits-eyebrow">Equipe</div>
          <div className="credits-title">Ficha técnica</div>

          <div className="credit-headline">
            <div className="photo">
              <Image
                src="/landing/renato.jpg"
                alt="Renato Moraes Natali"
                width={96}
                height={96}
              />
            </div>
            <div>
              <div className="role">Fundador · Direção criativa &amp; produto</div>
              <div className="name">Renato Moraes Natali</div>
              <div className="desc">
                Define a visão, a curadoria do edital e a régua pedagógica.
                <br />
                Decide o que entra, o que sai, e quando está pronto pra publicar.
              </div>
            </div>
          </div>

          <div className="credit-tools-label">Construído com</div>

          <div className="credit-tools">
            <div className="credit-tool">
              <div className="logo tool-tc">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/truecoding-logo.svg" alt="true-coding" />
              </div>
              <div className="info">
                <div className="nm">true-coding</div>
                <div className="role">
                  Metodologia &amp; product management ·{' '}
                  <a href="https://truecode.vercel.app" target="_blank" rel="noopener noreferrer">
                    truecode.vercel.app
                  </a>
                </div>
              </div>
              <div className="ver">framework próprio</div>
            </div>

            <div className="credit-tool">
              <div className="logo tool-cc">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 7 10 12 4 17" />
                  <line x1="13" y1="18" x2="20" y2="18" />
                </svg>
              </div>
              <div className="info">
                <div className="nm">Claude Code</div>
                <div className="role">Engenharia · implementação dos simuladores e do app</div>
              </div>
              <div className="ver">Anthropic · Opus 4.6</div>
            </div>

            <div className="credit-tool">
              <div className="logo tool-cd">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 7a7 7 0 1 0 0 10" />
                  <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="info">
                <div className="nm">Claude Design</div>
                <div className="role">Direção visual · sistema, tipografia, layout</div>
              </div>
              <div className="ver">Anthropic</div>
            </div>
          </div>

          <div className="credit-misc">
            <div className="credit-misc-row">
              <div className="k">Conteúdo</div>
              <div className="v">
                Edital SBC POSCOMP 2025
                <small>Sipser · Cormen/CLRS · Tanenbaum · Hopcroft</small>
              </div>
            </div>
            <div className="credit-misc-row">
              <div className="k">Trilha sonora</div>
              <div className="v">
                Lo-fi · café preto · 2h da manhã
                <small>não creditável</small>
              </div>
            </div>
          </div>

          <div className="credits-foot">
            <span>uma produção independente</span>
            <span>2026 · aprovado.xyz</span>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

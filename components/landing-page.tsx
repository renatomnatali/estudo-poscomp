import Link from 'next/link';

import styles from '@/components/landing-page.module.css';

export function LandingPage() {
  return (
    <main className={styles.landingRoot}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link className={styles.navLogo} href="/">
            <div className={styles.navLogoIcon}>PV</div>
            <div>
              <span className={styles.navLogoName}>POSCOMP</span>
              <span className={styles.navLogoSub}>Visual Lab</span>
            </div>
          </Link>

          <div className={styles.navLinks}>
            <a className={styles.navLink} href="#features">
              Como funciona
            </a>
            <a className={styles.navLink} href="#curriculum">
              Currículo
            </a>
            <a className={styles.navLink} href="#pricing">
              Planos
            </a>
            <Link className={styles.navCta} href="/dashboard">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      <section className={styles.hero} id="home">
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <div className={styles.dot} />
              Baseado no edital SBC 2025
            </div>

            <h1 className={styles.heroTitle}>
              Estude para o POSCOMP
              <br />
              de um jeito que
              <br />
              <span className={styles.accent}>faz sentido</span>
            </h1>

            <p className={styles.heroSub}>
              Trilhas visuais e interativas cobrindo os 25 tópicos do edital. Autômatos animados,
              simulados reais, flashcards - tudo em português.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.btnHeroPrimary} href="/dashboard">
                Começar grátis — 1 tópico completo
              </Link>
              <a className={styles.btnHeroGhost} href="#features">
                Ver como funciona
              </a>
            </div>

            <div className={styles.heroTrust}>
              <span>✓</span> Sem cartão de crédito &nbsp;·&nbsp;
              <span>✓</span> Linguagens Formais completo no plano free &nbsp;·&nbsp;
              <span>✓</span> Cancelamento fácil
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCardMain}>
              <div className={styles.hcTopbar}>
                <div className={styles.hcDots}>
                  <div className={styles.hcDot} />
                  <div className={styles.hcDot} />
                  <div className={styles.hcDot} />
                </div>
                <div className={styles.hcUrl}>poscomp.visual/app/trilhas/f6/modulo-03</div>
              </div>

              <div className={styles.hcBody}>
                <div className={styles.hcLabel}>F6 · Módulo 3 de 9</div>
                <div className={styles.hcModuleHeader}>
                  <div className={styles.hcModBadge}>Linguagens Formais · AFD</div>
                  <div className={styles.hcModTitle}>Autômatos Finitos Determinísticos</div>
                  <div className={styles.hcModSub}>
                    A máquina mais simples que reconhece padrões em strings
                  </div>
                  <div className={styles.hcModTags}>
                    <span className={styles.hcTag}>~35 min</span>
                    <span className={styles.hcTag}>Iniciante</span>
                    <span className={styles.hcTag}>5 exercícios</span>
                  </div>
                </div>

                <div className={styles.hcAutomata}>
                  <div className={styles.hcAutomataTitle}>
                    AFD — Reconhece strings terminadas em &quot;ab&quot;
                  </div>
                  <div className={styles.automataDiagram}>
                    <div className={`${styles.aState} ${styles.initial}`}>q₀</div>
                    <div className={styles.aArrow}>
                      <div className={styles.aLabel}>a</div>
                      <div className={styles.aLine} />
                    </div>
                    <div className={`${styles.aState} ${styles.normal}`}>q₁</div>
                    <div className={styles.aArrow}>
                      <div className={styles.aLabel}>b</div>
                      <div className={styles.aLine} />
                    </div>
                    <div className={`${styles.aState} ${styles.accept}`}>q₂</div>
                  </div>
                </div>

                <div className={styles.hcProgress}>
                  <span className={styles.hcProgLabel}>Progresso</span>
                  <div className={styles.hcProgBar}>
                    <div className={styles.hcProgFill} style={{ width: '33%' }} />
                  </div>
                  <span className={styles.hcProgPct}>33%</span>
                </div>
              </div>
            </div>

            <div className={styles.heroFloat1}>
              <div className={styles.floatIcon}>✓</div>
              <div className={styles.floatText}>
                <strong>Módulo concluído</strong>
                Pumping Lemma - F6
              </div>
            </div>

            <div className={styles.heroFloat2}>
              <div className={styles.floatIcon}>⏱</div>
              <div className={styles.floatText}>
                <strong>Simulado pronto</strong>
                20 questões · 45 min
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.logosStrip}>
        <div className={styles.logosInner}>
          <span className={styles.logosLabel}>Baseado em</span>
          <div className={styles.logosDivider} />
          <span className={styles.logoPill}>Edital SBC 2025</span>
          <span className={styles.logoPill}>Sipser 3ª ed.</span>
          <span className={styles.logoPill}>CLRS 4ª ed.</span>
          <span className={styles.logoPill}>Tanenbaum</span>
          <span className={styles.logoPill}>Cormen</span>
          <div className={styles.logosDivider} />
          <span className={styles.logosLabel}>70 questões · 4 áreas · 4 horas</span>
        </div>
      </div>

      <section className={styles.statsSection}>
        <div className={styles.sectionInner}>
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <div className={styles.statVal}>25</div>
              <div className={styles.statLabel}>tópicos do edital cobertos</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>9</div>
              <div className={styles.statLabel}>módulos interativos de F6</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>70</div>
              <div className={styles.statLabel}>questões no simulado completo</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>100%</div>
              <div className={styles.statLabel}>baseado no edital oficial SBC</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionBadge}>Como funciona</div>
          <h2 className={styles.sectionTitle}>
            Diferente de tudo que você já usou
            <br />
            para estudar computação
          </h2>
          <p className={styles.sectionSub}>
            Não é PDF. Não é videoaula. É conteúdo estruturado visualmente para você entender - não
            só memorizar.
          </p>

          <div className={styles.featuresGrid}>
            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#EEF1FF' }}>
                🎯
              </div>
              <div className={styles.featTitle}>Trilhas pelo edital</div>
              <div className={styles.featSub}>
                25 tópicos organizados exatamente como o edital da SBC. Sabe exatamente o que
                estudar e o que falta.
              </div>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#E6FBF4' }}>
                🔬
              </div>
              <div className={styles.featTitle}>Visualizações interativas</div>
              <div className={styles.featSub}>
                Autômatos que animam, diagramas de estado clicáveis, algoritmos passo a passo.
                Teoria que você vê funcionando.
              </div>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#FEF3C7' }}>
                ⏱️
              </div>
              <div className={styles.featTitle}>Simulado fiel ao real</div>
              <div className={styles.featSub}>
                70 questões, 4 horas, mesma distribuição do POSCOMP. Com gabarito explicado e
                análise de erros por tópico.
              </div>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#FEE2E2' }}>
                🃏
              </div>
              <div className={styles.featTitle}>Flashcards com spaced rep.</div>
              <div className={styles.featSub}>
                Algoritmo de repetição espaçada que prioriza o que você está esquecendo. Revisão em
                15 minutos por dia.
              </div>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#EEF1FF' }}>
                📊
              </div>
              <div className={styles.featTitle}>Progresso por tópico</div>
              <div className={styles.featSub}>
                Veja exatamente onde está forte e onde está fraco. Heatmap de desempenho por área e
                subtópico.
              </div>
            </div>

            <div className={styles.featCard}>
              <div className={styles.featIcon} style={{ background: '#E6FBF4' }}>
                🇧🇷
              </div>
              <div className={styles.featTitle}>100% em português</div>
              <div className={styles.featSub}>
                Todo o conteúdo em PT-BR, com exemplos brasileiros. Sem depender de tradução de
                Sipser ou apostilas de universidade.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.curriculumSection}`} id="curriculum">
        <div className={styles.sectionInner}>
          <div className={styles.sectionBadge}>Currículo</div>
          <h2 className={styles.sectionTitle}>25 tópicos. Um caminho claro.</h2>
          <p className={styles.sectionSub}>
            Todos os tópicos do edital POSCOMP 2025 organizados em trilhas de estudo. Linguagens
            Formais e Autômatos liberado no plano free.
          </p>

          <div className={styles.curriculumGrid}>
            <div className={styles.currArea}>
              <div className={styles.currAreaHead}>
                <div className={styles.currAreaDot} style={{ background: 'var(--sap)' }} />
                <div className={styles.currAreaName}>Fundamentos da Computação</div>
                <div className={styles.currAreaCount}>10 tópicos</div>
              </div>
              <div className={styles.currTopics}>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    F1
                  </div>
                  <div className={styles.currTopicName}>Análise de Algoritmos</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    F2
                  </div>
                  <div className={styles.currTopicName}>Algoritmos e Est. de Dados</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    F3
                  </div>
                  <div className={styles.currTopicName}>Arquitetura de Computadores</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    F4
                  </div>
                  <div className={styles.currTopicName}>Circuitos Digitais</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    F5
                  </div>
                  <div className={styles.currTopicName}>Sistemas Operacionais</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--em)' }}>
                    F6
                  </div>
                  <div className={styles.currTopicName}>Linguagens Formais e Autômatos</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsFree}`}>Free ✓</span>
                </div>
              </div>
            </div>

            <div className={styles.currArea}>
              <div className={styles.currAreaHead}>
                <div className={styles.currAreaDot} style={{ background: 'var(--amb)' }} />
                <div className={styles.currAreaName}>Matemática para Computação</div>
                <div className={styles.currAreaCount}>7 tópicos</div>
              </div>
              <div className={styles.currTopics}>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M1
                  </div>
                  <div className={styles.currTopicName}>Análise Combinatória</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M2
                  </div>
                  <div className={styles.currTopicName}>Álgebra Linear</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M3
                  </div>
                  <div className={styles.currTopicName}>Cálculo Diferencial e Integral</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M4
                  </div>
                  <div className={styles.currTopicName}>Lógica Matemática</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M5
                  </div>
                  <div className={styles.currTopicName}>Matemática Discreta</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M6
                  </div>
                  <div className={styles.currTopicName}>Probabilidade e Estatística</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    M7
                  </div>
                  <div className={styles.currTopicName}>Geometria Analítica</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
              </div>
            </div>

            <div className={styles.currArea}>
              <div className={styles.currAreaHead}>
                <div className={styles.currAreaDot} style={{ background: 'var(--coral)' }} />
                <div className={styles.currAreaName}>Tecnologia da Computação</div>
                <div className={styles.currAreaCount}>8 tópicos</div>
              </div>
              <div className={styles.currTopics}>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T1
                  </div>
                  <div className={styles.currTopicName}>Banco de Dados</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T2
                  </div>
                  <div className={styles.currTopicName}>Computação Gráfica</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T3
                  </div>
                  <div className={styles.currTopicName}>Engenharia de Software</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T4
                  </div>
                  <div className={styles.currTopicName}>Inteligência Artificial</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T5
                  </div>
                  <div className={styles.currTopicName}>Linguagens de Programação</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T6
                  </div>
                  <div className={styles.currTopicName}>Redes de Computadores</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T7
                  </div>
                  <div className={styles.currTopicName}>Sistemas Distribuídos</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
                <div className={styles.currTopic}>
                  <div className={styles.currTopicId} style={{ background: 'var(--n300)' }}>
                    T8
                  </div>
                  <div className={styles.currTopicName}>Programação</div>
                  <span className={`${styles.currTopicStatus} ${styles.tsLock}`}>Premium</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="how">
        <div className={`${styles.sectionInner} ${styles.howGrid}`}>
          <div>
            <div className={styles.sectionBadge}>Passo a passo</div>
            <h2 className={styles.sectionTitle}>Do zero ao POSCOMP em trilhas claras</h2>
            <p className={styles.sectionSub}>
              Sem precisar montar seu próprio plano de estudos. O caminho já está estruturado.
            </p>
          </div>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div>
                <div className={styles.stepTitle}>Crie sua conta e faça o diagnóstico</div>
                <div className={styles.stepSub}>
                  3 perguntas rápidas: nível atual, data da prova, áreas mais fracas. O dashboard
                  monta seu plano personalizado.
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div>
                <div className={styles.stepTitle}>Estude pelos módulos visuais</div>
                <div className={styles.stepSub}>
                  Cada tópico tem módulos de 30-45 min com visualizações, exemplos e exercícios ao
                  final. Linguagens Formais completo no free.
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div>
                <div className={styles.stepTitle}>Reforce com flashcards diários</div>
                <div className={styles.stepSub}>
                  Spaced repetition automático. 15 minutos por dia garante que você não esqueça o
                  que estudou semanas atrás.
                </div>
              </div>
            </div>

            <div className={styles.step}>
              <div className={styles.stepNum}>4</div>
              <div>
                <div className={styles.stepTitle}>Simule e analise seus erros</div>
                <div className={styles.stepSub}>
                  Simulados completos com timer. Após cada simulado, relatório detalhado mostra onde
                  você perdeu pontos e o módulo correto para revisar.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.testimonials}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionBadge}>Depoimentos</div>
          <h2 className={styles.sectionTitle}>Quem usou, aprovou</h2>
          <p className={styles.sectionSub}>
            Estudantes de todo o Brasil que usaram o POSCOMP Visual Lab para se preparar.
          </p>

          <div className={styles.testiGrid}>
            <div className={styles.testiCard}>
              <div className={styles.testiStars}>★★★★★</div>
              <div className={styles.testiText}>
                &ldquo;Finalmente entendi o Lema do Bombeamento. Tentei aprender pelo Sipser três
                vezes. A animação interativa resolveu em 20 minutos.&rdquo;
              </div>
              <div className={styles.testiAuthor}>
                <div className={styles.testiAvatar}>CA</div>
                <div>
                  <div className={styles.testiName}>Carlos Andrade</div>
                  <div className={styles.testiRole}>Aprovado UNICAMP 2024</div>
                </div>
              </div>
            </div>

            <div className={styles.testiCard}>
              <div className={styles.testiStars}>★★★★★</div>
              <div className={styles.testiText}>
                &ldquo;Estudei 3 meses com o Visual Lab. Tirei 72 pontos - 24 a mais que na primeira
                tentativa. O simulado com análise de erros fez toda a diferença.&rdquo;
              </div>
              <div className={styles.testiAuthor}>
                <div className={styles.testiAvatar}>MB</div>
                <div>
                  <div className={styles.testiName}>Marina Barbosa</div>
                  <div className={styles.testiRole}>Mestrado USP - ingresso 2025</div>
                </div>
              </div>
            </div>

            <div className={styles.testiCard}>
              <div className={styles.testiStars}>★★★★★</div>
              <div className={styles.testiText}>
                &ldquo;Conteúdo denso mas organizado. A trilha pelo edital me poupou semanas tentando
                entender o que cai na prova. Recomendo a qualquer candidato.&rdquo;
              </div>
              <div className={styles.testiAuthor}>
                <div className={styles.testiAvatar}>RY</div>
                <div>
                  <div className={styles.testiName}>Rafael Yamamoto</div>
                  <div className={styles.testiRole}>Top 5% nacional - POSCOMP 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="pricing">
        <div className={`${styles.sectionInner} ${styles.center}`}>
          <div className={styles.sectionBadge}>Planos</div>
          <h2 className={styles.sectionTitle}>Comece grátis. Escale quando precisar.</h2>
          <p className={`${styles.sectionSub} ${styles.centerSub}`}>
            Tópico gratuito completo, sem cartão de crédito. Upgrade quando quiser continuar.
          </p>

          <div className={styles.pricingGrid}>
            <div className={styles.planCard}>
              <div className={styles.planBadge}>Para começar</div>
              <div className={styles.planName}>Free</div>
              <div className={styles.planPrice}>R$0</div>
              <div className={styles.planPriceSub}>Para sempre grátis</div>

              <ul className={styles.planFeatures}>
                <li>
                  <span className={styles.check}>✓</span>Linguagens Formais - 9 módulos completos
                </li>
                <li>
                  <span className={styles.check}>✓</span>Flashcards de Linguagens Formais (47 cartões)
                </li>
                <li>
                  <span className={styles.check}>✓</span>Simulado parcial (20 questões)
                </li>
                <li>
                  <span className={styles.check}>✓</span>Dashboard com progresso básico
                </li>
                <li>
                  <span className={styles.lock}>—</span>
                  <span style={{ color: 'var(--n400)' }}>Demais 24 tópicos</span>
                </li>
                <li>
                  <span className={styles.lock}>—</span>
                  <span style={{ color: 'var(--n400)' }}>Simulado completo (70 questões)</span>
                </li>
                <li>
                  <span className={styles.lock}>—</span>
                  <span style={{ color: 'var(--n400)' }}>Analytics de desempenho</span>
                </li>
              </ul>

              <Link className={`${styles.btnPlan} ${styles.btnPlanFree}`} href="/dashboard">
                Criar conta grátis
              </Link>
            </div>

            <div className={`${styles.planCard} ${styles.featured}`}>
              <div className={styles.planBadge}>Mais popular</div>
              <div className={styles.planName}>Premium</div>
              <div className={styles.planPrice}>
                R$39<sub>/mês</sub>
              </div>
              <div className={styles.planPriceSub}>ou R$299/ano - economize 36%</div>

              <ul className={styles.planFeatures}>
                <li>
                  <span className={styles.check}>✓</span>Todos os 25 tópicos do edital
                </li>
                <li>
                  <span className={styles.check}>✓</span>Todos os flashcards + spaced rep.
                </li>
                <li>
                  <span className={styles.check}>✓</span>Simulado completo (70 questões)
                </li>
                <li>
                  <span className={styles.check}>✓</span>Analytics detalhado por tópico
                </li>
                <li>
                  <span className={styles.check}>✓</span>Histórico de simulados
                </li>
                <li>
                  <span className={styles.check}>✓</span>Exercícios ilimitados
                </li>
                <li>
                  <span className={styles.check}>✓</span>Acesso a novos módulos em primeira mão
                </li>
              </ul>

              <Link className={`${styles.btnPlan} ${styles.btnPlanPremium}`} href="/premium">
                Assinar Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            Pronto para estudar o POSCOMP <span className={styles.em}>de verdade?</span>
          </h2>
          <p className={styles.ctaSub}>
            Linguagens Formais completo, gratuito, agora. Sem cartão de crédito. Comece em menos de
            2 minutos.
          </p>
          <div className={styles.ctaActions}>
            <Link className={styles.btnHeroPrimary} href="/dashboard">
              Criar conta grátis
            </Link>
            <a className={styles.btnHeroGhost} href="#curriculum">
              Ver o currículo completo
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Link className={styles.footerLogo} href="/">
            <div className={styles.footerLogoIcon}>PV</div>
            <span className={styles.footerLogoText}>POSCOMP Visual Lab</span>
          </Link>

          <div className={styles.footerLinks}>
            <a className={styles.footerLink} href="#">
              Sobre
            </a>
            <a className={styles.footerLink} href="#curriculum">
              Currículo
            </a>
            <a className={styles.footerLink} href="#pricing">
              Planos
            </a>
            <a className={styles.footerLink} href="#">
              Termos
            </a>
            <a className={styles.footerLink} href="#">
              Privacidade
            </a>
          </div>

          <div className={styles.footerCopy}>© 2026 POSCOMP Visual Lab · Baseado no edital SBC</div>
        </div>
      </footer>
    </main>
  );
}

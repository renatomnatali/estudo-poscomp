import { Icon } from '../icon';

export function Tour() {
  return (
    <section className="section" id="tour">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Por dentro</span>
          <h2>
            Três telas, um <span className="em">fluxo</span>.
          </h2>
          <p>
            Diagnóstico, módulos visuais, simulado. O ciclo que você repete até o dia da prova.
          </p>
        </div>

        <div className="tour-grid">
          <div className="tour-card">
            <div className="tour-mock lit">
              <div className="tour-mock-inner">
                <div className="mock-eyebrow">Dashboard · semana 4</div>
                <div className="dash-row">
                  <div className="dash-tile">
                    <div className="v tabular">
                      12
                      <span style={{ fontSize: '0.6em', color: 'var(--on-dark-3)' }}>/25</span>
                    </div>
                    <div className="l">tópicos</div>
                  </div>
                  <div className="dash-tile">
                    <div className="v tabular">
                      68<span className="em">%</span>
                    </div>
                    <div className="l">acerto</div>
                  </div>
                </div>
                <div className="dash-progress">
                  <div className="lbl">
                    <span>F6 · Linguagens Formais</span>
                    <span style={{ color: 'var(--em)' }}>78%</span>
                  </div>
                  <div className="dash-bar">
                    <div style={{ width: '78%' }} />
                  </div>
                </div>
                <div className="dash-progress">
                  <div className="lbl">
                    <span>M5 · Matemática Discreta</span>
                    <span>32%</span>
                  </div>
                  <div className="dash-bar">
                    <div style={{ width: '32%', background: 'var(--sap-l)' }} />
                  </div>
                </div>
                <div className="dash-streak">
                  <Icon name="flame" size={18} className="flame" style={{ color: 'var(--amb)' }} />
                  <div className="txt">
                    <strong>14 dias seguidos</strong> · seu recorde é 18
                  </div>
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">01 · Diagnóstico</span>
              <h3>Saiba onde você está</h3>
              <p>
                Três perguntas montam seu plano. Dashboard mostra progresso por área, dia a
                dia.
              </p>
            </div>
          </div>

          <div className="tour-card">
            <div className="tour-mock lit">
              <div className="tour-mock-inner mod-mock">
                <div className="mock-eyebrow">F6 · módulo 3 de 9</div>
                <div className="mod-card-mini">
                  <div className="code">Autômatos finitos determinísticos</div>
                  <div className="ttl">AFD que reconhece &ldquo;ab&rdquo;</div>
                </div>
                <div className="mini-aut">
                  <div className="mini-state init">q₀</div>
                  <div className="mini-arrow">
                    <span className="lbl">a</span>
                    <span className="ln" />
                  </div>
                  <div className="mini-state norm">q₁</div>
                  <div className="mini-arrow">
                    <span className="lbl">b</span>
                    <span className="ln" />
                  </div>
                  <div className="mini-state acc">q₂</div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '0.7rem',
                    color: 'var(--on-dark-2)',
                    textAlign: 'center',
                    marginTop: 'auto',
                  }}
                >
                  M = (E, Σ, δ, e₀, F)
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">02 · Módulo visual</span>
              <h3>Aprenda manipulando</h3>
              <p>
                Cada módulo tem visualização interativa, exemplo guiado e 5 exercícios. 35 a
                45 min.
              </p>
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
                  Considere o AFD <span className="code">M = (E, Σ, δ, q₀, F)</span> com Σ ={' '}
                  {'{a, b}'}. Qual linguagem M reconhece?
                </div>
                <div className="sim-opts">
                  <div className="sim-opt">
                    <span className="letter">A</span>strings com nº par de a
                  </div>
                  <div className="sim-opt selected">
                    <span className="letter">B</span>strings terminadas em &ldquo;ab&rdquo;
                  </div>
                  <div className="sim-opt">
                    <span className="letter">C</span>palíndromos sobre {'{a,b}'}
                  </div>
                </div>
              </div>
            </div>
            <div className="tour-body">
              <span className="num">03 · Simulado</span>
              <h3>Ensaie a prova real</h3>
              <p>
                70 questões, 4 horas, mesma distribuição do POSCOMP. Relatório de erros aponta
                o módulo certo pra revisar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

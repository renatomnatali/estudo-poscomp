import { Icon } from '../icon';
import { AutomatonSim } from '../sims/automaton-sim';

export function PorQue() {
  return (
    <section className="section why-section" id="por-que">
      <div className="wrap">
        <div className="section-hd">
          <span className="eyebrow">Por que visual</span>
          <h2 style={{ maxWidth: '720px' }}>
            Não é PDF. Não é videoaula.
            <br />É teoria que você vê <span className="em">funcionando</span>.
          </h2>
          <p style={{ maxWidth: '620px' }}>
            Você acabou de testar um Bubble Sort lá em cima — esse é o nosso conteúdo, não uma
            demo de marketing. Cada conceito do edital tem uma visualização que você manipula.
            Entender vira muscle memory.
          </p>
        </div>

        <div className="why-grid">
          <div className="why-copy">
            <div className="quote">
              &ldquo;Eu construí o aprovado pra me ajudar a estudar pro POSCOMP.
              <span className="em"> Funcionou pra mim antes de funcionar pra qualquer um</span>
              .&rdquo;
            </div>
            <div className="meta">— Renato Natali, criador · candidato POSCOMP</div>

            <div className="why-bullets">
              <div className="b">
                <span className="icon-tile">
                  <Icon name="play" size={14} />
                </span>
                <div>
                  <strong>Manipule, não memorize</strong>
                  Edite a string de entrada, clique nos estados, veja a transição em tempo
                  real.
                </div>
              </div>
              <div className="b em-tile">
                <span className="icon-tile">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <strong>Cobertura real do edital</strong>
                  Começamos por Linguagens Formais — 9 módulos completos. Análise de
                  Algoritmos e Lógica Matemática chegam em seguida.
                </div>
              </div>
              <div className="b amb-tile">
                <span className="icon-tile">
                  <Icon name="timer" size={14} />
                </span>
                <div>
                  <strong>Sessões de 30–45 min</strong>
                  Cada módulo tem visualização, exemplo guiado e 5 exercícios. Cabe num
                  intervalo.
                </div>
              </div>
            </div>
          </div>

          <AutomatonSim />
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from 'next';

import { PageShell } from '@/components/marketing/pages/page-shell';

export const metadata: Metadata = {
  title: 'aprovado.xyz · contato',
  description:
    'Email é a melhor forma. Quem responde sou eu mesmo, Renato. Geralmente em até 24h.',
};

export default function ContatoPage() {
  return (
    <PageShell current="/contato">
      <header className="page-hd">
        <span className="eyebrow">Contato</span>
        <h1>Email é a melhor forma.</h1>
        <p className="lead">
          Quem responde sou eu mesmo, Renato. O aprovado.xyz é um projeto independente, não tem
          suporte 24/7 nem chatbot. Mas respondo a todas as mensagens, geralmente em até 24h.
        </p>
      </header>

      <section className="contact-body">
        <div className="contact-cards">
          <div className="contact-card">
            <div className="icon-tile">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h3>Dúvidas, sugestões, feedback</h3>
            <p>
              Bug, módulo confuso, questão errada no simulado, pedido de funcionalidade. Tudo
              aqui.
            </p>
            <a className="email" href="mailto:renato@aprovado.xyz">
              renato@aprovado.xyz
            </a>
          </div>

          <div className="contact-card">
            <div className="icon-tile" style={{ background: 'var(--sap-bg)', color: 'var(--sap)' }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
            </div>
            <h3>Imprensa, parcerias, B2B</h3>
            <p>
              Coordenação de pós-graduação, professor querendo licença pra turma, jornalista.
              Mesmo email, marca o assunto.
            </p>
            <a className="email" href="mailto:renato@aprovado.xyz?subject=parceria">
              renato@aprovado.xyz
            </a>
          </div>
        </div>

        <div
          className="callout"
          style={{ borderLeftColor: 'var(--amb)', background: 'var(--amb-bg)' }}
        >
          <strong>Pra problema com pagamento ou conta:</strong> mandar email com o endereço
          cadastrado e descrição do que aconteceu. Se for reembolso (até 7 dias após a compra),
          processo em até 5 dias úteis sem perguntas chatas.
        </div>

        <h2 style={{ marginTop: '56px', fontSize: '1.3rem' }}>Algumas situações comuns</h2>
        <ul style={{ color: 'var(--fg-2)', paddingLeft: '22px', lineHeight: 1.7 }}>
          <li>
            <strong>Dúvida sobre o conteúdo do edital</strong> (resolver questão, explicar um
            capítulo de Sipser, tirar dúvida de teoria) — pode mandar! Não vou conseguir
            responder cada uma como tutor pessoal, mas <em>uso a dúvida como input</em> pra
            melhorar o produto: se a pergunta aparece, é sinal de que o módulo precisa cobrir
            aquilo melhor. Sua dúvida vira melhoria no próximo release.
          </li>
          <li>
            <strong>Parcerias e divulgação</strong> (guest post, troca de conteúdo, link
            building, afiliação) — é um site comercial, então faz sentido conversar. Manda
            proposta objetiva com o que você oferece e o que espera; e a gente conversa.
          </li>
          <li>
            <strong>Oferta de serviços</strong> (freelancer, agência, dev terceirizado) —
            agradeço, mas o produto é construído por mim com o apoio do Claude, e não pretendo
            terceirizar a engenharia ou o conteúdo no momento.
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

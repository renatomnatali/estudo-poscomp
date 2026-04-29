import type { Metadata } from 'next';

import { PageShell } from '@/components/marketing/pages/page-shell';

export const metadata: Metadata = {
  title: 'aprovado.xyz · política de cookies',
  description: 'Os cookies que usamos, pra que servem, e como você pode desativar.',
};

interface CookieRow {
  name: string;
  purpose: string;
  type: 'essential' | 'analytics';
  duration: string;
}

const COOKIES: CookieRow[] = [
  {
    name: 'apv_session',
    purpose: 'Mantém você logado entre páginas. Sem ele você precisaria entrar a cada clique.',
    type: 'essential',
    duration: '30 dias',
  },
  {
    name: 'apv_csrf',
    purpose: 'Token de segurança pra prevenir ataques CSRF em formulários.',
    type: 'essential',
    duration: 'Sessão',
  },
  {
    name: 'apv_consent',
    purpose: 'Lembra suas preferências de cookies pra não mostrar o banner de novo.',
    type: 'essential',
    duration: '1 ano',
  },
  {
    name: '_ga, _ga_*',
    purpose:
      'Google Analytics. Identifica sessões anônimas pra eu entender quais páginas funcionam.',
    type: 'analytics',
    duration: '2 anos',
  },
  {
    name: '_gid',
    purpose: 'Google Analytics. Distingue usuários únicos no dia.',
    type: 'analytics',
    duration: '24 horas',
  },
];

export default function CookiesPage() {
  return (
    <PageShell current="/cookies">
      <header className="page-hd">
        <span className="eyebrow">Legal</span>
        <h1>Política de cookies</h1>
        <p className="lead">
          Os cookies que usamos, pra que servem, e como você pode desativar.
        </p>
        <div className="meta">Versão 1.0 · vigente desde 1 de janeiro de 2026</div>
      </header>

      <article className="legal-body">
        <div className="callout">
          <strong>Resumo:</strong> usamos 2 cookies essenciais (login e preferência) e o
          cookie do Google Analytics, que você pode recusar no banner ao entrar no site.
        </div>

        <h2>
          <span className="num">01</span>O que é um cookie
        </h2>
        <p>
          Cookie é um arquivo de texto pequeno que o site armazena no seu navegador. Serve
          pra lembrar coisas entre páginas (que você está logado, qual o seu tema preferido)
          ou pra ajudar no analytics.
        </p>

        <h2>
          <span className="num">02</span>Cookies que usamos
        </h2>

        <table className="cookies-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Finalidade</th>
              <th>Tipo</th>
              <th>Duração</th>
            </tr>
          </thead>
          <tbody>
            {COOKIES.map((c) => (
              <tr key={c.name}>
                <td className="name">{c.name}</td>
                <td>{c.purpose}</td>
                <td>
                  <span className={`badge ${c.type}`}>
                    {c.type === 'essential' ? 'Essencial' : 'Analítica'}
                  </span>
                </td>
                <td>{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>
          <span className="num">03</span>Cookies essenciais não podem ser desativados
        </h2>
        <p>
          Os 3 primeiros (apv_session, apv_csrf, apv_consent) são necessários pra o site
          funcionar com login e segurança. Sem eles, você não consegue usar o aprovado.xyz.
          Por isso não há opção de recusá-los — mas eu também não os uso pra rastreamento.
        </p>

        <h2>
          <span className="num">04</span>Cookies analíticos são opcionais
        </h2>
        <p>
          Os cookies do Google Analytics (_ga, _gid) só são instalados se você consentir no
          banner que aparece na primeira visita. Se você recusar, não rodam — e nada no site
          quebra.
        </p>
        <p>
          Você pode mudar sua escolha a qualquer momento clicando em{' '}
          <strong>&ldquo;Cookies&rdquo;</strong> no rodapé do site, ou apagando os cookies do
          navegador (o banner reaparece).
        </p>

        <h2>
          <span className="num">05</span>Como controlar cookies no navegador
        </h2>
        <p>Todos os navegadores permitem ver, bloquear ou apagar cookies. Atalhos:</p>
        <ul>
          <li>
            <strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies
          </li>
          <li>
            <strong>Firefox:</strong> Configurações → Privacidade e Segurança → Cookies
          </li>
          <li>
            <strong>Safari:</strong> Preferências → Privacidade
          </li>
        </ul>
        <p>
          Bloquear todos os cookies de qualquer site geralmente quebra a experiência de
          navegação — é mais útil bloquear de domínios específicos.
        </p>

        <h2>
          <span className="num">06</span>Mudanças nesta política
        </h2>
        <p>
          Se eu adicionar um novo cookie ou ferramenta de tracking, atualizo esta página{' '}
          <em>antes</em> de instalar e o banner pede consentimento de novo.
        </p>

        <h2>
          <span className="num">07</span>Contato
        </h2>
        <p>
          Dúvidas: <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>.
        </p>
      </article>
    </PageShell>
  );
}

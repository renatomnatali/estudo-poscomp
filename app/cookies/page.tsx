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
    name: '__session',
    purpose:
      'Cookie de sessão do Clerk (provedor de autenticação). Mantém você logado entre páginas.',
    type: 'essential',
    duration: 'Sessão · até 7 dias',
  },
  {
    name: '__client_uat',
    purpose:
      'Cookie do Clerk que indica a última vez que você se autenticou. Necessário para rotação de sessão e proteção contra CSRF.',
    type: 'essential',
    duration: '1 ano',
  },
  {
    name: '__clerk_db_jwt',
    purpose:
      'Token JWT do Clerk usado para validar a sessão no backend. Sem ele o login não funciona.',
    type: 'essential',
    duration: 'Sessão',
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
          <strong>Resumo:</strong> hoje usamos apenas cookies essenciais — os do nosso
          provedor de autenticação (Clerk). Não rodamos cookies analíticos nem de marketing
          neste momento. Se isso mudar, mostraremos um banner pedindo seu consentimento antes.
        </div>

        <h2>
          <span className="num">01</span>O que é um cookie
        </h2>
        <p>
          Cookie é um arquivo de texto pequeno que o site armazena no seu navegador. Serve
          pra lembrar coisas entre páginas — no nosso caso, manter sua sessão de login ativa.
        </p>

        <h2>
          <span className="num">02</span>Cookies que usamos hoje
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
          Os cookies do Clerk (<code>__session</code>, <code>__client_uat</code>,{' '}
          <code>__clerk_db_jwt</code>) são necessários pra o site funcionar com login e
          segurança. Sem eles, você não consegue usar o aprovado.xyz. Por isso não há opção
          de recusá-los — eles não são usados pra rastreamento, apenas pra autenticação.
        </p>

        <h2>
          <span className="num">04</span>Cookies analíticos e de terceiros
        </h2>
        <p>
          No momento <strong>não usamos</strong> Google Analytics, pixel de rastreamento ou
          qualquer ferramenta de analítica baseada em cookies. Se eu adicionar uma no futuro,
          ela só rodará após você consentir explicitamente em um banner — e você poderá mudar
          essa escolha a qualquer momento.
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

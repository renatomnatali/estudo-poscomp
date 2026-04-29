import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/marketing/pages/page-shell';

export const metadata: Metadata = {
  title: 'aprovado.xyz · política de privacidade',
  description:
    'O que coletamos, por quê, e o que você pode fazer a respeito. Cumpre a LGPD (Lei 13.709/2018).',
};

const SECTIONS = [
  { id: 's1', label: 'Resumo executivo' },
  { id: 's2', label: 'Quem é o controlador' },
  { id: 's3', label: 'O que coletamos' },
  { id: 's4', label: 'Por que coletamos (bases legais)' },
  { id: 's5', label: 'Com quem compartilhamos' },
  { id: 's6', label: 'Tempo de retenção' },
  { id: 's7', label: 'Seus direitos (LGPD)' },
  { id: 's8', label: 'Como exercer seus direitos' },
  { id: 's9', label: 'Segurança' },
  { id: 's10', label: 'Crianças' },
  { id: 's11', label: 'Mudanças nesta política' },
  { id: 's12', label: 'DPO / contato' },
];

export default function PrivacidadePage() {
  return (
    <PageShell current="/privacidade">
      <header className="page-hd">
        <span className="eyebrow">Legal</span>
        <h1>Política de privacidade</h1>
        <p className="lead">
          O que coletamos, por quê, e o que você pode fazer a respeito. Cumpre a LGPD (Lei
          13.709/2018).
        </p>
        <div className="meta">Versão 1.0 · vigente desde 1 de janeiro de 2026</div>
      </header>

      <div className="toc">
        <div className="toc-card">
          <div className="ttl">Sumário</div>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.label}</a>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <article className="legal-body">
        <div className="callout">
          <strong>Em uma frase:</strong> coleto o mínimo (email, nome, progresso de estudos),
          uso só pra fazer o produto funcionar, não vendo pra ninguém, e você pode pedir pra
          apagar tudo a qualquer momento.
        </div>

        <h2 id="s1">
          <span className="num">01</span>Resumo executivo
        </h2>
        <ul>
          <li>
            <strong>O que coleto:</strong> email, nome, senha (criptografada), progresso de
            módulos, respostas em simulados.
          </li>
          <li>
            <strong>O que NÃO coleto:</strong> CPF, telefone, endereço, dados de cartão, dados
            sensíveis (raça, religião, saúde etc).
          </li>
          <li>
            <strong>Compartilho com:</strong> processador de pagamento (Stripe), provedor de
            email transacional. Lista completa abaixo. Não usamos analytics de terceiros no
            momento.
          </li>
          <li>
            <strong>Vendo dados:</strong> nunca.
          </li>
          <li>
            <strong>Quanto tempo guardo:</strong> enquanto sua conta existir + 6 meses depois
            (obrigação fiscal). Você pode pedir exclusão antes.
          </li>
        </ul>

        <h2 id="s2">
          <span className="num">02</span>Quem é o controlador dos dados
        </h2>
        <p>
          <strong>Renato Moraes Natali</strong>, pessoa física, brasileiro, contato:{' '}
          <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>. Não há encarregado de
          proteção de dados (DPO) formalmente constituído por ser operação individual; eu
          mesmo cumpro a função e respondo solicitações da LGPD.
        </p>

        <h2 id="s3">
          <span className="num">03</span>O que coletamos
        </h2>

        <h3>Dados que você fornece ativamente</h3>
        <ul>
          <li>
            <strong>No cadastro:</strong> nome (ou apelido) e email.
          </li>
          <li>
            <strong>Senha:</strong> gerenciada inteiramente pelo Clerk; nunca é armazenada
            por mim em texto puro nem fica visível pra mim.
          </li>
          <li>
            <strong>Na compra (premium):</strong> os dados de pagamento são coletados{' '}
            <em>diretamente</em> pelo processador (Stripe) — eu recebo apenas: identificador
            da transação, plano, valor, data, e os 4 últimos dígitos do cartão (pra mostrar no
            recibo).
          </li>
          <li>
            <strong>Em emails que você manda:</strong> o conteúdo da mensagem.
          </li>
        </ul>

        <h3>Dados gerados pelo seu uso</h3>
        <ul>
          <li>Quais módulos você abriu e quanto progrediu.</li>
          <li>
            Suas respostas em quizzes e simulados (incluindo erros — uso pra calcular sua nota
            e pra melhorar o conteúdo, em forma agregada).
          </li>
          <li>
            Logs técnicos: IP, user-agent, horário do acesso. Mantidos por 6 meses por
            exigência do Marco Civil (Art. 15).
          </li>
        </ul>

        <h3>Dados coletados por terceiros</h3>
        <p>
          Hoje não rodamos analytics de terceiros (Google Analytics, pixel etc.). Se isso
          mudar no futuro, será com consentimento explícito via banner — ver{' '}
          <Link href="/cookies">Política de Cookies</Link>.
        </p>

        <h2 id="s4">
          <span className="num">04</span>Por que coletamos (bases legais da LGPD)
        </h2>
        <ul>
          <li>
            <strong>Execução do contrato</strong> (LGPD art. 7º, V): nome, email, progresso,
            respostas — sem isso o serviço não funciona.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal</strong> (art. 7º, II): logs de IP/acesso
            (Marco Civil), dados fiscais de pagamento.
          </li>
          <li>
            <strong>Consentimento</strong> (art. 7º, I): cookies não-essenciais e analytics
            (caso venham a ser adicionados) e emails de marketing (ainda não envio nenhum,
            mas se um dia for enviar, será opt-in).
          </li>
        </ul>

        <h2 id="s5">
          <span className="num">05</span>Com quem compartilhamos
        </h2>
        <p>Apenas com fornecedores estritamente necessários pra fazer o serviço funcionar:</p>
        <ul>
          <li>
            <strong>Stripe</strong> (processador de pagamento) — processa cartões em PCI-DSS
            Level 1; eu não armazeno dados de cartão.
          </li>
          <li>
            <strong>Provedor de email transacional</strong> (Resend ou similar) — envia emails
            de confirmação de cadastro, recuperação de senha, recibos.
          </li>
          <li>
            <strong>Clerk</strong> (autenticação) — armazena nome, email e gerencia sessões.
            Hospedado em infraestrutura própria, com criptografia em trânsito e em repouso.
          </li>
          <li>
            <strong>Hospedagem</strong> (Vercel ou similar) — servidores onde o site roda.
          </li>
        </ul>
        <p>
          <strong>Nunca</strong> vendo, alugo ou cedo seus dados pra terceiros pra fins de
          marketing. Caso isso mude (não pretendo), seria opt-in com consentimento explícito.
        </p>

        <h2 id="s6">
          <span className="num">06</span>Tempo de retenção
        </h2>
        <ul>
          <li>Dados de cadastro e progresso: enquanto sua conta existir.</li>
          <li>
            Após exclusão de conta: dados removidos em até 30 dias, exceto registros fiscais
            (compras) que ficam por 5 anos por obrigação legal.
          </li>
          <li>Logs de acesso (IP, user-agent): 6 meses (Marco Civil).</li>
          <li>Emails enviados pra mim: até 2 anos.</li>
        </ul>

        <h2 id="s7">
          <span className="num">07</span>Seus direitos (LGPD art. 18)
        </h2>
        <p>Você pode, a qualquer momento, solicitar:</p>
        <ul>
          <li>
            <strong>Confirmação</strong> de que estou tratando seus dados.
          </li>
          <li>
            <strong>Acesso</strong> aos dados que tenho sobre você (em formato legível).
          </li>
          <li>
            <strong>Correção</strong> de dados incorretos ou desatualizados.
          </li>
          <li>
            <strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários ou
            tratados em desconformidade.
          </li>
          <li>
            <strong>Portabilidade</strong> dos dados pra outro fornecedor.
          </li>
          <li>
            <strong>Eliminação</strong> dos dados tratados com base em consentimento.
          </li>
          <li>
            <strong>Informação</strong> sobre com quem compartilhei seus dados.
          </li>
          <li>
            <strong>Revogação do consentimento</strong>, quando aplicável.
          </li>
        </ul>

        <h2 id="s8">
          <span className="num">08</span>Como exercer seus direitos
        </h2>
        <p>
          Email pra <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a> com o assunto{' '}
          <strong>&ldquo;LGPD&rdquo;</strong> e descrição do pedido. Respondo em até 15 dias
          úteis, conforme exige a LGPD. Se eu negar (raro), explico por quê.
        </p>
        <p>
          Pra exclusão de conta: o pedido é processado em até 30 dias. Após isso, dados ficam
          retidos só pelo prazo fiscal de 5 anos pra eventuais compras feitas, conforme
          Receita Federal exige.
        </p>

        <h2 id="s9">
          <span className="num">09</span>Segurança
        </h2>
        <p>
          Autenticação delegada ao Clerk (provedor especializado, com SOC 2 Type II e
          criptografia em repouso). Conexões em HTTPS (TLS 1.3). Backups criptografados.
          Acesso a dados restrito a mim. Pagamentos processados em PCI-DSS Level 1 pelo
          Stripe.
        </p>
        <p>
          Em caso de incidente que comprometa dados pessoais (vazamento), comunico pelos
          canais cabíveis (email aos afetados, ANPD se grave) em prazo razoável.
        </p>

        <h2 id="s10">
          <span className="num">10</span>Crianças e adolescentes
        </h2>
        <p>
          O serviço é destinado a maiores de 16 anos. Não coleto deliberadamente dados de
          menores. Se identificar cadastro de menor, removo. Se você é responsável e
          identificou cadastro do menor sob sua tutela, me avise por email.
        </p>

        <h2 id="s11">
          <span className="num">11</span>Mudanças nesta política
        </h2>
        <p>
          Posso atualizar esta política. Mudanças relevantes (novo terceiro com quem
          compartilho dados, mudança de finalidade) são comunicadas por email com 30 dias de
          antecedência. A versão sempre fica visível no topo desta página.
        </p>

        <h2 id="s12">
          <span className="num">12</span>Contato
        </h2>
        <p>
          Renato Moraes Natali —{' '}
          <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>.
        </p>
        <p>
          Você também pode reclamar diretamente à <strong>ANPD</strong> (Autoridade Nacional
          de Proteção de Dados) em{' '}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
            gov.br/anpd
          </a>
          .
        </p>
      </article>
    </PageShell>
  );
}

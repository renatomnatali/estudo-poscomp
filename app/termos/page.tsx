import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/marketing/pages/page-shell';

export const metadata: Metadata = {
  title: 'aprovado.xyz · termos de uso',
  description:
    'As regras pra usar o aprovado.xyz. Em português direto, sem juridiquês — mas válidas mesmo assim.',
};

const SECTIONS = [
  { id: 's1', label: 'Quem somos' },
  { id: 's2', label: 'Aceitação' },
  { id: 's3', label: 'Conta e cadastro' },
  { id: 's4', label: 'Plano grátis e premium' },
  { id: 's5', label: 'Pagamento e reembolso' },
  { id: 's6', label: 'Conduta esperada' },
  { id: 's7', label: 'Propriedade intelectual' },
  { id: 's8', label: 'Garantias e limitações' },
  { id: 's9', label: 'Cancelamento' },
  { id: 's10', label: 'Mudanças nestes termos' },
  { id: 's11', label: 'Lei aplicável' },
  { id: 's12', label: 'Como falar comigo' },
];

export default function TermosPage() {
  return (
    <PageShell current="/termos">
      <header className="page-hd">
        <span className="eyebrow">Legal</span>
        <h1>Termos de uso</h1>
        <p className="lead">
          As regras pra usar o aprovado.xyz. Em português direto, sem juridiquês — mas válidas
          mesmo assim.
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
          <strong>Resumo em 3 linhas:</strong> você cria uma conta, estuda, paga só se quiser
          acesso premium. Pode cancelar a qualquer momento, reembolso de 7 dias sem perguntas.
          O conteúdo é meu, não copia. O resto é detalhe.
        </div>

        <h2 id="s1">
          <span className="num">01</span>Quem somos
        </h2>
        <p>
          O aprovado.xyz é um serviço operado por <strong>Renato Moraes Natali</strong>,
          pessoa física, contato via{' '}
          <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>. Não há sede física,
          não há equipe terceirizada de suporte. Sou eu sozinho.
        </p>

        <h2 id="s2">
          <span className="num">02</span>Aceitação destes termos
        </h2>
        <p>
          Ao criar uma conta ou usar o aprovado.xyz de qualquer forma, você confirma que leu,
          entendeu e concorda com estes termos. Se discordar de algum ponto, não use o
          serviço.
        </p>

        <h2 id="s3">
          <span className="num">03</span>Conta e cadastro
        </h2>
        <p>
          Pra usar o aprovado.xyz você precisa criar uma conta com email e senha. Você é
          responsável por manter a senha em segurança. Avise por email se suspeitar de acesso
          não autorizado — reseto a conta na hora.
        </p>
        <p>
          Você precisa ter pelo menos 16 anos pra criar conta. Não pedimos comprovação, mas se
          identificarmos cadastro de menor sem autorização, removemos.
        </p>

        <h2 id="s4">
          <span className="num">04</span>Plano grátis e plano premium
        </h2>
        <p>O aprovado.xyz tem dois planos:</p>
        <ul>
          <li>
            <strong>Grátis:</strong> acesso permanente e sem cartão à área de Linguagens
            Formais (9 módulos), simulado parcial (20 questões) e dashboard básico.
          </li>
          <li>
            <strong>Premium:</strong> acesso a todos os 25 tópicos do edital conforme forem
            lançados, simulado oficial completo (70 questões), flashcards e analítica de
            progresso.
          </li>
        </ul>
        <p>
          Os tópicos do plano premium são liberados em ondas. Não prometo data exata pra cada
          tópico — o cronograma público do edital fica disponível na página de currículo.
        </p>

        <h2 id="s5">
          <span className="num">05</span>Pagamento e reembolso
        </h2>
        <p>
          O plano premium é cobrado mensal ou anualmente, no valor anunciado na página de
          planos no momento da assinatura. O pagamento é processado por terceiros confiáveis
          (Stripe ou similar) — nenhum dado de cartão passa pelos servidores do aprovado.xyz.
        </p>
        <p>
          <strong>Reembolso de 7 dias:</strong> se você cancelar a assinatura nos primeiros 7
          dias após a primeira compra, devolvo 100% do valor sem perguntas. É só mandar email
          pra <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>.
        </p>
        <p>
          Após 7 dias, o cancelamento interrompe a renovação automática — você mantém o
          acesso até o fim do período já pago, mas não há reembolso proporcional.
        </p>

        <h2 id="s6">
          <span className="num">06</span>Conduta esperada
        </h2>
        <p>
          Você concorda em <em>não</em>:
        </p>
        <ul>
          <li>Compartilhar sua conta com outras pessoas. Cada conta é individual.</li>
          <li>
            Baixar, copiar ou redistribuir o conteúdo do aprovado.xyz (módulos, simulados,
            questões, gabaritos) fora do uso pessoal de estudo.
          </li>
          <li>Usar bots, scrapers ou qualquer automação pra extrair conteúdo do site.</li>
          <li>
            Tentar acessar áreas restritas, contas de outros usuários ou explorar
            vulnerabilidades.
          </li>
          <li>Vender, sublicenciar ou ceder seu acesso a terceiros.</li>
        </ul>
        <p>
          Violação séria pode resultar em suspensão da conta sem reembolso. Pra dúvida sobre
          uso aceitável (por exemplo: posso compartilhar uma questão num grupo de estudos?
          Resposta: sim, em pequena quantidade, com crédito), me manda email.
        </p>

        <h2 id="s7">
          <span className="num">07</span>Propriedade intelectual
        </h2>
        <p>
          Todo o conteúdo do aprovado.xyz — texto, animações, código dos simuladores,
          ilustrações, simulados — é de minha autoria ou licenciado, e protegido por direito
          autoral. As questões são originais, escritas com base no edital SBC e nos livros de
          referência citados. Os livros referenciados (Sipser, Cormen/CLRS, Tanenbaum,
          Hopcroft) são propriedade dos seus respectivos autores e editoras.
        </p>
        <p>
          Você recebe uma <strong>licença não-exclusiva, intransferível e revogável</strong>{' '}
          de uso pessoal pra estudo enquanto sua conta estiver ativa. Nenhum direito é
          transferido.
        </p>

        <h2 id="s8">
          <span className="num">08</span>Garantias e limitações
        </h2>
        <p>
          O aprovado.xyz é fornecido &ldquo;como está&rdquo;. Faço esforço razoável pra manter
          o serviço funcionando, o conteúdo correto e atualizado — mas não{' '}
          <strong>garanto</strong>:
        </p>
        <ul>
          <li>
            Aprovação no POSCOMP. O serviço é um auxílio de estudo, não uma promessa de
            resultado.
          </li>
          <li>Disponibilidade 100%. Pode haver manutenção, falha ou erro.</li>
          <li>Cobertura completa de todas as questões que poderão cair na prova.</li>
          <li>Que erros pontuais em gabaritos não aconteçam — se encontrar, me avise.</li>
        </ul>
        <p>
          Em qualquer caso, minha responsabilidade total fica limitada ao valor que você pagou
          no aprovado.xyz nos 12 meses anteriores ao evento que motivou a reclamação.
        </p>

        <h2 id="s9">
          <span className="num">09</span>Cancelamento
        </h2>
        <p>
          Você pode cancelar a qualquer momento, sem fidelidade, dentro da própria conta ou
          por email. Se quiser <strong>excluir completamente sua conta e dados</strong>, mando
          o processo da LGPD — ver detalhes na{' '}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
        <p>
          Eu também posso suspender ou encerrar contas em caso de violação destes termos.
          Sempre que possível, aviso por email antes.
        </p>

        <h2 id="s10">
          <span className="num">10</span>Mudanças nestes termos
        </h2>
        <p>
          Posso atualizar estes termos quando houver mudança relevante no serviço. Se a
          mudança for significativa (preço, escopo do plano, política de reembolso), aviso por
          email com 30 dias de antecedência. O histórico de versões fica disponível mediante
          solicitação.
        </p>

        <h2 id="s11">
          <span className="num">11</span>Lei aplicável e foro
        </h2>
        <p>
          Estes termos são regidos pelas leis do Brasil — Marco Civil da Internet (Lei
          12.965/2014), Código de Defesa do Consumidor e LGPD (Lei 13.709/2018). Foro da
          comarca de São Paulo, SP, salvo direito do consumidor.
        </p>

        <h2 id="s12">
          <span className="num">12</span>Como falar comigo
        </h2>
        <p>
          Qualquer dúvida, reclamação, sugestão:{' '}
          <a href="mailto:renato@aprovado.xyz">renato@aprovado.xyz</a>. Respondo em até 24h em
          dias úteis.
        </p>
      </article>
    </PageShell>
  );
}

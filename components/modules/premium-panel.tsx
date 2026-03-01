export function PremiumPanel() {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel">
          <h3 className="text-base font-semibold">Plano Gratuito</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>20 simulações por dia</li>
            <li>Tópicos essenciais</li>
            <li>Exercícios básicos</li>
            <li>Sem criação de flashcards personalizados</li>
          </ul>
        </article>

        <article className="panel">
          <h3 className="text-base font-semibold">Plano Premium</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Simulações ilimitadas</li>
            <li>Todos os tópicos e trilhas completas</li>
            <li>Flashcards personalizados</li>
            <li>Simulados completos estilo POSCOMP</li>
            <li>Analytics de desempenho detalhado</li>
          </ul>
          <article className="callout mt-4">Oferta atual: 7 dias para testar funcionalidades premium.</article>
        </article>
      </section>

      <section className="section-card">
        <h3 className="text-base font-semibold">Valor percebido na sua jornada</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="status-dot completed" aria-hidden="true"></span>
              <span>Limitação encontrada</span>
            </div>
            <small className="text-slate-500">agora</small>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="status-dot running" aria-hidden="true"></span>
              <span>Avaliando planos</span>
            </div>
            <small className="text-slate-500">em andamento</small>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="status-dot queued" aria-hidden="true"></span>
              <span>Checkout seguro</span>
            </div>
            <small className="text-slate-500">próximo</small>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DashboardPanel() {
  return (
    <div className="space-y-5">
      <section className="section-card">
        <div className="grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Progresso total</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">42%</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Tempo na semana</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">1h32</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Streak</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">6 dias</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Acerto em exercícios</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">78%</p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="panel">
          <h3 className="text-base font-semibold">Próximos tópicos recomendados</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p><strong>Agora:</strong> Autômatos Finitos Determinísticos</p>
            <p><strong>Depois:</strong> Expressões Regulares e conversão para AFD</p>
            <p><strong>Meta do dia:</strong> 2 simulações + 5 exercícios</p>
          </div>
          <div className="progress-track mt-3">
            <div className="progress-fill" style={{ width: '58%' }}></div>
          </div>
        </article>

        <article className="panel">
          <h3 className="text-base font-semibold">Atividade recente</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="status-dot completed" aria-hidden="true"></span>
                <span>Exercício #24 concluído</span>
              </div>
              <small className="text-slate-500">14:18</small>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="status-dot completed" aria-hidden="true"></span>
                <span>Simulação aceita</span>
              </div>
              <small className="text-slate-500">13:54</small>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="status-dot queued" aria-hidden="true"></span>
                <span>Revisão de flashcards</span>
              </div>
              <small className="text-slate-500">Próximo</small>
            </div>
          </div>
        </article>
      </section>

      <section className="section-card">
        <h3 className="text-base font-semibold">Ações rápidas</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <strong className="text-sm text-slate-900">Nova simulação</strong>
            <p className="mt-1 text-sm text-slate-600">Testar expressão e palavra alvo.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <strong className="text-sm text-slate-900">Revisão de flashcards</strong>
            <p className="mt-1 text-sm text-slate-600">Sessão rápida em 10 minutos.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <strong className="text-sm text-slate-900">Resolver exercícios</strong>
            <p className="mt-1 text-sm text-slate-600">Treino por dificuldade.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

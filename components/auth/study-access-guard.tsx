import Link from 'next/link';

export function StudyAccessGuard() {
  return (
    <main className="page-wrap">
      <section className="section-card">
        <h1 className="page-title">Acesso restrito</h1>
        <p className="page-subtitle">
          Faça login para acessar trilhas, simulados e progresso persistente entre sessões.
        </p>

        <div className="auth-landing-actions">
          <Link href="/entrar" className="sim-action-btn sim-action-btn-primary">Entrar</Link>
          <Link href="/cadastro" className="sim-action-btn sim-action-btn-tertiary">Criar conta</Link>
          <Link href="/demo" className="sim-action-btn sim-action-btn-secondary">Ver demo</Link>
        </div>
      </section>
    </main>
  );
}

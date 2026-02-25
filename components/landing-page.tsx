import Link from 'next/link';

export function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="section-card">
        <header>
          <h1 className="page-title">POSCOMP Visual Lab</h1>
          <p className="page-subtitle">
            Aprenda autômatos com simulação visual, trilha guiada e exercícios no estilo POSCOMP.
          </p>
        </header>

        <div className="auth-landing-actions">
          <Link href="/cadastro" className="sim-action-btn sim-action-btn-primary">Criar conta</Link>
          <Link href="/entrar" className="sim-action-btn sim-action-btn-tertiary">Entrar</Link>
          <Link href="/demo" className="sim-action-btn sim-action-btn-secondary">Ver demo do simulador</Link>
        </div>

        <p className="auth-landing-note">Não precisa estar logado para usar a demo do simulador.</p>
      </section>
    </main>
  );
}

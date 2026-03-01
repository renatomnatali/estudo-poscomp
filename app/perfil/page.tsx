import Link from 'next/link';

export default function ProfilePage() {
  return (
    <main className="page-wrap">
      <section className="section-card">
        <h1 className="page-title">Configurações do perfil</h1>
        <p className="page-subtitle">
          Ajuste preferências de estudo e gerenciamento de conta autenticada.
        </p>
        <div className="auth-landing-actions">
          <Link href="/dashboard" className="sim-action-btn sim-action-btn-primary">Voltar para estudo</Link>
        </div>
      </section>
    </main>
  );
}

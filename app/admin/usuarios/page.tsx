import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { AdminUsersPage } from '@/components/admin/admin-users-page';
import { StudyShell } from '@/components/study/study-shell';
import { resolveAdminAccess } from '@/lib/admin-auth';
import { getServerViewer } from '@/lib/server-viewer';

export default async function AdminUsersRoutePage() {
  const [viewer, admin] = await Promise.all([getServerViewer(), resolveAdminAccess()]);

  return (
    <StudyRouteGuard>
      <StudyShell
        activeNav="premium"
        pageTitle="Administração"
        pageSubtitle="Gestão de usuários VIP e premium"
        breadcrumb={[
          { label: 'App', href: '/dashboard' },
          { label: 'Admin', href: '/admin/usuarios' },
          'Usuários',
        ]}
        viewer={viewer}
      >
        {admin.allowed ? (
          <AdminUsersPage />
        ) : (
          <section className="section-card">
            <h2 className="text-lg font-semibold">Acesso restrito</h2>
            <p className="mt-2 text-sm text-slate-600">
              {admin.error || 'Você não possui permissão para visualizar o painel administrativo.'}
            </p>
          </section>
        )}
      </StudyShell>
    </StudyRouteGuard>
  );
}

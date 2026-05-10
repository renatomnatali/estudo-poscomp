import { redirect } from 'next/navigation';

import { StudyRouteGuard } from '@/components/auth/study-route-guard';
import { AdminUsersPage } from '@/components/admin/admin-users-page';
import { StudyShell } from '@/components/study/study-shell';
import { resolveAdminAccess } from '@/lib/admin-auth';
import { getServerViewer } from '@/lib/server-viewer';

export default async function AdminUsersRoutePage() {
  const [viewer, admin] = await Promise.all([getServerViewer(), resolveAdminAccess()]);

  if (!admin.allowed) {
    redirect('/dashboard');
  }

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
        <AdminUsersPage />
      </StudyShell>
    </StudyRouteGuard>
  );
}

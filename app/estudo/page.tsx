import { ClerkStudyShell } from '@/components/auth/clerk-study-shell';
import { PoscompApp } from '@/components/poscomp-app';
import { isClerkEnabledServer } from '@/lib/auth-config';

export default function StudyPage() {
  if (!isClerkEnabledServer()) {
    return (
      <PoscompApp
        auth={{
          mode: 'authenticated',
          displayName: 'Estudante',
          email: 'local@dev',
        }}
      />
    );
  }

  return <ClerkStudyShell />;
}

import { PoscompApp } from '@/components/poscomp-app';

export default function DemoPage() {
  return (
    <PoscompApp
      auth={{
        mode: 'demo',
        displayName: 'Visitante',
      }}
    />
  );
}

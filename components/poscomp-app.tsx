'use client';

import { useState } from 'react';

import { AfdSimulator } from '@/components/modules/afd-simulator';
import { AfnConversionPanel } from '@/components/modules/afn-conversion-panel';
import { MinimizationPanel } from '@/components/modules/minimization-panel';
import { QuestionsPanel } from '@/components/modules/questions-panel';

type TabId = 'afd' | 'min' | 'conv' | 'qa';

export function PoscompApp() {
  const [activeTab, setActiveTab] = useState<TabId>('afd');

  return (
    <main className="mx-auto max-w-[1380px] p-6">
      <header className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 via-blue-600 to-amber-500 p-8 text-white shadow-lg">
        <div className="inline-flex items-center gap-3 font-semibold">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">PC</div>
          <span>POSCOMP Visual Lab</span>
        </div>
        <h1 className="mt-4 text-4xl font-bold">Aplicação V1 - Autômatos</h1>
        <p className="mt-2 max-w-3xl text-blue-50">
          Stack oficial: Next.js 15, App Router e TypeScript. Módulos ativos: Simulação AFD,
          minimização, conversão AFN→AFD e questões estilo POSCOMP.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`button ${activeTab === 'afd' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('afd')}
          >
            Simulador AFD
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'min' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('min')}
          >
            Minimização
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'conv' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('conv')}
          >
            AFN→AFD
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'qa' ? 'primary' : 'secondary'}`}
            onClick={() => setActiveTab('qa')}
          >
            Questões
          </button>
        </div>
      </header>

      <section hidden={activeTab !== 'afd'}>
        <AfdSimulator />
      </section>
      <section hidden={activeTab !== 'min'}>
        <MinimizationPanel />
      </section>
      <section hidden={activeTab !== 'conv'}>
        <AfnConversionPanel />
      </section>
      <section hidden={activeTab !== 'qa'}>
        <QuestionsPanel />
      </section>
    </main>
  );
}

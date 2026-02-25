'use client';

import { useState } from 'react';
import Link from 'next/link';

import { AfdSimulator } from '@/components/modules/afd-simulator';
import { AfnConversionPanel } from '@/components/modules/afn-conversion-panel';
import { MinimizationPanel } from '@/components/modules/minimization-panel';
import { QuestionsPanel } from '@/components/modules/questions-panel';

type SimulatorTabId = 'afd' | 'min' | 'conv';
type MenuId = 'dashboard' | 'topics' | 'simulator' | 'flashcards' | 'exercises' | 'premium';

const MENU_ITEMS: Array<{ id: MenuId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'topics', label: 'Tópicos' },
  { id: 'simulator', label: 'Simulador' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'premium', label: 'Premium' },
];

const MOBILE_MENU_ITEMS: Array<{ id: MenuId; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'topics', label: 'Tópicos' },
  { id: 'simulator', label: 'Simulador' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'premium', label: 'Premium' },
];

const MODULE_HEADER: Record<MenuId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Rota de estudo da semana',
    subtitle: 'Continue de onde parou: Autômatos e Linguagens Formais.',
  },
  topics: {
    title: 'Tópicos do POSCOMP',
    subtitle: 'Selecione um tópico para estudar com teoria, exemplos e prática guiada.',
  },
  simulator: {
    title: 'Simulador de Autômatos',
    subtitle: '',
  },
  flashcards: {
    title: 'Sessão de flashcards',
    subtitle: 'Reforce conceitos críticos com repetição espaçada.',
  },
  exercises: {
    title: 'Questões estilo POSCOMP',
    subtitle: 'Resolva questões por subtópico e acompanhe desempenho.',
  },
  premium: {
    title: 'Recursos Premium',
    subtitle: 'Simulados completos, trilhas adaptativas e revisão guiada.',
  },
};

const DEMO_MENU_ITEMS: Array<{ id: MenuId; label: string }> = [
  { id: 'simulator', label: 'Simulador' },
];

type AppAuthMode = 'authenticated' | 'anonymous' | 'demo';

interface PoscompAppAuthState {
  mode: AppAuthMode;
  displayName: string;
  email?: string;
  onSignOut?: () => void;
}

interface PoscompAppProps {
  auth?: PoscompAppAuthState;
}

function PlaceholderModule({
  title,
  description,
  actionLabel,
  actionHint,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHint: string;
}) {
  return (
    <section className="section-card">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{actionLabel}</p>
        <p className="mt-1 text-sm text-slate-600">{actionHint}</p>
      </div>
    </section>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'U';
}

export function PoscompApp({ auth }: PoscompAppProps) {
  const effectiveAuth: PoscompAppAuthState = auth ?? {
    mode: 'authenticated',
    displayName: 'Estudante',
  };

  const menuItems = effectiveAuth.mode === 'demo' ? DEMO_MENU_ITEMS : MENU_ITEMS;
  const mobileMenuItems = effectiveAuth.mode === 'demo'
    ? DEMO_MENU_ITEMS
    : MOBILE_MENU_ITEMS;

  const [activeMenu, setActiveMenu] = useState<MenuId>(effectiveAuth.mode === 'demo' ? 'simulator' : 'simulator');
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<SimulatorTabId>('afd');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentHeader = MODULE_HEADER[activeMenu];

  function renderActiveModule() {
    if (activeMenu === 'simulator') {
      return (
        <div className="space-y-5">
          <section hidden={activeSimulatorTab !== 'afd'}>
            <AfdSimulator />
          </section>
          <section hidden={activeSimulatorTab !== 'min'}>
            <MinimizationPanel />
          </section>
          <section hidden={activeSimulatorTab !== 'conv'}>
            <AfnConversionPanel />
          </section>
        </div>
      );
    }

    if (activeMenu === 'exercises') {
      return <QuestionsPanel />;
    }

    if (activeMenu === 'dashboard') {
      return (
        <PlaceholderModule
          title="Dashboard da semana"
          description="Acompanhe progresso, sequência de estudos e recomendações da trilha atual."
          actionLabel="Próxima ação sugerida"
          actionHint="Executar uma simulação AFD e resolver 5 questões de autômatos."
        />
      );
    }

    if (activeMenu === 'topics') {
      return (
        <PlaceholderModule
          title="Lista de tópicos"
          description="Explore tópicos por macroárea e incidência em provas anteriores."
          actionLabel="Trilha recomendada"
          actionHint="Fundamentos → Autômatos Finitos Determinísticos (AFD)."
        />
      );
    }

    if (activeMenu === 'flashcards') {
      return (
        <PlaceholderModule
          title="Flashcards"
          description="Revise definições e propriedades com repetição espaçada para retenção."
          actionLabel="Fila de revisão"
          actionHint="12 cartões pendentes sobre linguagens formais e autômatos."
        />
      );
    }

    return (
      <PlaceholderModule
        title="Premium"
        description="Recursos avançados de preparação para prova com simulados completos."
        actionLabel="Conteúdo premium"
        actionHint="Liberação prevista após fechamento da V1 de Fundamentos."
      />
    );
  }

  return (
    <main className="page-wrap">
      <div className="app-shell">
        <aside className="sidebar">
          <h1>POSCOMP Visual</h1>
          <span className="project-chip">
            {effectiveAuth.mode === 'demo' ? 'Modo: Demo pública' : 'Plano: Gratuito'}
          </span>

          <div className="profile-area">
            {effectiveAuth.mode === 'authenticated' ? (
              <div className="profile-menu">
                <button
                  type="button"
                  aria-label="Menu do usuário"
                  className="profile-trigger"
                  onClick={() => setIsProfileOpen((current) => !current)}
                >
                  <span className="profile-avatar" aria-hidden="true">{getInitials(effectiveAuth.displayName)}</span>
                  <span className="profile-main">
                    <strong>{effectiveAuth.displayName}</strong>
                    <small>{effectiveAuth.email || 'Conta autenticada'}</small>
                  </span>
                </button>

                {isProfileOpen ? (
                  <div className="profile-dropdown" role="menu" aria-label="Menu de perfil">
                    <Link role="menuitem" href="/perfil" onClick={() => setIsProfileOpen(false)}>
                      Configurações
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        effectiveAuth.onSignOut?.();
                      }}
                    >
                      Sair
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="profile-anonymous">
                <p className="text-xs text-slate-600">
                  {effectiveAuth.mode === 'demo'
                    ? 'Sessão de demonstração sem progresso salvo.'
                    : 'Acesse para salvar progresso e histórico.'}
                </p>
                <div className="profile-anonymous-actions">
                  <Link href="/entrar" className="sim-action-btn sim-action-btn-primary">Entrar</Link>
                  <Link href="/cadastro" className="sim-action-btn sim-action-btn-tertiary">Criar conta</Link>
                </div>
              </div>
            )}
          </div>

          <nav aria-label="Menu principal">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenu(item.id);
                  setIsProfileOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {effectiveAuth.mode === 'authenticated'
              ? `Usuário: ${effectiveAuth.displayName}\nSessão ativa: sim`
              : 'Usuário: visitante\nSessão ativa: não'}
          </div>
        </aside>

        <section className="main-area">
          <header className="page-header">
            <h1 className="page-title">{currentHeader.title}</h1>
            {currentHeader.subtitle ? <p className="page-subtitle">{currentHeader.subtitle}</p> : null}
            {effectiveAuth.mode === 'demo' ? (
              <p className="page-subtitle">
                Demo pública: o simulador funciona sem login, mas progresso e métricas não são persistidos.
              </p>
            ) : null}

            {activeMenu === 'simulator' ? (
              <div className="sim-mode-switch mt-4" role="tablist" aria-label="Módulos do simulador">
                <button
                  type="button"
                  className={`sim-mode-pill ${activeSimulatorTab === 'afd' ? 'is-active' : ''}`}
                  onClick={() => setActiveSimulatorTab('afd')}
                >
                  Simulador AFD
                </button>
                <button
                  type="button"
                  className={`sim-mode-pill ${activeSimulatorTab === 'min' ? 'is-active' : ''}`}
                  onClick={() => setActiveSimulatorTab('min')}
                >
                  Minimização
                </button>
                <button
                  type="button"
                  className={`sim-mode-pill ${activeSimulatorTab === 'conv' ? 'is-active' : ''}`}
                  onClick={() => setActiveSimulatorTab('conv')}
                >
                  AFN→AFD
                </button>
              </div>
            ) : null}
          </header>

          {renderActiveModule()}
        </section>
      </div>

      <nav className="bottom-tabs" aria-label="Menu mobile">
        {mobileMenuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-link-mobile ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu(item.id);
              setIsProfileOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}

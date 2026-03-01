'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';

import { isClerkEnabledClient } from '@/lib/auth-config';

export type StudyNavId =
  | 'dashboard'
  | 'trilhas'
  | 'flashcards'
  | 'exercicios'
  | 'simulado'
  | 'premium';

type SidebarItemId = StudyNavId | 'progresso';

export interface StudyBreadcrumbItem {
  label: string;
  href?: string;
}

interface StudyShellProps {
  activeNav: StudyNavId;
  pageTitle: string;
  pageSubtitle?: string;
  breadcrumb: Array<string | StudyBreadcrumbItem>;
  searchPlaceholder?: string | null;
  topbarMode?: 'default' | 'lesson';
  contentMode?: 'default' | 'flush';
  mainVariant?: 'default' | 'lesson';
  children: React.ReactNode;
  onSignOut?: () => void;
}

interface SidebarItem {
  id: SidebarItemId;
  label: string;
  href: string;
  icon: string;
  tooltip: string;
  badge?: { label: string; tone: 'green' | 'amber' };
  premium?: boolean;
}

const NAV_SECTIONS: Array<{
  key: string;
  label?: string;
  separatorBefore?: boolean;
  items: SidebarItem[];
}> = [
  {
    key: 'inicio',
    label: 'Início',
    items: [{ id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '🏠', tooltip: 'Dashboard' }],
  },
  {
    key: 'estudar',
    label: 'Estudar',
    items: [
      {
        id: 'trilhas',
        label: 'Trilhas de Estudo',
        href: '/trilhas',
        icon: '📚',
        tooltip: 'Trilhas',
        badge: { label: '25', tone: 'green' },
      },
      {
        id: 'flashcards',
        label: 'Flashcards',
        href: '/flashcards',
        icon: '🃏',
        tooltip: 'Flashcards',
      },
    ],
  },
  {
    key: 'praticar',
    label: 'Praticar',
    items: [
      {
        id: 'exercicios',
        label: 'Exercícios',
        href: '/premium',
        icon: '📝',
        tooltip: 'Exercícios',
      },
      {
        id: 'simulado',
        label: 'Simulado POSCOMP',
        href: '/simulado',
        icon: '⏱️',
        tooltip: 'Simulado',
      },
    ],
  },
  {
    key: 'progresso',
    separatorBefore: true,
    items: [
      {
        id: 'progresso',
        label: 'Meu Progresso',
        href: '/premium',
        icon: '📊',
        tooltip: 'Progresso',
        badge: { label: 'PRO', tone: 'amber' },
      },
    ],
  },
  {
    key: 'premium',
    separatorBefore: true,
    items: [
      {
        id: 'premium',
        label: 'Seja Premium',
        href: '/premium',
        icon: '⭐',
        tooltip: 'Premium',
        premium: true,
      },
    ],
  },
];

export function StudyShell({
  activeNav,
  pageTitle,
  pageSubtitle,
  breadcrumb,
  searchPlaceholder = 'Buscar tópico ou módulo...',
  topbarMode = 'default',
  contentMode = 'default',
  mainVariant = 'default',
  children,
  onSignOut,
}: StudyShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const clerkEnabled = isClerkEnabledClient();

  useEffect(() => {
    const saved =
      window.localStorage.getItem('sb-state') ??
      window.localStorage.getItem('study:sidebar');
    setCollapsed(saved === 'collapsed');
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onResize() {
      if (!isMobileViewport()) {
        setMobileOpen(false);
      }
    }

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current) return;
      if (userMenuRef.current.contains(event.target as Node)) return;
      setUserMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function isMobileViewport() {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 768px)').matches;
    }

    return window.innerWidth <= 768;
  }

  function toggleSidebar() {
    if (isMobileViewport()) {
      setMobileOpen((value) => !value);
      return;
    }

    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem('study:sidebar', next ? 'collapsed' : 'expanded');
      window.localStorage.setItem('sb-state', next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  function handleSignOutFallback() {
    setUserMenuOpen(false);

    if (onSignOut) {
      onSignOut();
      return;
    }

    window.localStorage.removeItem('study:sidebar');
    window.localStorage.removeItem('sb-state');
    window.location.assign('/entrar');
  }

  function getItemClassName(item: SidebarItem) {
    const isActive = item.id === activeNav;
    return [
      'sb-item',
      isActive ? 'active' : '',
      item.premium ? 'premium' : '',
      isActive && item.id === 'premium' ? 'active-premium' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <main className="study-wrap">
      <button
        type="button"
        aria-label="Fechar menu móvel"
        className={`sb-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className="study-shell">
        <aside
          data-testid="study-sidebar"
          className={`study-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
        >
          <div className="sb-logo">
            <div className="sb-logo-icon">PV</div>
            <div className="sb-logo-text">
              <strong className="sb-logo-name">POSCOMP</strong>
              <span className="sb-logo-sub">Visual Lab</span>
            </div>
            <button
              type="button"
              aria-label="Alternar menu lateral"
              className="sb-toggle"
              onClick={toggleSidebar}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="1" y1="3.5" x2="13" y2="3.5" />
                <line x1="1" y1="7" x2="13" y2="7" />
                <line x1="1" y1="10.5" x2="13" y2="10.5" />
              </svg>
            </button>
          </div>

          <div className="sb-progress-strip">
            <div className="sb-ps-header">
              <span className="sb-ps-label">Progresso geral</span>
              <span className="sb-ps-pct">4%</span>
            </div>
            <div className="sb-ps-bar-bg">
              <div className="sb-ps-bar-fill" />
            </div>
            <div className="sb-ps-caption">1 de 25 tópicos concluídos</div>
          </div>

          <nav aria-label="Menu principal" className="sb-nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.key} className="sb-nav-wrapper">
                {section.separatorBefore ? <div className="sb-sep" /> : null}
                <div className="sb-nav-section">
                  {section.label ? <div className="sb-nav-label">{section.label}</div> : null}
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={getItemClassName(item)}
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="sb-item-icon" aria-hidden="true">
                        {item.icon}
                      </div>
                      <span className="sb-item-text">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`sb-item-badge ${item.badge.tone === 'green' ? 'badge-green' : 'badge-amber'}`}
                        >
                          {item.badge.label}
                        </span>
                      ) : null}
                      <span className="sb-tooltip">{item.tooltip}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="sb-footer">
            <div className="sb-user-wrap" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Menu do usuário"
                className="sb-user sb-user-trigger"
                onClick={() => setUserMenuOpen((value) => !value)}
              >
                <div className="sb-avatar">RN</div>
                <div className="sb-user-info">
                  <div className="sb-user-name">Renato Natali</div>
                  <div className="sb-user-plan">Plano Free</div>
                </div>
              </button>

              {userMenuOpen ? (
                <div className="sb-user-menu" role="menu" aria-label="Menu do usuário">
                  <Link
                    role="menuitem"
                    href="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Perfil
                  </Link>
                  <Link
                    role="menuitem"
                    href="/perfil#opcoes"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Opções
                  </Link>

                  {clerkEnabled ? (
                    <SignOutButton redirectUrl="/">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onSignOut?.();
                        }}
                      >
                        Sair
                      </button>
                    </SignOutButton>
                  ) : (
                    <button role="menuitem" type="button" onClick={handleSignOutFallback}>
                      Sair
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <section className={`study-main-area ${mainVariant === 'lesson' ? 'lesson-variant' : ''}`}>
          <div className={`study-topbar-progress ${collapsed ? 'visible' : ''}`}>
            <div className="study-topbar-progress-fill" />
          </div>

          <header className="study-topbar">
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              className="study-mobile-toggle"
              onClick={() => setMobileOpen(true)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="1" y1="3.5" x2="13" y2="3.5" />
                <line x1="1" y1="7" x2="13" y2="7" />
                <line x1="1" y1="10.5" x2="13" y2="10.5" />
              </svg>
            </button>
            <div className="study-topbar-row">
              <div className="study-breadcrumb topbar-breadcrumb" aria-label="Breadcrumb">
                {breadcrumb.map((item, index) => {
                  const crumb = typeof item === 'string' ? { label: item } : item;
                  const isCurrent = index === breadcrumb.length - 1;

                  return (
                    <span key={`${crumb.label}-${index}`} className="crumb-segment">
                      {!isCurrent && crumb.href ? (
                        <Link href={crumb.href} className="crumb-link">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isCurrent ? 'current' : ''}>{crumb.label}</span>
                      )}
                      {index < breadcrumb.length - 1 ? <span className="sep">›</span> : null}
                    </span>
                  );
                })}
              </div>
              {topbarMode === 'default' && searchPlaceholder ? (
                <div className="study-topbar-search" aria-label={`Buscar em ${pageTitle}`}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="7" cy="7" r="5" />
                    <path d="M11 11l3 3" />
                  </svg>
                  <span>{searchPlaceholder}</span>
                </div>
              ) : null}
              <div className="study-topbar-actions">
                {topbarMode === 'lesson' ? (
                  <>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Flashcards deste módulo">
                      🃏
                    </button>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Notificações">
                      🔔
                      <span className="study-notif-dot" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Notificações">
                      🔔
                      <span className="study-notif-dot" aria-hidden="true" />
                    </button>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Configurações">
                      ⚙️
                    </button>
                  </>
                )}
              </div>
            </div>
            {pageSubtitle ? <span className="sr-only">{pageSubtitle}</span> : null}
          </header>
          <section className={`study-content ${contentMode === 'flush' ? 'flush' : ''}`}>{children}</section>
        </section>
      </div>
    </main>
  );
}

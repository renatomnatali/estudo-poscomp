'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SignOutButton } from '@clerk/nextjs';
import {
  Bell,
  BookOpen,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Menu,
  Route,
  Search,
  Settings,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';

import { isClerkEnabledClient } from '@/lib/auth-config';
import type { Course } from '@/lib/courses/types';
import { CourseSwitcher } from '@/components/study/course-switcher';

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

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
  /** Curso ativo da sessão — decide nav, progresso e contexto do shell. */
  course: Course;
  /** Todos os cursos registrados — alimentam o seletor da sidebar. */
  courses: Course[];
  viewer?: {
    displayName?: string;
    email?: string;
    isPremium?: boolean;
    premiumSource?: 'billing' | 'vip' | 'none';
    planLabel?: 'Plano Free' | 'Plano Premium' | 'Plano VIP';
  };
}

interface SidebarItem {
  id: SidebarItemId;
  label: string;
  href: string;
  Icon: IconComponent;
  tooltip: string;
  badge?: { label: string; tone: 'green' | 'amber' };
  premium?: boolean;
}

type NavSection = {
  key: string;
  label?: string;
  separatorBefore?: boolean;
  items: SidebarItem[];
};

/**
 * Nav lateral derivada do curso ativo — sem ramificação por slug:
 *
 * - O item de trilhas vem do `studyEntry` do curso (rótulo + rota do
 *   catálogo daquele curso).
 * - Flashcards/Simulado seguem as features do curso.
 * - As seções de prática, progresso e premium pertencem à suíte de
 *   estudo completa: cursos só-trilha (simulado e flashcards desligados,
 *   como o Infantil hoje) não as têm.
 * - O badge de trilhas ("25") e o bloco de progresso geral descrevem o
 *   catálogo de study-data; só existem nele.
 */
function buildNavSections(course: Course): NavSection[] {
  const sections: NavSection[] = [
    {
      key: 'inicio',
      label: 'Início',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard, tooltip: 'Dashboard' },
      ],
    },
    {
      key: 'estudar',
      label: 'Estudar',
      items: [
        {
          id: 'trilhas',
          label: course.studyEntry.label,
          href: course.studyEntry.href,
          Icon: Route,
          tooltip: 'Trilhas',
          badge:
            course.trackSource === 'study-data'
              ? // 25 trilhas do edital em study-data (TRACK_CARDS).
                { label: '25', tone: 'green' }
              : undefined,
        },
        ...(course.features.flashcards
          ? [
              {
                id: 'flashcards' as const,
                label: 'Flashcards',
                href: '/flashcards',
                Icon: Layers,
                tooltip: 'Flashcards',
              },
            ]
          : []),
      ],
    },
  ];

  if (!course.features.simulado && !course.features.flashcards) {
    return sections;
  }

  return [
    ...sections,
    {
      key: 'praticar',
      label: 'Praticar',
      items: [
        {
          id: 'exercicios',
          label: 'Exercícios',
          href: '/premium',
          Icon: BookOpen,
          tooltip: 'Exercícios',
        },
        ...(course.features.simulado
          ? [
              {
                id: 'simulado' as const,
                label: 'Simulado POSCOMP',
                href: '/simulado',
                Icon: Timer,
                tooltip: 'Simulado',
              },
            ]
          : []),
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
          Icon: TrendingUp,
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
          Icon: Sparkles,
          tooltip: 'Premium',
          premium: true,
        },
      ],
    },
  ];
}

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
  course,
  courses,
  onSignOut,
  viewer,
}: StudyShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const clerkEnabled = isClerkEnabledClient();
  const navSections = buildNavSections(course);
  // O bloco "Progresso geral" descreve o catálogo de study-data (25
  // tópicos do POSCOMP); cursos com catálogo próprio ainda não têm fonte
  // real de progresso — nada de número inventado.
  const showProgressStrip = course.trackSource === 'study-data';
  const viewerName = viewer?.displayName || 'Estudante';
  const viewerPlan =
    viewer?.planLabel ||
    (viewer?.isPremium ? (viewer?.premiumSource === 'vip' ? 'Plano VIP' : 'Plano Premium') : 'Plano Free');
  const avatarLabel = viewerName
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .padEnd(2, 'E')
    .slice(0, 2);

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
      <div className={`study-shell ${collapsed ? 'collapsed' : ''}`}>
        <aside
          data-testid="study-sidebar"
          className={`study-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}
        >
          <div className="sb-logo">
            <Link href="/dashboard" className="aprovado-lockup is-sm" aria-label="aprovado.xyz — ir para o Dashboard">
              <span className="aprovado-ring" aria-hidden="true">
                ✓
              </span>
              <span className="aprovado-word">
                aprov<span className="a">a</span>do
              </span>
            </Link>
            <button
              type="button"
              aria-label="Alternar menu lateral"
              className="sb-toggle"
              onClick={toggleSidebar}
            >
              <Menu width={14} height={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>

          <CourseSwitcher course={course} courses={courses} />

          {showProgressStrip ? (
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
          ) : null}

          <nav aria-label="Menu principal" className="sb-nav">
            {navSections.map((section) => (
              <div key={section.key} className="sb-nav-wrapper">
                {section.separatorBefore ? <div className="sb-sep" /> : null}
                <div className="sb-nav-section">
                  {section.label ? <div className="sb-nav-label">{section.label}</div> : null}
                  {section.items.map((item) => {
                    const ItemIcon = item.Icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={getItemClassName(item)}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="sb-item-icon" aria-hidden="true">
                          <ItemIcon width={18} height={18} strokeWidth={1.75} />
                        </span>
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
                    );
                  })}
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
                <div className="sb-avatar">{avatarLabel}</div>
                <div className="sb-user-info">
                  <div className="sb-user-name">{viewerName}</div>
                  <div className="sb-user-plan">{viewerPlan}</div>
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
              <Menu width={14} height={14} strokeWidth={1.8} aria-hidden="true" />
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
                      {index < breadcrumb.length - 1 ? (
                        <ChevronRight className="sep" width={12} height={12} strokeWidth={1.75} aria-hidden="true" />
                      ) : null}
                    </span>
                  );
                })}
              </div>
              {topbarMode === 'default' && searchPlaceholder ? (
                <div className="study-topbar-search" aria-label={`Buscar em ${pageTitle}`}>
                  <Search width={14} height={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>{searchPlaceholder}</span>
                </div>
              ) : null}
              <div className="study-topbar-actions">
                {topbarMode === 'lesson' ? (
                  <>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Flashcards deste módulo">
                      <Layers width={16} height={16} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Notificações">
                      <Bell width={16} height={16} strokeWidth={1.75} aria-hidden="true" />
                      <span className="study-notif-dot" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Notificações">
                      <Bell width={16} height={16} strokeWidth={1.75} aria-hidden="true" />
                      <span className="study-notif-dot" aria-hidden="true" />
                    </button>
                    <button type="button" className="study-topbar-icon-btn" aria-label="Configurações">
                      <Settings width={16} height={16} strokeWidth={1.75} aria-hidden="true" />
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

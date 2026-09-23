'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { createRoot, type Root } from 'react-dom/client';

import type { InfantilLessonSource } from '@/lib/courses/infantil-catalog';
import { useImportedQuiz } from '@/components/study/imported-quiz';
import { SimulatorMount } from './simulators/simulator-mount';
import { getSimulatorComponent } from './simulators/registry';

interface InfantilLessonViewProps {
  source: InfantilLessonSource;
  /** Rota do tema (porta) para o link de retorno. */
  themeHref: string;
  themeTitle: string;
}

/**
 * View de uma aula do curso infantil: header do fragmento, nav de seções,
 * corpo HTML ingerido, quiz por delegação e montagem dos simuladores React
 * sobre os marcadores [data-simulator] — o mesmo padrão do fluxo POSCOMP.
 */
export function InfantilLessonView({ source, themeHref, themeTitle }: InfantilLessonViewProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('');

  useImportedQuiz(bodyRef, source.html, { openExplanation: true });

  /* Montador de simuladores: cada .sim-box com data-simulator conhecido
     recebe uma raiz React (título e frase de abertura preservados); o HTML
     estático ingerido é o skeleton inicial. Cleanup desmonta e restaura. */
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) {
      return;
    }

    const mounts: Array<{ reactRoot: Root; box: HTMLElement; originalHtml: string }> = [];

    root.querySelectorAll<HTMLElement>('[data-simulator]').forEach((box) => {
      const kind = box.dataset.simulator ?? '';
      const known = Boolean(getSimulatorComponent(kind));
      const title = box.querySelector('h4')?.textContent ?? '';
      const intro = box.querySelector('p')?.textContent ?? null;
      const originalHtml = box.innerHTML;
      const container = document.createElement('div');
      box.replaceChildren(container);
      const reactRoot = createRoot(container);
      /* marcador desconhecido: também passa pelo mount — sobrevive o título e a
         frase de abertura, e os controles estáticos mortos do skeleton saem */
      reactRoot.render(<SimulatorMount kind={kind} title={title} intro={intro} />);
      if (!known) box.dataset.degraded = 'simulator';
      mounts.push({ reactRoot, box, originalHtml });
    });

    return () => {
      for (const mount of mounts) {
        mount.reactRoot.unmount();
        mount.box.innerHTML = mount.originalHtml;
      }
    };
  }, [source.html]);

  function handleSectionNavClick(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    event.preventDefault();
    setActiveSectionId(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <article className="module-lesson module-import">
      <header className="module-lesson-header">
        <span className="module-lesson-tag">{source.header.badge}</span>
        <h1 className="module-lesson-title">{source.header.title}</h1>
        <p className="module-lesson-sub">{source.header.subtitle}</p>
        {source.header.meta.length > 0 ? (
          <div className="module-lesson-meta">
            {source.header.meta.map((item) => (
              <span key={item} className="module-lesson-meta-pill">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <nav className="module-section-nav" aria-label="Navegação das seções">
        {source.navLinks.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`module-section-link${activeSectionId === section.id ? ' active' : ''}`}
            onClick={(event) => handleSectionNavClick(event, section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <div className="module-lesson-content">
        <div
          ref={bodyRef}
          /* infantil-lesson-body: escopo EXCLUSIVO do curso infantil — as regras
             deste módulo em globals.css miram nela, nunca em .module-import-body
             (compartilhada com o POSCOMP; bloqueador do review do PR #31) */
          className="module-import-body infantil-lesson-body"
          dangerouslySetInnerHTML={{ __html: source.html }}
        />
      </div>

      <div className="module-lesson-nav">
        <Link href={themeHref} className="module-nav-btn prev">
          ← Voltar para {themeTitle}
        </Link>
      </div>
    </article>
  );
}

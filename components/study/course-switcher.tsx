'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';

import type { Course } from '@/lib/courses/types';
import { setActiveCourse } from '@/app/actions/set-active-course';

interface CourseSwitcherProps {
  course: Course;
  courses: Course[];
}

/**
 * Seletor de curso do topo da sidebar (modelo Duolingo): exibe o curso
 * em estudo e, ao abrir, a lista de cursos com o ativo marcado. Trocar
 * de curso grava o cookie via server action e refresca o shell — o
 * servidor re-renderiza a área logada no novo contexto.
 */
export function CourseSwitcher({ course, courses }: CourseSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const router = useRouter();
  const selectedOptionIndex = courses.findIndex((entry) => entry.slug === course.slug);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleSelect(nextCourse: Course) {
    setOpen(false);
    if (nextCourse.slug === course.slug) {
      return;
    }

    startTransition(async () => {
      const result = await setActiveCourse(nextCourse.slug);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  // Teclado do listbox (WAI-ARIA): setas/Home/End movem o foco entre as
  // options (foco programático; options ficam fora da ordem de Tab),
  // Enter/Espaço ativam a option focada (botão nativo) e Tab sai do
  // conjunto sem selecionar — só fechando o menu. Escape fecha (global).
  // Com o menu fechado, setas/Home/End ABREM o listbox (padrão do APG
  // para listbox colapsável) já focando a option-alvo.
  function focusedOptionIndex(): number {
    return optionRefs.current.findIndex((option) => option === document.activeElement);
  }

  function focusOption(index: number) {
    optionRefs.current[index]?.focus();
  }

  // Foco pedido enquanto o menu ainda estava fechado: as options só
  // existem depois da montagem, então o foco roda em efeito.
  useEffect(() => {
    if (!open || pendingFocusIndex === null) {
      return;
    }
    focusOption(pendingFocusIndex);
    setPendingFocusIndex(null);
  }, [open, pendingFocusIndex]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const lastIndex = courses.length - 1;
    // Sem foco em option (foco no gatilho), a primeira seta parte do
    // curso em estudo — como o padrão listbox espera.
    const startIndex = selectedOptionIndex >= 0 ? selectedOptionIndex : 0;

    if (!open) {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault();
          setOpen(true);
          setPendingFocusIndex(startIndex);
          break;
        }
        case 'Home': {
          event.preventDefault();
          setOpen(true);
          setPendingFocusIndex(0);
          break;
        }
        case 'End': {
          event.preventDefault();
          setOpen(true);
          setPendingFocusIndex(lastIndex);
          break;
        }
      }
      return;
    }

    const current = focusedOptionIndex();

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        focusOption(current === -1 ? startIndex : Math.min(current + 1, lastIndex));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        focusOption(current === -1 ? startIndex : Math.max(current - 1, 0));
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusOption(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusOption(lastIndex);
        break;
      }
      case 'Tab': {
        setOpen(false);
        break;
      }
    }
  }

  return (
    <div className="sb-course-switch" ref={rootRef}>
      <div className="sb-cs-wrap" onKeyDown={handleKeyDown}>
        <button
          type="button"
          className="sb-cs-btn"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`Curso em estudo: ${course.name}. Trocar de curso`}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={`sb-cs-ico tone-${course.slug}`} aria-hidden="true">
            {course.icon}
          </span>
          <span className="sb-cs-meta">
            <span className="sb-cs-label">estudando agora</span>
            <span className="sb-cs-name">{course.name}</span>
          </span>
          <ChevronDown className="sb-cs-caret" width={12} height={12} strokeWidth={2} aria-hidden="true" />
        </button>

        {open ? (
          <div className="sb-cs-menu" role="listbox" aria-label="Seus cursos">
            {courses.map((entry, index) => {
              const isActive = entry.slug === course.slug;
              return (
                <button
                  key={entry.slug}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={isActive}
                  aria-current={isActive ? 'true' : undefined}
                  className="sb-cs-opt"
                  onClick={() => handleSelect(entry)}
                >
                  <span className={`sb-cs-ico tone-${entry.slug}`} aria-hidden="true">
                    {entry.icon}
                  </span>
                  <span className="sb-cs-meta">
                    <span className="sb-cs-name">{entry.name}</span>
                    <small>{entry.switcherSubtitle}</small>
                  </span>
                  <span className="sb-cs-check" aria-hidden="true">
                    <Check width={14} height={14} strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {isPending ? (
        <span role="status" className="sr-only">
          Trocando de curso…
        </span>
      ) : null}
    </div>
  );
}

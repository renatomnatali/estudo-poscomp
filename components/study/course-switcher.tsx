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
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

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

  return (
    <div className="sb-course-switch" ref={rootRef}>
      <div className="sb-cs-wrap">
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
            {courses.map((entry) => {
              const isActive = entry.slug === course.slug;
              return (
                <button
                  key={entry.slug}
                  type="button"
                  role="option"
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
      {isPending ? <span className="sr-only">Trocando de curso…</span> : null}
    </div>
  );
}

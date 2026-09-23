import { describe, expect, it } from 'vitest';

import { POSCOMP_COURSE } from '@/lib/courses/poscomp';
import { INFANTIL_COURSE } from '@/lib/courses/infantil';
import {
  DEFAULT_COURSE_SLUG,
  getCourses,
  getCourse,
  getCourseOrThrow,
  isCourseSlug,
} from '@/lib/courses/registry';
import type { Course } from '@/lib/courses/types';

describe('registry de cursos', () => {
  describe('getCourses', () => {
    it('devolve poscomp e infantil, na ordem de exibição', () => {
      const courses = getCourses();

      expect(courses.map((course) => course.slug)).toEqual(['poscomp', 'infantil']);
    });

    it('devolve cópia do array: mutar o retorno não afeta chamadas seguintes', () => {
      // Arrange
      const first = getCourses();

      // Act — consumidor remove e enxerta curso intruso no array recebido
      first.pop();
      first.push({ slug: 'intruso' } as Course);

      // Assert — o contrato documentado cobre o array (cópia rasa);
      // uma nova chamada continua vendo o registry intacto.
      expect(getCourses().map((course) => course.slug)).toEqual(['poscomp', 'infantil']);
    });

    it('nunca registra dois cursos com o mesmo slug', () => {
      const slugs = getCourses().map((course) => course.slug);

      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  describe('getCourse', () => {
    it('devolve o curso do POSCOMP para o slug "poscomp"', () => {
      expect(getCourse('poscomp')).toBe(POSCOMP_COURSE);
    });

    it('devolve o curso Infantil para o slug "infantil"', () => {
      expect(getCourse('infantil')).toBe(INFANTIL_COURSE);
    });

    it('retorna undefined, sem lançar, para slug desconhecido', () => {
      expect(getCourse('enic')).toBeUndefined();
    });

    it('retorna undefined, sem lançar, para slug vazio', () => {
      expect(getCourse('')).toBeUndefined();
    });
  });

  describe('getCourseOrThrow', () => {
    it('devolve o curso do POSCOMP para slug registrado', () => {
      expect(getCourseOrThrow('poscomp')).toBe(POSCOMP_COURSE);
    });

    it('devolve o curso Infantil para slug registrado', () => {
      expect(getCourseOrThrow('infantil')).toBe(INFANTIL_COURSE);
    });

    it('lança erro em português que lista os slugs válidos quando o slug é desconhecido', () => {
      // Arrange + Act
      let thrown: unknown;
      try {
        getCourseOrThrow('enic');
      } catch (error) {
        thrown = error;
      }

      // Assert — o prefixo identifica a causa e a lista de slugs é o que
      // destrava quem chamou; ambos são o contrato de diagnóstico do erro.
      expect(thrown).toBeInstanceOf(Error);
      const message = (thrown as Error).message;
      expect(message).toContain('Curso desconhecido');
      expect(message).toContain('enic');
      expect(message).toContain('poscomp');
      expect(message).toContain('infantil');
    });

    it('lança para slug vazio', () => {
      expect(() => getCourseOrThrow('')).toThrowError(/Curso desconhecido/);
    });
  });

  describe('isCourseSlug', () => {
    it('aceita exatamente os slugs registrados', () => {
      expect(isCourseSlug('poscomp')).toBe(true);
      expect(isCourseSlug('infantil')).toBe(true);
    });

    it('rejeita slugs não registrados', () => {
      expect(isCourseSlug('enic')).toBe(false);
      expect(isCourseSlug('')).toBe(false);
    });

    it('é case-sensitive: maiúsculas não resolvem curso', () => {
      expect(isCourseSlug('POSCOMP')).toBe(false);
      expect(isCourseSlug('Infantil')).toBe(false);
    });
  });

  describe('DEFAULT_COURSE_SLUG', () => {
    it('aponta para "poscomp" e é um slug válido do registry', () => {
      expect(DEFAULT_COURSE_SLUG).toBe('poscomp');
      expect(isCourseSlug(DEFAULT_COURSE_SLUG)).toBe(true);
    });
  });
});

describe('contrato dos cursos registrados', () => {
  it('POSCOMP habilita simulado, flashcards e premium', () => {
    expect(POSCOMP_COURSE.features).toEqual({
      simulado: true,
      flashcards: true,
      premium: true,
    });
  });

  it('Infantil não expõe simulado nem flashcards, mas permanece contratável (premium)', () => {
    // Decisão do dono (2026-09-21): infantil é contratável por conteúdo;
    // simulado e flashcards chegam com o catálogo próprio do curso.
    expect(INFANTIL_COURSE.features).toEqual({
      simulado: false,
      flashcards: false,
      premium: true,
    });
  });

  it('todo slug de curso segue o formato fechado de URL (a-z, 0-9 e hífen)', () => {
    // Arrange — mesma régua do validador de módulos
    // (scripts/validate-module-fragment.ts): slug vira rota no app e
    // chave de entitlement, então acento, espaço ou maiúscula aqui
    // quebrariam URL e abririam caminho de traversal.
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    // Act
    const offenders = getCourses()
      .map((course) => course.slug)
      .filter((slug) => !slugPattern.test(slug));

    // Assert
    expect(offenders).toEqual([]);
  });

  it('nenhum curso se resolve por host: o contrato não tem campo de host/domínio', () => {
    // Arrange — arquitetura: site único, curso é dimensão de conteúdo,
    // não de DNS. Se um dia aparecer host/domain/url aqui, o registry
    // começou a resolver curso por host e este teste deve quebrar.
    const forbiddenKey = /host|domain|url|origin/i;

    // Act
    const offenders = getCourses().flatMap((course) => {
      const keys = [...Object.keys(course), ...Object.keys(course.features)];
      return keys
        .filter((key) => forbiddenKey.test(key))
        .map((key) => `${course.slug}.${key}`);
    });

    // Assert
    expect(offenders).toEqual([]);
  });

  it('todo curso registrado tem os dados de exibição preenchidos', () => {
    for (const course of getCourses()) {
      // trim(): string só de espaços não passa como dado preenchido.
      expect(course.slug.trim(), `slug de ${course.name}`).not.toBe('');
      expect(course.name.trim(), `name de ${course.slug}`).not.toBe('');
      expect(course.tagline.trim(), `tagline de ${course.slug}`).not.toBe('');
      expect(course.description.trim(), `description de ${course.slug}`).not.toBe('');
      expect(course.audience.trim(), `audience de ${course.slug}`).not.toBe('');
    }
  });
});

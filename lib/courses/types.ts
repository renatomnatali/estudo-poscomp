/**
 * Curso é a dimensão mais alta do catálogo do aprovado.xyz: agrupa as
 * áreas/trilhas de um exame ou série e define quais capacidades do produto
 * existem para ele.
 *
 * O site é único e o motor é único: o curso NÃO se resolve por host ou
 * subdomínio — é dimensão de conteúdo e de contratação. (Um subdomínio
 * futuro apontará apenas para uma landing.)
 */

/** Capacidades do produto habilitadas para um curso. */
export interface CourseFeatureFlags {
  /** Simulados completos com correção. */
  simulado: boolean;
  /** Baralhos de revisão com repetição espaçada. */
  flashcards: boolean;
  /**
   * O curso tem oferta paga (é contratável). Preço e planos são
   * configuração de contratação, não dado do registry.
   */
  premium: boolean;
}

/** De onde vem o catálogo de trilhas/áreas de um curso. */
export type CourseTrackSource = 'study-data' | 'future-registry';

export interface Course {
  /** Identificador estável, usado em URLs e contratação (ex.: 'poscomp'). */
  slug: string;
  /** Nome exibido (user-facing, pt-BR). */
  name: string;
  /** Frase curta de posicionamento. */
  tagline: string;
  /** Descrição do curso para páginas e metadados. */
  description: string;
  /** Para quem é o curso. */
  audience: string;
  features: CourseFeatureFlags;
  /**
   * Fonte do catálogo de trilhas: o curso REFERENCIA a fonte, não copia
   * dados de study-data.
   */
  trackSource: CourseTrackSource;
}

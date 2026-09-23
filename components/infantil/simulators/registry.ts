import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Registry de simuladores do curso infantil: data-simulator → componente.
 * Carregamento lazy — só entra no bundle da aula o simulador que a página usa.
 */

export const SIMULATOR_KINDS = [
  'mmc',
  'equivalencias',
  'subtracao-barras',
  'conta-passo-a-passo',
] as const;

export type SimulatorKind = (typeof SIMULATOR_KINDS)[number];

const REGISTRY: Record<SimulatorKind, LazyExoticComponent<ComponentType>> = {
  mmc: lazy(() => import('./mmc-simulator').then((module) => ({ default: module.MmcSimulator }))),
  equivalencias: lazy(() =>
    import('./equivalencias-simulator').then((module) => ({
      default: module.EquivalenciasSimulator,
    })),
  ),
  'subtracao-barras': lazy(() =>
    import('./subtracao-barras-simulator').then((module) => ({
      default: module.SubtracaoBarrasSimulator,
    })),
  ),
  'conta-passo-a-passo': lazy(() =>
    import('./conta-passos-simulator').then((module) => ({
      default: module.ContaPassosSimulator,
    })),
  ),
};

export function isSimulatorKind(kind: string): kind is SimulatorKind {
  return (SIMULATOR_KINDS as readonly string[]).includes(kind);
}

/** Componente do simulador para o marcador, ou null se desconhecido. */
export function getSimulatorComponent(kind: string): LazyExoticComponent<ComponentType> | null {
  return isSimulatorKind(kind) ? REGISTRY[kind] : null;
}

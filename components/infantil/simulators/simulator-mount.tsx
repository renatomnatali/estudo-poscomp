'use client';

import { Suspense } from 'react';

import { getSimulatorComponent } from './registry';

/**
 * Ponte entre o HTML ingerido e os simuladores React: substitui o conteúdo
 * estático de um .sim-box mantendo o <h4> do título (e a frase de abertura),
 * e monta o componente do registry no lugar — o HTML estático é o skeleton.
 */
export function SimulatorMount({
  kind,
  title,
  intro,
}: {
  kind: string;
  title: string;
  intro: string | null;
}) {
  const Simulator = getSimulatorComponent(kind);

  return (
    <>
      <h4>{title}</h4>
      {intro ? <p>{intro}</p> : null}
      {Simulator ? (
        <Suspense
          fallback={
            <div className="sim-state-display">
              <div className="sim-status">Carregando simulador…</div>
            </div>
          }
        >
          <Simulator />
        </Suspense>
      ) : null}
    </>
  );
}

import { MathUtils } from "three"

/**
 * Estado temporal del hilo, compartido por las dos opciones del spike.
 * Mutable y fuera de React: se avanza en `useFrame` y lo leen los shaders.
 */
export type ThreadClock = {
  /** Mezcla suavizada Vibo (0) → Pirp (1). */
  mix: number
  /** Fase de los pulsos, 0..1. */
  phase: number
  /** Desplazamiento de las partículas a lo largo del hilo, 0..1. */
  flow: number
  /** Dibujado progresivo de entrada, 0..1. */
  draw: number
  time: number
}

const PHASE_SPEED = { vibo: 0.24, pirp: 0.55 }
const FLOW_SPEED = { vibo: 0.012, pirp: 0.11 }
const DRAW_SECONDS = 1.6
/** Rigidez del seguimiento del scroll: absorbe saltos sin sentirse lento. */
const MIX_LAMBDA = 5

/** `mix` inicial: un deep link arranca en su estado sin animar desde Vibo. */
export function createThreadClock(mix = 0): ThreadClock {
  return { mix, phase: 0, flow: 0, draw: 0, time: 0 }
}

export function restartThreadDraw(clock: ThreadClock): void {
  clock.draw = 0
}

export function advanceThreadClock(
  clock: ThreadClock,
  target: number,
  delta: number
): void {
  // Tope por frame: al volver de una pestaña oculta no hay saltos de fase.
  const dt = Math.min(delta, 1 / 20)

  clock.time += dt
  clock.mix = MathUtils.damp(clock.mix, target, MIX_LAMBDA, dt)
  clock.phase =
    (clock.phase +
      dt * MathUtils.lerp(PHASE_SPEED.vibo, PHASE_SPEED.pirp, clock.mix)) %
    1
  clock.flow =
    (clock.flow +
      dt * MathUtils.lerp(FLOW_SPEED.vibo, FLOW_SPEED.pirp, clock.mix)) %
    1
  clock.draw = Math.min(1, clock.draw + dt / DRAW_SECONDS)
}

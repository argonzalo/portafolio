import type { ProjectId, QualityTier } from "./types"

/**
 * Store mutable de la experiencia (`01-arquitectura.md` §2).
 *
 * Reglas:
 * - El scroll escribe `progress` acá y las escenas lo leen en `useFrame`.
 *   **Nunca** se copia el progreso a estado de React: nada de `setState` por frame.
 * - Solo los cambios discretos (capítulo, beat, calidad, mobile, movimiento
 *   reducido) notifican a los suscriptores y pueden provocar un render.
 * - Sin dependencias de React ni de APIs del navegador: se puede importar desde
 *   Astro, desde una isla o desde un test.
 */

/** Handle mutable y de identidad estable que se pasa a las escenas. */
export type ProgressRef = { readonly current: number }

type MutableProgressRef = { current: number }

export type ActiveBeat = {
  sceneId: ProjectId
  beatId: string
}

/**
 * Estado discreto observable. Es inmutable: cada cambio crea un objeto nuevo,
 * así `useSyncExternalStore` detecta el cambio por identidad.
 */
export type ExperienceSnapshot = {
  readonly chapterId: string | null
  readonly beat: ActiveBeat | null
  readonly quality: QualityTier
  readonly isMobile: boolean
  readonly reducedMotion: boolean
}

export type ExperienceStoreListener = () => void

export type ExperienceStore = {
  /** Estado actual. La referencia cambia solo cuando cambia algo discreto. */
  getSnapshot: () => ExperienceSnapshot
  /** Suscripción a cambios discretos. Devuelve la función para desuscribirse. */
  subscribe: (listener: ExperienceStoreListener) => () => void

  /** Capítulo DOM visible. Cambiar de capítulo limpia el beat activo. */
  setChapter: (chapterId: string | null) => void
  setBeat: (beat: ActiveBeat | null) => void
  setQuality: (quality: QualityTier) => void
  setIsMobile: (isMobile: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void

  /** Progress 0..1 del capítulo. Misma referencia en cada llamada. `Stage` lo pasa como `SceneProps.progress`. */
  progress: (chapterId: string) => ProgressRef
  /** Lo escribe `scroll.ts` (ScrollTrigger) en cada scroll. */
  setProgress: (chapterId: string, value: number) => void
  /** Vuelve el progreso a 0 (al salir de un capítulo, por ejemplo). */
  resetProgress: (chapterId: string) => void
}

export type ExperienceStoreOptions = {
  /** Nivel inicial. La detección real vive en `quality.ts` (T-A07). */
  quality?: QualityTier
  isMobile?: boolean
  reducedMotion?: boolean
}

/**
 * Nivel conservador hasta que `quality.ts` detecte el dispositivo: sin
 * postprocesado pesado, pero sin caer a `static` por defecto.
 */
const DEFAULT_QUALITY: QualityTier = "medium"

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  return value > 1 ? 1 : value
}

export function createExperienceStore(
  options: ExperienceStoreOptions = {}
): ExperienceStore {
  let snapshot: ExperienceSnapshot = Object.freeze({
    chapterId: null,
    beat: null,
    quality: options.quality ?? DEFAULT_QUALITY,
    isMobile: options.isMobile ?? false,
    reducedMotion: options.reducedMotion ?? false,
  })

  const progressByChapter = new Map<string, MutableProgressRef>()
  const listeners = new Set<ExperienceStoreListener>()

  function commit(patch: Partial<ExperienceSnapshot>): void {
    const next: ExperienceSnapshot = Object.freeze({
      chapterId: patch.chapterId !== undefined ? patch.chapterId : snapshot.chapterId,
      beat: patch.beat !== undefined ? patch.beat : snapshot.beat,
      quality: patch.quality ?? snapshot.quality,
      isMobile: patch.isMobile ?? snapshot.isMobile,
      reducedMotion: patch.reducedMotion ?? snapshot.reducedMotion,
    })

    if (
      next.chapterId === snapshot.chapterId &&
      next.beat === snapshot.beat &&
      next.quality === snapshot.quality &&
      next.isMobile === snapshot.isMobile &&
      next.reducedMotion === snapshot.reducedMotion
    ) {
      return
    }

    snapshot = next

    // Copia de la lista: un suscriptor puede desuscribirse o suscribirse dentro
    // del callback sin alterar esta notificación.
    for (const listener of [...listeners]) {
      listener()
    }
  }

  function ensureProgress(chapterId: string): MutableProgressRef {
    let ref = progressByChapter.get(chapterId)

    if (!ref) {
      ref = { current: 0 }
      progressByChapter.set(chapterId, ref)
    }

    return ref
  }

  return {
    getSnapshot: () => snapshot,

    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    setChapter: (chapterId) => {
      if (chapterId === snapshot.chapterId) {
        return
      }

      commit({ chapterId, beat: null })
    },

    setBeat: (beat) => {
      const current = snapshot.beat
      const isSame =
        beat === null || current === null
          ? beat === current
          : beat.sceneId === current.sceneId && beat.beatId === current.beatId

      if (isSame) {
        return
      }

      commit({ beat })
    },

    setQuality: (quality) => {
      commit({ quality })
    },

    setIsMobile: (isMobile) => {
      commit({ isMobile })
    },

    setReducedMotion: (reducedMotion) => {
      commit({ reducedMotion })
    },

    progress: (chapterId) => ensureProgress(chapterId),

    setProgress: (chapterId, value) => {
      ensureProgress(chapterId).current = clampProgress(value)
    },

    resetProgress: (chapterId) => {
      const ref = progressByChapter.get(chapterId)

      if (ref) {
        ref.current = 0
      }
    },
  }
}

/**
 * Instancia única del sitio: hay un solo canvas persistente (ADR-002), así que
 * también hay un solo progreso de recorrido.
 */
export const experienceStore = createExperienceStore()

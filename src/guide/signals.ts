import type { ExperienceStore } from "@/experience/store"
import type { JourneySignal, ProjectId } from "@/experience/types"

/**
 * Emisor de `JourneySignal`: el único canal por el que la experiencia cuenta
 * qué está pasando (`01-arquitectura.md` §4). El observador del guía (T-A22)
 * se suscribe acá y aplica sus reglas; nada de esto cuesta una llamada al modelo.
 *
 * Los eventos son síncronos y de un solo sentido: un suscriptor que falla no
 * corta a los demás.
 */

export type JourneySignalListener = (signal: JourneySignal) => void

/** Cuántas señales se guardan para el panel de debug y el arranque del observador. */
const HISTORY_LIMIT = 50

const listeners = new Set<JourneySignalListener>()
const history: JourneySignal[] = []

/** Marca de tiempo común a todas las señales (`performance.now()` si existe). */
export function signalNow(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now()
}

export function emitJourneySignal(signal: JourneySignal): void {
  history.push(signal)

  if (history.length > HISTORY_LIMIT) {
    history.splice(0, history.length - HISTORY_LIMIT)
  }

  for (const listener of [...listeners]) {
    try {
      listener(signal)
    } catch (error) {
      console.error("[journey] un suscriptor de JourneySignal falló", error)
    }
  }
}

export function subscribeToJourneySignals(
  listener: JourneySignalListener
): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** Copia de las últimas señales, de la más vieja a la más nueva. */
export function getRecentJourneySignals(
  limit: number = HISTORY_LIMIT
): JourneySignal[] {
  const count = Math.max(0, Math.min(limit, history.length))
  return history.slice(history.length - count)
}

/** Para tests y para el laboratorio: vacía el historial sin tocar suscriptores. */
export function clearJourneySignals(): void {
  history.length = 0
}

export function emitChapterEnter(chapterId: string): void {
  emitJourneySignal({ type: "chapter:enter", chapterId, at: signalNow() })
}

export function emitBeatEnter(sceneId: ProjectId, beatId: string): void {
  emitJourneySignal({ type: "beat:enter", sceneId, beatId, at: signalNow() })
}

export function emitScrollReverse(chapterId: string): void {
  emitJourneySignal({ type: "scroll:reverse", chapterId, at: signalNow() })
}

export function emitInteract(target: string): void {
  emitJourneySignal({ type: "interact", target, at: signalNow() })
}

export function emitIdle(ms: number): void {
  emitJourneySignal({ type: "idle", ms, at: signalNow() })
}

/**
 * Puente store → señales. Lo monta `Stage` una vez (T-A06) y emite
 * `chapter:enter` y `beat:enter` cuando cambian los valores discretos.
 * Devuelve la función para desconectar.
 */
export function connectStoreSignals(store: ExperienceStore): () => void {
  let { chapterId, beat } = store.getSnapshot()

  return store.subscribe(() => {
    const snapshot = store.getSnapshot()

    if (snapshot.chapterId !== chapterId) {
      chapterId = snapshot.chapterId

      if (chapterId) {
        emitChapterEnter(chapterId)
      }
    }

    const nextBeat = snapshot.beat

    if (
      nextBeat?.sceneId !== beat?.sceneId ||
      nextBeat?.beatId !== beat?.beatId
    ) {
      beat = nextBeat

      if (beat) {
        emitBeatEnter(beat.sceneId, beat.beatId)
      }
    }
  })
}

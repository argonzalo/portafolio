import type { ComponentType } from "react"

/**
 * Contratos del runtime de la experiencia (`01-arquitectura.md` §4).
 *
 * Congelados desde G0: cambiarlos requiere un ADR aprobado y una tarea de
 * plataforma. Las escenas y el guía dependen de estos tipos, así que agregar
 * campos obligatorios rompe a todos los agentes que trabajan en paralelo.
 */

/** Niveles de calidad de `01-arquitectura.md` §6. */
export type QualityTier = "high" | "medium" | "low" | "static"

export type ProjectId =
  | "vibo"
  | "pirp"
  | "naturalis"
  | "banner-2"
  | "app-etiquetas"
  | "web-landing"
  | "starbene"
  | "agnt"
  | "cielo-y-mar"
  | "venta-duplex"
  | "arcor-demo"
  | "forme"
  | "agro-ia-tesis"
  | "teams"

/** Momento narrativo de una escena, en coordenadas de progreso del capítulo (0..1). */
export type SceneBeat = {
  /** "mundo" | "problema" | "razonamiento" | "solucion" | "resultado" o uno propio. */
  id: string
  range: [start: number, end: number]
  /** Texto corto para el índice y el guía. */
  label: string
}

export type ScenePalette = {
  /** También alimenta las CSS variables del DOM en ese capítulo. */
  background: string
  foreground: string
  accent: string
  accentAlt?: string
  scheme: "dark" | "light"
}

/** Cómo se transforma el hilo conductor dentro de la escena. */
export type ThreadForm = {
  shape: "line" | "trajectory" | "branching" | "growth" | "split" | "custom"
  color: string
  anchors?: (progress: number) => [x: number, y: number, z: number][]
}

export type SceneProps = {
  /** Lee siempre con `progress.current` dentro de `useFrame`. Nunca lo copies a estado de React. */
  progress: { readonly current: number }
  quality: QualityTier
  isMobile: boolean
  /** `true` mientras la escena es la principal (no la que entra o sale en una transición). */
  active: boolean
}

export type SceneDefinition = {
  id: ProjectId
  tier: 1 | 2 | 3
  /** id de la sección DOM que la controla. */
  chapterId: string
  /** Chunk lazy con el componente de la escena. */
  load: () => Promise<{ default: ComponentType<SceneProps> }>
  /** Assets + warmup de shaders. */
  preload?: (quality: QualityTier) => Promise<void>
  palette: ScenePalette
  thread: ThreadForm
  beats: SceneBeat[]
  fallback: { poster: string; posterMobile?: string; video?: string }
  budget: {
    maxTriangles: number
    maxDrawCalls: number
    maxAssetKB: { desktop: number; mobile: number }
  }
}

/** Eventos que la experiencia emite para el agente de IA (`04-agente-ia.md`). */
export type JourneySignal =
  | { type: "chapter:enter"; chapterId: string; at: number }
  | { type: "beat:enter"; sceneId: ProjectId; beatId: string; at: number }
  | { type: "scroll:reverse"; chapterId: string; at: number }
  | { type: "interact"; target: string; at: number }
  | { type: "idle"; ms: number; at: number }

/** Acciones que el agente puede pedir a la experiencia (lista cerrada). */
export type GuideAction =
  | { type: "goToChapter"; chapterId: string }
  | { type: "goToBeat"; sceneId: ProjectId; beatId: string }
  /** `target`: ids registrados por cada escena. */
  | { type: "highlight"; target: string }
  | { type: "openProject"; id: ProjectId }
  | { type: "showContact" }

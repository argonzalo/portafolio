import { useEffect } from "react"

import { useExperienceStore } from "@/experience/hooks"
import type { QualityTier } from "@/experience/types"

import { toRenderTier, type RenderTier } from "./specs"

/** Libera (`dispose`) el recurso de three cuando cambia o se desmonta. */
export function useDisposable<T extends { dispose: () => void }>(value: T): T {
  useEffect(() => () => value.dispose(), [value])
  return value
}

/** Nivel de render del dispositivo: prop explícita o el del store de experiencia. */
export function useDeviceTier(quality: QualityTier | undefined): RenderTier {
  const snapshot = useExperienceStore()
  return toRenderTier(quality ?? snapshot.quality)
}

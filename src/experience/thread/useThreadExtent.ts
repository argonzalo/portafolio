import { useMemo } from "react"
import { useThree } from "@react-three/fiber"

import { threadExtent, type ThreadExtent } from "./path"

/** Medidas del hilo para el viewport actual. Cambia solo al redimensionar. */
export function useThreadExtent(): ThreadExtent {
  const width = useThree((state) => state.viewport.width)
  const height = useThree((state) => state.viewport.height)

  return useMemo(() => threadExtent(width, height), [width, height])
}

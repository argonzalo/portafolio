import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"

import { readJsHeapMB, setGpuStats } from "@/experience/gpuStats"

const SAMPLE_EVERY_FRAMES = 30

/** Escribe `renderer.info` en el módulo compartido (sin setState por frame). */
export function GpuStatsProbe() {
  const gl = useThree((state) => state.gl)
  const frames = useRef(0)

  useFrame(() => {
    frames.current += 1
    if (frames.current % SAMPLE_EVERY_FRAMES !== 0) return

    const { memory, render, programs } = gl.info
    setGpuStats({
      geometries: memory.geometries,
      textures: memory.textures,
      programs: programs?.length ?? 0,
      calls: render.calls,
      triangles: render.triangles,
      jsHeapMB: readJsHeapMB(),
    })
  })

  return null
}

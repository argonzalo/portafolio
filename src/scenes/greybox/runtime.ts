import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Color, Vector3 } from "three"
import type { SceneProps } from "@/experience/types"

type Point = [number, number, number]
export type CameraFrame = {
  at: number
  desktop: Point
  mobile: Point
  target: Point
  mobileTarget?: Point
}

export function phase(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

/** Scroll absoluto: buscar un beat o retroceder produce el mismo encuadre. */
export function useGreyboxRig(
  props: SceneProps,
  background: string,
  frames: CameraFrame[]
) {
  const color = useMemo(() => new Color(background), [background])
  const targetRef = useRef(new Vector3())
  useFrame(({ camera, scene }) => {
    if (!props.active) return
    const target = targetRef.current
    const p = props.progress.current
    let index = 0
    while (index < frames.length - 2 && p > frames[index + 1].at) index++
    const a = frames[index]
    const b = frames[Math.min(index + 1, frames.length - 1)]
    const t = a.at === b.at ? 0 : phase(p, a.at, b.at)
    const start = props.isMobile ? a.mobile : a.desktop
    const end = props.isMobile ? b.mobile : b.desktop
    camera.position.set(...start)
    camera.position.x += (end[0] - start[0]) * t
    camera.position.y += (end[1] - start[1]) * t
    camera.position.z += (end[2] - start[2]) * t
    const from = props.isMobile ? (a.mobileTarget ?? a.target) : a.target
    const to = props.isMobile ? (b.mobileTarget ?? b.target) : b.target
    target.set(...from)
    target.x += (to[0] - from[0]) * t
    target.y += (to[1] - from[1]) * t
    target.z += (to[2] - from[2]) * t
    camera.lookAt(target)
    scene.background = color
  })
}

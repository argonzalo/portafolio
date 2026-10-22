import { useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three"
import { beatEnvelope, phase, type KitTheme, type Vec3Tuple } from "@/scenes/kit"
import { setNodeAt } from "./panel"

export type PipelineStep = {
  id: string
  label: string
  triggerAt: number
}

type Range4 = [number, number, number, number]

type Props = {
  steps: readonly PipelineStep[]
  progress: { readonly current: number }
  /** Centro del rótulo sobre la pared, en mundo. */
  position: Vec3Tuple
  /** Ancho del rótulo en metros. */
  width: number
  active: boolean
  theme: KitTheme
  range: Range4
}

const CANVAS_W = 2048
const CANVAS_H = 320
const FONT = '600 210px "Poppins", sans-serif'

/** Peso del paso como etapa actual; la saliente se va antes de que entre la siguiente. */
function stepWeight(p: number, steps: readonly PipelineStep[], i: number, gap: number) {
  const t = steps[i].triggerAt
  const enter = phase(p, t - gap * 0.15, t + gap * 0.15)
  const next = steps[i + 1]
  const exit = next ? phase(p, next.triggerAt - gap * 0.4, next.triggerAt - gap * 0.15) : 0
  return enter * (1 - exit)
}

function paintLabel(texture: CanvasTexture, label: string, color: string) {
  const canvas = texture.image as HTMLCanvasElement
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.font = FONT
  ctx.fillStyle = color
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.letterSpacing = "-4px"
  ctx.fillText(label, CANVAS_W / 2, CANVAS_H / 2, CANVAS_W - 40)
  texture.needsUpdate = true
}

function syncLabels(
  meshes: (Mesh | null)[],
  mats: MeshBasicMaterial[],
  props: Props,
  baseY: number
) {
  const { steps, progress, active, range } = props
  const p = progress.current
  const envelope = active ? beatEnvelope(p, ...range) : 0
  const gap = steps.length > 1 ? steps[1].triggerAt - steps[0].triggerAt : 0.05
  steps.forEach((_, i) => {
    const mesh = meshes[i]
    const mat = mats[i]
    if (!mesh || !mat) return
    const weight = envelope * stepWeight(p, steps, i, gap)
    mesh.visible = weight > 0.005
    mat.opacity = weight * 0.9
    mesh.position.y = baseY - (1 - weight) * 0.06
  })
}

/** Etapa actual del análisis como rótulo grande sobre el cristal del fondo. */
export function ViboPipeline(props: Props) {
  const { steps, position, width, theme } = props
  const meshes = useMemo<(Mesh | null)[]>(() => [], [])
  const geometry = useMemo(
    () => new PlaneGeometry(width, (width * CANVAS_H) / CANVAS_W),
    [width]
  )
  const textures = useMemo(
    () =>
      steps.map(() => {
        const canvas = document.createElement("canvas")
        canvas.width = CANVAS_W
        canvas.height = CANVAS_H
        const texture = new CanvasTexture(canvas)
        texture.colorSpace = SRGBColorSpace
        texture.anisotropy = 4
        return texture
      }),
    [steps]
  )
  const mats = useMemo(
    () =>
      textures.map(
        (map) =>
          new MeshBasicMaterial({
            map,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            opacity: 0,
          })
      ),
    [textures]
  )

  useEffect(() => {
    let cancelled = false
    const paint = () => {
      if (cancelled) return
      steps.forEach((step, i) => paintLabel(textures[i], step.label, theme.accent))
    }
    paint()
    document.fonts?.load(FONT).then(paint, paint)
    return () => {
      cancelled = true
    }
  }, [steps, textures, theme.accent])

  useEffect(
    () => () => {
      geometry.dispose()
      textures.forEach((t) => t.dispose())
      mats.forEach((m) => m.dispose())
    },
    [geometry, textures, mats]
  )

  useFrame(() => syncLabels(meshes, mats, props, position[1]))

  return (
    <group>
      {steps.map((step, i) => (
        <mesh
          key={step.id}
          ref={(el) => setNodeAt(meshes, i, el)}
          position={position}
          rotation-y={Math.PI}
          geometry={geometry}
          material={mats[i]}
          renderOrder={3}
          visible={false}
        />
      ))}
    </group>
  )
}

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react"
import { useFrame } from "@react-three/fiber"
import {
  Color,
  Material,
  MathUtils,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
  type Group,
  type Object3D,
} from "three"

import { useExperienceStore } from "@/experience/hooks"
import { setGpuStats } from "@/experience/gpuStats"
import { getLivePalette } from "@/experience/palette"
import { getSpikeScene, type SpikeSceneEntry } from "@/experience/spike/scenes"
import { experienceStore } from "@/experience/store"
import {
  CHAPTER_SEQUENCE,
  chapterIndexOf,
  type BorderPose,
  type SceneBorderFrames,
} from "@/experience/thread/forms"
import type { SceneProps } from "@/experience/types"
import { bannerBorderFrames } from "@/scenes/banner-2/definition"
import { naturalisBorderFrames } from "@/scenes/naturalis/definition"
import { pirpBorderFrames } from "@/scenes/pirp/definition"
import { getSceneByChapter } from "@/scenes/registry"
import { viboBorderFrames } from "@/scenes/vibo/definition"

const TRANSITION_SECONDS = 0.55

const BORDER_FRAMES: Readonly<Record<string, SceneBorderFrames>> = {
  vibo: viboBorderFrames,
  pirp: pirpBorderFrames,
  naturalis: naturalisBorderFrames,
  "banner-2": bannerBorderFrames,
}

const resolvedSceneCache = new Map<string, ComponentType<SceneProps>>()
const pendingSceneCache = new Map<string, Promise<ComponentType<SceneProps>>>()

function resolveEntry(chapterId: string | null): SpikeSceneEntry | undefined {
  if (!chapterId) return undefined
  const definition = getSceneByChapter(chapterId)
  if (definition) {
    return {
      ...definition,
      sceneId: definition.id,
      label: definition.id,
      accent: definition.palette.accent,
    }
  }
  return getSpikeScene(chapterId)
}

function loadEntryComponent(
  chapterId: string,
  entry: SpikeSceneEntry
): Promise<ComponentType<SceneProps>> {
  const cached = resolvedSceneCache.get(chapterId)
  if (cached) return Promise.resolve(cached)

  const existing = pendingSceneCache.get(chapterId)
  if (existing) return existing

  const promise = entry.load().then((mod) => {
    resolvedSceneCache.set(chapterId, mod.default)
    pendingSceneCache.delete(chapterId)
    return mod.default
  })
  pendingSceneCache.set(chapterId, promise)
  return promise
}

function preloadNeighbors(chapterId: string | null): void {
  if (!chapterId) return
  const index = CHAPTER_SEQUENCE.indexOf(
    chapterId as (typeof CHAPTER_SEQUENCE)[number]
  )
  const candidates =
    index >= 0
      ? [
          CHAPTER_SEQUENCE[index - 1],
          CHAPTER_SEQUENCE[index],
          CHAPTER_SEQUENCE[index + 1],
        ]
      : [chapterId]

  for (const candidate of candidates) {
    if (!candidate) continue
    const entry = resolveEntry(candidate)
    if (entry && !resolvedSceneCache.has(candidate)) {
      void loadEntryComponent(candidate, entry).catch(() => {
        /* Precarga silenciosa; el montaje activo maneja errores. */
      })
    }
  }
}

function smootherstep(t: number): number {
  const x = MathUtils.clamp(t, 0, 1)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

type MaterialSnapshot = {
  transparent: boolean
  opacity: number
  depthWrite: boolean
}

const materialSnapshots = new WeakMap<Material, MaterialSnapshot>()

function applyGroupOpacity(root: Object3D, alpha: number, restore: boolean) {
  root.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : []

    for (const mat of materials) {
      if (!mat) continue
      let snap = materialSnapshots.get(mat)
      if (!snap) {
        snap = {
          transparent: mat.transparent,
          opacity: mat.opacity,
          depthWrite: mat.depthWrite,
        }
        materialSnapshots.set(mat, snap)
      }

      if (restore) {
        mat.transparent = snap.transparent
        mat.opacity = snap.opacity
        mat.depthWrite = snap.depthWrite
      } else {
        mat.transparent = true
        mat.opacity = snap.opacity * alpha
        if (alpha < 0.95) {
          mat.depthWrite = false
        }
      }
    }
  })
}

type Slot = {
  key: string
  chapterId: string
  scene: SpikeSceneEntry
  Comp: ComponentType<SceneProps>
  role: "active" | "outgoing"
}

/**
 * Monta como máximo dos escenas (activa + saliente), con crossfade de opacidad,
 * deriva espacial alineada al scroll y continuidad de cámara por encuadres de borde.
 * El progress se lee en las escenas vía `useFrame` (nunca setState por frame).
 */
export function SceneDirector() {
  const { chapterId, quality, isMobile, reducedMotion } = useExperienceStore()
  const [slots, setSlots] = useState<Slot[]>([])
  const blend = useRef(1)
  const directionRef = useRef<1 | -1>(1)
  const transitioning = useRef(false)
  const pendingUnmount = useRef(false)
  const activeChapter = useRef<string | null>(null)

  useEffect(() => {
    preloadNeighbors(chapterId)
    const entry = resolveEntry(chapterId)

    if (!chapterId || !entry) {
      let cancelled = false
      queueMicrotask(() => {
        if (!cancelled) setSlots([])
      })
      activeChapter.current = null
      transitioning.current = false
      blend.current = 1
      experienceStore.setBeat(null)
      return () => {
        cancelled = true
      }
    }

    if (chapterId === activeChapter.current) {
      return
    }

    let cancelled = false

    const mountScene = (Comp: ComponentType<SceneProps>) => {
      if (cancelled) return

      const prevChapter = activeChapter.current
      if (prevChapter) {
        directionRef.current =
          chapterIndexOf(chapterId) >= chapterIndexOf(prevChapter) ? 1 : -1
      } else {
        directionRef.current = 1
      }

      const nextKey = `${chapterId}-${performance.now()}`

      setSlots((prev) => {
        const previousActive = prev.find((slot) => slot.role === "active")
        const next: Slot[] = [
          {
            key: nextKey,
            chapterId,
            scene: entry,
            Comp,
            role: "active",
          },
        ]

        if (
          previousActive &&
          previousActive.chapterId !== chapterId &&
          !reducedMotion
        ) {
          next.push({ ...previousActive, role: "outgoing" })
          blend.current = 0
          transitioning.current = true
          pendingUnmount.current = false
        } else {
          blend.current = 1
          transitioning.current = false
        }

        return next.slice(0, 2)
      })

      activeChapter.current = chapterId
      // `connectStoreSignals` emite `beat:enter` al cambiar el beat.
      experienceStore.setBeat({ sceneId: entry.sceneId, beatId: "mundo" })
    }

    const syncComp = resolvedSceneCache.get(chapterId)
    if (syncComp) {
      queueMicrotask(() => mountScene(syncComp))
    } else {
      loadEntryComponent(chapterId, entry)
        .then(mountScene)
        .catch((error: unknown) => {
          console.error("[experience] no se pudo cargar la escena", error)
        })
    }

    return () => {
      cancelled = true
    }
  }, [chapterId, reducedMotion])

  useEffect(() => {
    setGpuStats({ mountedScenes: slots.length })
  }, [slots])

  useEffect(() => {
    return () => {
      setGpuStats({ mountedScenes: 0 })
    }
  }, [])

  useFrame((_, delta) => {
    if (!transitioning.current) return
    const dt = Math.min(delta, 0.05)
    blend.current = Math.min(1, blend.current + dt / TRANSITION_SECONDS)

    if (blend.current >= 1 && !pendingUnmount.current) {
      transitioning.current = false
      pendingUnmount.current = true
      // Diferir el setState fuera del frame loop de R3F.
      queueMicrotask(() => {
        setSlots((prev) => prev.filter((slot) => slot.role === "active"))
        pendingUnmount.current = false
      })
    }
  })

  const activeKey = slots.find((s) => s.role === "active")?.key ?? "none"

  return (
    <>
      {slots.map((slot) => {
        const progress = experienceStore.progress(slot.chapterId)
        const isActive = slot.role === "active"

        return (
          <SceneLayer
            key={slot.key}
            Comp={slot.Comp}
            progress={progress}
            quality={quality}
            isMobile={isMobile}
            active={isActive}
            role={slot.role}
            blendRef={blend}
            directionRef={directionRef}
          />
        )
      })}
      <ScenePostDirector
        key={activeKey}
        chapterId={chapterId}
        isMobile={isMobile}
        reducedMotion={reducedMotion}
        activeChapterRef={activeChapter}
      />
    </>
  )
}

type SceneLayerProps = {
  Comp: ComponentType<SceneProps>
  progress: SceneProps["progress"]
  quality: SceneProps["quality"]
  isMobile: boolean
  active: boolean
  role: Slot["role"]
  blendRef: RefObject<number>
  directionRef: RefObject<1 | -1>
}

function SceneLayer({
  Comp,
  progress,
  quality,
  isMobile,
  active,
  role,
  blendRef,
  directionRef,
}: SceneLayerProps) {
  const group = useRef<Group>(null)

  // Corre antes de `Comp`: en `outgoing` oculta temporalmente el grupo para que
  // etiquetas `<Html>` que leen `parent.visible` (p.ej. Naturalis) se oculten de inmediato.
  useFrame(() => {
    const node = group.current
    if (!node) return
    if (role === "outgoing") {
      node.visible = false
    } else {
      node.visible = true
    }
  })

  return (
    <group ref={group}>
      <Suspense fallback={null}>
        <Comp
          progress={progress}
          quality={quality}
          isMobile={isMobile}
          active={active}
        />
      </Suspense>
      <SceneLayerPost
        groupRef={group}
        role={role}
        blendRef={blendRef}
        directionRef={directionRef}
      />
    </group>
  )
}

function SceneLayerPost({
  groupRef,
  role,
  blendRef,
  directionRef,
}: {
  groupRef: RefObject<Group | null>
  role: Slot["role"]
  blendRef: RefObject<number>
  directionRef: RefObject<1 | -1>
}) {
  const restoredRef = useRef(false)

  useFrame(() => {
    const node = groupRef.current
    if (!node) return

    const rawT = blendRef.current
    const t = smootherstep(rawT)
    const dir = directionRef.current

    if (role === "active") {
      if (rawT >= 1) {
        node.position.set(0, 0, 0)
        node.scale.setScalar(1)
        node.visible = true
        if (!restoredRef.current) {
          applyGroupOpacity(node, 1, true)
          restoredRef.current = true
        }
      } else {
        restoredRef.current = false
        node.visible = true
        // Entrada suave en eje vertical + profundidad, alineada con la dirección del scroll.
        node.position.set(0, -dir * (1 - t) * 0.42, -(1 - t) * 0.35)
        node.scale.setScalar(0.94 + t * 0.06)
        applyGroupOpacity(node, MathUtils.clamp(0.18 + t * 0.82, 0, 1), false)
      }
    } else {
      restoredRef.current = false
      const alpha = 1 - t
      node.visible = alpha > 0.015
      node.position.set(0, dir * t * 0.42, -t * 0.45)
      node.scale.setScalar(1 - t * 0.06)
      applyGroupOpacity(node, alpha, false)
    }
  })

  return null
}

const poseMatrix = new Matrix4()
const poseUp = new Vector3(0, 1, 0)
const scratchEye = new Vector3()
const scratchTarget = new Vector3()
const scratchBorderPos = new Vector3()
const scratchBorderQuat = new Quaternion()
const desiredPos = new Vector3(0, 0, 5)
const desiredQuat = new Quaternion()
const bridgeFromPos = new Vector3(0, 0, 5)
const bridgeFromQuat = new Quaternion()
const lastFinalPos = new Vector3(0, 0, 5)
const lastFinalQuat = new Quaternion()
const liveBgColor = new Color("#0a0a0b")
let cameraStateInitialized = false
let lastTrackedChapter: string | null = null

function computePose(
  pose: BorderPose,
  isMobile: boolean,
  outPos: Vector3,
  outQuat: Quaternion
) {
  const eye = isMobile ? pose.mobile : pose.desktop
  const target = isMobile ? (pose.mobileTarget ?? pose.target) : pose.target
  scratchEye.set(eye[0], eye[1], eye[2])
  scratchTarget.set(target[0], target[1], target[2])
  outPos.copy(scratchEye)
  poseMatrix.lookAt(scratchEye, scratchTarget, poseUp)
  outQuat.setFromRotationMatrix(poseMatrix)
}

/**
 * Se monta después de los slots activos: su `useFrame` corre tras el rig de la escena,
 * aplica encuadres de borde (`borderFrames`), amortigua cualquier salto de cámara al
 * cambiar de capítulo y sincroniza `scene.background` con `getLivePalette()`.
 */
function ScenePostDirector({
  chapterId,
  isMobile,
  reducedMotion,
  activeChapterRef,
}: {
  chapterId: string | null
  isMobile: boolean
  reducedMotion: boolean
  activeChapterRef: RefObject<string | null>
}) {
  const beatKey = useRef("")
  const cameraBridge = useRef(1)

  useFrame(({ camera, scene }, delta) => {
    const dt = Math.min(delta, 0.05)
    const isJourney =
      typeof document !== "undefined" &&
      document.documentElement.dataset.paletteBound !== undefined

    if (!cameraStateInitialized) {
      lastFinalPos.copy(camera.position)
      lastFinalQuat.copy(camera.quaternion)
      lastTrackedChapter = chapterId
      cameraStateInitialized = true
    }

    if (lastTrackedChapter !== chapterId) {
      bridgeFromPos.copy(lastFinalPos)
      bridgeFromQuat.copy(lastFinalQuat)
      cameraBridge.current = reducedMotion ? 1 : 0
      lastTrackedChapter = chapterId
      beatKey.current = ""
    }

    const definition = chapterId ? getSceneByChapter(chapterId) : undefined
    if (definition && activeChapterRef.current === chapterId) {
      const p = experienceStore.progress(definition.chapterId).current
      const beat = definition.beats.find(
        (b) => p >= b.range[0] && (p < b.range[1] || b.range[1] === 1)
      )
      const key = `${definition.id}/${beat?.id}`
      if (beat && beatKey.current !== key) {
        beatKey.current = key
        queueMicrotask(() => {
          if (experienceStore.getSnapshot().chapterId === definition.chapterId)
            experienceStore.setBeat({ sceneId: definition.id, beatId: beat.id })
        })
      }

      // En el recorrido aplicamos los encuadres de borde (entrada/salida) definidos por escena.
      const border = isJourney ? BORDER_FRAMES[definition.chapterId] : undefined
      if (border && !reducedMotion) {
        const entrySpan = border.entrySpan ?? 0.08
        const exitStart = border.exitStart ?? 0.9
        if (p < entrySpan && entrySpan > 0) {
          const tEntry = smootherstep(p / entrySpan)
          computePose(
            border.entry,
            isMobile,
            scratchBorderPos,
            scratchBorderQuat
          )
          camera.position.lerpVectors(scratchBorderPos, camera.position, tEntry)
          camera.quaternion.slerpQuaternions(
            scratchBorderQuat,
            camera.quaternion,
            tEntry
          )
        } else if (p > exitStart && exitStart < 1) {
          const tExit = smootherstep((p - exitStart) / (1 - exitStart))
          computePose(
            border.exit,
            isMobile,
            scratchBorderPos,
            scratchBorderQuat
          )
          camera.position.lerpVectors(camera.position, scratchBorderPos, tExit)
          camera.quaternion.slerpQuaternions(
            camera.quaternion,
            scratchBorderQuat,
            tExit
          )
        }
      }
    } else if (!chapterId || !getSpikeScene(chapterId)) {
      camera.position.set(0, 0, 5)
      camera.lookAt(0, 0, 0)
      beatKey.current = ""
    }

    desiredPos.copy(camera.position)
    desiredQuat.copy(camera.quaternion)

    if (cameraBridge.current < 1) {
      cameraBridge.current = Math.min(
        1,
        cameraBridge.current + dt / TRANSITION_SECONDS
      )
      const ease = smootherstep(cameraBridge.current)
      camera.position.lerpVectors(bridgeFromPos, desiredPos, ease)
      camera.quaternion.slerpQuaternions(bridgeFromQuat, desiredQuat, ease)
    }

    lastFinalPos.copy(camera.position)
    lastFinalQuat.copy(camera.quaternion)

    // En el recorrido el fondo WebGL sigue la paleta viva interpolada (T-A15),
    // evitando que el color fijo de `useGreyboxRig` pise la transición en 0.82..1.
    if (isJourney) {
      liveBgColor.set(getLivePalette().background)
      scene.background = liveBgColor
    } else if (!chapterId || (!definition && !getSpikeScene(chapterId))) {
      liveBgColor.set("#0a0a0b")
      scene.background = liveBgColor
    }
  })

  return null
}

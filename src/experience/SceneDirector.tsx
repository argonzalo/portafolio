import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MutableRefObject,
} from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"

import { useExperienceStore } from "@/experience/hooks"
import { setGpuStats } from "@/experience/gpuStats"
import {
  getSpikeScene,
  isSpikeChapter,
  type SpikeSceneEntry,
} from "@/experience/spike/scenes"
import { experienceStore } from "@/experience/store"
import type { SceneProps } from "@/experience/types"

const TRANSITION_SECONDS = 0.55

type Slot = {
  key: string
  chapterId: string
  scene: SpikeSceneEntry
  Comp: ComponentType<SceneProps>
  role: "active" | "outgoing"
}

/**
 * Monta como máximo dos escenas (activa + saliente), con slide por grupo.
 * El progress se lee en las escenas vía `useFrame` (nunca setState por frame).
 */
export function SceneDirector() {
  const { chapterId, quality, isMobile } = useExperienceStore()
  const [slots, setSlots] = useState<Slot[]>([])
  const blend = useRef(1)
  const transitioning = useRef(false)
  const pendingUnmount = useRef(false)
  const activeChapter = useRef<string | null>(null)

  useEffect(() => {
    if (!chapterId || !isSpikeChapter(chapterId)) {
      return
    }

    if (chapterId === activeChapter.current) {
      return
    }

    const entry = getSpikeScene(chapterId)
    if (!entry) return

    let cancelled = false

    entry
      .load()
      .then((mod) => {
        if (cancelled) return

        const Comp = mod.default
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

          if (previousActive && previousActive.chapterId !== chapterId) {
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
      })
      .catch((error: unknown) => {
        console.error("[experience] no se pudo cargar la escena spike", error)
      })

    return () => {
      cancelled = true
    }
  }, [chapterId])

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

    blend.current = Math.min(1, blend.current + delta / TRANSITION_SECONDS)

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
            blend={blend}
          />
        )
      })}
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
  blend: MutableRefObject<number>
}

function SceneLayer({
  Comp,
  progress,
  quality,
  isMobile,
  active,
  role,
  blend,
}: SceneLayerProps) {
  const group = useRef<Group>(null)

  useFrame(() => {
    const node = group.current
    if (!node) return

    const t = blend.current

    if (role === "active") {
      node.position.x = (1 - t) * 2.4
      node.position.z = (1 - t) * -0.6
      node.scale.setScalar(0.85 + t * 0.15)
    } else {
      node.position.x = -t * 2.4
      node.position.z = -t * 0.6
      node.scale.setScalar(1 - t * 0.2)
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
    </group>
  )
}

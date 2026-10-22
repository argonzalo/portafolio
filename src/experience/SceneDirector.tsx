import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react"
import { useFrame } from "@react-three/fiber"
import { Color, Vector3, type Group } from "three"
import { useExperienceStore } from "@/experience/hooks"
import { setGpuStats } from "@/experience/gpuStats"
import { applyPaletteNow } from "@/experience/palette"
import { getSpikeScene, type SpikeSceneEntry } from "@/experience/spike/scenes"
import { experienceStore } from "@/experience/store"
import {
  CHAPTER_SEQUENCE,
  chapterIndexOf,
  nextJourneyChapter,
} from "@/experience/thread/forms"
import { handoff, ramp } from "@/experience/choreography"
import {
  composeOpacity,
  PresentationContext,
  type Presentation,
} from "@/experience/presentation"
import type { SceneProps } from "@/experience/types"
import { getSceneByChapter } from "@/scenes/registry"

const cache = new Map<string, Promise<ComponentType<SceneProps>>>()
const poses = new Map<string, Presentation>()
const heldStart = { current: 0 }

function entry(id: string | null): SpikeSceneEntry | undefined {
  if (!id) return
  const definition = getSceneByChapter(id)
  return definition
    ? {
        ...definition,
        sceneId: definition.id,
        label: definition.id,
        accent: definition.palette.accent,
      }
    : getSpikeScene(id)
}

function load(id: string) {
  if (!cache.has(id)) {
    const definition = entry(id)
    if (!definition) return null
    cache.set(
      id,
      definition
        .load()
        .then((module) => module.default)
        .catch((error) => {
          cache.delete(id)
          throw error
        })
    )
  }
  return cache.get(id)!
}

/** Stable keys keep the incoming world alive across the chapter boundary.
 * Both worlds are sampled from scroll, including when reversing. No timer,
 * remount at the boundary, artificial scale, or second camera correction.
 */
export function SceneDirector() {
  const { chapterId, quality, isMobile } = useExperienceStore()
  const [loaded, setLoaded] = useState<
    Record<string, ComponentType<SceneProps>>
  >({})
  const next = chapterId ? nextJourneyChapter(chapterId) : null
  const previous = chapterId
    ? CHAPTER_SEQUENCE[chapterIndexOf(chapterId) - 1]
    : null
  const ids = [chapterId, next].filter(
    (id): id is string => !!id && !!entry(id)
  )

  useEffect(() => {
    let cancelled = false
    for (const id of [previous, chapterId, next]) {
      if (!id) continue
      void load(id)
        ?.then((Comp) => {
          if (!cancelled)
            setLoaded((previous) =>
              previous[id] ? previous : { ...previous, [id]: Comp }
            )
        })
        .catch((error) =>
          console.error("[experience] no se pudo cargar la escena", error)
        )
    }
    return () => {
      cancelled = true
    }
  }, [previous, chapterId, next])

  const count = ids.filter((id) => loaded[id]).length
  useEffect(() => {
    setGpuStats({ mountedScenes: count })
    return () => setGpuStats({ mountedScenes: 0 })
  }, [count])

  return (
    <>
      {ids.map((id) =>
        loaded[id] ? (
          <SceneLayer
            key={id}
            id={id}
            chapterId={chapterId}
            Comp={loaded[id]}
            quality={quality}
            isMobile={isMobile}
          />
        ) : null
      )}
      <CameraDirector chapterId={chapterId} next={next} />
    </>
  )
}

function SceneLayer({
  id,
  chapterId,
  Comp,
  quality,
  isMobile,
}: {
  id: string
  chapterId: string | null
  Comp: ComponentType<SceneProps>
  quality: SceneProps["quality"]
  isMobile: boolean
}) {
  const group = useRef<Group>(null)
  const presentation = useRef<Presentation>({
    opacity: 0,
    eye: new Vector3(0, 0, 5),
    target: new Vector3(),
    ready: false,
  })
  const current = id === chapterId
  const progress = current ? experienceStore.progress(id) : heldStart
  useEffect(() => {
    poses.set(id, presentation.current)
    return () => {
      poses.delete(id)
    }
  }, [id, presentation])

  // Before camera rigs (-3), scene animation (-1) and DOM projection (0).
  useFrame(() => {
    const p = chapterId ? experienceStore.progress(chapterId).current : 0
    const t = handoff(p)
    presentation.current.opacity = current
      ? 1 - ramp(t, 0, 0.72)
      : ramp(t, 0.28, 1)
    if (group.current) {
      group.current.visible = presentation.current.opacity > 0.001
      group.current.userData.reveal = presentation.current.opacity
    }
  }, -4)

  return (
    <PresentationContext.Provider value={presentation}>
      <group ref={group} visible={false}>
        <Suspense fallback={null}>
          <Comp
            progress={progress}
            quality={quality}
            isMobile={isMobile}
            active
          />
        </Suspense>
      </group>
      <LayerFinish root={group} />
    </PresentationContext.Provider>
  )
}

function LayerFinish({ root }: { root: React.RefObject<Group | null> }) {
  useFrame(() => {
    if (root.current) composeOpacity(root.current, 1)
  })
  return null
}

function CameraDirector({
  chapterId,
  next,
}: {
  chapterId: string | null
  next: string | null
}) {
  const color = useMemo(() => new Color(), [])
  const eye = useMemo(() => new Vector3(), [])
  const target = useMemo(() => new Vector3(), [])
  const beatKey = useRef("")
  useFrame(({ camera, scene }) => {
    const p = chapterId ? experienceStore.progress(chapterId).current : 0
    const t = handoff(p)
    const from = chapterId ? poses.get(chapterId) : undefined
    const to = next ? poses.get(next) : undefined
    eye.set(0, 0, 5)
    if (from?.ready) eye.copy(from.eye)
    target.set(0, 0, 0)
    if (from?.ready) target.copy(from.target)
    if (to?.ready) {
      eye.lerp(to.eye, t)
      target.lerp(to.target, t)
    } else if (!entry(next)) {
      // The last 3D world returns to the neutral camera before the DOM chapter.
      eye.multiplyScalar(1 - t)
      eye.setZ(eye.z + 5 * t)
      target.multiplyScalar(1 - t)
    }
    camera.position.copy(eye)
    camera.lookAt(target)
    camera.updateMatrixWorld()
    scene.background = color.set(applyPaletteNow(experienceStore).background)

    const definition = chapterId ? getSceneByChapter(chapterId) : undefined
    const beat = definition?.beats.find(
      (b) => p >= b.range[0] && (p < b.range[1] || b.range[1] === 1)
    )
    const key = `${chapterId}/${beat?.id}`
    if (key !== beatKey.current) {
      beatKey.current = key
      queueMicrotask(() => {
        if (experienceStore.getSnapshot().chapterId === chapterId)
          experienceStore.setBeat(
            definition && beat
              ? { sceneId: definition.id, beatId: beat.id }
              : null
          )
      })
    }
  }, -2)
  return null
}

import { useSyncExternalStore } from "react"
import { createExperienceStore, experienceStore } from "@/experience/store"
import { getSceneByChapter } from "@/scenes/registry"

// Todas las islas hidratan el mismo HTML aunque Stage ya haya detectado static.
const serverSnapshot = createExperienceStore().getSnapshot()

export function GreyboxCaption({
  chapterId,
  label,
}: {
  chapterId: string
  label: string
}) {
  const { quality, beat } = useSyncExternalStore(
    experienceStore.subscribe,
    experienceStore.getSnapshot,
    () => serverSnapshot
  )
  const scene = getSceneByChapter(chapterId)
  if (!scene) return null
  const current =
    scene.beats.find(
      (b) => beat?.sceneId === scene.id && b.id === beat.beatId
    ) ?? scene.beats[0]
  return (
    <>
      {quality === "static" ? (
        <picture className="absolute inset-0 -z-10">
          <source
            media="(max-width:768px)"
            srcSet={scene.fallback.posterMobile ?? scene.fallback.poster}
          />
          <img
            src={scene.fallback.poster}
            alt={`Escenario de ${label}`}
            className="h-full w-full object-cover"
          />
        </picture>
      ) : null}
      <div
        style={{
          color: scene.palette.foreground,
          background: `linear-gradient(${scene.palette.background}ee,${scene.palette.background}00)`,
          padding: "clamp(1.5rem,5vw,4rem)",
          paddingTop: "7rem",
          pointerEvents: "none",
        }}
      >
        <h2 className="text-2xl font-semibold sm:text-4xl">{label}</h2>
        <p className="mt-2 max-w-md text-sm sm:text-base" aria-live="polite">
          {current.label}
        </p>
        <a
          className="pointer-events-auto mt-3 inline-flex min-h-11 items-center underline underline-offset-4"
          href={`/projects/${scene.id}`}
        >
          Ver caso completo
        </a>
      </div>
    </>
  )
}

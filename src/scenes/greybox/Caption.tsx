import { useEffect, useRef, useSyncExternalStore } from "react"
import { createExperienceStore, experienceStore } from "@/experience/store"
import { handoff, ramp } from "@/experience/choreography"
import { nextJourneyChapter } from "@/experience/thread/forms"
import { getSceneByChapter } from "@/scenes/registry"

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
  const root = useRef<HTMLDivElement>(null)
  const subtitle = useRef<HTMLParagraphElement>(null)
  const scene = getSceneByChapter(chapterId)
  useEffect(() => {
    let frame = 0
    const update = () => {
      const active = experienceStore.getSnapshot().chapterId
      const p = active ? experienceStore.progress(active).current : 0
      const blend = handoff(p)
      const alpha =
        active === chapterId
          ? 1 - ramp(blend, 0, 0.45)
          : active && nextJourneyChapter(active) === chapterId
            ? ramp(blend, 0.65, 1)
            : 0
      if (subtitle.current && scene) {
        const local = experienceStore.progress(chapterId).current
        const beat = scene.beats.find(
          (b) => local >= b.range[0] && (local < b.range[1] || b.range[1] === 1)
        )
        if (beat) {
          const enter =
            beat.range[0] === 0
              ? 1
              : ramp(local, beat.range[0], beat.range[0] + 0.014)
          const exit =
            beat.range[1] === 1
              ? 1
              : 1 - ramp(local, beat.range[1] - 0.014, beat.range[1])
          subtitle.current.style.opacity = String(enter * exit)
        }
      }
      if (root.current) {
        root.current.style.opacity = String(alpha)
        root.current.style.visibility = alpha > 0.001 ? "visible" : "hidden"
        root.current.inert = alpha < 0.95
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [chapterId, scene])
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
        ref={root}
        data-scene-caption={chapterId}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          opacity: 0,
          visibility: "hidden",
          color: "var(--journey-foreground)",
          padding: "clamp(1.5rem,5vw,4rem)",
          paddingTop: "7rem",
          pointerEvents: "none",
        }}
      >
        <h2 className="text-2xl font-semibold sm:text-4xl">{label}</h2>
        <p
          ref={subtitle}
          className="mt-2 max-w-md text-sm sm:text-base"
          aria-live="polite"
        >
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

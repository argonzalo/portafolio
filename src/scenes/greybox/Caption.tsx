import { useEffect, useRef, useSyncExternalStore } from "react"
import { createExperienceStore, experienceStore } from "@/experience/store"
import { handoff, ramp } from "@/experience/choreography"
import { nextJourneyChapter } from "@/experience/thread/forms"
import { getSceneByChapter } from "@/scenes/registry"
import { openProjectDialog } from "@/lib/projectDialogStore"
import { ChevronRight } from "lucide-react"

const serverSnapshot = createExperienceStore().getSnapshot()

const SCENE_THEMES: Record<
  string,
  {
    gradient: string
    border: string
    glow: string
    thumbnails: string[]
  }
> = {
  vibo: {
    gradient: "from-[#1a56db] via-[#1f7aff] to-[#38bdf8]",
    border: "border-sky-400/40",
    glow: "shadow-[0_4px_24px_-4px_rgba(31,122,255,0.5)]",
    thumbnails: [
      "/images/proyects/vibo/padel-video-analisis/1.webp",
      "/images/proyects/vibo/padel-video-analisis/2.webp",
      "/images/proyects/vibo/padel-video-analisis/3.webp",
    ],
  },
  pirp: {
    gradient: "from-[#5c131d] via-[#7A1F2B] to-[#b91c1c]",
    border: "border-rose-400/40",
    glow: "shadow-[0_4px_24px_-4px_rgba(122,31,43,0.55)]",
    thumbnails: [
      "/images/proyects/pirp/1.webp",
      "/images/proyects/pirp/2.webp",
      "/images/proyects/pirp/3.webp",
    ],
  },
  naturalis: {
    gradient: "from-[#204038] via-[#3E6E65] to-[#5a9c8f]",
    border: "border-emerald-300/40",
    glow: "shadow-[0_4px_24px_-4px_rgba(62,110,101,0.5)]",
    thumbnails: [
      "/images/proyects/naturalis/app-web/1.webp",
      "/images/proyects/naturalis/app-web/2.webp",
      "/images/proyects/naturalis/app-web/3.webp",
    ],
  },
  "banner-2": {
    gradient: "from-[#9a2a00] via-[#DA3E00] to-[#f97316]",
    border: "border-orange-400/40",
    glow: "shadow-[0_4px_24px_-4px_rgba(218,62,0,0.55)]",
    thumbnails: [
      "/images/proyects/banner-director/banner-2/1.webp",
      "/images/proyects/banner-director/banner-2/2.webp",
      "/images/proyects/banner-director/banner-2/3.webp",
    ],
  },
  agnt: {
    gradient: "from-[#0d4d42] via-[#059669] to-[#34d399]",
    border: "border-emerald-400/40",
    glow: "shadow-[0_4px_24px_-4px_rgba(5,150,105,0.5)]",
    thumbnails: [
      "/images/proyects/agnt/1.webp",
      "/images/proyects/agnt/2.webp",
      "/images/proyects/agnt/3.webp",
    ],
  },
}

export function GreyboxCaption({
  chapterId,
  label,
}: {
  chapterId: string
  label: string
}) {
  const { quality } = useSyncExternalStore(
    experienceStore.subscribe,
    experienceStore.getSnapshot,
    () => serverSnapshot
  )
  const root = useRef<HTMLDivElement>(null)
  const scene = getSceneByChapter(chapterId)

  useEffect(() => {
    let frame = 0
    const update = () => {
      const active = experienceStore.getSnapshot().chapterId
      const p = active ? experienceStore.progress(active).current : 0
      const blend = handoff(p, active)
      const alpha =
        active === chapterId
          ? 1 - ramp(blend, 0, 0.45)
          : active && nextJourneyChapter(active) === chapterId
            ? ramp(blend, 0.65, 1)
            : 0

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

  const theme = SCENE_THEMES[scene.id] ?? SCENE_THEMES.vibo

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
          zIndex: 40,
          opacity: 0,
          visibility: "hidden",
          color: "var(--journey-foreground)",
          padding: "clamp(1.5rem,5vw,4rem)",
          paddingTop: "7rem",
          pointerEvents: "none",
        }}
      >
        <h2 className="text-2xl font-semibold sm:text-4xl">{label}</h2>

        {/* Botón con degradado de escena y mini stack de capturas en desktop */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => openProjectDialog(scene.id)}
            className={`group pointer-events-auto inline-flex items-center gap-3 rounded-full bg-gradient-to-r ${theme.gradient} px-4 py-2 sm:px-5 sm:py-2.5 text-white font-medium text-xs sm:text-sm border ${theme.border} ${theme.glow} backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer`}
            aria-label={`Ver proyecto ${label}`}
          >
            {/* Mini stack de 2 o 3 capturas en desktop */}
            <div className="hidden sm:flex items-center -space-x-2">
              {theme.thumbnails.slice(0, 3).map((thumb, idx) => (
                <img
                  key={thumb}
                  src={thumb}
                  alt=""
                  className="size-6 rounded-md object-cover border border-white/35 shadow-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ zIndex: 3 - idx }}
                />
              ))}
            </div>

            <span className="tracking-tight">Ver proyecto</span>
            <ChevronRight className="size-4 text-white/80 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </>
  )
}

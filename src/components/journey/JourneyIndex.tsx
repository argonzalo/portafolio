"use client"

import { useState, useSyncExternalStore } from "react"
import {
  journeyChapterGroups,
  journeyChapters,
  type JourneyChapter,
} from "@/components/journey/chapters"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { experienceStore } from "@/experience/store"
import { getSceneByChapter } from "@/scenes/registry"
import { XIcon } from "lucide-react"

function chaptersInGroup(group: JourneyChapter["group"]) {
  return journeyChapters.filter((chapter) => chapter.group === group)
}

const SCENE_COLORS: Record<string, string> = {
  vibo: "#1f7aff",
  pirp: "#7A1F2B",
  naturalis: "#3E6E65",
  "banner-2": "#DA3E00",
  agnt: "#10b981",
}

export function JourneyIndex() {
  const [open, setOpen] = useState(false)
  const activeChapterId = useSyncExternalStore(
    experienceStore.subscribe,
    () => experienceStore.getSnapshot().chapterId,
    () => null
  )

  const navigateToChapter = (chapterId: string) => {
    setOpen(false)

    setTimeout(() => {
      if (chapterId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" })
        history.replaceState(null, "", "#hero")
        return
      }

      const targetEl =
        document.querySelector<HTMLElement>(`[data-chapter="${chapterId}"]`) ||
        document.getElementById(chapterId)
      if (!targetEl) return

      const sceneDef = getSceneByChapter(chapterId)
      const top = targetEl.getBoundingClientRect().top + window.scrollY
      const targetScroll = sceneDef
        ? Math.max(0, top - window.innerHeight / 2 + 10)
        : Math.max(0, top - 80)

      window.scrollTo({
        top: Math.round(targetScroll),
        behavior: "smooth",
      })

      window.dispatchEvent(new Event("experience:seek"))
      history.replaceState(null, "", `#${chapterId}`)
    }, 60)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="text-foreground/80 hover:text-foreground hover:bg-white/10 inline-flex h-8 sm:h-9 items-center justify-center rounded-full px-3 sm:px-3.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
          aria-label="Abrir índice del recorrido"
        >
          Índice
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:inset-3 sm:data-[side=right]:inset-auto sm:data-[side=right]:top-4 sm:data-[side=right]:right-4 sm:data-[side=right]:bottom-4 sm:data-[side=right]:w-80 sm:data-[side=right]:h-[calc(100dvh-2rem)] rounded-3xl border border-white/10 bg-[#141416]/95 p-0 text-white backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.75)] flex flex-col gap-0 overflow-hidden"
      >
        {/* Cabecera minimalista sin textos explicativos */}
        <SheetHeader className="relative z-10 flex flex-row items-center justify-between border-b border-white/10 px-5 py-4">
          <SheetTitle className="text-base font-semibold tracking-tight text-white">
            Índice
          </SheetTitle>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:bg-white/15 hover:text-white cursor-pointer"
            aria-label="Cerrar índice"
          >
            <XIcon className="size-3.5" />
          </button>
        </SheetHeader>

        {/* Lista de capítulos minimalista */}
        <nav
          aria-label="Capítulos del recorrido"
          className="relative z-10 flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5"
        >
          {journeyChapterGroups.map((group) => {
            const items = chaptersInGroup(group.id)
            if (items.length === 0) return null

            return (
              <div key={group.id} className="flex flex-col gap-1.5">
                <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase px-2">
                  {group.label}
                </p>

                <ul className="flex flex-col gap-1">
                  {items.map((chapter) => {
                    const itemIndex =
                      journeyChapters.findIndex((c) => c.id === chapter.id) + 1
                    const indexFormatted = String(itemIndex).padStart(2, "0")
                    const isActive = activeChapterId === chapter.id
                    const sceneColor = SCENE_COLORS[chapter.id]

                    return (
                      <li key={chapter.id}>
                        <a
                          href={`#${chapter.id}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigateToChapter(chapter.id)
                          }}
                          className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all duration-200 border ${
                            isActive
                              ? "border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-md"
                              : "border-transparent text-white/75 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`font-mono text-xs tabular-nums transition-colors ${
                                isActive
                                  ? "text-white font-semibold"
                                  : "text-white/35 group-hover:text-white/60"
                              }`}
                            >
                              {indexFormatted}
                            </span>
                            <span className="text-xs sm:text-sm font-medium">
                              {chapter.indexLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {sceneColor && (
                              <span
                                className="size-2 rounded-full shadow-sm"
                                style={{ backgroundColor: sceneColor }}
                                title="Escena 3D"
                              />
                            )}
                            {isActive && (
                              <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">
                                Actual
                              </span>
                            )}
                          </div>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

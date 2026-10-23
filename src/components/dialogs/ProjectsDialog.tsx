"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ProjectDetailBody } from "@/components/dialogs/ProjectDetailBody"
import type { Project } from "@/lib/projects"
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

type Props = {
  projects: Project[]
}

type View = "list" | "detail"

export function ProjectsDialog({ projects }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>("list")
  const [activeId, setActiveId] = useState<string | null>(null)

  const project = projects.find((item) => item.id === activeId) ?? null

  useEffect(() => {
    if (!open) {
      setView("list")
      setActiveId(null)
    }
  }, [open])

  const showDetail = (id: string) => {
    setActiveId(id)
    setView("detail")
  }

  const goBack = () => {
    setView("list")
    setActiveId(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-app-bar-action="projects"
          className="inline-flex h-8 sm:h-9 items-center justify-center px-1.5 sm:px-2 text-xs sm:text-sm font-medium text-foreground/75 transition-colors duration-200 hover:text-foreground active:text-foreground/90 cursor-pointer"
          aria-label="Abrir lista de proyectos"
        >
          Proyectos
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#141416]/98 p-0 text-white backdrop-blur-3xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[88vh] sm:w-[94vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#161618]/95 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
      >
        {view === "list" || !project ? (
          <>
            <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#141416]/80 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-xl sm:px-8 sm:py-4">
              <DialogTitle className="text-base font-semibold tracking-tight text-white sm:text-lg">
                Proyectos
              </DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
                aria-label="Cerrar lista de proyectos"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-5 sm:pb-8">
              <DialogDescription className="sr-only">
                Lista de proyectos en el orden del recorrido. Elegí uno para ver
                el detalle.
              </DialogDescription>

              <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
                {projects.map((item) => {
                  const cover = item.images?.[0]?.src

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => showDetail(item.id)}
                        className="group flex w-full items-center gap-3.5 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none cursor-pointer sm:gap-4 sm:py-4"
                        aria-label={`Ver detalles de ${item.title}`}
                      >
                        <div className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 sm:w-24">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] text-[11px] font-bold text-white/80">
                              {item.title.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-white/50 sm:text-xs">
                            <span className="truncate font-medium tracking-wide">
                              {item.client || "Desarrollo"}
                            </span>
                          </div>
                          <h3 className="mt-1 truncate text-sm font-semibold tracking-tight text-white transition-colors group-hover:text-primary sm:text-base">
                            {item.title}
                          </h3>
                          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-white/65 sm:text-[13px]">
                            {item.oneLiner}
                          </p>
                        </div>

                        <ChevronRightIcon className="size-4 shrink-0 text-white/35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/70" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 bg-[#141416]/80 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
                aria-label="Volver a la lista de proyectos"
              >
                <ChevronLeftIcon className="size-4" />
              </button>

              <DialogTitle className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                {project.title}
              </DialogTitle>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
                aria-label="Cerrar detalle del proyecto"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8">
              <DialogHeader className="gap-2 text-left">
                <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {project.title}
                </span>
                <DialogDescription className="text-base leading-relaxed text-white/80 sm:text-lg">
                  {project.oneLiner}
                </DialogDescription>
              </DialogHeader>

              <ProjectDetailBody key={project.id} project={project} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

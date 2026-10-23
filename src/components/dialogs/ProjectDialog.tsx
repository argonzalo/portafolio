"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  closeProjectDialog,
  subscribeProjectDialog,
} from "@/lib/projectDialogStore"
import type { Project } from "@/lib/projects"
import { ExternalLinkIcon, XIcon } from "lucide-react"

type Props = {
  projects: Project[]
}

export function ProjectDialog({ projects }: Props) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      const projectParam = url.searchParams.get("project")
      if (projectParam && projects.some((p) => p.id === projectParam)) {
        return projectParam
      }
    }
    return null
  })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    // Escucha cambios en el store global y eventos popstate
    const unsubscribe = subscribeProjectDialog((id) => {
      setActiveId(id)
      setSelectedImageIndex(0)
    })

    return unsubscribe
  }, [])


  const project = projects.find((p) => p.id === activeId)
  const isOpen = Boolean(project)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeProjectDialog()
    }
  }

  if (!project) return null

  const images = project.images ?? []
  const hasImages = images.length > 0
  const activeImage = hasImages ? images[selectedImageIndex] ?? images[0] : null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-[#141416]/98 p-0 text-white backdrop-blur-3xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[88vh] sm:w-[94vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#161618]/95 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
      >
        {/* Barra superior con botón cerrar accesible */}
        <div className="sticky top-0 z-20 flex items-center justify-end border-b border-white/10 bg-[#141416]/80 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-xl sm:px-8 sm:py-4">
          <button
            type="button"
            onClick={closeProjectDialog}
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
            aria-label="Cerrar detalle del proyecto"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Contenido scrolleable interior */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {project.title}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-white/80 sm:text-lg">
              {project.oneLiner}
            </DialogDescription>
          </DialogHeader>

          {/* Enlace al sitio oficial si está disponible */}
          {project.url && (
            <div className="mt-4">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-all hover:border-white/30 hover:bg-white/15"
              >
                <span>Url</span>
                <ExternalLinkIcon className="size-3.5 text-white/70" />
              </a>
            </div>
          )}

          {/* Bloque 1: Capturas y vistas (sin título) */}
          <div className="mt-8">
            {hasImages ? (
              <div className="flex flex-col gap-3">
                {/* Imagen principal activa */}
                <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 shadow-inner">
                  {activeImage && (
                    <img
                      src={activeImage.src}
                      alt={activeImage.alt || project.title}
                      className="h-full w-full object-contain transition-opacity duration-300"
                      loading="lazy"
                    />
                  )}
                  {activeImage?.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-xs text-white/80 backdrop-blur-[2px]">
                      {activeImage.caption}
                    </div>
                  )}
                </div>

                {/* Tira de miniaturas si hay más de 1 imagen */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                    {images.map((img, idx) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative aspect-[16/10] h-14 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? "border-primary ring-primary/40 ring-2 scale-105"
                            : "border-white/15 opacity-60 hover:opacity-100 hover:border-white/30"
                        }`}
                        aria-label={`Ver captura ${idx + 1}`}
                      >
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                    <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                      {selectedImageIndex + 1} de {images.length}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-white/60">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-bold text-white">
                  {project.title.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-3 text-sm text-white/80">{project.title}</p>
                <p className="text-xs text-white/50">Proyecto sin capturas públicas</p>
              </div>
            )}
          </div>

          {/* Bloque 2: Descripción (sin "... y propósito") */}
          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
              Descripción
            </h3>
            <p className="text-sm leading-relaxed text-white/85 sm:text-base">
              {project.problem || project.description}
            </p>
          </div>

          {/* Bloque 3: Tecnologías utilizadas */}
          {project.stack && project.stack.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="mb-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
                Tecnologías utilizadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

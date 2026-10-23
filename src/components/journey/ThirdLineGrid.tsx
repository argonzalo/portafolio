"use client"

import { useState } from "react"
import type { Project } from "@/lib/projects"
import { openProjectDialog } from "@/lib/projectDialogStore"
import { ArrowUpRightIcon, ChevronDownIcon } from "lucide-react"

type Props = {
  projects: Project[]
}

export function ThirdLineGrid({ projects }: Props) {
  const [showAll, setShowAll] = useState(false)
  const displayedProjects = showAll ? projects : projects.slice(0, 2)

  return (
    <div className="mt-10 flex flex-col">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {displayedProjects.map((project) => {
          const cover = project.images?.[0]?.src

          return (
            <div
              key={project.id}
              onClick={() => openProjectDialog(project.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openProjectDialog(project.id)
                }
              }}
              tabIndex={0}
              role="button"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/85 p-5 text-left backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-[#16161a]/95 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`Ver detalles de ${project.title}`}
            >
              {/* Visual preview */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
                {cover ? (
                  <img
                    src={cover}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] p-4 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                      {project.title.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="mt-2 text-xs text-white/50">
                      Presentación de proyecto
                    </span>
                  </div>
                )}

                {/* Botón flotante de acción */}
                <div className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md opacity-80 transition-all group-hover:opacity-100 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary">
                  <ArrowUpRightIcon className="size-4" />
                </div>
              </div>

              {/* Metadatos y título */}
              <div className="mt-4 flex flex-1 flex-col">
                <div className="text-xs text-white/50">
                  <span className="font-medium tracking-wide">
                    {project.client || "Desarrollo"}
                  </span>
                </div>

                <h3 className="mt-1.5 text-base font-semibold text-white tracking-tight group-hover:text-primary transition-colors">
                  {project.title}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-white/70 line-clamp-2">
                  {project.oneLiner}
                </p>

                {/* Stack tags */}
                {project.stack && project.stack.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                    {project.stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.stack.length > 3 && (
                      <span className="rounded-full border border-white/5 bg-transparent px-1.5 py-0.5 text-[10px] text-white/40">
                        +{project.stack.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón Ver más si hay más de 2 proyectos y no están desplegados */}
      {!showAll && projects.length > 2 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs sm:text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/20 hover:bg-white/10 active:scale-[0.98] cursor-pointer"
          >
            <span>Ver más</span>
            <span className="text-white/50 text-xs">({projects.length - 2} proyectos más)</span>
            <ChevronDownIcon className="size-4 text-white/60 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>
        </div>
      )}
    </div>
  )
}

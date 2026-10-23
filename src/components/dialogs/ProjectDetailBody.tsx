"use client"

import type { Project } from "@/lib/projects"
import { ExternalLinkIcon } from "lucide-react"
import { useState } from "react"

type Props = {
  project: Project
}

export function ProjectDetailBody({ project }: Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const images = project.images ?? []
  const hasImages = images.length > 0
  const activeImage = hasImages ? (images[selectedImageIndex] ?? images[0]) : null

  return (
    <>
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

      <div className="mt-8">
        {hasImages ? (
          <div className="flex flex-col gap-3">
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

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
          Descripción
        </h3>
        <p className="text-sm leading-relaxed text-white/85 sm:text-base">
          {project.problem || project.description}
        </p>
      </div>

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
    </>
  )
}

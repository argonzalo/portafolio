import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LightboxStage } from "@/components/projects/LightboxStage"
import type { ProjectImage } from "@/lib/projects"
import { getProjectInitial } from "@/lib/projects"
import { cn } from "@/lib/utils"

type ProjectGalleryProps = {
  images: ProjectImage[]
  title: string
}

export function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (active === null) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null)
      }
      if (event.key === "ArrowRight") {
        setActive((current) =>
          current === null ? current : (current + 1) % images.length
        )
      }
      if (event.key === "ArrowLeft") {
        setActive((current) =>
          current === null
            ? current
            : (current - 1 + images.length) % images.length
        )
      }
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [active, images.length])

  if (images.length === 0) {
    return (
      <div className="border-border bg-muted/40 flex aspect-16/10 items-center justify-center rounded-2xl border border-dashed">
        <span className="text-primary text-6xl font-semibold">
          {getProjectInitial(title)}
        </span>
      </div>
    )
  }

  return (
    <>
      <ul
        className={cn(
          "grid gap-3",
          images.length === 1 && "grid-cols-1",
          images.length === 2 && "grid-cols-1 sm:grid-cols-2",
          images.length > 2 && "grid-cols-2 lg:grid-cols-3"
        )}
      >
        {images.map((image, index) => (
          <li
            key={image.src}
            className={cn(
              images.length > 2 && index === 0 && "col-span-2 lg:col-span-3"
            )}
          >
            <button
              type="button"
              onClick={() => setActive(index)}
              className="group border-border bg-muted relative block w-full overflow-hidden rounded-2xl border text-left"
            >
              <img
                src={image.src}
                alt={image.alt}
                className={cn(
                  "w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]",
                  images.length > 2 && index === 0
                    ? "aspect-16/9"
                    : "aspect-4/3"
                )}
              />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </button>
          </li>
        ))}
      </ul>

      {active !== null && images[active] ? (
        <div
          className="fixed inset-0 z-80 flex flex-col overscroll-none bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista de ${images[active].alt}`}
          onClick={() => setActive(null)}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="text-sm font-medium">
              {active + 1} / {images.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => setActive(null)}
            >
              <X />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          <div className="relative flex min-h-0 flex-1">
            {images.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-4 z-10 hidden -translate-y-1/2 sm:inline-flex"
                onClick={(event) => {
                  event.stopPropagation()
                  setActive(
                    (current) =>
                      ((current ?? 0) - 1 + images.length) % images.length
                  )
                }}
              >
                <ChevronLeft />
                <span className="sr-only">Anterior</span>
              </Button>
            )}

            <LightboxStage
              image={images[active]}
              canNavigate={images.length > 1}
              onPrev={() =>
                setActive(
                  (current) =>
                    ((current ?? 0) - 1 + images.length) % images.length
                )
              }
              onNext={() =>
                setActive((current) => ((current ?? 0) + 1) % images.length)
              }
              onClose={() => setActive(null)}
            />

            {images.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 sm:inline-flex"
                onClick={(event) => {
                  event.stopPropagation()
                  setActive(
                    (current) => ((current ?? 0) + 1) % images.length
                  )
                }}
              >
                <ChevronRight />
                <span className="sr-only">Siguiente</span>
              </Button>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="flex justify-center gap-3 px-4 pb-5 sm:hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setActive(
                    (current) =>
                      ((current ?? 0) - 1 + images.length) % images.length
                  )
                }
              >
                <ChevronLeft />
                Anterior
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setActive((current) => ((current ?? 0) + 1) % images.length)
                }
              >
                Siguiente
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}

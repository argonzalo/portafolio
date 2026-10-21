import { type ReactNode, useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Folders } from "lucide-react"

import { StackBadge } from "@/components/portfolio/StackBadge"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const VISIBLE_STACK = 3
const PROJECTS_RETURN_URL = "/#proyectos"

export type ProjectSubproject = {
  title: string
  description: string
}

export type ProjectCardProps = {
  href: string
  title: string
  description: string
  stack: string[]
  cover?: string
  active?: boolean
  subprojects?: ProjectSubproject[]
}

export function ProjectCard({
  href,
  title,
  description,
  stack,
  cover,
  active = false,
  subprojects = [],
}: ProjectCardProps) {
  const visibleStack = stack.slice(0, VISIBLE_STACK)
  const hiddenStack = stack.slice(VISIBLE_STACK)
  const showSubprojects = subprojects.length > 1

  return (
    <article className="group/card border-border bg-card hover:border-foreground/20 relative flex h-full min-w-0 flex-col rounded-2xl border transition-colors">
      <a
        href={href}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={title}
        onClick={rememberProjectsSection}
      />

      <div className="bg-muted relative aspect-16/10 overflow-hidden rounded-t-2xl">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.03]"
          />
        ) : (
          <CoverFallback title={title} />
        )}
        {active && (
          <Badge className="absolute top-3 right-3 z-10">En curso</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-balance">
          {title}
        </h3>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed text-pretty">
          {description}
        </p>

        <div className="relative z-20 mt-auto flex flex-wrap items-center gap-1.5 pt-1 pointer-events-auto">
          {visibleStack.map((item) => (
            <StackBadge key={item} name={item} />
          ))}

          {hiddenStack.length > 0 && (
            <ChipPopup
              label={`${hiddenStack.length} tecnologías más`}
              content={
                <div className="flex flex-col gap-2.5">
                  <p className="text-muted-foreground text-xs font-medium">
                    Stack adicional
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {hiddenStack.map((item) => (
                      <li key={item}>
                        <StackBadge name={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              }
            >
              +{hiddenStack.length}
            </ChipPopup>
          )}

          {showSubprojects && (
            <ChipPopup
              label={`${subprojects.length} subproyectos`}
              content={
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-xs font-medium">
                    Subproyectos
                  </p>
                  <ul className="flex min-w-0 flex-col gap-3">
                    {subprojects.map((item) => (
                      <li key={item.title} className="flex min-w-0 flex-col gap-0.5">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-muted-foreground line-clamp-2 min-w-0 overflow-hidden text-xs leading-relaxed break-words">
                          {item.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              }
            >
              <Folders />
              <span className="tabular-nums">{subprojects.length}</span>
              <ChevronDown className="transition-transform duration-200 group-data-open/chip:rotate-180" />
            </ChipPopup>
          )}
        </div>
      </div>
    </article>
  )
}

function rememberProjectsSection() {
  window.history.replaceState(window.history.state, "", PROJECTS_RETURN_URL)
}

function ChipPopup({
  label,
  content,
  children,
}: {
  label: string
  content: ReactNode
  children: ReactNode
}) {
  const triggerId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef(0)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, placeAbove: true })

  function clearCloseTimer() {
    window.clearTimeout(closeTimer.current)
  }

  function updateCoords() {
    const trigger = triggerRef.current
    if (!trigger) {
      return
    }

    const rect = trigger.getBoundingClientRect()
    const panelWidth = 256
    const gap = 8
    const placeAbove = rect.top > 200
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - panelWidth - 12
    )

    setCoords({
      top: placeAbove ? rect.top - gap : rect.bottom + gap,
      left,
      placeAbove,
    })
  }

  function openPopup() {
    clearCloseTimer()
    updateCoords()
    setOpen(true)
  }

  function scheduleClose() {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }

      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    function onReposition() {
      updateCoords()
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open])

  useEffect(() => {
    return () => clearCloseTimer()
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-open={open ? "true" : undefined}
        className={cn(
          badgeVariants({ variant: "outline" }),
          "group/chip relative z-20 cursor-pointer"
        )}
        onMouseEnter={openPopup}
        onMouseLeave={scheduleClose}
        onFocus={openPopup}
        onBlur={scheduleClose}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          clearCloseTimer()
          if (open) {
            setOpen(false)
            return
          }
          openPopup()
        }}
      >
        {children}
      </button>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-labelledby={triggerId}
              className="bg-popover text-popover-foreground z-80 w-72 overflow-hidden rounded-3xl p-3 text-sm shadow-lg ring-1 ring-foreground/5"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: coords.placeAbove ? "translateY(-100%)" : undefined,
              }}
              onMouseEnter={openPopup}
              onMouseLeave={scheduleClose}
              onClick={(event) => event.stopPropagation()}
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  )
}

function CoverFallback({ title }: { title: string }) {
  return (
    <div className="flex size-full items-center justify-center bg-muted" aria-hidden="true">
      <span className="text-primary text-6xl font-semibold">
        {title.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

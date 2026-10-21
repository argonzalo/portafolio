import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { Badge } from "@/components/ui/badge"
import { prefersReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { ExperienceStage } from "@/lib/experience"

type ExperienceTimelineProps = {
  stages: ExperienceStage[]
}

export function ExperienceTimeline({ stages }: ExperienceTimelineProps) {
  const rootRef = useRef<HTMLOListElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) {
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      const fill = root.querySelector("[data-experience-fill]")
      const items = Array.from(
        root.querySelectorAll<HTMLElement>("[data-experience-item]")
      )
      const nodes = Array.from(root.querySelectorAll("[data-experience-node]"))
      const animatedItems = items.slice(1)
      const animatedNodes = nodes.slice(1)
      const firstItem = items[0]

      const initialScale =
        firstItem && root.offsetHeight > 0
          ? firstItem.offsetHeight / root.offsetHeight
          : 0

      gsap.set(fill, { scaleY: initialScale, transformOrigin: "top center" })
      gsap.set(animatedItems, { autoAlpha: 0, y: 28 })
      gsap.set(animatedNodes, { scale: 0.45, autoAlpha: 0.35 })

      gsap.to(fill, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 75%",
          end: "bottom 55%",
          scrub: 0.45,
        },
      })

      animatedItems.forEach((item, index) => {
        const node = animatedNodes[index]

        ScrollTrigger.create({
          trigger: item,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.to(item, {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
            })
            gsap.to(node, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.45,
              ease: "back.out(2.1)",
            })
          },
        })
      })

      ScrollTrigger.refresh()
    }, root)

    return () => context.revert()
  }, [])

  return (
    <ol
      ref={rootRef}
      className="relative max-w-3xl"
      aria-label="Experiencia laboral"
    >
      <div
        className="absolute top-2 bottom-2 left-1.75 w-px overflow-hidden bg-border"
        aria-hidden="true"
      >
        <div
          data-experience-fill
          className="h-full w-full origin-top bg-linear-to-b from-primary to-primary-soft"
        />
      </div>

      {stages.map((stage) => (
        <li
          key={`${stage.company}-${stage.start}`}
          data-experience-item
          className="relative flex gap-6 pb-10 last:pb-0 sm:gap-8 sm:pb-12"
        >
          <div
            data-experience-node
            className="relative z-10 mt-1.5 size-3.75 shrink-0"
          >
            {stage.current && (
              <span
                className="absolute inset-0 rounded-full bg-primary/35 motion-safe:animate-ping"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "absolute inset-0 rounded-full border-2 border-background shadow-[0_0_0_1px_var(--primary)]",
                stage.current ? "bg-primary" : "bg-background"
              )}
              aria-hidden="true"
            />
          </div>

          <article
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6",
              stage.current &&
                "border-primary/25 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_12%,transparent)]"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">
                <span
                  className="icon-[tabler--calendar] size-3 bg-current"
                  aria-hidden="true"
                />
                <span>
                  {stage.start} — {stage.end}
                </span>
              </Badge>
              {stage.current && <Badge>Actual</Badge>}
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold tracking-tight text-balance">
                {stage.title}
              </h3>
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <span
                  className="icon-[tabler--building] size-3.5 bg-current"
                  aria-hidden="true"
                />
                {stage.company}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              {stage.description}
            </p>
          </article>
        </li>
      ))}
    </ol>
  )
}

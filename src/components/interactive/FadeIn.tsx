import { useLayoutEffect, useRef, type ReactNode } from "react"
import gsap from "gsap"

import { prefersReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

type FadeInProps = {
  children: ReactNode
  className?: string
}

export function FadeIn({ children, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) {
      return
    }

    const context = gsap.context(() => {
      gsap.from(root.children, {
        autoAlpha: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
      })
    }, root)

    return () => context.revert()
  }, [])

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  )
}

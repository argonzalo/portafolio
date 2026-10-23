import gsap from "gsap"

import { prefersReducedMotion } from "@/lib/motion"

const COMPACT_AFTER = 36
const DURATION = 0.65
const EASE = "power3.inOut"
const EDGE_INSET = 24
const COMPACT_PADDING_X = 16
const MIN_COMPACT_DESKTOP = 500

let compact = false
let tween: gsap.core.Tween | null = null
let sectionObserver: IntersectionObserver | null = null
let listenersBound = false

function getBar() {
  return document.querySelector<HTMLElement>("[data-app-bar]")
}

function getRoot() {
  return document.querySelector<HTMLElement>("[data-app-bar-root]")
}

function compactPaddingX() {
  return window.matchMedia("(min-width: 640px)").matches
    ? COMPACT_PADDING_X
    : 12
}

function measureHugWidth(bar: HTMLElement) {
  const inner =
    bar.querySelector<HTMLElement>("[data-app-bar-inner]") ?? bar
  const styles = getComputedStyle(inner)
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0
  const children = Array.from(inner.children) as HTMLElement[]
  const contentWidth = children.reduce((total, child, index) => {
    return total + child.getBoundingClientRect().width + (index > 0 ? gap : 0)
  }, 0)

  const hugged = Math.ceil(contentWidth + compactPaddingX() * 2 + 2)
  const isDesktop = window.matchMedia("(min-width: 768px)").matches
  const withFloor = isDesktop ? Math.max(hugged, MIN_COMPACT_DESKTOP) : hugged

  return Math.min(withFloor, window.innerWidth - EDGE_INSET)
}

function setCompactAttrs(next: boolean) {
  const bar = getBar()
  const root = getRoot()
  if (!bar || !root) {
    return
  }

  bar.dataset.compact = String(next)
  root.dataset.compact = String(next)
}

function animateBar(next: boolean, immediate: boolean) {
  const bar = getBar()
  if (!bar) {
    return
  }

  compact = next
  setCompactAttrs(next)

  const vars = next
    ? { width: measureHugWidth(bar) }
    : { width: "100%" }

  tween?.kill()

  if (prefersReducedMotion() || immediate) {
    gsap.set(bar, vars)
    return
  }

  tween = gsap.to(bar, {
    ...vars,
    duration: DURATION,
    ease: EASE,
    overwrite: "auto",
  })
}

function syncCompact(immediate = false) {
  const next = window.scrollY > COMPACT_AFTER
  if (next === compact && !immediate) {
    return
  }

  animateBar(next, immediate)
}

function setActiveSection(id: string | null) {
  const bar = getBar()
  if (!bar) {
    return
  }

  const links = bar.querySelectorAll<HTMLAnchorElement>("[data-section]")
  for (const link of links) {
    const active = Boolean(id) && link.dataset.section === id
    link.toggleAttribute("data-active", active)

    if (active) {
      link.setAttribute("aria-current", "location")
    } else {
      link.removeAttribute("aria-current")
    }
  }
}

function observeSections() {
  const bar = getBar()
  if (!bar) {
    return
  }

  sectionObserver?.disconnect()

  const links = Array.from(
    bar.querySelectorAll<HTMLAnchorElement>("[data-section]")
  )
  const sections = links
    .map((link) => document.getElementById(link.dataset.section ?? ""))
    .filter((section): section is HTMLElement => Boolean(section))

  if (sections.length === 0) {
    setActiveSection(null)
    return
  }

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      const id = visible[0]?.target.id
      if (id) {
        setActiveSection(id)
      }
    },
    {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0, 0.25, 0.5, 0.75],
    }
  )

  for (const section of sections) {
    sectionObserver.observe(section)
  }

  const hash = window.location.hash.slice(1)
  if (hash) {
    setActiveSection(hash)
  }
}

export function initAppBar() {
  const bar = getBar()
  if (!bar) {
    return
  }

  if (!listenersBound) {
    listenersBound = true
    compact = window.scrollY > COMPACT_AFTER
    animateBar(compact, true)

    window.addEventListener(
      "scroll",
      () => {
        syncCompact(false)
      },
      { passive: true }
    )

    window.addEventListener("resize", () => {
      if (!compact) {
        return
      }

      const currentBar = getBar()
      if (!currentBar) {
        return
      }

      gsap.set(currentBar, { width: measureHugWidth(currentBar) })
    })

    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.slice(1)
      setActiveSection(hash || null)
    })
  } else {
    syncCompact(true)
  }

  observeSections()
}

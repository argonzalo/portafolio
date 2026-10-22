const COMPACT_ENTER = 96
const COMPACT_EXIT = 16
const TRANSITION_MS = 340

let compact = false
let locked = false
let ticking = false
let lockTimer = 0
let listenersBound = false

function getBar() {
  return document.querySelector<HTMLElement>("[data-case-bar]")
}

function shouldBeCompact(y: number) {
  return compact ? y > COMPACT_EXIT : y > COMPACT_ENTER
}

function applyCompact(next: boolean) {
  const bar = getBar()
  if (!bar || next === compact) {
    return
  }

  compact = next
  bar.dataset.compact = String(next)
  locked = true

  window.clearTimeout(lockTimer)
  lockTimer = window.setTimeout(() => {
    locked = false
    syncCompact()
  }, TRANSITION_MS)
}

function syncCompact() {
  if (locked) {
    return
  }

  applyCompact(shouldBeCompact(window.scrollY))
}

function onScroll() {
  if (ticking) {
    return
  }

  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    syncCompact()
  })
}

/** Compacta la barra del caso al hacer scroll (View Transitions: re-init en page-load). */
export function initCaseBar() {
  const bar = getBar()
  window.clearTimeout(lockTimer)
  locked = false

  if (!bar) {
    compact = false
    return
  }

  compact = window.scrollY > COMPACT_ENTER
  bar.dataset.compact = String(compact)

  if (listenersBound) {
    return
  }

  listenersBound = true
  window.addEventListener("scroll", onScroll, { passive: true })
}

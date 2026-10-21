import { useEffect, useRef } from "react"

import type { ProjectImage } from "@/lib/projects"

const MIN_SCALE = 1
const MAX_SCALE = 4
const SWIPE_DISTANCE = 56
const TAP_SLOP = 10

type LightboxStageProps = {
  image: ProjectImage
  canNavigate: boolean
  onPrev: () => void
  onNext: () => void
  onClose: () => void
}

type Point = { x: number; y: number }

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function touchPoint(touch: Touch): Point {
  return { x: touch.clientX, y: touch.clientY }
}

export function LightboxStage({
  image,
  canNavigate,
  onPrev,
  onNext,
  onClose,
}: LightboxStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const transform = useRef({ scale: 1, x: 0, y: 0 })
  const gesture = useRef({
    mode: "idle" as "idle" | "swipe" | "pan" | "pinch",
    start: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    lastMid: { x: 0, y: 0 },
    lastDist: 0,
    origin: { scale: 1, x: 0, y: 0 },
    moved: false,
  })
  const suppressClick = useRef(false)
  const actions = useRef({ onPrev, onNext, onClose, canNavigate })
  actions.current = { onPrev, onNext, onClose, canNavigate }

  function apply(animated = false) {
    const el = imageRef.current
    if (!el) {
      return
    }

    const { scale, x, y } = transform.current
    el.style.transition = animated ? "transform 0.28s ease-out" : "none"
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  }

  function clampPan() {
    const stage = stageRef.current
    const el = imageRef.current
    const next = transform.current
    if (!stage || !el || next.scale <= 1) {
      next.x = 0
      next.y = 0
      return
    }

    const maxX = Math.max(0, (el.offsetWidth * next.scale - stage.clientWidth) / 2)
    const maxY = Math.max(
      0,
      (el.offsetHeight * next.scale - stage.clientHeight) / 2
    )
    next.x = Math.min(maxX, Math.max(-maxX, next.x))
    next.y = Math.min(maxY, Math.max(-maxY, next.y))
  }

  function reset(animated = false) {
    transform.current = { scale: 1, x: 0, y: 0 }
    apply(animated)
  }

  function markGesture() {
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 400)
  }

  useEffect(() => {
    reset()
  }, [image.src])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) {
      return
    }

    function onTouchStart(event: TouchEvent) {
      const state = gesture.current
      const current = transform.current

      if (event.touches.length === 2) {
        event.preventDefault()
        const a = touchPoint(event.touches[0])
        const b = touchPoint(event.touches[1])
        state.mode = "pinch"
        state.lastDist = distance(a, b)
        state.lastMid = midpoint(a, b)
        state.origin = { ...current }
        state.moved = true
        return
      }

      if (event.touches.length === 1) {
        const point = touchPoint(event.touches[0])
        state.mode = current.scale > 1 ? "pan" : "swipe"
        state.start = point
        state.last = point
        state.origin = { ...current }
        state.moved = false
      }
    }

    function onTouchMove(event: TouchEvent) {
      const state = gesture.current
      const current = transform.current

      if (event.touches.length >= 2) {
        event.preventDefault()
        const a = touchPoint(event.touches[0])
        const b = touchPoint(event.touches[1])
        const dist = distance(a, b)
        const mid = midpoint(a, b)
        const stageBox = stage.getBoundingClientRect()
        const cx = stageBox.left + stageBox.width / 2
        const cy = stageBox.top + stageBox.height / 2

        if (state.mode !== "pinch") {
          state.mode = "pinch"
          state.lastDist = dist
          state.lastMid = mid
          state.origin = { ...current }
        }

        if (state.lastDist === 0) {
          state.lastDist = dist
        }

        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, current.scale * (dist / state.lastDist))
        )
        const ratio = nextScale / current.scale
        current.x = current.x * ratio + (mid.x - cx) * (1 - ratio) + (mid.x - state.lastMid.x)
        current.y = current.y * ratio + (mid.y - cy) * (1 - ratio) + (mid.y - state.lastMid.y)
        current.scale = nextScale
        state.lastDist = dist
        state.lastMid = mid
        state.moved = true
        clampPan()
        apply()
        return
      }

      if (event.touches.length !== 1 || state.mode === "idle") {
        return
      }

      const point = touchPoint(event.touches[0])
      const dx = point.x - state.start.x
      const dy = point.y - state.start.y
      if (Math.hypot(dx, dy) > TAP_SLOP) {
        state.moved = true
      }

      if (state.mode === "pinch") {
        state.mode = current.scale > 1 ? "pan" : "swipe"
        state.start = point
        state.origin = { ...current }
      }

      if (state.mode === "pan") {
        event.preventDefault()
        current.x = state.origin.x + (point.x - state.start.x)
        current.y = state.origin.y + (point.y - state.start.y)
        clampPan()
        apply()
        return
      }

      if (state.mode === "swipe" && actions.current.canNavigate) {
        event.preventDefault()
        current.x = dx
        current.y = 0
        apply()
      }

      state.last = point
    }

    function onTouchEnd(event: TouchEvent) {
      const state = gesture.current
      const current = transform.current

      if (event.touches.length >= 2) {
        return
      }

      if (event.touches.length === 1) {
        const point = touchPoint(event.touches[0])
        state.mode = current.scale > 1 ? "pan" : "swipe"
        state.start = point
        state.origin = { ...current }
        return
      }

      if (state.mode === "pinch") {
        if (current.scale < 1.05) {
          reset(true)
        } else {
          clampPan()
          apply(true)
        }
        markGesture()
        state.mode = "idle"
        return
      }

      if (state.mode === "pan") {
        clampPan()
        apply(true)
        markGesture()
        state.mode = "idle"
        return
      }

      if (state.mode === "swipe") {
        const dx = state.last.x - state.start.x
        const dy = state.last.y - state.start.y

        if (state.moved) {
          markGesture()
        }

        if (
          actions.current.canNavigate &&
          Math.abs(dx) >= SWIPE_DISTANCE &&
          Math.abs(dx) > Math.abs(dy)
        ) {
          reset()
          if (dx < 0) {
            actions.current.onNext()
          } else {
            actions.current.onPrev()
          }
        } else if (!state.moved && event.target !== imageRef.current) {
          actions.current.onClose()
        } else {
          reset(true)
        }

        state.mode = "idle"
      }
    }

    stage.addEventListener("touchstart", onTouchStart, { passive: false })
    stage.addEventListener("touchmove", onTouchMove, { passive: false })
    stage.addEventListener("touchend", onTouchEnd)
    stage.addEventListener("touchcancel", onTouchEnd)

    return () => {
      stage.removeEventListener("touchstart", onTouchStart)
      stage.removeEventListener("touchmove", onTouchMove)
      stage.removeEventListener("touchend", onTouchEnd)
      stage.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [])

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-4 pb-6"
      onClick={(event) => {
        if (suppressClick.current) {
          event.stopPropagation()
          return
        }

        if (event.target === imageRef.current) {
          event.stopPropagation()
        }
      }}
    >
      <img
        ref={imageRef}
        src={image.src}
        alt={image.alt}
        draggable={false}
        className="max-h-full max-w-full rounded-xl object-contain shadow-2xl select-none"
      />
    </div>
  )
}

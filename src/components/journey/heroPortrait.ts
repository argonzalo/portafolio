import gsap from "gsap"

/**
 * Retrato fragmentado del hero.
 *
 * La foto se corta en una malla de triángulos (determinista, sin `Math.random`)
 * que se dibuja en un `<canvas>` 2D. Cada fragmento:
 * - se ensambla una sola vez al cargar (único momento orquestado del hero);
 * - se dispersa de forma reversible con el scroll del capítulo;
 * - es atraído levemente por el cursor (magnetismo) y deja ver sus juntas.
 *
 * Con `prefers-reduced-motion` se queda la `<img>` estática y no hay listeners.
 */

type Shard = {
  /** Vértices en coordenadas normalizadas 0..1. */
  a: [number, number]
  b: [number, number]
  c: [number, number]
  cx: number
  cy: number
  /** Dirección radial normalizada desde el centro del retrato. */
  dx: number
  dy: number
  /** Semilla 0..1 por fragmento (amplitud, giro, fase). */
  seed: number
}

type PortraitState = {
  intro: number
  scroll: number
  pointerX: number
  pointerY: number
  magnet: number
}

const THREAD_RGB = "145, 186, 255"

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function alphaAt(data: Uint8ClampedArray, size: number, x: number, y: number) {
  const px = Math.min(size - 1, Math.max(0, Math.round(x * (size - 1))))
  const py = Math.min(size - 1, Math.max(0, Math.round(y * (size - 1))))
  return data[(py * size + px) * 4 + 3]
}

function buildShards(image: HTMLImageElement, divisions: number): Shard[] {
  const random = mulberry32(7741)
  const n = divisions
  const grid: [number, number][][] = []
  for (let row = 0; row <= n; row++) {
    const line: [number, number][] = []
    for (let col = 0; col <= n; col++) {
      const edge = row === 0 || col === 0 || row === n || col === n
      const jitter = edge ? 0 : 0.36 / n
      line.push([
        col / n + (random() - 0.5) * 2 * jitter,
        row / n + (random() - 0.5) * 2 * jitter,
      ])
    }
    grid.push(line)
  }

  // Muestra de alfa para descartar fragmentos completamente transparentes.
  const probeSize = 96
  const probe = document.createElement("canvas")
  probe.width = probeSize
  probe.height = probeSize
  const probeCtx = probe.getContext("2d", { willReadFrequently: true })
  let alpha: Uint8ClampedArray | null = null
  if (probeCtx) {
    probeCtx.drawImage(image, 0, 0, probeSize, probeSize)
    alpha = probeCtx.getImageData(0, 0, probeSize, probeSize).data
  }

  const shards: Shard[] = []
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const p00 = grid[row][col]
      const p10 = grid[row][col + 1]
      const p01 = grid[row + 1][col]
      const p11 = grid[row + 1][col + 1]
      const flip = (row + col) % 2 === 0
      const tris: [number, number][][] = flip
        ? [
            [p00, p10, p11],
            [p00, p11, p01],
          ]
        : [
            [p00, p10, p01],
            [p10, p11, p01],
          ]
      for (const [a, b, c] of tris) {
        const cx = (a[0] + b[0] + c[0]) / 3
        const cy = (a[1] + b[1] + c[1]) / 3
        if (alpha) {
          const visible = [a, b, c, [cx, cy] as [number, number]].some(
            ([x, y]) => alphaAt(alpha, probeSize, x, y) > 8
          )
          if (!visible) continue
        }
        const vx = cx - 0.5
        const vy = cy - 0.5
        const len = Math.hypot(vx, vy) || 1
        shards.push({
          a,
          b,
          c,
          cx,
          cy,
          dx: vx / len,
          dy: vy / len,
          seed: random(),
        })
      }
    }
  }
  return shards
}

function mountPortrait(figure: HTMLElement): () => void {
  const image = figure.querySelector("img")
  const canvas = figure.querySelector("canvas")
  const hero = document.querySelector<HTMLElement>("#hero")
  if (!image || !canvas || !hero) return () => {}
  const ctx = canvas.getContext("2d")
  if (!ctx) return () => {}

  const state: PortraitState = {
    intro: 1,
    scroll: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    magnet: 0,
  }
  const target = { scroll: 0, pointerX: 0.5, pointerY: 0.5, magnet: 0 }

  let shards: Shard[] = []
  let size = 0
  let dpr = 1
  let visible = true
  let dirty = true
  let disposed = false
  const timeOrigin = gsap.ticker.time

  const resize = () => {
    if (!image.complete || !image.naturalWidth) return
    const rect = figure.getBoundingClientRect()
    size = Math.max(1, Math.round(rect.width))
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size * 1.5 * dpr)
    canvas.height = Math.round(size * 1.5 * dpr)
    const coarse = window.matchMedia("(pointer: coarse)").matches
    shards = buildShards(image, coarse || size < 320 ? 5 : 7)
    dirty = true
  }

  const readScroll = () => {
    const rect = hero.getBoundingClientRect()
    const travel = Math.max(1, rect.height * 0.75)
    target.scroll = Math.min(1, Math.max(0, -rect.top / travel))
  }

  const onPointer = (event: PointerEvent) => {
    const rect = figure.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    target.pointerX = x
    target.pointerY = y
    // Zona de influencia: el retrato más un margen generoso.
    const inside = x > -0.25 && x < 1.25 && y > -0.25 && y < 1.25
    target.magnet = inside && event.pointerType !== "touch" ? 1 : 0
  }
  const onLeave = () => {
    target.magnet = 0
  }

  const draw = () => {
    const s = size
    const t = gsap.ticker.time - timeOrigin
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, s * 1.5, s * 1.5)
    ctx.translate(s * 0.25, s * 0.25)

    // Las juntas siguen visibles en reposo: el retrato conserva su identidad
    // fragmentada antes de que el scroll o el cursor separen más las piezas.
    const scatter = Math.max(state.intro, state.scroll * state.scroll)

    const radius = 0.24
    for (const shard of shards) {
      // Dispersión radial (intro + scroll) con giro propio.
      // Un núcleo estable mantiene ojos/nariz/boca ensamblados. El corte se
      // abre progresivamente hacia el contorno, con más vuelo en los laterales.
      const distance = Math.hypot((shard.cx - 0.5) * 1.2, shard.cy - 0.47)
      const edge = gsap.utils.clamp(0, 1, (distance - 0.23) / 0.25)
      const touchesFace = [shard.a, shard.b, shard.c].some(
        ([x, y]) => x > 0.35 && x < 0.65 && y > 0.2 && y < 0.78
      )
      const fringe = edge * edge * (touchesFace ? 0.02 : 1)
      const energy = 0.16 * fringe + scatter * (0.035 + fringe * 0.48)
      const reach = energy * (0.6 + shard.seed * 0.7)
      let ox = shard.dx * reach * (1 + fringe * 0.9)
      let oy = shard.dy * reach * 0.65
      let rot = energy * (shard.seed - 0.5) * 1.8
      let scale = 1 - energy * 0.3 * shard.seed

      // Magnetismo: el fragmento se acerca al cursor y se eleva.
      let lift = 0
      if (state.magnet > 0.001) {
        const vx = state.pointerX - shard.cx
        const vy = state.pointerY - shard.cy
        const dist = Math.hypot(vx, vy)
        const falloff =
          Math.exp(-((dist / radius) ** 2)) *
          state.magnet *
          (0.06 + fringe * 0.94)
        const pull = Math.min(dist, 0.07) * falloff
        if (dist > 0.0001) {
          ox += (vx / dist) * pull
          oy += (vy / dist) * pull
        }
        rot += falloff * (shard.seed - 0.5) * 0.35
        scale += falloff * 0.06
        lift = falloff
      }

      // Respiración mínima solo mientras el retrato está activo.
      const breathe = (lift + state.intro) * 0.004
      ox += Math.sin(t * 1.3 + shard.seed * 12) * breathe
      oy += Math.cos(t * 1.1 + shard.seed * 9) * breathe

      const alpha = 1 - Math.min(1, energy * (0.35 + shard.seed * 0.75))
      if (alpha <= 0.01) continue

      const cx = shard.cx * s
      const cy = shard.cy * s
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(cx + ox * s, cy + oy * s)
      ctx.rotate(rot)
      ctx.scale(scale, scale)
      ctx.translate(-cx, -cy)

      // Clip apenas expandido para que no aparezcan juntas en reposo.
      const grow = 0.6
      ctx.beginPath()
      for (const [i, [px, py]] of [shard.a, shard.b, shard.c].entries()) {
        const x = px * s
        const y = py * s
        const ex = x - cx
        const ey = y - cy
        const el = Math.hypot(ex, ey) || 1
        const gx = x + (ex / el) * grow
        const gy = y + (ey / el) * grow
        if (i === 0) ctx.moveTo(gx, gy)
        else ctx.lineTo(gx, gy)
      }
      ctx.closePath()
      ctx.save()
      ctx.clip()
      ctx.drawImage(image, 0, 0, s, s)
      ctx.restore()

      const seam = Math.min(1, lift * 0.9 + energy * 1.6)
      if (seam > 0.02) {
        ctx.lineWidth = 0.75
        ctx.strokeStyle = `rgba(${THREAD_RGB}, ${0.55 * seam})`
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  const tick = () => {
    if (disposed || !visible) return
    readScroll()
    const k = 0.14
    const before =
      state.scroll +
      state.pointerX +
      state.pointerY +
      state.magnet +
      state.intro
    state.scroll += (target.scroll - state.scroll) * 0.2
    state.pointerX += (target.pointerX - state.pointerX) * k
    state.pointerY += (target.pointerY - state.pointerY) * k
    state.magnet += (target.magnet - state.magnet) * 0.09
    const after =
      state.scroll +
      state.pointerX +
      state.pointerY +
      state.magnet +
      state.intro
    const moving = Math.abs(after - before) > 0.00005
    const animated = state.magnet > 0.002 || state.intro > 0.001
    if (!visible || (!moving && !animated && !dirty)) return
    dirty = false
    draw()
  }

  const ready = () => {
    if (disposed) return
    resize()
    figure.dataset.portraitReady = ""
    gsap.to(state, {
      intro: 0,
      duration: 1.6,
      ease: "expo.out",
      delay: 0.15,
    })
    gsap.ticker.add(tick)
  }

  const resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(figure)
  const visibility = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true
      dirty = true
    },
    { rootMargin: "120px" }
  )
  visibility.observe(figure)
  window.addEventListener("pointermove", onPointer, { passive: true })
  document.documentElement.addEventListener("pointerleave", onLeave)

  if (image.complete && image.naturalWidth > 0) ready()
  else image.addEventListener("load", ready, { once: true })

  return () => {
    disposed = true
    gsap.ticker.remove(tick)
    gsap.killTweensOf(state)
    resizeObserver.disconnect()
    visibility.disconnect()
    window.removeEventListener("pointermove", onPointer)
    document.documentElement.removeEventListener("pointerleave", onLeave)
    image.removeEventListener("load", ready)
    delete figure.dataset.portraitReady
  }
}

let cleanup: (() => void) | undefined

function mountHero() {
  cleanup?.()
  cleanup = undefined
  const figure = document.querySelector<HTMLElement>("[data-hero-portrait]")
  if (!figure) return
  const media = gsap.matchMedia()
  media.add("(prefers-reduced-motion: no-preference)", () =>
    mountPortrait(figure)
  )
  cleanup = () => media.revert()
}

document.addEventListener("astro:page-load", mountHero)
document.addEventListener("astro:before-swap", () => cleanup?.())
mountHero()

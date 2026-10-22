import { useEffect, useState } from "react"
import { useThree } from "@react-three/fiber"
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  TextureLoader,
  VideoTexture,
  type Texture,
} from "three"

/* -------------------------------------------------------------------------- */
/*  Caché con conteo de referencias (las capturas pesan ~9 MB de VRAM c/u)     */
/* -------------------------------------------------------------------------- */

type Entry = {
  promise: Promise<Texture>
  texture: Texture | null
  video: HTMLVideoElement | null
  refs: number
  disposeTimer: number | null
}

const cache = new Map<string, Entry>()
const loader = new TextureLoader()
const VIDEO_RE = /\.(mp4|webm|m4v|mov)(\?.*)?$/i

export function isVideoSource(src: string): boolean {
  return VIDEO_RE.test(src)
}

function loadVideo(src: string, entry: Entry): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.src = src
    video.crossOrigin = "anonymous"
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = "auto"
    video.setAttribute("playsinline", "")
    entry.video = video
    const onReady = () => {
      video.removeEventListener("loadeddata", onReady)
      const texture = new VideoTexture(video)
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearFilter
      texture.generateMipmaps = false
      void video.play().catch(() => undefined)
      resolve(texture)
    }
    video.addEventListener("loadeddata", onReady)
    video.addEventListener("error", () => reject(new Error(`No se pudo cargar ${src}`)), {
      once: true,
    })
    video.load()
  })
}

function acquire(src: string, anisotropy: number): Entry {
  const existing = cache.get(src)
  if (existing) {
    existing.refs += 1
    if (existing.disposeTimer !== null) {
      window.clearTimeout(existing.disposeTimer)
      existing.disposeTimer = null
      if (existing.video) void existing.video.play().catch(() => undefined)
    }
    return existing
  }

  const entry: Entry = {
    promise: Promise.resolve(null as unknown as Texture),
    texture: null,
    video: null,
    refs: 1,
    disposeTimer: null,
  }
  entry.promise = (
    isVideoSource(src)
      ? loadVideo(src, entry)
      : loader.loadAsync(src).then((texture) => {
          texture.colorSpace = SRGBColorSpace
          texture.anisotropy = anisotropy
          texture.minFilter = LinearMipmapLinearFilter
          texture.generateMipmaps = true
          return texture
        })
  ).then((texture) => {
    entry.texture = texture
    return texture
  })
  cache.set(src, entry)
  return entry
}

function release(src: string) {
  const entry = cache.get(src)
  if (!entry) return
  entry.refs -= 1
  if (entry.refs > 0) return
  entry.video?.pause()
  entry.disposeTimer = window.setTimeout(() => {
    if (entry.refs > 0) return
    entry.texture?.dispose()
    if (entry.video) {
      entry.video.removeAttribute("src")
      entry.video.load()
    }
    cache.delete(src)
  }, 2000)
}

/**
 * Carga una captura (`.webp`, `.png`, `.jpg`) o un video (`.mp4`, `.webm`)
 * como textura de pantalla **sin suspender** (no exige `<Suspense>`): devuelve
 * `null` mientras carga y la pantalla se muestra apagada.
 *
 * Las texturas se comparten entre dispositivos y se liberan de la GPU cuando
 * ninguna escena las usa (con 2 s de gracia para transiciones).
 */
export function useScreenTexture(src: string | undefined): Texture | null {
  const gl = useThree((state) => state.gl)
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    if (!src) return
    let alive = true
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const entry = acquire(src, anisotropy)
    if (entry.texture) {
      const ready = entry.texture
      queueMicrotask(() => {
        if (alive) setTexture(ready)
      })
    } else {
      entry.promise
        .then((loaded) => {
          if (alive) setTexture(loaded)
        })
        .catch((error: unknown) => {
          console.warn("[kit/devices]", error)
        })
    }
    return () => {
      alive = false
      setTexture(null)
      release(src)
    }
  }, [src, gl])

  return src ? texture : null
}

/** Relación de aspecto (ancho/alto) del contenido de una textura. */
export function getTextureAspect(texture: Texture): number {
  const image = texture.image as
    | { width?: number; height?: number; videoWidth?: number; videoHeight?: number }
    | undefined
  const width = image?.videoWidth || image?.width || 1
  const height = image?.videoHeight || image?.height || 1
  return width / height
}

/** `cover` recorta sin deformar; `stretch` estira (solo para UI generada a medida). */
export type ScreenFit = "cover" | "stretch"
export type ScreenAlign = "top" | "center" | "bottom"

export type UvTransform = {
  repeat: [number, number]
  offset: [number, number]
}

/**
 * Calcula `repeat`/`offset` para encajar una captura en la pantalla sin
 * deformarla. `align` decide qué parte se conserva cuando la captura es más
 * alta que la pantalla (en móviles conviene `top`: se ve el header de la app).
 */
export function computeFitTransform(
  contentAspect: number,
  screenAspect: number,
  fit: ScreenFit,
  align: ScreenAlign
): UvTransform {
  if (fit === "stretch" || Math.abs(contentAspect - screenAspect) < 1e-3) {
    return { repeat: [1, 1], offset: [0, 0] }
  }
  let rx = 1
  let ry = 1
  if (contentAspect > screenAspect) rx = screenAspect / contentAspect
  else ry = contentAspect / screenAspect
  const ox = (1 - rx) / 2
  // v = 0 abajo (flipY): `top` conserva la franja superior.
  const oy = align === "top" ? 1 - ry : align === "bottom" ? 0 : (1 - ry) / 2
  return { repeat: [rx, ry], offset: [ox, oy] }
}

type LayerLayout = { x: number; y: number; width: number; height: number }

/**
 * Ubicación local (sobre la pantalla) de una región `[x, y, w, h]` normalizada
 * `0..1` respecto del área visible de la pantalla (origen arriba-izquierda).
 */
export function layoutLayerRect(
  rect: readonly [number, number, number, number],
  _transform: UvTransform,
  screenWidth: number,
  screenHeight: number
): LayerLayout {
  const [x, y, w, h] = rect
  const cu = x + w / 2
  const cv = 1 - y - h / 2
  return {
    x: (cu - 0.5) * screenWidth,
    y: (cv - 0.5) * screenHeight,
    width: w * screenWidth,
    height: h * screenHeight,
  }
}

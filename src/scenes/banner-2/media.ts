import { useContext, useEffect, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { SRGBColorSpace, VideoTexture } from "three"
import { experienceStore } from "@/experience/store"
import type { SceneProps } from "@/experience/types"
import { ramp } from "@/experience/choreography"
import { PresentationContext } from "@/experience/presentation"

export const CLIPS = [
  "bebidas-cafe-sirviendo-taza",
  "comida-hamburguesa-cebolla",
  "comida-pizza-caja",
  "cosmetica-crema-skincare",
  "deportes-futbol-playa",
  "deportes-surfistas-playa",
  "promo-black-friday-grafica",
  "perfumeria-perfume-spray",
] as const

export function videoBlend(progress: number, slot: number, isMobile: boolean) {
  const start = isMobile ? 0.3 + slot * 0.26 : 0.24 + slot * 0.13
  return ramp(progress, start, start + 0.16)
}

/** Only players participating in the current crossfade run; all are scene-owned. */
export function useBannerClips({ progress, active, isMobile }: SceneProps) {
  const count = isMobile ? 2 : 4
  const presentation = useContext(PresentationContext)
  const [textures, setTextures] = useState<(VideoTexture | null)[]>([])
  const resources = useRef<
    {
      video: HTMLVideoElement
      texture: VideoTexture
      playing: boolean
      blocked: boolean
      index: number
    }[]
  >([])
  useEffect(() => {
    const reduced = experienceStore.getSnapshot().reducedMotion
    if (reduced) return
    let alive = true
    const indices = Array.from({ length: count * 2 }, (_, i) =>
      i < count ? i : i - count + 4
    )
    const entries = indices.map((i) => {
      const clip = CLIPS[i]
      const video = document.createElement("video")
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.preload = "auto"
      video.dataset.bannerClip = clip
      const texture = new VideoTexture(video)
      texture.colorSpace = SRGBColorSpace
      const entry = { video, texture, playing: false, blocked: false, index: i }
      video.onloadeddata = () => {
        if (alive)
          setTextures((previous) => {
            const next = [...previous]
            next[i] = texture
            return next
          })
      }
      // Decode failures and blocked autoplay retain the WebP frame on the display.
      video.onerror = () => {
        entry.blocked = true
      }
      video.src = `/videos/banner/${clip}.mp4`
      video.load()
      return entry
    })
    resources.current = entries
    const pause = () => {
      if (!document.hidden) return
      for (const entry of entries) {
        entry.video.pause()
        entry.playing = false
      }
    }
    const retry = () => {
      for (const entry of entries) entry.blocked = false
    }
    document.addEventListener("visibilitychange", pause)
    window.addEventListener("pointerdown", retry)
    window.addEventListener("keydown", retry)
    return () => {
      alive = false
      resources.current = []
      document.removeEventListener("visibilitychange", pause)
      window.removeEventListener("pointerdown", retry)
      window.removeEventListener("keydown", retry)
      for (const { video, texture } of entries) {
        video.onloadeddata = null
        video.onerror = null
        video.pause()
        texture.dispose()
        video.removeAttribute("src")
        video.load()
      }
    }
  }, [count])
  useFrame(() => {
    resources.current.forEach((entry) => {
      const mix = videoBlend(progress.current, entry.index % 4, isMobile)
      const visible = entry.index < 4 ? mix < 0.999 : mix > 0.001
      const play =
        active &&
        (presentation?.current.opacity ?? 1) > 0.01 &&
        !document.hidden &&
        !experienceStore.getSnapshot().reducedMotion &&
        visible
      if (play === entry.playing || entry.blocked || entry.video.readyState < 2)
        return
      entry.playing = play
      if (play) {
        // All wall players restart on the same render frame, including reverse scroll.
        entry.video.currentTime = 0
        void entry.video.play().catch(() => {
          entry.blocked = true
          entry.playing = false
        })
      } else entry.video.pause()
    })
  })
  return textures
}

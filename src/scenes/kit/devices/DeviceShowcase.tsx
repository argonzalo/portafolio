import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Group, MathUtils } from "three"

import type { QualityTier } from "@/experience/types"
import { beatEnvelope } from "../cameraRig"
import type { KitPresetId, KitTheme } from "../theme"

import { Display } from "./Display"
import type { DeviceLayer } from "./DeviceScreen"
import { Laptop } from "./Laptop"
import { Phone } from "./Phone"
import type { DeviceFinish } from "./specs"

type PresetDeviceShowcase = {
  finish: DeviceFinish
  displayVariant: "monitor" | "signage"
  displayOrientation?: "landscape" | "portrait"
  phoneSrc: string
  laptopSrc: string
  displaySrc: string
  phoneLayers: readonly DeviceLayer[]
  laptopLayers: readonly DeviceLayer[]
  displayLayers: readonly DeviceLayer[]
}

const PRESET_DEVICE_SHOWCASE: Readonly<Record<KitPresetId, PresetDeviceShowcase>> =
  {
    vibo: {
      finish: "midnight",
      displayVariant: "monitor",
      phoneSrc: "/images/proyects/vibo/padel-video-analisis/3.webp",
      laptopSrc: "/images/proyects/vibo/padel-video-analisis/2.webp",
      displaySrc: "/images/proyects/vibo/padel-video-analisis/1.webp",
      phoneLayers: [
        {
          id: "vibo-phone-share",
          rect: [0.06, 0.43, 0.88, 0.24],
          depth: 0.14,
          scale: 1.05,
          accent: "#3D8BFF",
        },
        {
          id: "vibo-phone-players",
          rect: [0.08, 0.68, 0.84, 0.17],
          depth: 0.24,
          scale: 1.06,
          accent: "#F5C451",
          delay: 0.18,
        },
      ],
      laptopLayers: [
        {
          id: "vibo-laptop-pose",
          rect: [0.02, 0.56, 0.26, 0.26],
          depth: 0.26,
          scale: 1.06,
          accent: "#3D8BFF",
        },
        {
          id: "vibo-laptop-json",
          rect: [0.76, 0.26, 0.22, 0.39],
          depth: 0.42,
          scale: 1.05,
          accent: "#F5C451",
          delay: 0.16,
        },
      ],
      displayLayers: [
        {
          id: "vibo-display-center",
          rect: [0.36, 0.08, 0.28, 0.82],
          depth: 0.36,
          scale: 1.04,
          accent: "#3D8BFF",
        },
        {
          id: "vibo-display-shots",
          rect: [0.66, 0.24, 0.28, 0.64],
          depth: 0.56,
          scale: 1.05,
          accent: "#F5C451",
          delay: 0.2,
        },
      ],
    },
    pirp: {
      finish: "graphite",
      displayVariant: "monitor",
      phoneSrc: "/images/proyects/varios/pirp/1.webp",
      laptopSrc: "/images/proyects/varios/pirp/2.webp",
      displaySrc: "/images/proyects/varios/pirp/1.webp",
      phoneLayers: [
        {
          id: "pirp-phone-pulse",
          rect: [0.06, 0.06, 0.88, 0.14],
          depth: 0.16,
          scale: 1.05,
          accent: "#A8434F",
        },
        {
          id: "pirp-phone-feed",
          rect: [0.08, 0.52, 0.84, 0.28],
          depth: 0.28,
          scale: 1.06,
          accent: "#EFE9DD",
          delay: 0.15,
        },
      ],
      laptopLayers: [
        {
          id: "pirp-laptop-map",
          rect: [0.08, 0.14, 0.84, 0.34],
          depth: 0.28,
          scale: 1.05,
          accent: "#A8434F",
        },
        {
          id: "pirp-laptop-list",
          rect: [0.1, 0.54, 0.8, 0.32],
          depth: 0.42,
          scale: 1.05,
          accent: "#EFE9DD",
          delay: 0.18,
        },
      ],
      displayLayers: [
        {
          id: "pirp-display-hero",
          rect: [0.12, 0.14, 0.76, 0.36],
          depth: 0.32,
          scale: 1.04,
          accent: "#A8434F",
        },
        {
          id: "pirp-display-kpi",
          rect: [0.18, 0.56, 0.64, 0.28],
          depth: 0.48,
          scale: 1.05,
          accent: "#EFE9DD",
          delay: 0.2,
        },
      ],
    },
    naturalis: {
      finish: "silver",
      displayVariant: "monitor",
      phoneSrc: "/images/proyects/naturalis/app-web/2.webp",
      laptopSrc: "/images/proyects/naturalis/natuadmin/2.webp",
      displaySrc: "/images/proyects/naturalis/natuadmin/1.webp",
      phoneLayers: [
        {
          id: "nat-phone-booking",
          rect: [0.08, 0.16, 0.84, 0.24],
          depth: 0.15,
          scale: 1.05,
        },
        {
          id: "nat-phone-care",
          rect: [0.1, 0.46, 0.8, 0.22],
          depth: 0.26,
          scale: 1.05,
          delay: 0.16,
        },
      ],
      laptopLayers: [
        {
          id: "nat-laptop-agenda",
          rect: [0.18, 0.16, 0.22, 0.68],
          depth: 0.28,
          scale: 1.05,
        },
        {
          id: "nat-laptop-panel",
          rect: [0.42, 0.22, 0.4, 0.56],
          depth: 0.42,
          scale: 1.05,
          delay: 0.18,
        },
      ],
      displayLayers: [
        {
          id: "nat-display-space",
          rect: [0.16, 0.14, 0.68, 0.52],
          depth: 0.34,
          scale: 1.04,
        },
      ],
    },
    banner: {
      finish: "space-black",
      displayVariant: "signage",
      displayOrientation: "landscape",
      phoneSrc: "/images/proyects/banner-director/app-etiquetas/1.webp",
      laptopSrc: "/images/proyects/banner-director/banner-2/2.webp",
      displaySrc: "/images/proyects/banner-director/banner-2/1.webp",
      phoneLayers: [
        {
          id: "ban-phone-label",
          rect: [0.1, 0.18, 0.8, 0.26],
          depth: 0.14,
          scale: 1.05,
          accent: "#DA3E00",
        },
        {
          id: "ban-phone-queue",
          rect: [0.1, 0.5, 0.8, 0.3],
          depth: 0.26,
          scale: 1.06,
          accent: "#FFB5A0",
          delay: 0.16,
        },
      ],
      laptopLayers: [
        {
          id: "ban-laptop-editor",
          rect: [0.28, 0.14, 0.45, 0.56],
          depth: 0.3,
          scale: 1.05,
          accent: "#DA3E00",
        },
        {
          id: "ban-laptop-assets",
          rect: [0.24, 0.76, 0.56, 0.18],
          depth: 0.46,
          scale: 1.05,
          accent: "#FFB5A0",
          delay: 0.18,
        },
      ],
      displayLayers: [
        {
          id: "ban-display-screen",
          rect: [0.16, 0.08, 0.78, 0.28],
          depth: 0.36,
          scale: 1.04,
          accent: "#DA3E00",
        },
        {
          id: "ban-display-ticker",
          rect: [0.16, 0.4, 0.78, 0.3],
          depth: 0.52,
          scale: 1.05,
          accent: "#FFB5A0",
          delay: 0.2,
        },
      ],
    },
  }

export type DeviceShowcaseProps = {
  progress: { readonly current: number }
  quality: QualityTier
  isMobile: boolean
  theme: KitTheme
}

/**
 * Trío Phone + Laptop + Display para `/lab/kit` (beats 04–05).
 * Aparece con la curva/telemetry; en el beat de resultado despega capas de UI.
 */
export function DeviceShowcase({
  progress,
  quality,
  isMobile,
  theme,
}: DeviceShowcaseProps) {
  const groupRef = useRef<Group>(null)
  const preset = PRESET_DEVICE_SHOWCASE[theme.id]

  const power = () =>
    beatEnvelope(progress.current, 0.6, 0.67, 0.98, 1.02)
  const separation = () =>
    beatEnvelope(progress.current, 0.82, 0.88, 0.99, 1.02)

  useFrame(() => {
    const env = power()
    const group = groupRef.current
    if (!group) return
    group.visible = env > 0.02
    const s = (isMobile ? 0.94 : 1) * MathUtils.lerp(0.92, 1, env)
    group.scale.setScalar(s)
    const baseY = isMobile ? 1.82 : 0.12
    group.position.y = baseY + MathUtils.lerp(-0.12, 0, env)
    group.rotation.y = Math.sin(progress.current * Math.PI * 2) * 0.04
  })

  const phoneScale = isMobile ? 0.92 : 1.15
  const laptopScale = isMobile ? 0.38 : 0.52
  const displayScale = isMobile ? 0.25 : 0.34
  const lowTier = quality === "low"
  const displayLayers = lowTier ? preset.displayLayers.slice(0, 1) : preset.displayLayers
  const laptopLayers = lowTier ? preset.laptopLayers.slice(0, 1) : preset.laptopLayers
  const phoneLayers = lowTier ? preset.phoneLayers.slice(0, 1) : preset.phoneLayers

  return (
    <group
      ref={groupRef}
      position={isMobile ? [0, 1.85, 0.25] : [-1.15, 0.22, 0.15]}
      visible={false}
    >
      <Display
        quality={quality}
        finish={preset.finish}
        variant={preset.displayVariant}
        orientation={preset.displayOrientation}
        stand="studio"
        scale={displayScale}
        position={isMobile ? [0.0, 0.55, -0.95] : [-0.45, 0.35, -1.15]}
        rotation={[0, isMobile ? -0.05 : 0.18, 0]}
        screen={{
          src: preset.displaySrc,
          fit: "cover",
          align: "center",
          power,
          separation,
          layers: displayLayers,
          brightness: theme.scheme === "light" ? 1.02 : 1.1,
        }}
      />
      <Laptop
        quality={quality}
        finish={preset.finish}
        scale={laptopScale}
        position={isMobile ? [-0.42, 0.38, 0.18] : [0.05, 0.08, 0.22]}
        rotation={[0.05, isMobile ? 0.2 : 0.28, 0]}
        open={1}
        screen={{
          src: preset.laptopSrc,
          fit: "cover",
          align: "top",
          power,
          separation,
          layers: laptopLayers,
          brightness: theme.scheme === "light" ? 1.05 : 1.12,
        }}
      />
      <Phone
        quality={quality}
        finish={preset.finish}
        scale={phoneScale}
        position={isMobile ? [0.58, 0.85, 0.65] : [1.08, 0.92, 0.82]}
        rotation={[-0.08, isMobile ? -0.24 : -0.32, 0.04]}
        screen={{
          src: preset.phoneSrc,
          fit: "cover",
          align: "top",
          power,
          separation,
          layers: phoneLayers,
          brightness: theme.scheme === "light" ? 1.05 : 1.15,
        }}
      />
    </group>
  )
}

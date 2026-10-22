import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  NormalBlending,
  Points,
  ShaderMaterial,
} from "three"
import { experienceStore } from "@/experience/store"
import type { QualityTier } from "@/experience/types"
import type { Vec3Tuple } from "./cameraRig"

const PARTICLE_BUDGET: Record<Exclude<QualityTier, "static">, number> = {
  high: 720,
  medium: 360,
  low: 140,
}

const PARTICLE_VERTEX = /* glsl */ `
attribute vec3 aSeed;
attribute float aScale;

uniform float uTime;
uniform float uPixelRatio;
uniform float uBaseSize;
uniform vec3 uSpread;
uniform float uMode;

varying float vAlpha;
varying float vMix;

void main() {
  vec3 pos = position;

  if (uMode < 0.5) {
    // Modo 0: "stadium" (polvo suspendido bajo reflectores)
    pos.x += sin(uTime * 0.45 + aSeed.x * 6.2831) * 0.28;
    pos.y += cos(uTime * 0.35 + aSeed.y * 6.2831) * 0.22;
    pos.z += sin(uTime * 0.30 + aSeed.z * 6.2831) * 0.25;
  } else if (uMode < 1.5) {
    // Modo 1: "stream" (flujo direccional de señales / paquetes)
    float flow = fract(aSeed.x + uTime * (0.14 + aSeed.y * 0.12));
    pos.x = (flow - 0.5) * uSpread.x;
    pos.y += sin(flow * 6.2831 + aSeed.z * 6.2831) * 0.35;
  } else {
    // Modo 2: "calm" (ascenso orgánico lento)
    float rise = fract(aSeed.y + uTime * 0.06);
    pos.y = (rise - 0.35) * uSpread.y;
    pos.x += sin(uTime * 0.25 + aSeed.x * 6.2831) * 0.18;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float dist = max(-mvPosition.z, 1.2);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (uBaseSize * aScale * uPixelRatio) * (5.5 / dist);

  float pulse = 0.65 + 0.35 * sin(uTime * 1.6 + aSeed.z * 6.2831);
  vAlpha = pulse * smoothstep(24.0, 3.0, dist);
  vMix = aSeed.x;
}
`

const PARTICLE_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vAlpha;
varying float vMix;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;

  float core = exp(-d * d * 10.0);
  float halo = exp(-d * d * 2.6) * 0.45;
  vec3 col = mix(uColorA, uColorB, vMix);
  float alpha = clamp((core + halo) * vAlpha * uOpacity, 0.0, 0.9);

  gl_FragColor = vec4(col * (core * 1.2 + halo), alpha);
  #include <colorspace_fragment>
}
`

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function createParticleGeometry(
  count: number,
  spread: Vec3Tuple,
  center: Vec3Tuple
): BufferGeometry {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count * 3)
  const scales = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const r1 = pseudoRandom(i * 3 + 1)
    const r2 = pseudoRandom(i * 3 + 2)
    const r3 = pseudoRandom(i * 3 + 3)
    const r4 = pseudoRandom(i * 7 + 5)

    positions[i * 3] = center[0] + (r1 - 0.5) * spread[0]
    positions[i * 3 + 1] = center[1] + (r2 - 0.5) * spread[1]
    positions[i * 3 + 2] = center[2] + (r3 - 0.5) * spread[2]

    seeds[i * 3] = r1
    seeds[i * 3 + 1] = r2
    seeds[i * 3 + 2] = r3
    scales[i] = 0.55 + r4 * 0.95
  }

  const geo = new BufferGeometry()
  geo.setAttribute("position", new BufferAttribute(positions, 3))
  geo.setAttribute("aSeed", new BufferAttribute(seeds, 3))
  geo.setAttribute("aScale", new BufferAttribute(scales, 1))
  return geo
}

export type ParticleFieldProps = {
  quality: QualityTier
  progress?: { readonly current: number }
  color?: string
  secondaryColor?: string
  mode?: "stadium" | "stream" | "calm"
  spread?: Vec3Tuple
  center?: Vec3Tuple
  size?: number
  opacity?: number | ((progress: number) => number)
  scheme?: "dark" | "light"
}

/**
 * Campo de partículas GPU en un único draw call con presupuesto automático por nivel (`03` §2).
 */
export function ParticleField({
  quality,
  progress,
  color = "#3D8BFF",
  secondaryColor = "#F5C451",
  mode = "stadium",
  spread = [14, 7, 10],
  center = [0, 1.8, 0],
  size = 18,
  opacity = 0.65,
  scheme = "dark",
}: ParticleFieldProps) {
  const dpr = useThree((state) => state.viewport.dpr)
  const tier = quality === "static" ? "low" : quality
  const count = PARTICLE_BUDGET[tier]
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const timeRef = useRef(0)

  const geometry = useMemo(
    () => createParticleGeometry(count, spread, center),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, spread[0], spread[1], spread[2], center[0], center[1], center[2]]
  )

  const isLight = scheme === "light"
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: PARTICLE_VERTEX,
        fragmentShader: PARTICLE_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uBaseSize: { value: size },
          uSpread: { value: [...spread] },
          uMode: { value: mode === "stadium" ? 0 : mode === "stream" ? 1 : 2 },
          uColorA: { value: new Color(color) },
          uColorB: { value: new Color(secondaryColor) },
          uOpacity: { value: 0.65 },
        },
        transparent: true,
        depthWrite: false,
        blending: isLight ? NormalBlending : AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLight]
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    const pts = pointsRef.current
    const mat = pts?.material
    if (!pts || !mat) return

    const p = progress ? progress.current : 0.5
    const reducedMotion = experienceStore.getSnapshot().reducedMotion

    if (!reducedMotion) {
      timeRef.current += Math.min(delta, 0.05)
    } else {
      timeRef.current = p * 3.0
    }

    const resolvedOpacity =
      typeof opacity === "number"
        ? MathUtils.clamp(opacity, 0, 1)
        : MathUtils.clamp(opacity(p), 0, 1)

    mat.uniforms.uTime.value = timeRef.current
    mat.uniforms.uPixelRatio.value = dpr
    mat.uniforms.uBaseSize.value = size
    mat.uniforms.uMode.value =
      mode === "stadium" ? 0 : mode === "stream" ? 1 : 2
    mat.uniforms.uColorA.value.set(color)
    mat.uniforms.uColorB.value.set(secondaryColor)
    mat.uniforms.uOpacity.value = isLight
      ? resolvedOpacity * 0.55
      : resolvedOpacity

    pts.visible = resolvedOpacity > 0.01
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  )
}

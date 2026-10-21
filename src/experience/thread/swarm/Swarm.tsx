import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  Vector2,
} from "three"

import type { ThreadClock } from "../clock"
import {
  SWARM_PARTICLES,
  THREAD_PATH_GLSL,
  THREAD_STYLES,
  type RenderTier,
} from "../path"
import { useThreadExtent } from "../useThreadExtent"

/**
 * Opción C de ADR-006: enjambre de partículas.
 *
 * Todas las partículas viven en un único `Points` y su posición se calcula en
 * el vertex shader sobre la misma curva que el filamento. En Vibo una parte
 * del enjambre se condensa en la pelota; en la transición cada partícula cruza
 * con su propio retraso, se dispersa y se reordena como la señal de Pirp.
 *
 * Costo: 1 draw call, 0 triángulos; el riesgo es fill rate (overdraw aditivo)
 * en GPUs mobile, por eso la cantidad y el tamaño dependen del nivel.
 */

const VERTEX = /* glsl */ `
${THREAD_PATH_GLSL}

attribute float aU;
attribute vec3 aOffset;
attribute float aSeed;

uniform float uMix;
uniform float uFlow;
uniform float uTime;
uniform float uDraw;
uniform float uSize;
uniform float uPixelRatio;
uniform float uSpread;
uniform float uBallRadius;
uniform float uScatter;

varying float vEnergy;
varying float vAlpha;
varying float vMix;

void main() {
  // Cada partícula cruza con su propio retraso: el enjambre cambia en ola.
  float m = smoothstep(0.0, 1.0, clamp((uMix - aSeed * 0.45) / 0.55, 0.0, 1.0));
  float u = fract(aU + uFlow);

  vec3 dust = threadPath(u, m) + aOffset * uSpread * mix(1.0, 0.45, m);
  float energy = threadEnergy(u, m);
  float alpha = smoothstep(0.0, 0.04, u) * smoothstep(1.0, 0.96, u);

  float head = pulseCenter(0);
  float ball = step(fract(aSeed * 7.31), 0.28) * (1.0 - m);
  vec3 ballPosition = threadPath(head, m) + aOffset * uBallRadius;

  vec3 p = mix(dust, ballPosition, ball);
  energy = mix(energy, 0.75 * pulseWeight(0, m), ball);
  alpha = mix(alpha, pulseWeight(0, m), ball);
  alpha *= step(mix(u, head, ball), uDraw);

  float scatter = sin(THREAD_PI * m);
  vec3 drift = vec3(
    sin(aSeed * 91.7 + uTime * 1.3),
    cos(aSeed * 53.3 + uTime * 1.1),
    sin(aSeed * 27.1 + uTime * 0.9)
  );
  p += drift * scatter * uScatter;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = uSize * uPixelRatio * (0.55 + min(energy, 1.5) * 0.9) * (5.0 / -mvPosition.z);

  vEnergy = energy;
  vAlpha = alpha;
  vMix = m;
}
`

const FRAGMENT = /* glsl */ `
uniform vec3 uLineA;
uniform vec3 uLineB;
uniform vec3 uHeadA;
uniform vec3 uHeadB;
uniform float uGain;

varying float vEnergy;
varying float vAlpha;
varying float vMix;

void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0 || vAlpha <= 0.0) discard;

  float soft = exp(-d * d * 4.0);
  float energy = min(vEnergy, 1.5);
  vec3 line = mix(uLineA, uLineB, vMix);
  vec3 head = mix(uHeadA, uHeadB, vMix);
  vec3 color = mix(line, head, clamp(energy * 0.8, 0.0, 1.0));
  color *= (mix(0.22, 0.4, vMix) + energy) * soft * vAlpha * uGain;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`

/** PRNG con semilla: el enjambre es idéntico en cada carga (capturas comparables). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createSwarm(count: number): BufferGeometry {
  const random = mulberry32(0x0a08)
  const u = new Float32Array(count)
  const offset = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const position = new Float32Array(count * 3)

  // Suma de uniformes ≈ gaussiana: núcleo denso y bordes que se deshilachan.
  const spread = () => (random() + random() + random() - 1.5) / 1.5

  for (let i = 0; i < count; i += 1) {
    u[i] = random()
    offset[i * 3] = spread()
    offset[i * 3 + 1] = spread()
    offset[i * 3 + 2] = spread()
    seed[i] = random()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(position, 3))
  geometry.setAttribute("aU", new BufferAttribute(u, 1))
  geometry.setAttribute("aOffset", new BufferAttribute(offset, 3))
  geometry.setAttribute("aSeed", new BufferAttribute(seed, 1))

  return geometry
}

/** Brillo por partícula: con más partículas cada una aporta menos luz. */
const GAIN: Record<RenderTier, number> = {
  high: 0.32,
  medium: 0.45,
  low: 0.7,
}

type Props = {
  clock: ThreadClock
  tier: RenderTier
}

export function Swarm({ clock, tier }: Props) {
  const extent = useThreadExtent()
  const dpr = useThree((state) => state.viewport.dpr)
  const count = SWARM_PARTICLES[tier]
  const pointsRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)

  const geometry = useMemo(() => createSwarm(count), [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uPhase: { value: 0 },
          uExtent: { value: new Vector2(1, 1) },
          uMix: { value: 0 },
          uFlow: { value: 0 },
          uTime: { value: 0 },
          uDraw: { value: 0 },
          uSize: { value: 3 },
          uPixelRatio: { value: 1 },
          uSpread: { value: 0.07 },
          uBallRadius: { value: 0.09 },
          uScatter: { value: 0.5 },
          uGain: { value: GAIN.medium },
          uLineA: { value: new Color(THREAD_STYLES.vibo.line) },
          uLineB: { value: new Color(THREAD_STYLES.pirp.line) },
          uHeadA: { value: new Color(THREAD_STYLES.vibo.head) },
          uHeadB: { value: new Color(THREAD_STYLES.pirp.head) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    const uniforms = pointsRef.current?.material.uniforms
    if (!uniforms) return

    uniforms.uPhase.value = clock.phase
    uniforms.uMix.value = clock.mix
    uniforms.uFlow.value = clock.flow
    uniforms.uTime.value = clock.time
    uniforms.uDraw.value = clock.draw
    uniforms.uExtent.value.set(extent.x, extent.y)
    uniforms.uSize.value = extent.portrait ? 2.4 : 3.2
    uniforms.uPixelRatio.value = dpr
    uniforms.uSpread.value = 0.07 * extent.scale
    uniforms.uBallRadius.value = 0.09 * extent.scale
    uniforms.uScatter.value = 0.5 * extent.scale
    uniforms.uGain.value = GAIN[tier]
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      position-y={extent.offsetY}
      frustumCulled={false}
    />
  )
}

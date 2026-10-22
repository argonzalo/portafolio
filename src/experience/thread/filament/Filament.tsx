import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  Points,
  ShaderMaterial,
  Vector2,
} from "three"

import type { ThreadClock } from "../clock"
import {
  FILAMENT_SEGMENTS,
  THREAD_PATH_GLSL,
  THREAD_STYLES,
  type RenderTier,
} from "../path"
import { useThreadExtent } from "../useThreadExtent"

/**
 * Opción A de ADR-006: filamento de luz.
 *
 * Un listón (triangle strip indexado) cuya forma se calcula entera en el
 * vertex shader: la CPU solo actualiza uniforms. El brillo es falso (núcleo +
 * halo aditivo), sin postprocesado, para que valga igual en `low`.
 * La punta es un `Points` de un vértice: es el lugar natural del guía (`04` §7).
 *
 * Costo: 2 draw calls y `2 × segmentos` triángulos.
 */

const RIBBON_VERTEX = /* glsl */ `
${THREAD_PATH_GLSL}

attribute float aU;
attribute float aSide;

uniform float uMix;
uniform float uWidth;

varying float vSide;
varying float vEnergy;
varying float vU;

void main() {
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 p = threadPath(aU, m);
  // Tangente con paso amplio: en los picos de la señal la normal no se da vuelta.
  vec3 ahead = threadPath(min(aU + 0.006, 1.0), m);
  vec3 behind = threadPath(max(aU - 0.006, 0.0), m);
  vec2 tangent = normalize((ahead - behind).xy + 1e-5);
  vec2 normal = vec2(-tangent.y, tangent.x);

  float energy = threadEnergy(aU, m);
  p.xy += normal * aSide * uWidth * (1.0 + min(energy, 1.0) * mix(1.6, 0.7, m));

  vSide = aSide;
  vEnergy = energy;
  vU = aU;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const RIBBON_FRAGMENT = /* glsl */ `
uniform float uMix;
uniform float uDraw;
uniform vec3 uLineA;
uniform vec3 uLineB;
uniform vec3 uHeadA;
uniform vec3 uHeadB;

varying float vSide;
varying float vEnergy;
varying float vU;

void main() {
  if (vU > uDraw) discard;

  float m = smoothstep(0.0, 1.0, uMix);
  float d = abs(vSide);
  float core = exp(-d * d * 28.0);
  float halo = exp(-d * d * 3.5) * 0.45;
  float energy = min(vEnergy, 1.5);
  float base = mix(0.28, 0.55, m);
  float ends = smoothstep(0.0, 0.03, vU) * smoothstep(1.0, 0.97, vU);
  // Borde de dibujado: la línea se "enciende" al avanzar.
  float drawing = 1.0 + smoothstep(0.04, 0.0, uDraw - vU) * step(uDraw, 0.999) * 2.0;

  // El cruce pasa por el dorado de Vibo en lugar de un violeta de mezcla.
  vec3 line = mix(mix(uLineA, uLineB, m), uHeadA, sin(m * 3.14159) * 0.55);
  vec3 head = mix(uHeadA, uHeadB, m);
  vec3 color = line * (core + halo) * (base + energy) * drawing;
  color += head * core * energy * 1.2;

  gl_FragColor = vec4(color * ends, 1.0);
  #include <colorspace_fragment>
}
`

const HEAD_VERTEX = /* glsl */ `
${THREAD_PATH_GLSL}

uniform float uMix;
uniform float uSize;
uniform float uPixelRatio;

varying float vWeight;

void main() {
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 p = threadPath(pulseCenter(0), m);
  vWeight = pulseWeight(0, m);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * uPixelRatio * vWeight;
}
`

const HEAD_FRAGMENT = /* glsl */ `
uniform float uMix;
uniform vec3 uHeadA;
uniform vec3 uHeadB;

varying float vWeight;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;

  float core = exp(-d * d * 18.0);
  float halo = exp(-d * d * 3.0) * 0.35;
  vec3 head = mix(uHeadA, uHeadB, smoothstep(0.0, 1.0, uMix));

  gl_FragColor = vec4(head * (core * 1.4 + halo) * vWeight, 1.0);
  #include <colorspace_fragment>
}
`

function createRibbon(segments: number): BufferGeometry {
  const vertices = (segments + 1) * 2
  const u = new Float32Array(vertices)
  const side = new Float32Array(vertices)
  // Posición ficticia: el shader la calcula; three la necesita para el draw.
  const position = new Float32Array(vertices * 3)
  const index = new Uint16Array(segments * 6)

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments
    u[i * 2] = t
    u[i * 2 + 1] = t
    side[i * 2] = -1
    side[i * 2 + 1] = 1
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2
    index.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(position, 3))
  geometry.setAttribute("aU", new BufferAttribute(u, 1))
  geometry.setAttribute("aSide", new BufferAttribute(side, 1))
  geometry.setIndex(new BufferAttribute(index, 1))

  return geometry
}

function createHead(): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(3), 3))
  return geometry
}

function sharedUniforms() {
  return {
    uPhase: { value: 0 },
    uExtent: { value: new Vector2(1, 1) },
    uMix: { value: 0 },
    uHeadA: { value: new Color(THREAD_STYLES.vibo.head) },
    uHeadB: { value: new Color(THREAD_STYLES.pirp.head) },
  }
}

type Props = {
  clock: ThreadClock
  tier: RenderTier
}

export function Filament({ clock, tier }: Props) {
  const extent = useThreadExtent()
  const dpr = useThree((state) => state.viewport.dpr)
  const segments = FILAMENT_SEGMENTS[tier]
  const ribbonRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  const headRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)

  const ribbon = useMemo(() => createRibbon(segments), [segments])
  const head = useMemo(() => createHead(), [])

  const ribbonMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: RIBBON_VERTEX,
        fragmentShader: RIBBON_FRAGMENT,
        uniforms: {
          ...sharedUniforms(),
          uWidth: { value: 0.04 },
          uDraw: { value: 0 },
          uLineA: { value: new Color(THREAD_STYLES.vibo.line) },
          uLineB: { value: new Color(THREAD_STYLES.pirp.line) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        // El listón gira con la curva: según el tramo queda de frente o de espaldas.
        side: DoubleSide,
      }),
    []
  )

  const headMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: HEAD_VERTEX,
        fragmentShader: HEAD_FRAGMENT,
        uniforms: {
          ...sharedUniforms(),
          uSize: { value: 40 },
          uPixelRatio: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  )

  useEffect(() => () => ribbon.dispose(), [ribbon])

  useEffect(
    () => () => {
      head.dispose()
      ribbonMaterial.dispose()
      headMaterial.dispose()
    },
    [head, ribbonMaterial, headMaterial]
  )

  useFrame(() => {
    const line = ribbonRef.current?.material
    const tip = headRef.current?.material
    if (!line || !tip) return

    for (const material of [line, tip]) {
      material.uniforms.uPhase.value = clock.phase
      material.uniforms.uMix.value = clock.mix
      material.uniforms.uExtent.value.set(extent.x, extent.y)
    }

    line.uniforms.uDraw.value = clock.draw
    line.uniforms.uWidth.value = 0.04 * extent.scale
    tip.uniforms.uSize.value = (extent.portrait ? 30 : 40) * clock.draw
    tip.uniforms.uPixelRatio.value = dpr
  })

  return (
    <group position-y={extent.offsetY}>
      <mesh
        ref={ribbonRef}
        geometry={ribbon}
        material={ribbonMaterial}
        frustumCulled={false}
      />
      <points
        ref={headRef}
        geometry={head}
        material={headMaterial}
        frustumCulled={false}
        renderOrder={1}
      />
    </group>
  )
}

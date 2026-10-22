import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from "three"
import { experienceStore } from "@/experience/store"
import type { QualityTier } from "@/experience/types"
import {
  KIT_LINE_SAMPLES,
  phase,
  resampleCurvePoints,
  type Vec3Tuple,
} from "./cameraRig"

const SEGMENT_BUDGET: Record<Exclude<QualityTier, "static">, number> = {
  high: 144,
  medium: 96,
  low: 52,
}

const THREAD_LINE_VERTEX = /* glsl */ `
attribute float aU;
attribute float aSide;

uniform vec3 uPath[32];
uniform float uWidth;
uniform float uPhase;
uniform float uPulseSpeed;
uniform float uTail;

varying float vSide;
varying float vEnergy;
varying float vU;

vec3 sampleCurve(float u) {
  float idx = clamp(u, 0.0, 1.0) * 31.0;
  int a = min(int(floor(idx)), 30);
  return mix(uPath[a], uPath[a + 1], idx - float(a));
}

float computeEnergy(float u) {
  float e = 0.0;
  for (int i = 0; i < 2; i++) {
    float center = fract(uPhase * uPulseSpeed + float(i) * 0.5);
    float behind = center - u;
    float front = behind / 0.018;
    float shape = behind >= 0.0 ? exp(-behind / max(uTail, 0.04)) : exp(-front * front);
    float edgeFade = smoothstep(0.0, 0.05, center) * smoothstep(1.0, 0.95, center);
    e += shape * edgeFade * (i == 0 ? 1.0 : 0.65);
  }
  return e;
}

void main() {
  vec3 pos = sampleCurve(aU);
  vec3 ahead = sampleCurve(min(aU + 0.015, 1.0));
  vec3 behind = sampleCurve(max(aU - 0.015, 0.0));

  vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
  vec4 viewAhead = modelViewMatrix * vec4(ahead, 1.0);
  vec4 viewBehind = modelViewMatrix * vec4(behind, 1.0);

  vec2 tangent = normalize((viewAhead.xy - viewBehind.xy) + vec2(1e-5, 0.0));
  vec2 normal = vec2(-tangent.y, tangent.x);

  float energy = computeEnergy(aU);
  float widthScale = uWidth * (1.0 + min(energy, 1.2) * 0.85);
  viewPos.xy += normal * aSide * widthScale;

  vSide = aSide;
  vEnergy = energy;
  vU = aU;
  gl_Position = projectionMatrix * viewPos;
}
`

const THREAD_LINE_FRAGMENT = /* glsl */ `
uniform float uDraw;
uniform float uOpacity;
uniform float uLightMode;
uniform vec3 uColor;
uniform vec3 uHeadColor;

varying float vSide;
varying float vEnergy;
varying float vU;

void main() {
  if (vU > uDraw || uDraw <= 0.001) discard;

  float d = abs(vSide);
  float core = exp(-d * d * 28.0);
  float halo = exp(-d * d * 3.5) * 0.48;
  float energy = min(vEnergy, 1.5);
  float ends = smoothstep(0.0, 0.03, vU) * smoothstep(1.0, 0.97, vU);
  float drawEdge = 1.0 + smoothstep(0.05, 0.0, uDraw - vU) * step(uDraw, 0.999) * 2.2;

  vec3 baseLine = uColor * (core + halo) * (0.42 + energy * 0.95) * drawEdge;
  vec3 headGlow = uHeadColor * core * (energy * 1.15 + smoothstep(0.06, 0.0, uDraw - vU) * 1.4);
  vec3 finalColor = baseLine + headGlow;

  float alpha = clamp((core * 0.95 + halo * 0.75) * ends * uOpacity, 0.0, 1.0);
  if (uLightMode > 0.5) {
    finalColor = mix(uColor, uHeadColor, clamp(energy * 0.65, 0.0, 1.0));
    alpha = clamp((core + halo * 0.55) * ends * uOpacity, 0.0, 0.95);
  }

  gl_FragColor = vec4(finalColor * ends * uOpacity, alpha);
  #include <colorspace_fragment>
}
`

const THREAD_HEAD_VERTEX = /* glsl */ `
uniform vec3 uPath[32];
uniform float uHeadU;
uniform float uSize;
uniform float uPixelRatio;

vec3 sampleCurve(float u) {
  float idx = clamp(u, 0.0, 1.0) * 31.0;
  int a = min(int(floor(idx)), 30);
  return mix(uPath[a], uPath[a + 1], idx - float(a));
}

void main() {
  vec3 p = sampleCurve(uHeadU);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * uPixelRatio;
}
`

const THREAD_HEAD_FRAGMENT = /* glsl */ `
uniform vec3 uHeadColor;
uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;

  float core = exp(-d * d * 18.0);
  float halo = exp(-d * d * 3.0) * 0.42;
  float alpha = clamp((core + halo) * uOpacity, 0.0, 1.0);
  gl_FragColor = vec4(uHeadColor * (core * 1.45 + halo) * uOpacity, alpha);
  #include <colorspace_fragment>
}
`

function createRibbonGeometry(segments: number): BufferGeometry {
  const vertices = (segments + 1) * 2
  const u = new Float32Array(vertices)
  const side = new Float32Array(vertices)
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

function createHeadGeometry(): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(3), 3))
  return geometry
}

export type ThreadLineProps = {
  /** Puntos de control fijos en coordenadas 3D. */
  points?: readonly Vec3Tuple[]
  /** Generador de puntos dinámico leído en `useFrame` (sin re-render). */
  getPoints?: (progress: number) => readonly Vec3Tuple[]
  /** Referencia al progreso del capítulo. */
  progress?: { readonly current: number }
  /** Nivel de calidad activo. */
  quality?: QualityTier
  /** Color principal del filamento. */
  color?: string
  /** Color de la cabeza y los pulsos de energía. */
  headColor?: string
  /** Grosor en espacio de vista (default 0.042). */
  width?: number
  /**
   * Fracción dibujada `0..1`, rango `[start, end]` sobre `progress.current`
   * o callback `(progress: number) => number`.
   */
  draw?: number | [start: number, end: number] | ((progress: number) => number)
  /** Rango `[enterStart, enterEnd, exitStart, exitEnd]` o opacidad fija `0..1`. */
  opacity?: number | ((progress: number) => number)
  /** Velocidad de los pulsos que recorren la trayectoria. */
  pulseSpeed?: number
  /** Largo de la estela de cada pulso (0.05 corto tipo Pirp, 0.22 largo tipo Vibo). */
  pulseTail?: number
  /** Muestra la partícula luminosa en la punta de dibujado o en el pulso líder. */
  showHead?: boolean
  /** Tamaño en px de la partícula de punta. */
  headSize?: number
  /** Suaviza los puntos de control con Catmull-Rom (default `true`). */
  smooth?: boolean
  /** Ajusta el blending para fondos claros como Naturalis. */
  scheme?: "dark" | "light"
}

/**
 * Línea gruesa 3D con el shader del hilo conductor (`Filament.tsx`).
 * Soporta dibujado progresivo, pulsos de energía y punta luminosa en 1–2 draw calls.
 */
export function ThreadLine({
  points,
  getPoints,
  progress,
  quality = "high",
  color = "#3D8BFF",
  headColor = "#F5C451",
  width = 0.042,
  draw = 1,
  opacity = 1,
  pulseSpeed = 0.65,
  pulseTail = 0.16,
  showHead = true,
  headSize = 26,
  smooth = true,
  scheme = "dark",
}: ThreadLineProps) {
  const dpr = useThree((state) => state.viewport.dpr)
  const tier = quality === "static" ? "low" : quality
  const segments = SEGMENT_BUDGET[tier]

  const ribbonRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null)
  const headRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null)
  const phaseRef = useRef(0)

  const pathSamples = useMemo(
    () => Array.from({ length: KIT_LINE_SAMPLES }, () => new Vector3()),
    []
  )

  useMemo(() => {
    if (points && points.length > 0) {
      resampleCurvePoints(points, pathSamples, smooth)
    }
  }, [points, pathSamples, smooth])

  const ribbonGeo = useMemo(() => createRibbonGeometry(segments), [segments])
  const headGeo = useMemo(() => createHeadGeometry(), [])

  const isLight = scheme === "light"

  const ribbonMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: THREAD_LINE_VERTEX,
        fragmentShader: THREAD_LINE_FRAGMENT,
        uniforms: {
          uPath: { value: pathSamples },
          uWidth: { value: width },
          uPhase: { value: 0 },
          uPulseSpeed: { value: pulseSpeed },
          uTail: { value: pulseTail },
          uDraw: { value: 1 },
          uOpacity: { value: 1 },
          uLightMode: { value: isLight ? 1 : 0 },
          uColor: { value: new Color(color) },
          uHeadColor: { value: new Color(headColor) },
        },
        transparent: true,
        depthWrite: false,
        blending: isLight ? NormalBlending : AdditiveBlending,
        side: DoubleSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLight, pathSamples]
  )

  const headMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: THREAD_HEAD_VERTEX,
        fragmentShader: THREAD_HEAD_FRAGMENT,
        uniforms: {
          uPath: { value: pathSamples },
          uHeadU: { value: 1 },
          uSize: { value: headSize },
          uPixelRatio: { value: 1 },
          uOpacity: { value: 1 },
          uHeadColor: { value: new Color(headColor) },
        },
        transparent: true,
        depthWrite: false,
        blending: isLight ? NormalBlending : AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLight, pathSamples]
  )

  useEffect(() => () => ribbonGeo.dispose(), [ribbonGeo])
  useEffect(
    () => () => {
      headGeo.dispose()
      ribbonMat.dispose()
      headMat.dispose()
    },
    [headGeo, ribbonMat, headMat]
  )

  useFrame((_, delta) => {
    const line = ribbonRef.current?.material
    if (!line) return

    const p = progress ? progress.current : 1
    const reducedMotion = experienceStore.getSnapshot().reducedMotion

    if (getPoints) {
      const dynamicPts = getPoints(p)
      resampleCurvePoints(dynamicPts, pathSamples, smooth)
    }

    const currentDraw =
      typeof draw === "number"
        ? MathUtils.clamp(draw, 0, 1)
        : Array.isArray(draw)
          ? phase(p, draw[0], draw[1])
          : MathUtils.clamp(draw(p), 0, 1)

    const currentOpacity =
      typeof opacity === "number"
        ? MathUtils.clamp(opacity, 0, 1)
        : MathUtils.clamp(opacity(p), 0, 1)

    if (!reducedMotion) {
      phaseRef.current = (phaseRef.current + Math.min(delta, 0.05)) % 100
    } else {
      phaseRef.current = p * 2
    }

    line.uniforms.uColor.value.set(color)
    line.uniforms.uHeadColor.value.set(headColor)
    line.uniforms.uWidth.value = width
    line.uniforms.uDraw.value = currentDraw
    line.uniforms.uOpacity.value = currentOpacity
    line.uniforms.uPhase.value = phaseRef.current
    line.uniforms.uPulseSpeed.value = pulseSpeed
    line.uniforms.uTail.value = pulseTail

    if (ribbonRef.current) {
      ribbonRef.current.visible = currentDraw > 0.002 && currentOpacity > 0.01
    }

    const tipMesh = headRef.current
    const tip = tipMesh?.material
    if (tipMesh && tip) {
      const visible = showHead && currentDraw > 0.02 && currentOpacity > 0.02
      tipMesh.visible = visible
      if (visible) {
        tip.uniforms.uHeadColor.value.set(headColor)
        tip.uniforms.uOpacity.value = currentOpacity
        tip.uniforms.uPixelRatio.value = dpr
        tip.uniforms.uSize.value = headSize * Math.min(1, currentDraw * 2.5)
        const pulseU =
          currentDraw < 0.98
            ? currentDraw
            : (phaseRef.current * pulseSpeed) % 1
        tip.uniforms.uHeadU.value = pulseU
      }
    }
  })

  return (
    <group>
      <mesh
        ref={ribbonRef}
        geometry={ribbonGeo}
        material={ribbonMat}
        frustumCulled={false}
      />
      {showHead ? (
        <points
          ref={headRef}
          geometry={headGeo}
          material={headMat}
          frustumCulled={false}
          renderOrder={1}
        />
      ) : null}
    </group>
  )
}

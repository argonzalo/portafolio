import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  BoxGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three"
import type { SceneProps } from "@/experience/types"
import { AgentGraph, type AgentEdgeDef, type AgentNodeDef } from "./AgentGraph"
import {
  beatEnvelope,
  phase,
  useBeatCameraRig,
  type BeatCameraFrame,
  type Vec3Tuple,
} from "./cameraRig"
import {
  TelemetryDeck,
  type KitBarDef,
  type KitCounterDef,
  type KitTrendSeries,
} from "./CountersAndCharts"
import {
  HudOverlay,
  type HudBoundingBox3D,
  type HudMarkerItem,
  type HudPoseSkeleton3D,
} from "./HudOverlay"
import { ParticleField } from "./ParticleField"
import { KIT_THEMES, type KitTheme } from "./theme"
import { ThreadLine } from "./ThreadLine"

const CAMERA_FRAMES: readonly BeatCameraFrame[] = [
  {
    at: 0.0,
    desktop: [5.4, 3.2, 6.8],
    mobile: [0.2, 4.3, 9.6],
    target: [0, 1.05, -0.4],
    mobileTarget: [0, 1.0, -0.2],
    fov: 42,
    mobileFov: 50,
    sway: 0.04,
  },
  {
    at: 0.28,
    desktop: [2.5, 2.05, 4.35],
    mobile: [1.1, 2.25, 6.2],
    target: [-0.35, 1.35, 0.75],
    mobileTarget: [-0.2, 1.25, 0.7],
    fov: 38,
    mobileFov: 46,
    sway: 0.025,
  },
  {
    at: 0.52,
    desktop: [0.0, 2.4, 6.4],
    mobile: [0.0, 2.1, 8.2],
    target: [0.0, 1.65, -0.4],
    mobileTarget: [0.0, 1.35, -0.2],
    fov: 44,
    mobileFov: 52,
    sway: 0.03,
  },
  {
    at: 0.74,
    desktop: [-3.1, 3.3, 6.2],
    mobile: [-0.8, 3.8, 8.8],
    target: [0.7, 1.1, -0.3],
    mobileTarget: [0.0, 0.9, -0.2],
    fov: 43,
    mobileFov: 50,
    sway: 0.03,
  },
  {
    at: 1.0,
    desktop: [4.2, 3.6, 7.4],
    mobile: [0.4, 4.4, 9.8],
    target: [0.3, 1.2, -0.3],
    mobileTarget: [0.0, 1.0, -0.2],
    fov: 44,
    mobileFov: 50,
    sway: 0.035,
  },
]

const STAGE_FLOOR_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const STAGE_FLOOR_FRAGMENT = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uGrid;
uniform vec3 uPrimary;
uniform vec3 uAccent;
uniform float uProgress;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vec2 coord = vWorldPos.xz;
  float dist = length(coord * vec2(0.85, 0.65));

  // Grilla táctica con antialiasing por derivada
  vec2 gridUv = abs(fract(coord * 0.75 - 0.5) - 0.5) / fwidth(coord * 0.75);
  float line = 1.0 - min(min(gridUv.x, gridUv.y), 1.0);

  // Líneas reglamentarias de cancha estilizada
  float courtX = smoothstep(0.06, 0.0, abs(abs(coord.x) - 3.6)) * step(abs(coord.y), 5.6);
  float courtZ = smoothstep(0.06, 0.0, abs(abs(coord.y) - 5.6)) * step(abs(coord.x), 3.6);
  float serviceZ = smoothstep(0.045, 0.0, abs(abs(coord.y) - 2.6)) * step(abs(coord.x), 3.6);
  float centerLine = smoothstep(0.04, 0.0, abs(coord.x)) * step(abs(coord.y), 2.6);
  float courtLines = max(max(courtX, courtZ), max(serviceZ, centerLine));

  // Anillo de calor / zona de impacto en el pique
  float bounceDist = length(coord - vec2(0.45, -1.55));
  float bounceRing = exp(-bounceDist * bounceDist * 2.4) * 0.55;
  float pulseRing = smoothstep(0.08, 0.0, abs(bounceDist - fract(uProgress * 2.5) * 1.6)) * (1.0 - fract(uProgress * 2.5));

  float radialMask = smoothstep(9.5, 1.2, dist);
  vec3 col = uBg;
  col = mix(col, uGrid, line * 0.38 * radialMask);
  col = mix(col, uPrimary, courtLines * 0.72 * radialMask);
  col += uAccent * (bounceRing * 0.45 + pulseRing * 0.55) * radialMask;

  float alpha = radialMask * 0.96;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`

const ATHLETE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}
`

const ATHLETE_FRAGMENT = /* glsl */ `
uniform vec3 uBaseColor;
uniform vec3 uRimColor;
uniform vec3 uAccentColor;
uniform float uRimPower;

varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);
  vec3 keyLight = normalize(vec3(0.55, 0.82, 0.45));
  vec3 fillLight = normalize(vec3(-0.6, 0.25, -0.4));

  float diffKey = max(dot(n, keyLight), 0.0);
  float diffFill = max(dot(n, fillLight), 0.0);
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), uRimPower);

  vec3 halfVec = normalize(keyLight + v);
  float spec = pow(max(dot(n, halfVec), 0.0), 28.0);

  vec3 color = uBaseColor * (0.28 + diffKey * 0.68 + diffFill * 0.22);
  color += uRimColor * fresnel * 0.92;
  color += uAccentColor * spec * 0.48;

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`

const PRIMARY_TRAJECTORY: readonly Vec3Tuple[] = [
  [-0.18, 2.02, 1.05],
  [0.05, 2.38, 0.15],
  [0.28, 1.52, -0.78],
  [0.45, 0.06, -1.55],
  [0.72, 0.88, -2.55],
  [1.08, 1.16, -3.55],
  [1.42, 0.72, -4.45],
]

const SECONDARY_TRAJECTORY: readonly Vec3Tuple[] = [
  [-0.22, 1.88, 1.05],
  [-0.55, 2.95, -0.1],
  [-0.88, 2.55, -1.45],
  [-1.12, 0.08, -2.85],
  [-1.32, 0.78, -3.85],
]

const VELOCITY_VECTOR_LINE: readonly Vec3Tuple[] = [
  [-0.18, 2.02, 1.05],
  [0.62, 2.18, 0.35],
  [1.25, 2.28, -0.25],
]

const GRAPH_NODES: readonly AgentNodeDef[] = [
  {
    id: "detect",
    label: "Detección",
    decision: "bbox + pose 17p (0.94)",
    metric: "3.1 ms",
    desktop: [-3.1, 2.35, -0.5],
    mobile: [-0.36, 2.55, 0],
    triggerAt: 0.44,
  },
  {
    id: "track",
    label: "Seguimiento",
    decision: "ByteTrack ID #P2 estable",
    metric: "1.8 ms",
    desktop: [-1.55, 2.85, -0.65],
    mobile: [0.36, 1.85, 0],
    triggerAt: 0.48,
  },
  {
    id: "calib",
    label: "Calibración",
    decision: "Homografía cancha 2D",
    metric: "2.4 ms",
    desktop: [-1.55, 1.65, -0.35],
    mobile: [-0.36, 1.15, 0],
    triggerAt: 0.51,
  },
  {
    id: "stroke",
    label: "Golpes",
    decision: "Pico cinemático f276",
    metric: "4.0 ms",
    desktop: [0.45, 2.25, -0.5],
    mobile: [0.36, 0.45, 0],
    triggerAt: 0.55,
  },
  {
    id: "classify",
    label: "Clasificación",
    decision: "Drive cruzado · 81.4°",
    metric: "94% CONF",
    desktop: [2.45, 2.35, -0.4],
    mobile: [0.0, -0.28, 0],
    triggerAt: 0.59,
  },
]

const GRAPH_EDGES: readonly AgentEdgeDef[] = [
  { from: "detect", to: "track", arcHeight: 0.24, range: [0.44, 0.5] },
  { from: "detect", to: "calib", arcHeight: -0.18, range: [0.45, 0.52] },
  { from: "track", to: "stroke", arcHeight: 0.22, range: [0.49, 0.56] },
  { from: "calib", to: "stroke", arcHeight: 0.16, range: [0.51, 0.57] },
  { from: "stroke", to: "classify", arcHeight: 0.28, range: [0.55, 0.62] },
]

const TREND_SERIES: KitTrendSeries = {
  title: "Índice de dominio e intensidad por ventana",
  unitLabel: "VENTANA 01–12 · 30 FPS",
  samples: [
    0.28, 0.34, 0.31, 0.45, 0.52, 0.48, 0.64, 0.72, 0.94, 0.81, 0.76, 0.86,
  ],
  peakIndex: 8,
  peakLabel: "+38% PICO",
  alertText: "↗ Cambio de ritmo detectado · transición a ataque en red",
  drawRange: [0.65, 0.79],
}

const TELEMETRY_BARS: readonly KitBarDef[] = [
  {
    id: "conf",
    label: "Confianza de clasificación (Drive / Bandeja)",
    value: 94,
    tone: "accent",
  },
  {
    id: "cov",
    label: "Cobertura táctica de media cancha",
    value: 82,
    tone: "primary",
  },
  {
    id: "sync",
    label: "Estabilidad de pose e identidad",
    value: 98,
    tone: "positive",
  },
]

const RESULT_COUNTERS: readonly KitCounterDef[] = [
  {
    id: "speed",
    label: "Velocidad pico",
    from: 120,
    to: 516.5,
    decimals: 1,
    suffix: " px/s",
    detail: "Impacto f276 · P2",
    tone: "accent",
    range: [0.82, 0.94],
  },
  {
    id: "angle",
    label: "Ángulo de salida",
    from: 15,
    to: 81.4,
    decimals: 1,
    suffix: "°",
    detail: "Drive cruzado",
    tone: "primary",
    range: [0.83, 0.95],
  },
  {
    id: "screens",
    label: "Escala multi-escena",
    from: 500,
    to: 10000,
    decimals: 0,
    prefix: "≈",
    detail: "Nodos / pantallas",
    tone: "positive",
    range: [0.84, 0.96],
  },
  {
    id: "clients",
    label: "Impacto operativo",
    from: 40,
    to: 650,
    decimals: 0,
    prefix: "+",
    detail: "Clientes / sesión",
    tone: "accent",
    range: [0.85, 0.97],
  },
]

function swingPoseAt(progress: number): number {
  if (progress < 0.2) return 0.35
  if (progress <= 0.46) return phase(progress, 0.2, 0.42)
  return 0.78
}

function getRightWristWorld(progress: number): Vec3Tuple {
  const s = swingPoseAt(progress)
  const angle = -0.55 + s * 1.35
  return [
    -0.55 + 0.32 + Math.cos(angle) * 0.56,
    1.48 + Math.sin(angle) * 0.48,
    0.85 + Math.sin(s * Math.PI) * 0.22,
  ]
}

export type KitShowcaseSceneProps = SceneProps & {
  theme?: KitTheme
}

/**
 * Escena demostrativa completa del Kit T-A18 para `/lab/kit`.
 * Integra Rig de cámara por beats, ThreadLine, HudOverlay, AgentGraph,
 * TelemetryDeck y ParticleField con estética de producto real.
 */
export default function KitShowcaseScene({
  progress,
  quality,
  isMobile,
  active,
  theme = KIT_THEMES.vibo,
}: KitShowcaseSceneProps) {
  useBeatCameraRig(
    { progress, quality, isMobile, active },
    { frames: CAMERA_FRAMES, background: theme.background, damping: 14 }
  )

  const floorMatRef = useRef<ShaderMaterial>(null)
  const athleteGroupRef = useRef<Group>(null)
  const shoulderPivotRef = useRef<Group>(null)
  const bounceRingRef = useRef<Mesh>(null)
  const dataPodiumRef = useRef<Group>(null)

  const low = quality === "low"
  const isLight = theme.scheme === "light"

  // Geometrías compartidas y liberadas al desmontar
  const geos = useMemo(() => {
    const segs = low ? 10 : 20
    return {
      floor: new PlaneGeometry(16, 18, 1, 1),
      net: new BoxGeometry(7.2, 0.88, 0.03),
      post: new CylinderGeometry(0.045, 0.045, 1.02, 8),
      beam: new CylinderGeometry(0.08, 1.35, 5.2, 16, 1, true),
      head: new SphereGeometry(0.155, segs, segs),
      torso: new CapsuleGeometry(0.21, 0.52, 8, segs),
      pelvis: new CapsuleGeometry(0.18, 0.22, 6, segs),
      limb: new CapsuleGeometry(0.068, 0.44, 6, segs),
      forearm: new CapsuleGeometry(0.056, 0.38, 6, segs),
      racketHead: new TorusGeometry(0.2, 0.022, 8, 24),
      racketFace: new CylinderGeometry(0.19, 0.19, 0.01, 16),
      ring: new RingGeometry(0.24, 0.32, 32),
      podiumRing: new TorusGeometry(1.15, 0.018, 8, 48),
    }
  }, [low])

  const mats = useMemo(() => {
    const floor = new ShaderMaterial({
      vertexShader: STAGE_FLOOR_VERTEX,
      fragmentShader: STAGE_FLOOR_FRAGMENT,
      uniforms: {
        uBg: { value: new Color(theme.background) },
        uGrid: { value: new Color(theme.gridColor) },
        uPrimary: { value: new Color(theme.primary) },
        uAccent: { value: new Color(theme.accent) },
        uProgress: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })

    const athleteBody = new ShaderMaterial({
      vertexShader: ATHLETE_VERTEX,
      fragmentShader: ATHLETE_FRAGMENT,
      uniforms: {
        uBaseColor: {
          value: new Color(isLight ? "#2B4F49" : "#152C4E"),
        },
        uRimColor: { value: new Color(theme.primary) },
        uAccentColor: { value: new Color(theme.accent) },
        uRimPower: { value: 2.3 },
      },
    })

    const athleteJoint = new ShaderMaterial({
      vertexShader: ATHLETE_VERTEX,
      fragmentShader: ATHLETE_FRAGMENT,
      uniforms: {
        uBaseColor: {
          value: new Color(isLight ? "#56857D" : "#23477A"),
        },
        uRimColor: { value: new Color(theme.accent) },
        uAccentColor: { value: new Color("#FFFFFF") },
        uRimPower: { value: 1.8 },
      },
    })

    const beam = new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float fadeY = smoothstep(0.0, 0.85, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
          gl_FragColor = vec4(uColor, fadeY * uOpacity);
          #include <colorspace_fragment>
        }
      `,
      uniforms: {
        uColor: { value: new Color(theme.primary) },
        uOpacity: { value: isLight ? 0.08 : 0.14 },
      },
      transparent: true,
      depthWrite: false,
      blending: isLight ? NormalBlending : AdditiveBlending,
      side: DoubleSide,
    })

    return { floor, athleteBody, athleteJoint, beam }
  }, [theme, isLight])

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
    },
    [geos]
  )

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose())
    },
    [mats]
  )

  const hudBoxes = useMemo<readonly HudBoundingBox3D[]>(
    () => [
      {
        id: "player-p2",
        center: [-0.52, 1.18, 0.85],
        size: [1.18, 2.15, 0.75],
        label: "JUGADOR P2",
        tag: "DRIVE CRUZADO",
        confidence: (p) => 0.91 + phase(p, 0.22, 0.4) * 0.05,
        footerMetrics: [
          { label: "vel", value: "516.5 px/s" },
          { label: "áng", value: "81.4°" },
        ],
        range: [0.18, 0.23, 0.43, 0.48],
      },
    ],
    []
  )

  const hudSkeleton = useMemo<HudPoseSkeleton3D>(
    () => ({
      id: "pose-p2",
      range: [0.2, 0.25, 0.43, 0.48],
      joints: [
        { id: "head", position: [-0.55, 1.98, 0.85] },
        { id: "neck", position: [-0.55, 1.72, 0.85] },
        { id: "l_shoulder", position: [-0.78, 1.66, 0.82] },
        { id: "r_shoulder", position: [-0.28, 1.68, 0.86], accent: true },
        {
          id: "r_elbow",
          position: (p) => {
            const s = swingPoseAt(p)
            const a = -0.55 + s * 1.35
            return [
              -0.28 + Math.cos(a) * 0.28,
              1.56 + Math.sin(a) * 0.24,
              0.88,
            ]
          },
          accent: true,
        },
        { id: "r_wrist", position: getRightWristWorld, accent: true },
        { id: "pelvis", position: [-0.55, 1.05, 0.85] },
        { id: "l_knee", position: [-0.72, 0.56, 0.95] },
        { id: "r_knee", position: [-0.36, 0.58, 0.76] },
        { id: "l_ankle", position: [-0.78, 0.1, 1.02] },
        { id: "r_ankle", position: [-0.3, 0.1, 0.7] },
      ],
      bones: [
        ["head", "neck"],
        ["l_shoulder", "r_shoulder"],
        ["r_shoulder", "r_elbow"],
        ["r_elbow", "r_wrist"],
        ["neck", "pelvis"],
        ["pelvis", "l_knee"],
        ["l_knee", "l_ankle"],
        ["pelvis", "r_knee"],
        ["r_knee", "r_ankle"],
      ],
      angleGauge: {
        vertexId: "r_shoulder",
        armAId: "pelvis",
        armBId: "r_wrist",
        label: "IMPACTO",
        degrees: (p) => 64.2 + swingPoseAt(p) * 22.0,
      },
    }),
    []
  )

  const hudMarkers = useMemo<readonly HudMarkerItem[]>(
    () => [
      {
        id: "impact-point",
        position: getRightWristWorld,
        offset: [56, -54],
        code: "SHOT #10",
        label: "Velocidad de salida",
        value: (p) => (420 + swingPoseAt(p) * 96.5).toFixed(1),
        unit: "px/s",
        tone: "accent",
        range: [0.16, 0.22, 0.44, 0.5],
      },
      {
        id: "bounce-zone",
        position: [0.45, 0.12, -1.55],
        offset: [48, -38],
        code: "ZONA B2",
        label: "Profundidad de pique",
        value: "4,18",
        unit: "m fondo",
        tone: "primary",
        range: [0.06, 0.12, 0.43, 0.48],
      },
      {
        id: "homography",
        position: [1.42, 0.72, -4.45],
        offset: [-185, -36],
        code: "HOMOGRAFÍA",
        label: "Precisión espacial",
        value: "98,4",
        unit: "% IoU",
        tone: "positive",
        range: [0.1, 0.16, 0.42, 0.47],
      },
    ],
    []
  )

  useFrame(() => {
    const p = progress.current
    const swing = swingPoseAt(p)

    if (floorMatRef.current) {
      floorMatRef.current.uniforms.uProgress.value = p
      floorMatRef.current.uniforms.uBg.value.set(theme.background)
      floorMatRef.current.uniforms.uGrid.value.set(theme.gridColor)
      floorMatRef.current.uniforms.uPrimary.value.set(theme.primary)
      floorMatRef.current.uniforms.uAccent.value.set(theme.accent)
    }

    if (athleteGroupRef.current) {
      athleteGroupRef.current.rotation.y = -0.32 + swing * 0.58
    }

    if (shoulderPivotRef.current) {
      shoulderPivotRef.current.rotation.z = -0.65 + swing * 1.38
      shoulderPivotRef.current.rotation.x = 0.22 - swing * 0.35
    }

    if (bounceRingRef.current) {
      const pulse = 0.85 + Math.sin(p * 24) * 0.18
      bounceRingRef.current.scale.setScalar(pulse)
    }

    if (dataPodiumRef.current) {
      const podiumEnv = beatEnvelope(p, 0.6, 0.66, 0.98, 1.01)
      dataPodiumRef.current.visible = podiumEnv > 0.01
      dataPodiumRef.current.rotation.y = p * 1.8
      dataPodiumRef.current.scale.setScalar(0.85 + podiumEnv * 0.15)
    }
  })

  return (
    <group>
      {/* 1. Piso táctico con shader de cancha + anillos de lectura */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0, -0.8]}
        geometry={geos.floor}
        material={mats.floor}
      >
        <primitive
          ref={floorMatRef}
          object={mats.floor}
          attach="material"
        />
      </mesh>

      {/* Red estilizada y postes de referencia espacial */}
      <group position={[0, 0, -0.4]}>
        <mesh position={[0, 0.44, 0]} geometry={geos.net}>
          <meshBasicMaterial
            color={theme.primary}
            wireframe
            transparent
            opacity={0.35}
          />
        </mesh>
        {!low
          ? [-3.6, 3.6].map((x) => (
              <mesh key={x} position={[x, 0.51, 0]} geometry={geos.post}>
                <meshBasicMaterial color={theme.gridColor} />
              </mesh>
            ))
          : null}
      </group>

      {/* Reflectores volumétricos de estadio */}
      {!low
        ? [-3.4, 3.4].map((x, idx) => (
            <mesh
              key={x}
              position={[x, 3.6, -1.8 + idx * 0.9]}
              rotation-z={x > 0 ? 0.26 : -0.26}
              geometry={geos.beam}
              material={mats.beam}
            />
          ))
        : null}

      {/* Marcador 3D en punto de pique */}
      <mesh
        ref={bounceRingRef}
        position={[0.45, 0.02, -1.55]}
        rotation-x={-Math.PI / 2}
        geometry={geos.ring}
      >
        <meshBasicMaterial
          color={theme.accent}
          side={DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2. Figura atlética estilizada con shader rim-lit (Beats 1, 2 y 5) */}
      <group ref={athleteGroupRef} position={[-0.55, 0, 0.85]}>
        {/* Cabeza */}
        <mesh
          position={[0, 1.98, 0]}
          geometry={geos.head}
          material={mats.athleteJoint}
        />
        {/* Torso */}
        <mesh
          position={[0, 1.4, 0]}
          geometry={geos.torso}
          material={mats.athleteBody}
        />
        {/* Pelvis */}
        <mesh
          position={[0, 0.98, 0]}
          rotation-z={Math.PI / 2}
          geometry={geos.pelvis}
          material={mats.athleteBody}
        />
        {/* Pierna izquierda */}
        <mesh
          position={[-0.16, 0.48, 0.08]}
          rotation-z={0.14}
          rotation-x={-0.12}
          geometry={geos.limb}
          material={mats.athleteBody}
        />
        {/* Pierna derecha */}
        <mesh
          position={[0.18, 0.48, -0.08]}
          rotation-z={-0.16}
          rotation-x={0.14}
          geometry={geos.limb}
          material={mats.athleteBody}
        />
        {/* Brazo de equilibrio izquierdo */}
        <mesh
          position={[-0.32, 1.48, 0.12]}
          rotation-z={0.62}
          rotation-x={0.35}
          geometry={geos.forearm}
          material={mats.athleteJoint}
        />
        {/* Cadena cinemática de brazo de golpe + pala/raqueta */}
        <group ref={shoulderPivotRef} position={[0.27, 1.62, 0.04]}>
          <mesh
            position={[0.24, 0, 0]}
            rotation-z={Math.PI / 2}
            geometry={geos.forearm}
            material={mats.athleteJoint}
          />
          <group position={[0.62, 0, 0]}>
            <mesh geometry={geos.racketHead} material={mats.athleteJoint} />
            <mesh rotation-x={Math.PI / 2} geometry={geos.racketFace}>
              <meshBasicMaterial
                color={theme.accent}
                transparent
                opacity={0.38}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* 3. Líneas y trayectorias con el shader del hilo conductor */}
      <ThreadLine
        points={PRIMARY_TRAJECTORY}
        progress={progress}
        quality={quality}
        color={theme.primary}
        headColor={theme.accent}
        width={0.048}
        draw={(p) =>
          p < 0.45 ? MathUtils.clamp(phase(p, 0.0, 0.18), 0.15, 1) : 1
        }
        opacity={(p) =>
          p >= 0.44 && p < 0.64 ? 0.25 : 0.98
        }
        pulseSpeed={0.72}
        pulseTail={0.2}
        showHead
        headSize={30}
        scheme={theme.scheme}
      />

      <ThreadLine
        points={SECONDARY_TRAJECTORY}
        progress={progress}
        quality={quality}
        color={theme.accent}
        headColor={theme.text}
        width={0.028}
        draw={[0.04, 0.22]}
        opacity={(p) =>
          beatEnvelope(p, 0.02, 0.08, 0.4, 0.46) * 0.72
        }
        pulseSpeed={0.52}
        pulseTail={0.14}
        showHead={quality !== "low"}
        headSize={20}
        scheme={theme.scheme}
      />

      <ThreadLine
        points={VELOCITY_VECTOR_LINE}
        progress={progress}
        quality={quality}
        color={theme.accent}
        headColor={theme.text}
        width={0.032}
        draw={[0.2, 0.32]}
        opacity={(p) => beatEnvelope(p, 0.19, 0.24, 0.43, 0.47)}
        pulseSpeed={1.1}
        pulseTail={0.12}
        showHead
        headSize={22}
        smooth={false}
        scheme={theme.scheme}
      />

      {/* Podio holográfico 3D para los beats de Tendencia y Contadores (0.64..1.0) */}
      <group ref={dataPodiumRef} position={[-1.1, 1.15, -0.3]} visible={false}>
        <mesh rotation-x={Math.PI / 2} geometry={geos.podiumRing}>
          <meshBasicMaterial color={theme.primary} transparent opacity={0.75} />
        </mesh>
        <mesh
          rotation-x={Math.PI / 2.6}
          rotation-y={0.4}
          scale={0.74}
          geometry={geos.podiumRing}
        >
          <meshBasicMaterial color={theme.accent} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* 4. Campo de partículas GPU con presupuesto automático por nivel */}
      <ParticleField
        quality={quality}
        progress={progress}
        color={theme.primary}
        secondaryColor={theme.accent}
        mode={
          theme.id === "pirp" || theme.id === "banner"
            ? "stream"
            : theme.id === "naturalis"
              ? "calm"
              : "stadium"
        }
        scheme={theme.scheme}
      />

      {/* 5. HUD anclado a coordenadas 3D (Beat 1 y Beat 2) */}
      <HudOverlay
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={theme}
        boxes={hudBoxes}
        skeleton={hudSkeleton}
        markers={hudMarkers}
        defaultSelectedId="impact-point"
      />

      {/* 6. Grafo de nodos y decisiones (Beat 3: 0.42..0.66) */}
      <AgentGraph
        nodes={GRAPH_NODES}
        edges={GRAPH_EDGES}
        progress={progress}
        quality={quality}
        isMobile={isMobile}
        active={active}
        theme={theme}
        range={[0.41, 0.45, 0.63, 0.67]}
        interactive
      />

      {/* 7. Curva de tendencia y barras en vivo (Beat 4: 0.64..0.84) */}
      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={theme}
        eyebrow="KIT · TENDENCIA Y DISTRIBUCIÓN"
        heading="Lectura continua con detección de pico"
        summary="Curva SVG trazada por scroll con umbral de alerta y barras aceleradas por GPU."
        trend={TREND_SERIES}
        bars={TELEMETRY_BARS}
        range={[0.63, 0.67, 0.81, 0.85]}
        placement="right"
      />

      {/* 8. Contadores numéricos y síntesis de resultado (Beat 5: 0.82..1.00) */}
      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={theme}
        eyebrow="KIT · CONTADORES Y SÍNTESIS"
        heading="Métricas listas para las 4 escenas y viñetas"
        summary="Interpolación directa en DOM (tabular-nums) sin renders de React por frame."
        counters={RESULT_COUNTERS}
        bars={TELEMETRY_BARS.slice(0, 2)}
        range={[0.81, 0.85, 0.99, 1.01]}
        placement="right"
      />
    </group>
  )
}

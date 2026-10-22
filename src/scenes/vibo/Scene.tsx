import {
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  SpotLight,
  Vector3,
  type Camera,
  type Texture,
} from "three"
import { envelope, handoff, ramp } from "@/experience/choreography"
import {
  PresentationContext,
  reveal,
  writeCameraPose,
} from "@/experience/presentation"
import { experienceStore } from "@/experience/store"
import type { SceneProps } from "@/experience/types"
import { emitInteract } from "@/guide/signals"
import {
  AgentGraph,
  HudOverlay,
  KIT_THEMES,
  TelemetryDeck,
  ThreadLine,
  beatEnvelope,
  interpolateCameraState,
  useStudioEnvironment,
  type AgentEdgeDef,
  type AgentNodeDef,
  type HudBoundingBox3D,
  type HudMarkerItem,
  type HudPoseSkeleton3D,
  type KitTheme,
  type Vec3Tuple,
} from "@/scenes/kit"
import { Court } from "./Court"
import { COVERAGE, HEAT, HEAT_GRID, INTENSITY, INTENSITY_PEAK, PLAYER, SHOT } from "./data"
import { createPanelNodes, paintInset } from "./panel"
import { ViboPlayer } from "./Player"
import { createContactProbe, createPlayerJoints, createRim, type JointId } from "./rig"
import { BodyLayer, ViboPanel } from "./ViboPanel"
import {
  CAMERA_KEYS,
  CONTACT,
  COURT,
  FLOODLIGHTS,
  HERO_POSITION,
  createCourtState,
  SWING,
  TIMELINE,
  ballAt,
  ballOutgoing,
  courtToWorld,
  samplePath,
} from "./world"

const THEME = KIT_THEMES.vibo
const GOLD_THEME: KitTheme = {
  ...THEME,
  border: "rgba(245, 196, 81, 0.34)",
  borderStrong: "rgba(245, 196, 81, 0.8)",
  primary: "#F5C451",
  accent: "#FFE2A1",
  glowColor: "rgba(245, 196, 81, 0.22)",
}

const CONTACT_P = TIMELINE.swing[0] + SWING.contact * (TIMELINE.swing[1] - TIMELINE.swing[0])

const SKELETON_BONES: readonly [JointId, JointId][] = [
  ["shoulderL", "shoulderR"],
  ["shoulderL", "elbowL"],
  ["elbowL", "wristL"],
  ["shoulderR", "elbowR"],
  ["elbowR", "wristR"],
  ["shoulderL", "hipL"],
  ["shoulderR", "hipR"],
  ["hipL", "hipR"],
  ["hipL", "kneeL"],
  ["kneeL", "ankleL"],
  ["hipR", "kneeR"],
  ["kneeR", "ankleR"],
  ["nose", "shoulderL"],
  ["nose", "shoulderR"],
]

/** Centroide ponderado de un canal del mapa de calor, en mundo. */
function heatCentroid(grid: readonly number[]): Vec3Tuple {
  let sx = 0
  let sz = 0
  let sum = 0
  for (let i = 0; i < grid.length; i++) {
    const w = grid[i] ** 2
    sx += ((i % HEAT_GRID.width) + 0.5) * HEAT_GRID.cell * w
    sz += (Math.floor(i / HEAT_GRID.width) + 0.5) * HEAT_GRID.cell * w
    sum += w
  }
  return courtToWorld(sx / sum, sz / sum, 0.1)
}

const PIPELINE: AgentNodeDef[] = [
  { id: "deteccion", label: "Detección", decision: "4 jugadores + pelota", metric: `f${SHOT.keyFrame}` },
  { id: "seguimiento", label: "Seguimiento", decision: "IDs estables · 713 f", metric: "30 fps" },
  { id: "calibracion", label: "Calibración", decision: "12 puntos → metros", metric: "10×20 m" },
  { id: "golpes", label: "Golpes", decision: `${PLAYER.totalShots} golpes en el punto`, metric: `${SHOT.tSec} s` },
  { id: "clasificacion", label: "Clasificación", decision: "drive · derecha", metric: "fondo" },
].map((node, i) => ({
  ...node,
  // Columna vertical sobre el cristal del fondo: se lee igual en toda la órbita de cámara.
  desktop: [-2.3, 3.0 - i * 0.6, COURT.length / 2 - 0.25] as Vec3Tuple,
  mobile: [-0.2, 3.0 - i * 0.43, COURT.length / 2 - 0.25] as Vec3Tuple,
  triggerAt: 0.28 + i * 0.05,
}))

type Range4 = [number, number, number, number]

/** En mobile el golpe y el pipeline se suceden: un bloque de información por vez. */
const MOBILE_HUD: Range4 = [0.21, 0.25, 0.43, 0.47]
const MOBILE_GRAPH: Range4 = [0.43, 0.47, 0.56, 0.6]

function hudRange(isMobile: boolean): Range4 {
  return isMobile ? MOBILE_HUD : [...TIMELINE.hud]
}

/** El layout "mobile" del kit es el de columna (etiquetas alternadas a los lados). */
function columnNodes(isMobile: boolean): AgentNodeDef[] {
  return PIPELINE.map((node, i) => ({
    ...node,
    mobile: isMobile ? node.mobile : node.desktop,
    triggerAt: isMobile ? MOBILE_GRAPH[1] + i * 0.02 : node.triggerAt,
  }))
}

const PIPELINE_EDGES: AgentEdgeDef[] = PIPELINE.slice(1).map((node, i) => ({
  from: PIPELINE[i].id,
  to: node.id,
  arcHeight: 0.04,
}))


const SHADOW_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float d = length(c);
  float a = smoothstep(1.0, 0.0, d);
  gl_FragColor = vec4(0.0, 0.01, 0.03, a * a * 0.72 * uOpacity);
}
`
const UV_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export default function ViboScene(props: SceneProps) {
  const { progress, quality, isMobile, active } = props
  const presentation = useContext(PresentationContext)
  const envMap = useStudioEnvironment()
  const low = quality === "low"

  const runtime = useMemo(() => createRuntime(), [])
  const { joints, rim, keyTarget, panel } = runtime
  const swing = useRef(0)
  const scrub = useRef<number | null>(null)
  const pausedAt = useRef<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const highlightRef = useRef(false)

  const playerRoot = useRef<Group>(null)
  const ballRef = useRef<Mesh>(null)
  const ringRef = useRef<Mesh>(null)
  const shadowRef = useRef<Mesh>(null)
  const keyRef = useRef<SpotLight>(null)

  const geos = useMemo(
    () => ({
      ball: new SphereGeometry(0.042, low ? 12 : 24, low ? 8 : 16),
      ring: new RingGeometry(0.16, 0.2, low ? 24 : 48),
      shadow: new PlaneGeometry(1.5, 1.1),
    }),
    [low]
  )
  const mats = useMemo(
    () => ({
      ball: new MeshPhysicalMaterial({
        color: "#d7ee45",
        roughness: 0.78,
        metalness: 0,
        sheen: 1,
        sheenColor: new Color("#f4ffb0"),
        sheenRoughness: 0.6,
        emissive: new Color("#556b0c"),
        emissiveIntensity: 0.5,
      }),
      ring: new ShaderMaterial({
        vertexShader: UV_VERTEX,
        fragmentShader: /* glsl */ `
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(vec3(0.96, 0.77, 0.32) * 1.6 * uOpacity, 1.0);
          }
        `,
        uniforms: { uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
      shadow: new ShaderMaterial({
        vertexShader: UV_VERTEX,
        fragmentShader: SHADOW_FRAGMENT,
        uniforms: { uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: false,
      }),
    }),
    []
  )

  useEffect(() => setEnvMap(mats.ball, envMap), [envMap, mats])

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

  // Driver: golpe, cámara y estado del mundo antes que el director (-2).
  useFrame(({ camera }, delta) => {
    const p = progress.current
    const scrolled = ramp(p, TIMELINE.swing[0], TIMELINE.swing[1])
    swing.current = scrub.current ?? pausedAt.current ?? scrolled
    driveWorld(runtime, {
      p,
      delta,
      isMobile,
      scrubbing: scrub.current !== null,
      reduced: experienceStore.getSnapshot().reducedMotion,
    })
    if (presentation) writeCameraPose(presentation.current, runtime.eye, runtime.target)
    else {
      camera.position.copy(runtime.eye)
      camera.lookAt(runtime.target)
    }
  }, -3)

  useFrame(({ camera }) => {
    animateScene(runtime, {
      p: progress.current,
      s: swing.current,
      alpha: presentation?.current.opacity ?? 1,
      highlight: highlightRef.current,
      scrubbing: scrub.current !== null,
      isMobile,
      camera,
      player: playerRoot.current,
      shadow: shadowRef.current,
      ball: ballRef.current,
      ring: ringRef.current,
      key: keyRef.current,
    })
  }, -1)

  useEffect(() => {
    highlightRef.current = highlight
  }, [highlight])

  const togglePause = useCallback(() => {
    if (pausedAt.current === null && scrub.current === null) {
      pausedAt.current = swing.current
      setPaused(true)
    } else {
      pausedAt.current = null
      scrub.current = null
      setPaused(false)
    }
    emitInteract("vibo:pause")
  }, [])
  const toggleHighlight = useCallback(() => {
    setHighlight((value) => !value)
    emitInteract("vibo:overlay")
  }, [])
  const onScrub = useCallback((value: number) => {
    scrub.current = value
    pausedAt.current = value
    setPaused(true)
    emitInteract("vibo:scrub")
  }, [])
  const onScrubEnd = useCallback(() => {
    scrub.current = null
  }, [])

  const pos = (id: JointId | "racketHead") => (): Vec3Tuple => {
    const v = joints[id]
    return [v.x, v.y, v.z]
  }

  const skeleton = useMemo<HudPoseSkeleton3D>(
    () => ({
      id: "pose",
      joints: (Object.keys(joints) as (JointId | "racketHead" | "center")[])
        .filter((id): id is JointId => id !== "racketHead" && id !== "center")
        .map((id) => ({
          id,
          position: pos(id),
          accent: id === "wristR" || id === "kneeR",
        })),
      bones: SKELETON_BONES,
      angleGauge: {
        vertexId: "kneeR",
        armAId: "hipR",
        armBId: "ankleR",
        label: "RODILLA",
        degrees: () => {
          const a = joints.hipR.clone().sub(joints.kneeR)
          const b = joints.ankleR.clone().sub(joints.kneeR)
          return MathUtils.radToDeg(a.angleTo(b))
        },
      },
      range: hudRange(isMobile),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [joints, isMobile]
  )

  const boxes = useMemo<HudBoundingBox3D[]>(
    () => [
      {
        id: "jugador",
        center: () => [joints.center.x, 0.98, joints.center.z],
        size: [1.05, 1.96, 0.7],
        label: "JUGADOR A",
        tag: `${SHOT.label.split(" · ")[0].toUpperCase()} · ${SHOT.hand.toUpperCase()}`,
        confidence: () => SHOT.frames[shotFrameIndex(swing.current)].conf,
        footerMetrics: [
          { label: "keypoints", value: "17/17" },
          { label: "fps", value: "30" },
        ],
        range: hudRange(isMobile),
      },
    ],
    [joints, isMobile]
  )

  const strikeMarkers = useMemo<HudMarkerItem[]>(
    () => [
      {
        id: "impacto",
        position: pos("racketHead"),
        offset: [54, -64],
        code: "IMPACTO",
        label: "Golpe detectado",
        value: `${SHOT.tSec.toFixed(1)} s`,
        unit: `f${SHOT.keyFrame}`,
        tone: "accent",
        range: [CONTACT_P - 0.03, CONTACT_P - 0.01, isMobile ? 0.41 : 0.53, isMobile ? 0.45 : 0.57],
      },
      {
        id: "brazo",
        position: pos("elbowR"),
        offset: [-200, -30],
        code: "POSE",
        label: "Brazo dominante",
        value: "Derecha",
        unit: "COCO-17",
        tone: "primary",
        range: [0.27, 0.3, 0.53, 0.57],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [joints, isMobile]
  )

  const zoneMarkers = useMemo<HudMarkerItem[]>(() => {
    const area = (pct: number) => `${((pct / 100) * 50).toFixed(1).replace(".", ",")} m²`
    const mid = 100 - COVERAGE.net - COVERAGE.back
    return [
      {
        id: "zona-a",
        position: heatCentroid(HEAT.hero),
        offset: isMobile ? [-150, -80] : [-210, -40],
        code: "JUGADOR A",
        label: "Área pisada en el punto",
        value: area(COVERAGE.hero),
        unit: `MEDIA ${mid}%`,
        tone: "accent",
        range: [0.62, 0.66, 0.78, 0.83],
      },
      {
        id: "zona-companero",
        position: heatCentroid(HEAT.partner),
        offset: [40, -60],
        code: "COMPAÑERO",
        label: "Área pisada en el punto",
        value: area(COVERAGE.partner),
        unit: "LADO DER.",
        tone: "primary",
        range: [0.64, 0.68, 0.78, 0.83],
      },
      {
        id: "zona-red",
        position: [0, 0.9, 0],
        offset: isMobile ? [-60, -90] : [30, -80],
        code: "PERFIL",
        label: "Tiempo junto a la red",
        value: `${COVERAGE.net}%`,
        unit: `FONDO ${COVERAGE.back}%`,
        tone: "positive",
        range: [0.66, 0.7, 0.78, 0.83],
      },
    ]
  }, [isMobile])

  const intensitySeries = useMemo(
    () => ({
      title: "Desgaste a lo largo del punto",
      subtitle: `Velocidad del jugador A · ${INTENSITY.length} s`,
      samples: INTENSITY,
      peakIndex: INTENSITY_PEAK,
      peakLabel: "pico",
      alertText: `Pico de exigencia en el segundo ${INTENSITY_PEAK + 1}`,
      unitLabel: "km/h rel.",
      drawRange: [0.81, 0.88] as [number, number],
    }),
    []
  )

  const counters = useMemo(
    () => [
      {
        id: "distancia",
        label: "Distancia",
        to: PLAYER.distanceMeters,
        decimals: 1,
        suffix: " m",
        tone: "accent" as const,
        range: [0.8, 0.86] as [number, number],
      },
      {
        id: "velocidad",
        label: "Velocidad máx.",
        to: PLAYER.maxSpeedKmh,
        decimals: 1,
        suffix: " km/h",
        tone: "primary" as const,
        range: [0.8, 0.86] as [number, number],
      },
    ],
    []
  )

  const bars = useMemo(
    () =>
      PLAYER.shotMix.slice(0, isMobile ? 2 : 4).map((shot) => ({
        id: shot.label,
        label: shot.label,
        value: Math.round((shot.count / PLAYER.totalShots) * 100),
        displayValue: `${shot.count} de ${PLAYER.totalShots}`,
        tone: "accent" as const,
      })),
    [isMobile]
  )

  const trailOpacity = useCallback(
    (p: number) => envelope(p, CONTACT_P - 0.01, 0.6, 0.03),
    []
  )
  const pipeline = useMemo(() => columnNodes(isMobile), [isMobile])
  const outgoingTrail = useCallback(() => trailPoints(runtime), [runtime])
  const trailDraw = useCallback(() => {
    const s = swing.current
    return s <= SWING.contact ? 0 : (s - SWING.contact) / (1 - SWING.contact)
  }, [])

  return (
    <group>
      {/* Tres puntos: reflector clave, relleno nocturno y contraluces azul/dorado. */}
      <hemisphereLight args={["#3a5680", "#0a0f18", 0.45]} />
      <primitive object={keyTarget} position={[HERO_POSITION[0], 1.25, HERO_POSITION[2]]} />
      <spotLight
        ref={keyRef}
        position={[FLOODLIGHTS[0][0] + 1.4, FLOODLIGHTS[0][1], FLOODLIGHTS[0][2] - 4.2]}
        target={keyTarget}
        color="#fff3e2"
        intensity={0}
        angle={0.78}
        penumbra={0.75}
        decay={0}
        distance={30}
      />
      <directionalLight position={[-6, 4.5, 12]} intensity={1.8} color="#3d8bff" />
      <directionalLight position={[3.5, 3.8, 11]} intensity={1.2} color="#f5c451" />

      <Court quality={quality} envMap={envMap} state={runtime.court} />

      <mesh
        ref={shadowRef}
        rotation-x={-Math.PI / 2}
        geometry={geos.shadow}
        material={mats.shadow}
        renderOrder={0}
      />

      <group ref={playerRoot}>
        <Suspense fallback={null}>
          <ViboPlayer
            quality={quality}
            envMap={envMap}
            swing={swing}
            joints={joints}
            contact={runtime.contact}
            rim={rim}
          />
        </Suspense>
      </group>

      <mesh ref={ballRef} geometry={geos.ball} material={mats.ball} visible={false} />
      <mesh ref={ringRef} geometry={geos.ring} material={mats.ring} visible={false} renderOrder={4} />

      <ThreadLine
        getPoints={outgoingTrail}
        progress={progress}
        quality={quality}
        color="#f5c451"
        headColor="#fff1c4"
        width={isMobile ? 0.03 : 0.024}
        draw={trailDraw}
        opacity={trailOpacity}
        pulseSpeed={0.6}
        pulseTail={0.22}
        showHead={false}
      />

      <HudOverlay
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={THEME}
        boxes={boxes}
        skeleton={skeleton}
        markers={isMobile ? strikeMarkers.slice(0, 1) : strikeMarkers}
        defaultSelectedId="impacto"
      />

      <AgentGraph
        nodes={pipeline}
        edges={PIPELINE_EDGES}
        progress={progress}
        quality={quality}
        isMobile
        active={active}
        theme={THEME}
        range={isMobile ? MOBILE_GRAPH : [...TIMELINE.graph]}
      />

      <HudOverlay
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={THEME}
        markers={zoneMarkers}
        defaultSelectedId="zona-a"
      />

      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={GOLD_THEME}
        eyebrow={`VIBO · ${PLAYER.name.toUpperCase()}`}
        heading="Tu lectura de partido"
        summary={`${PLAYER.hand} · ${PLAYER.tags.join(" · ")}. Estilo, repertorio y desgaste leídos de un punto real.`}
        counters={counters}
        bars={bars}
        trend={intensitySeries}
        range={[...TIMELINE.card]}
        placement="right"
      />

      <BodyLayer>
        <ViboPanel
          nodes={panel}
          isMobile={isMobile}
          paused={paused}
          highlight={highlight}
          onTogglePause={togglePause}
          onToggleHighlight={toggleHighlight}
          onScrub={onScrub}
          onScrubEnd={onScrubEnd}
        />
      </BodyLayer>
    </group>
  )
}

const GOLD = new Color("#f5c451")
const BLUE = new Color("#3d8bff")

type Runtime = ReturnType<typeof createRuntime>

function createRuntime() {
  return {
    court: createCourtState(),
    joints: createPlayerJoints(),
    rim: createRim(),
    contact: createContactProbe(),
    trail: samplePath((t) => ballOutgoing(t), 14),
    trailReady: false,
    keyTarget: new Object3D(),
    panel: createPanelNodes(),
    eye: new Vector3(),
    target: new Vector3(),
    elapsed: 0,
  }
}

function contactPoint(rt: Runtime): Vec3Tuple {
  const probe = rt.contact
  return probe.ready ? [probe.point.x, probe.point.y, probe.point.z] : CONTACT
}

function trailPoints(rt: Runtime) {
  if (!rt.trailReady && rt.contact.ready) {
    const contact = contactPoint(rt)
    rt.trail = samplePath((t) => ballOutgoing(t, contact), 14)
    rt.trailReady = true
  }
  return rt.trail
}

function setEnvMap(material: MeshPhysicalMaterial, envMap: Texture | null) {
  material.envMap = envMap
  material.needsUpdate = true
}

/** Cámara y estado del mundo, antes de que el director lea la pose (-2). */
function driveWorld(
  rt: Runtime,
  f: { p: number; delta: number; isMobile: boolean; scrubbing: boolean; reduced: boolean }
) {
  const { p, isMobile } = f
  const cam = interpolateCameraState(CAMERA_KEYS, p, isMobile, f.reduced)
  rt.elapsed += Math.min(f.delta, 0.05)
  rt.eye.set(...cam.position)
  rt.target.set(...cam.target)
  if (cam.sway > 0) {
    rt.eye.x += Math.sin(rt.elapsed * 0.7) * cam.sway
    rt.eye.y += Math.cos(rt.elapsed * 0.5) * cam.sway * 0.6
  }
  // En mobile el encuadre cerrado se abre un poco mientras se explora el golpe.
  if (isMobile && f.scrubbing) rt.eye.sub(rt.target).multiplyScalar(1.18).add(rt.target)

  const court = rt.court
  court.lines = ramp(p, TIMELINE.lines[0], TIMELINE.lines[1])
  FLOODLIGHTS.forEach((_, i) => {
    const start = TIMELINE.floodlights[0] + i * 0.025
    court.lights[i] = ramp(p, start, start + 0.05)
  })
  court.heat = beatEnvelope(p, ...TIMELINE.heat)
  court.dim = 1 - handoff(p) * 0.65
}

type AnimateFrame = {
  p: number
  s: number
  alpha: number
  highlight: boolean
  scrubbing: boolean
  isMobile: boolean
  camera: Camera
  player: Group | null
  shadow: Mesh | null
  ball: Mesh | null
  ring: Mesh | null
  key: SpotLight | null
}

function shotFrameIndex(s: number) {
  return MathUtils.clamp(Math.round(3 + (s - SWING.contact) * 14), 0, SHOT.frames.length - 1)
}

function animateScene(rt: Runtime, f: AnimateFrame) {
  const { p, s, alpha, court, joints } = { ...f, court: rt.court, joints: rt.joints }

  const playerIn = ramp(p, TIMELINE.playerIn[0], TIMELINE.playerIn[1])
  reveal(f.player, playerIn * (1 - ramp(p, 0.9, 0.98)))
  if (f.shadow) {
    f.shadow.position.set(joints.center.x, 0.012, joints.center.z)
    reveal(f.shadow, playerIn)
  }

  const contact = contactPoint(rt)
  const ballPos = ballAt(s, contact)
  const ballVisible = ballPos !== null && p < TIMELINE.swing[1] + 0.12
  if (f.ball) {
    if (ballPos) f.ball.position.set(...ballPos)
    reveal(f.ball, ballVisible ? 1 : 0)
  }
  if (f.ring) {
    const flash = Math.exp(-(((s - SWING.contact) / 0.045) ** 2))
    f.ring.position.set(...contact)
    f.ring.quaternion.copy(f.camera.quaternion)
    f.ring.scale.setScalar(0.6 + (s - SWING.contact + 0.05) * 9)
    reveal(f.ring, s > SWING.contact - 0.02 ? flash : 0)
  }

  const lit = (court.lights[0] + court.lights[1] + court.lights[2] + court.lights[3]) / 4
  if (f.key) f.key.intensity = 3.6 * lit * court.dim

  const rim = rt.rim
  rim.uRim.value = MathUtils.lerp(rim.uRim.value, 0.6 + (f.highlight ? 1.4 : 0), 0.12)
  rim.uRimColor.value.lerp(f.highlight ? GOLD : BLUE, 0.12)

  // Panel e inserto 2D: visibles solo durante el golpe.
  const panel = rt.panel
  const panelRange: Range4 = f.isMobile ? MOBILE_HUD : [...TIMELINE.panel]
  const panelAlpha = alpha * beatEnvelope(p, ...panelRange)
  if (panel.root) {
    panel.root.style.opacity = panelAlpha.toFixed(3)
    panel.root.style.visibility = panelAlpha > 0.01 ? "visible" : "hidden"
    panel.root.inert = panelAlpha < 0.5
  }
  if (panel.slider) {
    if (!f.scrubbing) panel.slider.value = s.toFixed(3)
    panel.slider.setAttribute("aria-valuetext", `${Math.round(s * 100)}% del golpe`)
  }
  if (panel.inset) {
    const insetAlpha = alpha * beatEnvelope(p, 0.22, 0.27, f.isMobile ? 0.42 : 0.54, f.isMobile ? 0.46 : 0.58)
    panel.inset.style.opacity = insetAlpha.toFixed(3)
    panel.inset.style.visibility = insetAlpha > 0.01 ? "visible" : "hidden"
    paintInset(panel, shotFrameIndex(s))
  }
}

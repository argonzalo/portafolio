import { useContext, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from "three"
import { ramp } from "@/experience/choreography"
import {
  PresentationContext,
  reveal,
  writeCameraPose,
} from "@/experience/presentation"
import { experienceStore } from "@/experience/store"
import type { SceneProps } from "@/experience/types"
import {
  AgentGraph,
  Display,
  HudOverlay,
  Laptop,
  TelemetryDeck,
  ThreadLine,
  beatEnvelope,
  interpolateCameraState,
  toRenderTier,
  useStudioEnvironment,
  type AgentEdgeDef,
  type AgentNodeDef,
  type BeatCameraFrame,
  type DeviceLayer,
  type HudMarkerItem,
  type KitBarDef,
  type KitCounterDef,
  type KitTheme,
  type Vec3Tuple,
} from "@/scenes/kit"
import { createRoundedSlabGeometry } from "@/scenes/kit/devices/geometry"

const AGNT_THEME: KitTheme = {
  id: "vibo",
  label: "AGNT · Mercado de Pases",
  tagline: "Pizarra de representación, órdenes de clubes y sincronización API-Football",
  scheme: "dark",
  background: "#0B1513",
  backgroundAlt: "#11221E",
  surface: "rgba(13, 27, 24, 0.88)",
  surfaceElevated: "rgba(18, 38, 34, 0.94)",
  border: "rgba(56, 200, 152, 0.36)",
  borderStrong: "rgba(110, 168, 254, 0.78)",
  text: "#EAF7F3",
  textMuted: "#9EC2B8",
  primary: "#38C898",
  accent: "#6EA8FE",
  positive: "#38C898",
  warning: "#F5C451",
  danger: "#F87171",
  gridColor: "#193831",
  glowColor: "rgba(56, 200, 152, 0.28)",
}

const CAMERA_FRAMES: readonly BeatCameraFrame[] = [
  {
    at: 0.0,
    desktop: [0.0, 2.35, 4.85],
    mobile: [0.0, 2.85, 6.45],
    target: [0.0, 0.1, 0.0],
    mobileTarget: [0.0, 0.15, 0.0],
    fov: 41,
    mobileFov: 49,
    sway: 0.025,
  },
  {
    at: 0.34,
    desktop: [-0.65, 1.95, 4.55],
    mobile: [0.0, 2.45, 6.1],
    target: [0.0, 0.25, 0.0],
    mobileTarget: [0.0, 0.3, 0.0],
    fov: 40,
    mobileFov: 48,
    sway: 0.024,
  },
  {
    at: 0.62,
    desktop: [0.45, 1.65, 4.45],
    mobile: [0.0, 2.1, 5.95],
    target: [0.1, 0.35, 0.0],
    mobileTarget: [0.0, 0.35, 0.0],
    fov: 39,
    mobileFov: 47,
    sway: 0.022,
  },
  {
    at: 0.86,
    desktop: [0.55, 1.35, 4.75],
    mobile: [0.0, 1.65, 6.15],
    target: [0.2, 0.38, -0.1],
    mobileTarget: [0.0, 0.38, -0.1],
    fov: 40,
    mobileFov: 48,
    sway: 0.02,
  },
  {
    at: 1.0,
    desktop: [0.4, 1.32, 4.9],
    mobile: [0.0, 1.62, 6.25],
    target: [0.15, 0.35, -0.1],
    mobileTarget: [0.0, 0.35, -0.1],
    fov: 40,
    mobileFov: 48,
    sway: 0.018,
  },
]

const PITCH_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const PITCH_FRAGMENT = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uGrid;
uniform vec3 uLine;
uniform vec3 uAccent;
uniform float uProgress;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vec2 p = (vUv - 0.5) * vec2(4.6, 3.0);

  // Grilla táctica fina
  vec2 g = abs(fract(p * 3.0 - 0.5) - 0.5) / fwidth(p * 3.0);
  float subGrid = 1.0 - min(min(g.x, g.y), 1.0);

  // Líneas reglamentarias de pizarra de fútbol
  float borderX = smoothstep(0.035, 0.0, abs(abs(p.x) - 2.1)) * step(abs(p.y), 1.35);
  float borderY = smoothstep(0.035, 0.0, abs(abs(p.y) - 1.35)) * step(abs(p.x), 2.1);
  float halfLine = smoothstep(0.03, 0.0, abs(p.x)) * step(abs(p.y), 1.35);
  float centerCircle = smoothstep(0.032, 0.0, abs(length(p) - 0.44));

  // Áreas grandes (izquierda y derecha)
  float boxL = (smoothstep(0.03, 0.0, abs(p.x + 1.48)) * step(abs(p.y), 0.68)) +
               (smoothstep(0.03, 0.0, abs(abs(p.y) - 0.68)) * step(-2.1, p.x) * step(p.x, -1.48));
  float boxR = (smoothstep(0.03, 0.0, abs(p.x - 1.48)) * step(abs(p.y), 0.68)) +
               (smoothstep(0.03, 0.0, abs(abs(p.y) - 0.68)) * step(1.48, p.x) * step(p.x, 2.1));

  float pitchLines = clamp(borderX + borderY + halfLine + centerCircle + boxL + boxR, 0.0, 1.0);

  // Barrido de sincronización API-Football
  float sweepX = -2.2 + fract(uProgress * 2.4) * 4.4;
  float sweep = exp(-pow((p.x - sweepX) * 3.2, 2.0)) * step(abs(p.x), 2.1) * step(abs(p.y), 1.35);

  vec3 col = mix(uBg, uGrid, subGrid * 0.35);
  col = mix(col, uLine, pitchLines * 0.85);
  col += uAccent * sweep * 0.42;

  gl_FragColor = vec4(col, 0.96 * uOpacity);
  #include <colorspace_fragment>
}
`

const TACTICAL_NODES: readonly AgentNodeDef[] = [
  {
    id: "player-rivas",
    label: "M. Rivas (#10 · FW)",
    decision: "Valor €24.5M · Disponible",
    metric: "7.8 RAT",
    desktop: [-1.45, 0.14, 0.32],
    mobile: [-0.34, 1.35, 0],
    triggerAt: 0.08,
  },
  {
    id: "club-origen",
    label: "Atlético Central (ARG)",
    decision: "Cláusula + Ficha activa",
    metric: "ORIGEN",
    desktop: [-0.55, 0.14, -0.42],
    mobile: [0.34, 0.72, 0],
    triggerAt: 0.22,
  },
  {
    id: "api-sync",
    label: "API-Football Sync",
    decision: "30 clubes · stats al día",
    metric: "29/7500 req",
    desktop: [0.15, 0.62, -0.15],
    mobile: [-0.34, 0.1, 0],
    triggerAt: 0.4,
  },
  {
    id: "club-destino",
    label: "Orden Club Destino (MEX)",
    decision: "Matching 94% · Extremo/9",
    metric: "OFERTA",
    desktop: [1.35, 0.14, 0.22],
    mobile: [0.34, -0.52, 0],
    triggerAt: 0.52,
  },
]

const TACTICAL_EDGES: readonly AgentEdgeDef[] = [
  {
    from: "player-rivas",
    to: "club-origen",
    arcHeight: 0.32,
    range: [0.06, 0.28],
  },
  {
    from: "club-origen",
    to: "api-sync",
    arcHeight: 0.38,
    range: [0.32, 0.48],
  },
  {
    from: "api-sync",
    to: "club-destino",
    arcHeight: 0.42,
    range: [0.42, 0.6],
  },
  {
    from: "player-rivas",
    to: "club-destino",
    arcHeight: 0.68,
    range: [0.36, 0.62],
  },
]

const TRANSFER_ARC_PRIMARY: readonly Vec3Tuple[] = [
  [-1.45, 0.05, 0.32],
  [-0.1, 0.95, 0.45],
  [1.35, 0.05, 0.22],
]

const TRANSFER_ARC_SECONDARY: readonly Vec3Tuple[] = [
  [-0.55, 0.05, -0.42],
  [0.42, 0.72, -0.12],
  [1.35, 0.05, 0.22],
]

const DISPLAY_LAYERS: readonly DeviceLayer[] = [
  {
    id: "agnt-player-intelligence",
    rect: [0.12, 0.14, 0.76, 0.31],
    depth: 0.28,
    scale: 1.04,
  },
]

const LAPTOP_LAYERS: readonly DeviceLayer[] = [
  {
    id: "agnt-api-panel",
    rect: [0.12, 0.42, 0.76, 0.46],
    depth: 0.26,
    scale: 1.04,
  },
]

const HUD_MARKERS: readonly HudMarkerItem[] = [
  {
    id: "market-value",
    position: [-1.45, 0.28, 0.32],
    offset: [-176, -52],
    code: "PERFIL #10",
    label: "Valuación y cláusula",
    value: "€24,5M",
    unit: "18G · 9A",
    tone: "primary",
    range: [0.04, 0.1, 0.62, 0.68],
  },
  {
    id: "api-football",
    position: [0.15, 0.68, -0.15],
    offset: [42, -48],
    code: "API-FOOTBALL",
    label: "Sincronización automática",
    value: "30 clubes",
    unit: "PRO LIVE",
    tone: "accent",
    range: [0.34, 0.4, 0.66, 0.72],
  },
]

const TELEMETRY_COUNTERS: readonly KitCounterDef[] = [
  {
    id: "goals",
    label: "Goles / Temporada",
    from: 0,
    to: 18,
    decimals: 0,
    suffix: " goles",
    detail: "M. Rivas · 31 PJ",
    tone: "primary",
    range: [0.7, 0.86],
  },
  {
    id: "teams",
    label: "Clubes conectados",
    from: 4,
    to: 30,
    decimals: 0,
    detail: "Liga Profesional · API Pro",
    tone: "accent",
    range: [0.72, 0.88],
  },
]

const TELEMETRY_BARS: readonly KitBarDef[] = [
  {
    id: "deal-progress",
    label: "Trazabilidad de operación (Jugador → Orden → Cierre)",
    value: 96,
    displayValue: "Punta a punta",
    tone: "primary",
  },
  {
    id: "api-freshness",
    label: "Datos vigentes vía API-Football",
    value: 100,
    displayValue: "Sync automático",
    tone: "accent",
  },
]

const TOKEN_COORDS: readonly [number, number][] = [
  [-1.45, 0.32],
  [-0.55, -0.42],
  [-0.95, -0.12],
  [0.25, 0.42],
  [0.68, -0.35],
  [1.35, 0.22],
]

export default function AgntScene(props: SceneProps) {
  const { progress, quality, isMobile, active } = props
  const presentation = useContext(PresentationContext)
  const tier = toRenderTier(quality)
  const low = tier === "low"
  const envMap = useStudioEnvironment()

  const eyeVec = useRef(new Vector3())
  const targetVec = useRef(new Vector3())
  const pitchMatRef = useRef<ShaderMaterial>(null)
  const boardGroupRef = useRef<Group>(null)
  const tokenRefs = useRef<(Mesh | null)[]>([])
  const displayGroupRef = useRef<Group>(null)
  const laptopGroupRef = useRef<Group>(null)

  const geos = useMemo(
    () => ({
      boardSlab: createRoundedSlabGeometry(4.8, 3.2, 0.14, 0.22, 0.038, tier),
      pitchPlane: new PlaneGeometry(4.56, 2.96, 1, 1),
      tokenCylinder: new CylinderGeometry(0.115, 0.13, 0.065, low ? 14 : 28),
      tokenRing: new RingGeometry(0.145, 0.185, low ? 16 : 32),
    }),
    [tier, low]
  )

  const mats = useMemo(() => {
    const frame = new MeshStandardMaterial({
      color: "#162622",
      metalness: 0.82,
      roughness: 0.24,
    })
    const tokenPrimary = new MeshStandardMaterial({
      color: "#38C898",
      metalness: 0.45,
      roughness: 0.22,
      emissive: new Color("#125E44"),
      emissiveIntensity: 0.5,
    })
    const tokenAccent = new MeshStandardMaterial({
      color: "#6EA8FE",
      metalness: 0.45,
      roughness: 0.24,
      emissive: new Color("#1F4B8E"),
      emissiveIntensity: 0.48,
    })
    const pitch = new ShaderMaterial({
      vertexShader: PITCH_VERTEX,
      fragmentShader: PITCH_FRAGMENT,
      uniforms: {
        uBg: { value: new Color("#0D1D1A") },
        uGrid: { value: new Color("#183630") },
        uLine: { value: new Color("#38C898") },
        uAccent: { value: new Color("#6EA8FE") },
        uProgress: { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })

    return { frame, tokenPrimary, tokenAccent, pitch }
  }, [])

  useEffect(() => {
    for (const mat of [mats.frame, mats.tokenPrimary, mats.tokenAccent]) {
      mat.envMap = envMap
      mat.envMapIntensity = 1.05
      mat.needsUpdate = true
    }
  }, [mats, envMap])

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

  useFrame(({ camera, scene }) => {
    const p = progress.current
    const reduced = experienceStore.getSnapshot().reducedMotion

    if (active) {
      const camState = interpolateCameraState(
        CAMERA_FRAMES,
        p,
        isMobile,
        reduced
      )
      eyeVec.current.set(...camState.position)
      targetVec.current.set(...camState.target)
      if (presentation) {
        writeCameraPose(presentation.current, eyeVec.current, targetVec.current)
      } else {
        camera.position.copy(eyeVec.current)
        camera.lookAt(targetVec.current)
        scene.background = new Color(AGNT_THEME.background)
      }
    }

    if (pitchMatRef.current) {
      pitchMatRef.current.uniforms.uProgress.value = p
    }

    const panelShift = ramp(p, 0.64, 0.84)

    if (boardGroupRef.current) {
      boardGroupRef.current.position.y = -0.18 - panelShift * 0.34
      boardGroupRef.current.position.z = -panelShift * 0.35
      boardGroupRef.current.rotation.x = MathUtils.lerp(
        -0.08,
        -0.22,
        panelShift
      )
      boardGroupRef.current.rotation.y = Math.sin(p * Math.PI) * 0.08
      const bScale = (isMobile ? 0.72 : 0.96) * (1 - panelShift * 0.12)
      boardGroupRef.current.scale.setScalar(bScale)
    }

    // Fichas tácticas sobre la pizarra con pulso sutil
    tokenRefs.current.forEach((mesh, idx) => {
      if (!mesh) return
      const [bx, bz] = TOKEN_COORDS[idx]
      const transferMove =
        idx === 0 ? ramp(p, 0.36, 0.62) * 0.42 : 0
      mesh.position.set(
        bx + transferMove,
        0.045 + Math.sin(p * 10 + idx) * 0.015,
        bz
      )
    })

    // Beat 3: Display (Presentación de jugador) + Laptop (Workspace API-Football)
    const devicesEnter = ramp(p, 0.62, 0.78)
    if (displayGroupRef.current) {
      reveal(displayGroupRef.current, devicesEnter)
      const dx = isMobile ? 0.0 : -0.58
      const dy = isMobile ? 0.35 : 0.08
      const dz = isMobile ? -0.45 : -0.55
      displayGroupRef.current.position.set(
        dx,
        dy + (1 - devicesEnter) * -0.2,
        dz
      )
      displayGroupRef.current.rotation.set(0, isMobile ? 0.05 : 0.22, 0)
      displayGroupRef.current.scale.setScalar(
        (isMobile ? 0.25 : 0.34) * MathUtils.lerp(0.88, 1, devicesEnter)
      )
    }

    if (laptopGroupRef.current) {
      reveal(laptopGroupRef.current, devicesEnter)
      const lx = isMobile ? 0.05 : 0.92
      const ly = isMobile ? -0.28 : -0.16
      const lz = isMobile ? 0.32 : 0.26
      laptopGroupRef.current.position.set(
        lx,
        ly + (1 - devicesEnter) * -0.18,
        lz
      )
      laptopGroupRef.current.rotation.set(0.06, isMobile ? -0.14 : -0.26, 0)
      laptopGroupRef.current.scale.setScalar(
        (isMobile ? 0.34 : 0.46) * MathUtils.lerp(0.88, 1, devicesEnter)
      )
    }
  }, -1)

  const panelPower = () => ramp(progress.current, 0.62, 0.78)
  const panelSeparation = () => ramp(progress.current, 0.72, 0.88)

  return (
    <group>
      {/* Esquema de iluminación de 3 puntos (Rúbrica 03 §8.1) */}
      <ambientLight intensity={0.42} color="#B6E8D8" />
      <directionalLight
        position={[3.6, 5.4, 3.8]}
        intensity={2.1}
        color="#F0FAF6"
      />
      <directionalLight
        position={[-4.0, 2.6, -2.5]}
        intensity={1.35}
        color="#38C898"
      />
      <pointLight
        position={[0.5, 1.8, 2.2]}
        intensity={1.5}
        distance={8}
        color="#6EA8FE"
      />

      {/* Elemento distintivo: Pizarra táctica 3D biselada con campo y fichas de jugadores */}
      <group ref={boardGroupRef} position={[0, -0.18, 0]}>
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, -0.07, 0]}
          geometry={geos.boardSlab}
          material={mats.frame}
        />
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 0.005, 0]}
          geometry={geos.pitchPlane}
          material={mats.pitch}
        >
          <primitive ref={pitchMatRef} object={mats.pitch} attach="material" />
        </mesh>

        {/* Fichas tácticas PBR sobre la pizarra */}
        {TOKEN_COORDS.map(([x, z], idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              tokenRefs.current[idx] = el
            }}
            position={[x, 0.045, z]}
            geometry={geos.tokenCylinder}
            material={idx % 2 === 0 ? mats.tokenPrimary : mats.tokenAccent}
          />
        ))}

        {/* Arcos 3D de traspasos sobre el tablero (Beat 2) */}
        <ThreadLine
          points={TRANSFER_ARC_PRIMARY}
          progress={progress}
          quality={quality}
          color="#38C898"
          headColor="#6EA8FE"
          width={0.036}
          draw={[0.3, 0.56]}
          opacity={(p) => beatEnvelope(p, 0.28, 0.36, 0.66, 0.74)}
          pulseSpeed={1.05}
          pulseTail={0.2}
          showHead={!low}
          headSize={22}
        />

        <ThreadLine
          points={TRANSFER_ARC_SECONDARY}
          progress={progress}
          quality={quality}
          color="#6EA8FE"
          headColor="#EAF7F3"
          width={0.028}
          draw={[0.36, 0.62]}
          opacity={(p) => beatEnvelope(p, 0.34, 0.42, 0.66, 0.74)}
          pulseSpeed={1.2}
          pulseTail={0.16}
          showHead={!low}
          headSize={18}
        />
      </group>

      {/* Grafo de nodos (Jugadores → Clubes → API-Football) */}
      <AgentGraph
        nodes={TACTICAL_NODES}
        edges={TACTICAL_EDGES}
        progress={progress}
        quality={quality}
        isMobile={isMobile}
        active={active}
        theme={AGNT_THEME}
        range={[0.04, 0.1, 0.64, 0.72]}
        interactive
      />

      {/* Beat 3: Display 27" con ficha de jugador + Laptop con sincronización API-Football */}
      <group ref={displayGroupRef} visible={false}>
        <Display
          quality={quality}
          finish="graphite"
          variant="monitor"
          stand="studio"
          screen={{
            src: "/images/proyects/agnt/3.webp",
            fit: "cover",
            align: "top",
            power: panelPower,
            separation: panelSeparation,
            layers: low ? DISPLAY_LAYERS.slice(0, 1) : DISPLAY_LAYERS,
            brightness: 1.1,
          }}
        />
      </group>

      <group ref={laptopGroupRef} visible={false}>
        <Laptop
          quality={quality}
          finish="space-black"
          open={panelPower}
          screen={{
            src: "/images/proyects/agnt/2.webp",
            fit: "cover",
            align: "top",
            power: panelPower,
            separation: panelSeparation,
            layers: LAPTOP_LAYERS,
            brightness: 1.1,
          }}
        />
      </group>

      {/* Callouts táctiles en Beats 1 y 2 */}
      <HudOverlay
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={AGNT_THEME}
        markers={HUD_MARKERS}
        defaultSelectedId="market-value"
      />

      {/* Panel de métricas del mercado en Beat 3 */}
      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={AGNT_THEME}
        eyebrow="AGNT · MERCADO Y REPRESENTACIÓN"
        heading="Cartera, órdenes y traspasos sobre datos vigentes"
        summary="Representantes, jugadores y clubes en un mismo sistema sincronizado automáticamente con API-Football."
        counters={TELEMETRY_COUNTERS}
        bars={TELEMETRY_BARS}
        range={[0.68, 0.74, 0.96, 1.0]}
        placement="bottom-right"
      />
    </group>
  )
}

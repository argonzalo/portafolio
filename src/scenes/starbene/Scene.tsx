import { useContext, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  TorusGeometry,
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
  HudOverlay,
  Laptop,
  Phone,
  TelemetryDeck,
  ThreadLine,
  beatEnvelope,
  interpolateCameraState,
  toRenderTier,
  useStudioEnvironment,
  type BeatCameraFrame,
  type DeviceLayer,
  type HudBoundingBox3D,
  type HudMarkerItem,
  type KitBarDef,
  type KitCounterDef,
  type KitTheme,
  type Vec3Tuple,
} from "@/scenes/kit"
import {
  createRoundedPlaneGeometry,
  createRoundedSlabGeometry,
} from "@/scenes/kit/devices/geometry"

const STARBENE_THEME: KitTheme = {
  id: "vibo",
  label: "Starbene · Ecosistema Posventa",
  tagline: "Equipo médico-estético, app de soporte y vidriera comercial",
  scheme: "dark",
  background: "#0B1124",
  backgroundAlt: "#121C38",
  surface: "rgba(13, 21, 44, 0.86)",
  surfaceElevated: "rgba(19, 31, 64, 0.94)",
  border: "rgba(75, 107, 255, 0.36)",
  borderStrong: "rgba(124, 198, 184, 0.78)",
  text: "#EEF4FF",
  textMuted: "#A6B8D6",
  primary: "#4B6BFF",
  accent: "#7CC6B8",
  positive: "#5EEAD4",
  warning: "#F5C451",
  danger: "#F87171",
  gridColor: "#1B2A52",
  glowColor: "rgba(75, 107, 255, 0.30)",
}

const CAMERA_FRAMES: readonly BeatCameraFrame[] = [
  {
    at: 0.0,
    desktop: [0.35, 1.35, 4.95],
    mobile: [0.0, 1.55, 6.45],
    target: [-0.25, 0.22, 0.0],
    mobileTarget: [0.0, 0.35, 0.0],
    fov: 40,
    mobileFov: 48,
    sway: 0.028,
  },
  {
    at: 0.32,
    desktop: [-0.45, 1.18, 4.55],
    mobile: [0.0, 1.42, 6.1],
    target: [-0.35, 0.25, 0.0],
    mobileTarget: [0.0, 0.38, 0.0],
    fov: 39,
    mobileFov: 47,
    sway: 0.025,
  },
  {
    at: 0.56,
    desktop: [0.55, 1.08, 4.35],
    mobile: [0.08, 1.28, 5.75],
    target: [0.22, 0.28, 0.15],
    mobileTarget: [0.0, 0.45, 0.1],
    fov: 38,
    mobileFov: 46,
    sway: 0.022,
  },
  {
    at: 0.84,
    desktop: [0.85, 1.22, 4.85],
    mobile: [0.0, 1.38, 6.25],
    target: [0.35, 0.22, 0.05],
    mobileTarget: [0.0, 0.28, 0.05],
    fov: 41,
    mobileFov: 48,
    sway: 0.024,
  },
  {
    at: 1.0,
    desktop: [0.7, 1.25, 5.05],
    mobile: [0.0, 1.42, 6.35],
    target: [0.25, 0.2, 0.0],
    mobileTarget: [0.0, 0.24, 0.0],
    fov: 41,
    mobileFov: 48,
    sway: 0.02,
  },
]

const FLOOR_VERTEX = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FLOOR_FRAGMENT = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uGrid;
uniform vec3 uPrimary;
uniform vec3 uAccent;
uniform float uProgress;
uniform float uOpacity;

varying vec3 vWorldPos;

void main() {
  vec2 coord = vWorldPos.xz;
  float dist = length(coord * vec2(0.82, 0.95));

  vec2 gridUv = abs(fract(coord * 1.15 - 0.5) - 0.5) / fwidth(coord * 1.15);
  float gridLine = 1.0 - min(min(gridUv.x, gridUv.y), 1.0);

  float ringA = smoothstep(0.05, 0.0, abs(dist - 1.15));
  float ringB = smoothstep(0.04, 0.0, abs(dist - 2.15));
  float pulseR = fract(uProgress * 2.2) * 2.6;
  float pulseRing = smoothstep(0.09, 0.0, abs(dist - pulseR)) * (1.0 - pulseR / 2.6);

  float radialMask = smoothstep(5.8, 0.65, dist);
  vec3 col = uBg;
  col = mix(col, uGrid, gridLine * 0.34 * radialMask);
  col += uPrimary * (ringA * 0.55 + pulseRing * 0.48) * radialMask;
  col += uAccent * (ringB * 0.42) * radialMask;

  gl_FragColor = vec4(col, radialMask * 0.92 * uOpacity);
  #include <colorspace_fragment>
}
`

const PHONE_LAYERS: readonly DeviceLayer[] = [
  {
    id: "starbene-unit-card",
    rect: [0.05, 0.15, 0.9, 0.26],
    depth: 0.16,
    scale: 1.05,
  },
  {
    id: "starbene-actions",
    rect: [0.05, 0.54, 0.9, 0.21],
    depth: 0.28,
    scale: 1.06,
    delay: 0.16,
  },
]

const LAPTOP_LAYERS: readonly DeviceLayer[] = [
  {
    id: "starbene-web-device",
    rect: [0.18, 0.14, 0.32, 0.72],
    depth: 0.24,
    scale: 1.04,
  },
  {
    id: "starbene-web-specs",
    rect: [0.54, 0.18, 0.38, 0.58],
    depth: 0.38,
    scale: 1.05,
    delay: 0.18,
  },
]

const TELEMETRY_COUNTERS: readonly KitCounterDef[] = [
  {
    id: "modules",
    label: "Módulos posventa",
    from: 1,
    to: 4,
    decimals: 0,
    detail: "Equipos · Cursos · Manuales · Service",
    tone: "accent",
    range: [0.7, 0.86],
  },
  {
    id: "platforms",
    label: "Superficies unificadas",
    from: 0,
    to: 2,
    decimals: 0,
    suffix: " apps",
    detail: "React Native + Next.js",
    tone: "primary",
    range: [0.72, 0.88],
  },
]

const TELEMETRY_BARS: readonly KitBarDef[] = [
  {
    id: "traceability",
    label: "Trazabilidad por número de serie (#7741)",
    value: 100,
    displayValue: " Serie + Garantía",
    tone: "accent",
  },
  {
    id: "catalog",
    label: "Catálogo comercial + academia clínica",
    value: 92,
    displayValue: "Web + Cursos",
    tone: "primary",
  },
]

function explodedAmount(progress: number): number {
  const open = ramp(progress, 0.04, 0.28)
  const settle = ramp(progress, 0.64, 0.86) * 0.45
  return MathUtils.clamp(open - settle, 0, 1)
}

export default function StarbeneScene(props: SceneProps) {
  const { progress, quality, isMobile, active } = props
  const presentation = useContext(PresentationContext)
  const tier = toRenderTier(quality)
  const low = tier === "low"
  const envMap = useStudioEnvironment()

  const eyeVec = useRef(new Vector3())
  const targetVec = useRef(new Vector3())
  const floorMatRef = useRef<ShaderMaterial>(null)

  const machineRootRef = useRef<Group>(null)
  const topConsoleRef = useRef<Group>(null)
  const coreModuleRef = useRef<Group>(null)
  const leftApplicatorRef = useRef<Group>(null)
  const rightApplicatorRef = useRef<Group>(null)
  const basePedestalRef = useRef<Group>(null)
  const energyRingRef = useRef<Mesh>(null)

  const phoneGroupRef = useRef<Group>(null)
  const laptopGroupRef = useRef<Group>(null)

  // Geometrías biseladas PBR (regla 03 §8.1: cero primitivas desnudas)
  const geos = useMemo(
    () => ({
      floor: new PlaneGeometry(11, 11, 1, 1),
      pedestal: createRoundedSlabGeometry(0.96, 0.24, 0.84, 0.12, 0.035, tier),
      lowerChassis: createRoundedSlabGeometry(0.76, 0.92, 0.64, 0.11, 0.032, tier),
      rfCore: createRoundedSlabGeometry(0.62, 0.42, 0.52, 0.09, 0.025, tier),
      rfCoil: new TorusGeometry(0.22, 0.022, low ? 8 : 14, low ? 24 : 40),
      consoleHead: createRoundedSlabGeometry(0.66, 0.48, 0.14, 0.07, 0.02, tier),
      consoleScreen: createRoundedPlaneGeometry(0.56, 0.38, 0.045, tier),
      consoleNeck: new CylinderGeometry(0.075, 0.105, 0.26, low ? 12 : 24),
      applicatorBody: createRoundedSlabGeometry(0.16, 0.44, 0.16, 0.05, 0.018, tier),
      applicatorTip: new CylinderGeometry(0.052, 0.068, 0.14, low ? 10 : 20),
      energyRing: new RingGeometry(0.46, 0.54, low ? 24 : 48),
    }),
    [tier, low]
  )

  const mats = useMemo(() => {
    const shell = new MeshStandardMaterial({
      color: "#F2F6FC",
      metalness: 0.12,
      roughness: 0.24,
    })
    const slateMetal = new MeshStandardMaterial({
      color: "#22304A",
      metalness: 0.78,
      roughness: 0.26,
    })
    const cobaltTrim = new MeshStandardMaterial({
      color: "#4B6BFF",
      metalness: 0.45,
      roughness: 0.28,
      emissive: new Color("#1D3399"),
      emissiveIntensity: 0.35,
    })
    const mintCore = new MeshStandardMaterial({
      color: "#7CC6B8",
      metalness: 0.35,
      roughness: 0.22,
      emissive: new Color("#2E8B7A"),
      emissiveIntensity: 0.55,
    })
    const screenGlow = new MeshBasicMaterial({
      color: "#4B6BFF",
      transparent: true,
      opacity: 0.9,
    })
    const energyRing = new MeshBasicMaterial({
      color: "#7CC6B8",
      side: DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: AdditiveBlending,
      depthWrite: false,
    })
    const floor = new ShaderMaterial({
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
      uniforms: {
        uBg: { value: new Color(STARBENE_THEME.background) },
        uGrid: { value: new Color(STARBENE_THEME.gridColor) },
        uPrimary: { value: new Color(STARBENE_THEME.primary) },
        uAccent: { value: new Color(STARBENE_THEME.accent) },
        uProgress: { value: 0 },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })

    return {
      shell,
      slateMetal,
      cobaltTrim,
      mintCore,
      screenGlow,
      energyRing,
      floor,
    }
  }, [])

  useEffect(() => {
    for (const mat of [
      mats.shell,
      mats.slateMetal,
      mats.cobaltTrim,
      mats.mintCore,
    ]) {
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

  const machineX = isMobile ? -0.42 : -0.95

  const hudBoxes = useMemo<readonly HudBoundingBox3D[]>(
    () => [
      {
        id: "starbene-unit",
        center: () => [isMobile ? -0.35 : -0.95, 0.32, 0],
        size: [1.15, 1.75, 0.9],
        label: "EQUIPO ALPHA SYNERGY",
        tag: "SERIE #7741",
        confidence: 0.98,
        footerMetrics: [
          { label: "garantía", value: "Activa" },
          { label: "módulos", value: "4 activos" },
        ],
        range: [0.02, 0.08, 0.44, 0.52],
      },
    ],
    [isMobile]
  )

  const hudMarkers = useMemo<readonly HudMarkerItem[]>(
    () => [
      {
        id: "capacitacion",
        position: (p) => {
          const ex = explodedAmount(p)
          return [
            (isMobile ? -0.42 : -0.95) - 0.12,
            0.78 + ex * 0.42,
            0.22,
          ]
        },
        offset: [-178, -48],
        code: "MOD 01",
        label: "Capacitación y protocolos",
        value: "Cursos + Video",
        unit: "APP",
        tone: "primary",
        range: [0.05, 0.12, 0.62, 0.68],
      },
      {
        id: "recambios",
        position: (p) => {
          const ex = explodedAmount(p)
          return [
            (isMobile ? -0.42 : -0.95) + 0.44 + ex * 0.34,
            0.38,
            0.18,
          ]
        },
        offset: [16, -98],
        code: "MOD 02",
        label: "Recambios y cabezales",
        value: "Catálogo 24h",
        unit: "STOCK",
        tone: "accent",
        range: [0.06, 0.14, 0.3, 0.38],
      },
      {
        id: "servicio",
        position: (p) => {
          const ex = explodedAmount(p)
          return [
            (isMobile ? -0.42 : -0.95) - 0.38 - ex * 0.3,
            -0.05 - ex * 0.18,
            0.2,
          ]
        },
        offset: [-176, 18],
        code: "MOD 03",
        label: "Documentación y service",
        value: "Ticket directo",
        unit: "SLA",
        tone: "positive",
        range: [0.1, 0.18, 0.62, 0.68],
      },
    ],
    [isMobile]
  )

  const connectionArcA = useMemo(
    () =>
      (p: number): readonly Vec3Tuple[] => {
        const ex = explodedAmount(p)
        const mx = isMobile ? -0.42 : -0.95
        const px = isMobile ? 0.38 : 0.42
        return [
          [mx, 0.72 + ex * 0.38, 0.12],
          [(mx + px) * 0.5, 0.92 + ex * 0.25, 0.42],
          [px, 0.52, 0.36],
        ]
      },
    [isMobile]
  )

  const connectionArcB = useMemo(
    () =>
      (p: number): readonly Vec3Tuple[] => {
        const ex = explodedAmount(p)
        const mx = isMobile ? -0.42 : -0.95
        const px = isMobile ? 0.38 : 0.42
        return [
          [mx + 0.38 + ex * 0.3, 0.32, 0.12],
          [(mx + px) * 0.5 + 0.15, 0.35, 0.52],
          [px, 0.12, 0.36],
        ]
      },
    [isMobile]
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
        scene.background = new Color(STARBENE_THEME.background)
      }
    }

    if (floorMatRef.current) {
      floorMatRef.current.uniforms.uProgress.value = p
    }

    const ex = explodedAmount(p)
    const webShift = ramp(p, 0.64, 0.86)

    if (machineRootRef.current) {
      machineRootRef.current.position.x =
        machineX - webShift * (isMobile ? 0.28 : 0.45)
      machineRootRef.current.rotation.y =
        0.32 + p * 0.45 - webShift * 0.2
      const mScale = (isMobile ? 0.78 : 0.95) * (1 - webShift * 0.14)
      machineRootRef.current.scale.setScalar(mScale)
    }

    if (topConsoleRef.current) {
      topConsoleRef.current.position.y = 0.68 + ex * 0.42
      topConsoleRef.current.rotation.x = -0.18 - ex * 0.12
    }

    if (coreModuleRef.current) {
      coreModuleRef.current.position.y = 0.24 + ex * 0.14
      coreModuleRef.current.position.z = ex * 0.28
      coreModuleRef.current.rotation.y = p * 1.6
    }

    if (leftApplicatorRef.current) {
      leftApplicatorRef.current.position.set(
        -0.46 - ex * 0.34,
        0.32 + ex * 0.08,
        ex * 0.16
      )
      leftApplicatorRef.current.rotation.z = 0.12 + ex * 0.28
    }

    if (rightApplicatorRef.current) {
      rightApplicatorRef.current.position.set(
        0.46 + ex * 0.34,
        0.32 + ex * 0.08,
        ex * 0.16
      )
      rightApplicatorRef.current.rotation.z = -0.12 - ex * 0.28
    }

    if (basePedestalRef.current) {
      basePedestalRef.current.position.y = -0.56 - ex * 0.22
    }

    if (energyRingRef.current) {
      energyRingRef.current.scale.setScalar(0.85 + ex * 0.38)
      energyRingRef.current.rotation.z = p * 3.2
    }

    // Teléfono Starbene+ (Beat 2 protagonista, cede protagonismo a la Web en Beat 3)
    const phoneEnv = beatEnvelope(p, 0.26, 0.4, 0.64, 0.74)
    if (phoneGroupRef.current) {
      reveal(phoneGroupRef.current, phoneEnv)
      const px = isMobile
        ? MathUtils.lerp(0.28, -0.26, webShift)
        : MathUtils.lerp(0.45, 0.05, webShift)
      const py = isMobile
        ? MathUtils.lerp(0.32, 0.56, webShift)
        : MathUtils.lerp(0.32, 0.44, webShift)
      const pz = MathUtils.lerp(0.38, 0.52, webShift)
      phoneGroupRef.current.position.set(px, py, pz)
      phoneGroupRef.current.rotation.set(
        -0.08,
        MathUtils.lerp(-0.28, -0.05, webShift),
        0.03
      )
      const ps = (isMobile ? 0.92 : 1.12) * MathUtils.lerp(0.86, 1, phoneEnv)
      phoneGroupRef.current.scale.setScalar(ps)
    }

    // Laptop Web Comercial (Beat 3)
    const laptopEnter = ramp(p, 0.62, 0.78)
    if (laptopGroupRef.current) {
      reveal(laptopGroupRef.current, laptopEnter)
      const lx = isMobile ? 0.05 : 0.78
      const ly = isMobile ? -0.32 : -0.24
      const lz = isMobile ? 0.25 : 0.22
      laptopGroupRef.current.position.set(
        lx,
        ly + (1 - laptopEnter) * -0.18,
        lz
      )
      laptopGroupRef.current.rotation.set(0.06, isMobile ? -0.12 : -0.26, 0)
      const ls = (isMobile ? 0.36 : 0.5) * MathUtils.lerp(0.88, 1, laptopEnter)
      laptopGroupRef.current.scale.setScalar(ls)
    }
  }, -1)

  const phonePower = () => beatEnvelope(progress.current, 0.28, 0.4, 0.64, 0.74)
  const phoneSeparation = () =>
    beatEnvelope(progress.current, 0.36, 0.45, 0.62, 0.72)
  const laptopPower = () => ramp(progress.current, 0.64, 0.78)
  const laptopSeparation = () => ramp(progress.current, 0.72, 0.88)
  const laptopOpen = () => ramp(progress.current, 0.6, 0.78)

  return (
    <group>
      {/* Esquema de iluminación de 3 puntos (Rúbrica 03 §8.1) */}
      <ambientLight intensity={0.45} color="#B8CCF8" />
      <directionalLight
        position={[3.8, 5.2, 4.2]}
        intensity={2.2}
        color="#F5F8FF"
      />
      <directionalLight
        position={[-4.2, 2.4, -2.6]}
        intensity={1.35}
        color="#4B6BFF"
      />
      <pointLight
        position={[0.2, 1.6, -2.4]}
        intensity={1.65}
        distance={8}
        color="#7CC6B8"
      />

      {/* Piso técnico con anillos de telemetría */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -0.78, 0]}
        geometry={geos.floor}
        material={mats.floor}
      >
        <primitive ref={floorMatRef} object={mats.floor} attach="material" />
      </mesh>

      {/* Elemento distintivo: Equipo médico-estético en vista explosionada */}
      <group ref={machineRootRef} position={[machineX, 0, 0]}>
        {/* Pedestal / base rodante */}
        <group ref={basePedestalRef} position={[0, -0.56, 0]}>
          <mesh geometry={geos.pedestal} material={mats.slateMetal} />
        </group>

        {/* Chasis clínico principal */}
        <mesh
          position={[0, -0.05, 0]}
          geometry={geos.lowerChassis}
          material={mats.shell}
        />

        {/* Núcleo interno RF + bobina electromagnética (se adelanta al explosionar) */}
        <group ref={coreModuleRef} position={[0, 0.24, 0]}>
          <mesh geometry={geos.rfCore} material={mats.slateMetal} />
          <mesh
            position={[0, 0, 0.28]}
            geometry={geos.rfCoil}
            material={mats.mintCore}
          />
        </group>

        {/* Anillo de energía horizontal */}
        <mesh
          ref={energyRingRef}
          position={[0, 0.35, 0]}
          rotation-x={-Math.PI / 2}
          geometry={geos.energyRing}
          material={mats.energyRing}
        />

        {/* Cabezal / consola táctil superior */}
        <group ref={topConsoleRef} position={[0, 0.68, 0]}>
          <mesh
            position={[0, -0.18, -0.02]}
            geometry={geos.consoleNeck}
            material={mats.slateMetal}
          />
          <mesh geometry={geos.consoleHead} material={mats.shell} />
          <mesh
            position={[0, 0, 0.074]}
            geometry={geos.consoleScreen}
            material={mats.screenGlow}
          />
        </group>

        {/* Manípulo / aplicador izquierdo */}
        <group ref={leftApplicatorRef} position={[-0.46, 0.32, 0]}>
          <mesh geometry={geos.applicatorBody} material={mats.shell} />
          <mesh
            position={[0, 0.26, 0]}
            geometry={geos.applicatorTip}
            material={mats.cobaltTrim}
          />
        </group>

        {/* Manípulo / aplicador derecho */}
        <group ref={rightApplicatorRef} position={[0.46, 0.32, 0]}>
          <mesh geometry={geos.applicatorBody} material={mats.shell} />
          <mesh
            position={[0, 0.26, 0]}
            geometry={geos.applicatorTip}
            material={mats.mintCore}
          />
        </group>
      </group>

      {/* Arcos del shader del hilo que conectan las piezas explosionadas con la App */}
      <ThreadLine
        getPoints={connectionArcA}
        progress={progress}
        quality={quality}
        color="#4B6BFF"
        headColor="#7CC6B8"
        width={0.032}
        draw={[0.3, 0.48]}
        opacity={(p) => beatEnvelope(p, 0.28, 0.36, 0.62, 0.72)}
        pulseSpeed={0.85}
        pulseTail={0.18}
        showHead={!low}
        headSize={20}
      />

      <ThreadLine
        getPoints={connectionArcB}
        progress={progress}
        quality={quality}
        color="#7CC6B8"
        headColor="#EEF4FF"
        width={0.028}
        draw={[0.34, 0.52]}
        opacity={(p) => beatEnvelope(p, 0.32, 0.4, 0.62, 0.72)}
        pulseSpeed={0.95}
        pulseTail={0.16}
        showHead={!low}
        headSize={18}
      />

      {/* Beat 2: Teléfono 3D con la App Starbene+ y capas flotantes */}
      <group ref={phoneGroupRef} visible={false}>
        <Phone
          quality={quality}
          finish="silver"
          back={false}
          screen={{
            src: "/images/proyects/starbene/app-mobile/starbene-mobile-showcase.webp",
            fit: "cover",
            align: "top",
            power: phonePower,
            separation: phoneSeparation,
            layers: low ? PHONE_LAYERS.slice(0, 1) : PHONE_LAYERS,
            brightness: 1.12,
          }}
        />
      </group>

      {/* Beat 3: Notebook 3D con la Web Comercial (productos, soluciones y cursos) */}
      <group ref={laptopGroupRef} visible={false}>
        <Laptop
          quality={quality}
          finish="midnight"
          open={laptopOpen}
          screen={{
            src: "/images/proyects/starbene/web-comercial/1.webp",
            fit: "cover",
            align: "top",
            power: laptopPower,
            separation: laptopSeparation,
            layers: low ? LAPTOP_LAYERS.slice(0, 1) : LAPTOP_LAYERS,
            brightness: 1.1,
          }}
        />
      </group>

      {/* HUD táctil anclado a las piezas del equipo */}
      <HudOverlay
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={STARBENE_THEME}
        boxes={hudBoxes}
        markers={hudMarkers}
        defaultSelectedId="capacitacion"
      />

      {/* Síntesis de ecosistema en el beat 3 */}
      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={STARBENE_THEME}
        eyebrow="STARBENE · POSVENTA + WEB"
        heading="Un solo ecosistema para equipos y clientes"
        summary="Las secciones de la app (capacitación, manuales, recambios y servicio técnico) nacen de cada pieza del equipo y se integran con la vidriera web."
        counters={TELEMETRY_COUNTERS}
        bars={TELEMETRY_BARS}
        range={[0.68, 0.74, 0.96, 1.0]}
        placement="bottom-right"
      />
    </group>
  )
}

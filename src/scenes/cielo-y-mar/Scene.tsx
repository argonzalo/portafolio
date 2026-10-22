import { useContext, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  Color,
  DoubleSide,
  Group,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
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
  Laptop,
  TelemetryDeck,
  beatEnvelope,
  computeFitTransform,
  getTextureAspect,
  interpolateCameraState,
  toRenderTier,
  useScreenTexture,
  useStudioEnvironment,
  type BeatCameraFrame,
  type DeviceLayer,
  type KitBarDef,
  type KitCounterDef,
  type KitTheme,
} from "@/scenes/kit"
import {
  createRoundedPlaneGeometry,
  createRoundedSlabGeometry,
} from "@/scenes/kit/devices/geometry"

const CIELO_THEME: KitTheme = {
  id: "vibo",
  label: "Cielo y Mar · Playa del Carmen",
  tagline: "Agua al atardecer, postal de suite y vidriera hotelera",
  scheme: "dark",
  background: "#0B1E2D",
  backgroundAlt: "#122B3E",
  surface: "rgba(11, 30, 45, 0.88)",
  surfaceElevated: "rgba(17, 42, 62, 0.94)",
  border: "rgba(22, 181, 168, 0.34)",
  borderStrong: "rgba(244, 162, 97, 0.76)",
  text: "#FFF8F0",
  textMuted: "#B8D0DC",
  primary: "#16B5A8",
  accent: "#F4A261",
  positive: "#16B5A8",
  warning: "#F4A261",
  danger: "#F87171",
  gridColor: "#17374D",
  glowColor: "rgba(22, 181, 168, 0.24)",
}

const CAMERA_FRAMES: readonly BeatCameraFrame[] = [
  {
    at: 0.0,
    desktop: [0.0, 0.82, 4.85],
    mobile: [0.0, 1.05, 6.2],
    target: [0.0, 0.14, -0.6],
    mobileTarget: [0.0, 0.16, -0.5],
    fov: 40,
    mobileFov: 48,
    sway: 0.018,
  },
  {
    at: 0.34,
    desktop: [-0.18, 0.92, 4.45],
    mobile: [0.0, 1.12, 5.85],
    target: [0.0, 0.24, 0.0],
    mobileTarget: [0.0, 0.26, 0.0],
    fov: 39,
    mobileFov: 47,
    sway: 0.015,
  },
  {
    at: 0.62,
    desktop: [0.15, 0.96, 4.35],
    mobile: [0.0, 1.16, 5.75],
    target: [0.04, 0.24, 0.05],
    mobileTarget: [0.0, 0.26, 0.04],
    fov: 38,
    mobileFov: 46,
    sway: 0.014,
  },
  {
    at: 0.86,
    desktop: [0.32, 1.04, 4.65],
    mobile: [0.0, 1.24, 6.0],
    target: [0.08, 0.2, 0.08],
    mobileTarget: [0.0, 0.22, 0.06],
    fov: 39,
    mobileFov: 47,
    sway: 0.012,
  },
  {
    at: 1.0,
    desktop: [0.24, 1.04, 4.75],
    mobile: [0.0, 1.24, 6.1],
    target: [0.06, 0.18, 0.06],
    mobileTarget: [0.0, 0.2, 0.06],
    fov: 39,
    mobileFov: 47,
    sway: 0.01,
  },
]

const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SKY_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;

void main() {
  // Gradiente atmosférico de atardecer en el Caribe:
  // horizonte cálido dorado/coral que asciende a turquesa crepuscular y azul sereno
  vec3 zenith = vec3(0.043, 0.118, 0.184);       // #0B1E2F
  vec3 midSky = vec3(0.094, 0.286, 0.368);       // #18495E
  vec3 horizonCoral = vec3(0.925, 0.545, 0.369); // #EC8B5E
  vec3 horizonGold = vec3(0.988, 0.835, 0.584);  // #FCD595

  float h = clamp(vUv.y, 0.0, 1.0);
  vec3 col = mix(horizonCoral, midSky, smoothstep(0.04, 0.48, h));
  col = mix(col, zenith, smoothstep(0.42, 0.96, h));

  // Brillo cálido del sol poniente sobre la línea del horizonte (sin bordes duros)
  vec2 sunDelta = (vUv - vec2(0.5, 0.10)) * vec2(1.45, 2.6);
  float sunDist = length(sunDelta);
  float sunGlow = exp(-sunDist * 3.4);
  float sunCore = exp(-sunDist * 11.0);

  col = mix(col, horizonGold, clamp(sunGlow * 0.68 + sunCore * 0.45, 0.0, 1.0));

  // Desvanecimiento suave únicamente en la base y el cénit para cubrir el viewport de punta a punta
  float edgeY = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.90, vUv.y);

  gl_FragColor = vec4(col, edgeY * uOpacity);
  #include <colorspace_fragment>
}
`

const OCEAN_VERTEX = /* glsl */ `
uniform float uTime;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vWaveHeight;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Atenuar desplazamiento en el borde del horizonte para una línea de horizonte 100 % limpia
  float horizonCalm = smoothstep(0.98, 0.72, uv.y);

  // Oleaje sereno de mar caribeño
  float w1 = sin(pos.x * 1.15 + uTime * 1.05) * 0.022 * horizonCalm;
  float w2 = cos(pos.y * 1.65 - uTime * 0.82) * 0.016 * horizonCalm;
  float w3 = sin((pos.x * 0.9 + pos.y * 1.3) * 2.1 + uTime * 1.35) * 0.009 * horizonCalm;
  float height = w1 + w2 + w3;

  pos.z += height;
  vWaveHeight = height;

  // Derivadas analíticas para reflexión Fresnel e iluminación especular limpia
  float dx = (1.15 * cos(pos.x * 1.15 + uTime * 1.05) * 0.022
           + 1.89 * cos((pos.x * 0.9 + pos.y * 1.3) * 2.1 + uTime * 1.35) * 0.009) * horizonCalm;
  float dy = (-1.65 * sin(pos.y * 1.65 - uTime * 0.82) * 0.016
           + 2.73 * cos((pos.x * 0.9 + pos.y * 1.3) * 2.1 + uTime * 1.35) * 0.009) * horizonCalm;

  vec3 localNormal = normalize(vec3(-dx, -dy, 1.0));
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorldPos = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * localNormal);

  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const OCEAN_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uCameraPos;

varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying float vWaveHeight;

void main() {
  vec2 coord = vWorldPos.xz;
  float dist = length(coord * vec2(0.46, 0.62));
  float radialMask = smoothstep(8.2, 1.6, dist);

  // Paleta de mar del Caribe (Playa del Carmen): turquesa cristalino, laguna y azul profundo
  vec3 shallowSand   = vec3(0.24, 0.84, 0.78); // #3DD6C7
  vec3 caribbeanTeal = vec3(0.06, 0.65, 0.64); // #0FA6A3
  vec3 deepOcean     = vec3(0.03, 0.22, 0.34); // #083857
  vec3 horizonWarm   = vec3(0.95, 0.68, 0.45); // #F2AD73
  vec3 sunGold       = vec3(1.00, 0.88, 0.66); // #FFE0A8

  // coord.y va de -5.2 (horizonte lejano) a +3.8 (orilla cercana)
  float shoreFactor = smoothstep(-4.6, 2.8, coord.y);
  vec3 water = mix(deepOcean, caribbeanTeal, smoothstep(0.0, 0.62, shoreFactor));
  water = mix(water, shallowSand, smoothstep(0.55, 1.0, shoreFactor) * 0.45);

  // Fresnel atmosférico hacia el horizonte cálido
  vec3 viewDir = normalize(uCameraPos - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormalW, viewDir), 0.0), 3.0);
  float horizonBlend = smoothstep(1.2, -4.4, coord.y);
  water = mix(water, horizonWarm, fresnel * horizonBlend * 0.58);

  // Cáusticas y ondulación fina del agua turquesa
  float rippleA = sin(coord.x * 4.2 + coord.y * 3.1 + uTime * 1.6);
  float rippleB = cos(coord.x * 3.4 - coord.y * 5.2 - uTime * 1.3);
  float caustic = smoothstep(0.35, 0.95, (rippleA * rippleB) * 0.5 + 0.5);
  water += shallowSand * caustic * 0.11 * shoreFactor;

  // Reflejo solar dorado continuo y sereno sobre el agua
  float waveOffset = vNormalW.x * 1.4 + sin(coord.y * 5.5 - uTime * 2.1) * 0.06;
  float sunColumn = exp(-pow((coord.x + waveOffset) * 1.45, 2.0) * 2.4);
  float sparkle = 0.68 + 0.32 * sin(coord.y * 12.0 - uTime * 2.6 + coord.x * 5.0);
  float sunPath = sunColumn * sparkle * smoothstep(2.6, -4.4, coord.y);

  vec3 finalColor = water + sunGold * sunPath * 0.54;

  gl_FragColor = vec4(finalColor, radialMask * 0.98 * uOpacity);
  #include <colorspace_fragment>
}
`

const LAPTOP_LAYERS: readonly DeviceLayer[] = [
  {
    id: "cielo-booking-bar",
    rect: [0.18, 0.68, 0.64, 0.1],
    depth: 0.22,
    scale: 1.03,
  },
  {
    id: "cielo-rooms-cta",
    rect: [0.18, 0.84, 0.64, 0.12],
    depth: 0.32,
    scale: 1.04,
    delay: 0.16,
  },
]

const TELEMETRY_COUNTERS: readonly KitCounterDef[] = [
  {
    id: "views",
    label: "Recorrido visual",
    from: 1,
    to: 3,
    decimals: 0,
    suffix: " vistas",
    detail: "Suites · Zonas · Experiencias",
    tone: "accent",
    range: [0.7, 0.86],
  },
  {
    id: "steps",
    label: "De la postal a la disponibilidad",
    from: 0,
    to: 1,
    decimals: 0,
    suffix: " flujo",
    detail: "Vidriera digital hotelera",
    tone: "primary",
    range: [0.72, 0.88],
  },
]

const TELEMETRY_BARS: readonly KitBarDef[] = [
  {
    id: "rooms",
    label: "Presentación de suites y disponibilidad inmediata",
    value: 96,
    displayValue: "Habitaciones + Tarifas",
    tone: "accent",
  },
  {
    id: "location",
    label: "Mapa interactivo · Playa, cenotes y 5ta Avenida",
    value: 92,
    displayValue: "Guía local",
    tone: "primary",
  },
]

export default function CieloYMarScene(props: SceneProps) {
  const { progress, quality, isMobile, active } = props
  const presentation = useContext(PresentationContext)
  const tier = toRenderTier(quality)
  const low = tier === "low"
  const envMap = useStudioEnvironment()

  const eyeVec = useRef(new Vector3())
  const targetVec = useRef(new Vector3())
  const oceanMatRef = useRef<ShaderMaterial>(null)
  const skyMatRef = useRef<ShaderMaterial>(null)
  const postcardGroupRef = useRef<Group>(null)
  const laptopGroupRef = useRef<Group>(null)
  const elapsedRef = useRef(0)

  const screenshotTex = useScreenTexture(
    "/images/proyects/varios/cielo-y-mar/1.webp"
  )

  const postcardMap = useMemo(() => {
    if (!screenshotTex) return null
    const transform = computeFitTransform(
      getTextureAspect(screenshotTex),
      2.12 / 1.34,
      "cover",
      "center"
    )
    const clone = screenshotTex.clone()
    clone.repeat.set(transform.repeat[0], transform.repeat[1])
    clone.offset.set(transform.offset[0], transform.offset[1])
    clone.needsUpdate = true
    return clone
  }, [screenshotTex])

  useEffect(() => () => postcardMap?.dispose(), [postcardMap])

  const geos = useMemo(() => {
    const waterSegs = low ? 32 : 64
    return {
      skyBackdrop: new PlaneGeometry(24, 9.2, 1, 1),
      ocean: new PlaneGeometry(20, 12, waterSegs, waterSegs),
      postcardSlab: createRoundedSlabGeometry(2.26, 1.48, 0.055, 0.09, 0.018, tier),
      postcardFace: createRoundedPlaneGeometry(2.12, 1.34, 0.065, tier),
    }
  }, [tier, low])

  const mats = useMemo(() => {
    const sky = new ShaderMaterial({
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      uniforms: {
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
    })

    const ocean = new ShaderMaterial({
      vertexShader: OCEAN_VERTEX,
      fragmentShader: OCEAN_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uCameraPos: { value: new Vector3(0, 1, 5) },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })

    const warmFrame = new MeshStandardMaterial({
      color: "#FAF5EE",
      metalness: 0.14,
      roughness: 0.26,
    })

    const postcardPhoto = new MeshBasicMaterial({
      map: postcardMap,
      color: postcardMap ? "#FFFFFF" : "#16B5A8",
      toneMapped: false,
    })

    return {
      sky,
      ocean,
      warmFrame,
      postcardPhoto,
    }
  }, [postcardMap])

  useEffect(() => {
    for (const mat of [mats.warmFrame]) {
      mat.envMap = envMap
      mat.envMapIntensity = 1.0
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

  useFrame(({ camera, scene }, delta) => {
    const p = progress.current
    const reduced = experienceStore.getSnapshot().reducedMotion

    if (!reduced) {
      elapsedRef.current += Math.min(delta, 0.05)
    } else {
      elapsedRef.current = p * 4.0
    }

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
        scene.background = new Color(CIELO_THEME.background)
      }
    }

    if (oceanMatRef.current) {
      oceanMatRef.current.uniforms.uTime.value = elapsedRef.current
      oceanMatRef.current.uniforms.uCameraPos.value.copy(camera.position)
    }

    // Beat 2: La suite aparece como una postal arquitectónica limpia y da paso a la notebook en Beat 3
    const postcardEnv = beatEnvelope(p, 0.24, 0.36, 0.62, 0.72)
    const toLaptop = ramp(p, 0.58, 0.74)

    if (postcardGroupRef.current) {
      reveal(postcardGroupRef.current, postcardEnv)
      const px = MathUtils.lerp(0, -0.35, toLaptop)
      const py =
        0.34 +
        (1 - ramp(p, 0.24, 0.38)) * -0.22 +
        Math.sin(elapsedRef.current * 0.9) * 0.02
      const pz = MathUtils.lerp(0.18, -0.2, toLaptop)
      postcardGroupRef.current.position.set(px, py, pz)
      postcardGroupRef.current.rotation.set(
        -0.04 + toLaptop * 0.08,
        Math.sin(p * Math.PI) * 0.08 + toLaptop * 0.16,
        0
      )
      const pScale =
        (isMobile ? 0.78 : 0.98) *
        MathUtils.lerp(0.9, 1, postcardEnv) *
        (1 - toLaptop * 0.14)
      postcardGroupRef.current.scale.setScalar(pScale)
    }

    // Beat 3: La postal se convierte en el sitio web en una notebook
    const laptopEnter = ramp(p, 0.62, 0.78)
    if (laptopGroupRef.current) {
      reveal(laptopGroupRef.current, laptopEnter)
      const lx = isMobile ? 0.0 : 0.12
      const ly = isMobile ? -0.16 : -0.14
      const lz = isMobile ? 0.34 : 0.32
      laptopGroupRef.current.position.set(
        lx,
        ly + (1 - laptopEnter) * -0.18,
        lz
      )
      laptopGroupRef.current.rotation.set(0.04, isMobile ? -0.06 : -0.16, 0)
      laptopGroupRef.current.scale.setScalar(
        (isMobile ? 0.38 : 0.52) * MathUtils.lerp(0.88, 1, laptopEnter)
      )
    }
  }, -1)

  const laptopPower = () => ramp(progress.current, 0.62, 0.78)
  const laptopSeparation = () => ramp(progress.current, 0.74, 0.9)

  return (
    <group>
      {/* Esquema de iluminación cálida y turquesa de estudio (Rúbrica 03 §8.1) */}
      <ambientLight intensity={0.55} color="#FFF0DC" />
      <directionalLight
        position={[2.6, 4.4, -2.2]}
        intensity={2.2}
        color="#FFD49E"
      />
      <directionalLight
        position={[-3.6, 2.2, 3.0]}
        intensity={1.35}
        color="#16B5A8"
      />
      <pointLight
        position={[0.0, 1.4, 2.4]}
        intensity={1.25}
        distance={8}
        color="#F4A261"
      />

      {/* Telón atmosférico de cielo caribeño al atardecer (sin geometrías recortadas duras) */}
      <mesh
        position={[0, 1.55, -4.6]}
        geometry={geos.skyBackdrop}
        material={mats.sky}
      >
        <primitive ref={skyMatRef} object={mats.sky} attach="material" />
      </mesh>

      {/* Elemento distintivo 1: Mar caribeño turquesa con reflejo solar al atardecer */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, -0.58, -0.8]}
        geometry={geos.ocean}
        material={mats.ocean}
      >
        <primitive ref={oceanMatRef} object={mats.ocean} attach="material" />
      </mesh>

      {/* Elemento distintivo 2: La suite aparece como una postal arquitectónica enmarcada */}
      <group ref={postcardGroupRef} position={[0, 0.34, 0.18]} visible={false}>
        <mesh geometry={geos.postcardSlab} material={mats.warmFrame} />
        <mesh
          position={[0, 0, 0.031]}
          geometry={geos.postcardFace}
          material={mats.postcardPhoto}
        />
      </group>

      {/* Beat 3: La postal se convierte en el sitio web en una notebook */}
      <group ref={laptopGroupRef} visible={false}>
        <Laptop
          quality={quality}
          finish="silver"
          open={laptopPower}
          screen={{
            src: "/images/proyects/varios/cielo-y-mar/2.webp",
            fit: "cover",
            align: "top",
            power: laptopPower,
            separation: laptopSeparation,
            layers: low ? LAPTOP_LAYERS.slice(0, 1) : LAPTOP_LAYERS,
            brightness: 1.06,
          }}
        />
      </group>

      {/* Síntesis de la vidriera digital en el beat 3 */}
      <TelemetryDeck
        progress={progress}
        isMobile={isMobile}
        active={active}
        theme={CIELO_THEME}
        eyebrow="CIELO Y MAR · PLAYA DEL CARMEN"
        heading="La calma del Caribe en una vidriera que convierte"
        summary="Habitaciones en la Quinta Avenida a 250 m del mar, disponibilidad inmediata y recorrido visual de las suites."
        counters={TELEMETRY_COUNTERS}
        bars={TELEMETRY_BARS}
        range={[0.68, 0.74, 0.96, 1.0]}
        placement="bottom-right"
      />
    </group>
  )
}

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  ConeGeometry,
  DataTexture,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  LinearFilter,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Vector3,
  Vector4,
  type Texture,
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import type { QualityTier } from "@/experience/types"
import { createRoundedSlabGeometry } from "@/scenes/kit/devices/geometry"
import { HEAT, HEAT_GRID } from "./data"
import { COURT, FLOODLIGHTS, type CourtState } from "./world"

const HW = COURT.width / 2
const HL = COURT.length / 2

const FLOOR_VERTEX = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FLOOR_FRAGMENT = /* glsl */ `
uniform vec3 uBg;
uniform float uLines;
uniform vec4 uLights;
uniform float uHeat;
uniform float uDim;
uniform float uDetail;
uniform float uOpacity;
uniform sampler2D uHeatMap;
uniform vec3 uLightPos[4];
varying vec3 vWorld;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float lineMask(float d, float w) {
  float aa = fwidth(d) * 1.2;
  return 1.0 - smoothstep(w - aa, w + aa, d);
}

void main() {
  vec2 p = vWorld.xz;
  float inside = step(abs(p.x), ${HW.toFixed(1)}) * step(abs(p.y), ${HL.toFixed(1)});

  float grain = noise(p * 2.3) * 0.45 + noise(p * 9.0) * 0.3 + noise(p * 41.0) * 0.25;
  grain = mix(0.5, grain, uDetail);
  vec3 turf = mix(vec3(0.026, 0.072, 0.165), vec3(0.04, 0.11, 0.235), grain);
  // Pasadas de cepillado del césped, a lo largo de la cancha.
  turf *= 0.93 + 0.07 * step(0.5, fract(p.x * 0.5)) * uDetail;
  vec3 apron = vec3(0.016, 0.034, 0.07) * (0.85 + 0.3 * grain);
  vec3 col = mix(apron, turf, inside);

  float pool = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 d = p - uLightPos[i].xz * vec2(0.55, 0.9);
    pool += exp(-dot(d, d) / 22.0) * uLights[i];
  }
  float lit = dot(uLights, vec4(0.25));
  col *= 0.32 + lit * 0.55 + pool * 0.75;

  // Líneas reglamentarias: perímetro, servicio y central.
  float dEdge = min(
    abs(p.y) <= ${(HL + 0.03).toFixed(2)} ? abs(abs(p.x) - ${HW.toFixed(1)}) : 9.0,
    abs(p.x) <= ${(HW + 0.03).toFixed(2)} ? abs(abs(p.y) - ${HL.toFixed(1)}) : 9.0
  );
  float dService = abs(p.x) <= ${HW.toFixed(1)} ? abs(abs(p.y) - ${COURT.serviceLine.toFixed(2)}) : 9.0;
  float dCenter = abs(p.y) <= ${COURT.serviceLine.toFixed(2)} ? abs(p.x) : 9.0;
  float lines = lineMask(min(dEdge, min(dService, dCenter)), 0.028);
  float reach = uLines * 12.5;
  float radius = length(p * vec2(1.25, 0.62));
  float drawn = 1.0 - smoothstep(reach - 0.4, reach, radius);
  float front = exp(-pow((radius - reach) / 0.55, 2.0)) * step(0.001, uLines) * (1.0 - step(0.999, uLines));
  vec3 lineCol = vec3(0.86, 0.92, 1.0) * (0.55 + lit * 0.55);
  col = mix(col, lineCol, lines * drawn);
  col += vec3(0.96, 0.77, 0.32) * lines * front * 1.6;

  // Mapa de calor real (R = jugador A, G = compañero, B = rivales).
  vec2 uv = vec2((p.x + ${HW.toFixed(1)}) / ${COURT.width.toFixed(1)}, (p.y + ${HL.toFixed(1)}) / ${COURT.length.toFixed(1)});
  vec3 h = texture2D(uHeatMap, uv).rgb * inside;
  float hero = smoothstep(0.04, 1.0, h.r);
  float partner = smoothstep(0.04, 1.0, h.g);
  float rivals = smoothstep(0.04, 1.0, h.b);
  float bands = 0.75 + 0.25 * step(0.5, fract(h.r * 7.0));
  vec3 heat = vec3(0.96, 0.77, 0.32) * hero * bands * 1.25
            + vec3(0.25, 0.55, 1.0) * partner * 0.95
            + vec3(0.62, 0.68, 0.8) * rivals * 0.4;
  col = mix(col, col * 0.55, uHeat * 0.6 * inside);
  col += heat * uHeat;

  float edge = max(abs(p.x) / 10.5, abs(p.y) / 16.0);
  float fade = 1.0 - smoothstep(0.62, 1.0, edge);
  col = mix(uBg, col, fade * uDim);
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
`

const GLASS_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const GLASS_FRAGMENT = /* glsl */ `
uniform float uOpacity;
uniform float uLights;
uniform vec3 uRim;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vec3 view = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - abs(dot(normalize(vNormalW), view)), 2.2);
  float edgeX = smoothstep(0.035, 0.0, vUv.x) + smoothstep(0.965, 1.0, vUv.x);
  float edgeTop = smoothstep(0.975, 1.0, vUv.y);
  // Reflejo diagonal de los reflectores sobre el cristal.
  float streak = smoothstep(0.08, 0.0, abs(fract(vUv.x * 0.9 + vUv.y * 0.55 + 0.2) - 0.5) - 0.38);
  vec3 tint = vec3(0.55, 0.72, 1.0);
  vec3 col = tint * (0.05 + fres * 0.42) + uRim * (edgeX * 0.35 + edgeTop * 0.55) + vec3(1.0) * streak * 0.06 * uLights;
  float alpha = (0.05 + fres * 0.32 + (edgeX + edgeTop) * 0.35 + streak * 0.05) * (0.35 + 0.65 * uLights);
  gl_FragColor = vec4(col, alpha * uOpacity);
  #include <colorspace_fragment>
}
`

const FENCE_FRAGMENT = /* glsl */ `
uniform float uOpacity;
uniform float uLights;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  // Malla romboidal de 5 cm sobre las paredes laterales.
  vec2 cell = vec2(vWorld.z + vWorld.y, vWorld.z - vWorld.y) * 14.0;
  vec2 g = abs(fract(cell) - 0.5);
  vec2 aa = fwidth(cell);
  float wire = max(
    smoothstep(0.44 - aa.x, 0.44, g.x),
    smoothstep(0.44 - aa.y, 0.44, g.y)
  );
  float far = clamp(length(aa) * 2.5, 0.0, 1.0);
  float density = mix(wire, 0.22, far);
  float frame = smoothstep(0.03, 0.0, vUv.y) + smoothstep(0.97, 1.0, vUv.y);
  vec3 col = vec3(0.32, 0.42, 0.56) * (0.35 + 0.65 * uLights) + frame * 0.1;
  float alpha = (density * 0.55 + frame * 0.6) * (0.4 + 0.6 * uLights);
  gl_FragColor = vec4(col, alpha * uOpacity);
  #include <colorspace_fragment>
}
`

const CONE_VERTEX = /* glsl */ `
attribute float aGlow;
varying float vGlow;
varying float vHeight;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vGlow = aGlow;
  vHeight = uv.y;
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const CONE_FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying float vGlow;
varying float vHeight;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vec3 view = normalize(cameraPosition - vWorld);
  float facing = abs(dot(normalize(vNormalW), view));
  float body = pow(facing, 1.6) * smoothstep(0.0, 0.85, vHeight) * (1.0 - smoothstep(0.92, 1.0, vHeight));
  vec3 col = vec3(0.78, 0.86, 1.0) * body * 0.085 * vGlow;
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
`

const NET_FRAGMENT = /* glsl */ `
uniform float uOpacity;
uniform float uLights;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorld;
void main() {
  vec2 cell = vec2(vWorld.x, vWorld.y) * 22.0;
  vec2 g = abs(fract(cell) - 0.5);
  vec2 aa = fwidth(cell);
  float wire = max(
    smoothstep(0.42 - aa.x, 0.42, g.x),
    smoothstep(0.42 - aa.y, 0.42, g.y)
  );
  float far = clamp(length(aa) * 2.5, 0.0, 1.0);
  float density = mix(wire, 0.28, far);
  vec3 col = vec3(0.7, 0.78, 0.9) * (0.3 + 0.7 * uLights);
  gl_FragColor = vec4(col, density * 0.7 * uOpacity);
  #include <colorspace_fragment>
}
`

function heatTexture(): DataTexture {
  const { width, depth } = HEAT_GRID
  const data = new Uint8Array(width * depth * 4)
  for (let i = 0; i < width * depth; i++) {
    data[i * 4] = HEAT.hero[i]
    data[i * 4 + 1] = HEAT.partner[i]
    data[i * 4 + 2] = HEAT.rivals[i]
    data[i * 4 + 3] = 255
  }
  const texture = new DataTexture(data, width, depth, RGBAFormat)
  texture.magFilter = LinearFilter
  texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

type Panel = { center: Vector3; width: number; height: number; rotY: number }

function panels(kind: "glass" | "fence"): Panel[] {
  const list: Panel[] = []
  const h = COURT.wallHeight
  if (kind === "glass") {
    for (const z of [-HL, HL])
      for (let x = -HW + 1; x < HW; x += 2)
        list.push({ center: new Vector3(x, h / 2, z), width: 2, height: h, rotY: 0 })
    for (const x of [-HW, HW])
      for (const sign of [-1, 1])
        for (let d = 1; d < COURT.sideGlass; d += 2)
          list.push({
            center: new Vector3(x, h / 2, sign * (HL - d)),
            width: 2,
            height: h,
            rotY: Math.PI / 2,
          })
  } else {
    const span = HL - COURT.sideGlass
    for (const x of [-HW, HW])
      for (let z = -span + 1; z < span; z += 2)
        list.push({ center: new Vector3(x, h / 2, z), width: 2, height: h, rotY: Math.PI / 2 })
  }
  return list
}

function panelGeometry(list: Panel[]): BufferGeometry {
  const parts = list.map((panel) => {
    const g = new PlaneGeometry(panel.width, panel.height)
    g.rotateY(panel.rotY)
    g.translate(panel.center.x, panel.center.y, panel.center.z)
    return g
  })
  const merged = mergeGeometries(parts)
  for (const g of parts) g.dispose()
  return merged
}

function postPositions(): Vector3[] {
  const seen = new Set<string>()
  const out: Vector3[] = []
  const add = (x: number, z: number) => {
    const key = `${x}/${z}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(new Vector3(x, COURT.wallHeight / 2, z))
  }
  for (const z of [-HL, HL]) for (let x = -HW; x <= HW; x += 2) add(x, z)
  for (const x of [-HW, HW]) for (let z = -HL; z <= HL; z += 2) add(x, z)
  return out
}

type Props = {
  quality: QualityTier
  envMap: Texture | null
  state: CourtState
}

type CourtMaterials = {
  floor: ShaderMaterial
  glass: ShaderMaterial
  fence: ShaderMaterial
  net: ShaderMaterial
}

const emitterColor = new Color()

function syncCourt(
  mats: CourtMaterials,
  state: CourtState,
  coneGlow: InstancedBufferAttribute,
  emitters: InstancedMesh | null,
  background: unknown,
  low: boolean
) {
  const lit = (state.lights[0] + state.lights[1] + state.lights[2] + state.lights[3]) / 4
  const u = mats.floor.uniforms
  if (background instanceof Color) u.uBg.value.copy(background)
  u.uLines.value = state.lines
  u.uLights.value.set(...state.lights)
  u.uHeat.value = state.heat
  u.uDim.value = state.dim
  u.uDetail.value = low ? 0 : 1
  mats.glass.uniforms.uLights.value = lit * state.dim
  mats.fence.uniforms.uLights.value = lit * state.dim
  mats.net.uniforms.uLights.value = lit * state.dim
  state.lights.forEach((value, i) => {
    coneGlow.setX(i, value * state.dim)
    emitterColor.setScalar(0.08 + value * 2.6 * state.dim)
    emitters?.setColorAt(i, emitterColor)
  })
  coneGlow.needsUpdate = true
  if (emitters?.instanceColor) emitters.instanceColor.needsUpdate = true
}

export function Court({ quality, envMap, state }: Props) {
  const tier = quality === "static" ? "low" : quality
  const low = tier === "low"
  const high = tier === "high"
  const posts = useMemo(() => postPositions(), [])
  const conesRef = useRef<InstancedMesh>(null)
  const emitterRef = useRef<InstancedMesh>(null)
  const poleRef = useRef<InstancedMesh>(null)
  const headRef = useRef<InstancedMesh>(null)
  const postRef = useRef<InstancedMesh>(null)

  const geos = useMemo(
    () => ({
      floor: new PlaneGeometry(26, 38),
      glass: panelGeometry(panels("glass")),
      fence: panelGeometry(panels("fence")),
      post: createRoundedSlabGeometry(0.07, COURT.wallHeight + 0.05, 0.07, 0.025, 0.012, tier),
      net: new PlaneGeometry(COURT.width, COURT.netHeight - 0.06),
      netBand: createRoundedSlabGeometry(COURT.width + 0.1, 0.055, 0.03, 0.012, 0.006, tier),
      netPost: createRoundedSlabGeometry(0.09, 1.0, 0.09, 0.03, 0.012, tier),
      pole: createRoundedSlabGeometry(0.16, 6.4, 0.16, 0.06, 0.02, tier),
      head: createRoundedSlabGeometry(1.15, 0.5, 0.16, 0.06, 0.025, tier),
      emitter: new PlaneGeometry(1.0, 0.38),
      cone: (() => {
        const g = new ConeGeometry(3.4, 6.6, high ? 28 : 18, 1, true)
        g.translate(0, -3.3, 0)
        return g
      })(),
    }),
    [tier, high]
  )

  const heat = useMemo(() => heatTexture(), [])

  const mats = useMemo(() => {
    const floor = new ShaderMaterial({
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
      uniforms: {
        uBg: { value: new Color("#071426") },
        uLines: { value: 0 },
        uLights: { value: new Vector4() },
        uHeat: { value: 0 },
        uDim: { value: 1 },
        uDetail: { value: 1 },
        uOpacity: { value: 1 },
        uHeatMap: { value: heat },
        uLightPos: { value: FLOODLIGHTS.map((p) => new Vector3(...p)) },
      },
    })
    const glass = new ShaderMaterial({
      vertexShader: GLASS_VERTEX,
      fragmentShader: GLASS_FRAGMENT,
      uniforms: {
        uOpacity: { value: 1 },
        uLights: { value: 0 },
        uRim: { value: new Color("#5aa2ff") },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const fence = new ShaderMaterial({
      vertexShader: GLASS_VERTEX,
      fragmentShader: FENCE_FRAGMENT,
      uniforms: { uOpacity: { value: 1 }, uLights: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const net = new ShaderMaterial({
      vertexShader: GLASS_VERTEX,
      fragmentShader: NET_FRAGMENT,
      uniforms: { uOpacity: { value: 1 }, uLights: { value: 0 } },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    const cone = new ShaderMaterial({
      vertexShader: CONE_VERTEX,
      fragmentShader: CONE_FRAGMENT,
      uniforms: { uOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    })
    const metal = new MeshStandardMaterial({
      color: "#1b2638",
      metalness: 0.82,
      roughness: 0.34,
    })
    const tape = new MeshStandardMaterial({
      color: "#e8eef7",
      metalness: 0,
      roughness: 0.7,
    })
    const housing = new MeshStandardMaterial({
      color: "#252f3d",
      metalness: 0.7,
      roughness: 0.42,
    })
    const emitter = new MeshBasicMaterial({ color: "#ffffff", toneMapped: false })
    return { floor, glass, fence, net, cone, metal, tape, housing, emitter }
  }, [heat])

  useEffect(() => {
    for (const mat of [mats.metal, mats.tape, mats.housing]) {
      mat.envMap = envMap
      mat.envMapIntensity = 0.9
      mat.needsUpdate = true
    }
  }, [envMap, mats])

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      Object.values(mats).forEach((m) => m.dispose())
      heat.dispose()
    },
    [geos, mats, heat]
  )

  const coneGlow = useMemo(
    () => new InstancedBufferAttribute(new Float32Array(FLOODLIGHTS.length), 1),
    []
  )

  // Matrices estáticas de los instanciados.
  useEffect(() => {
    const dummy = new Object3D()
    const center = new Vector3(0, 0, 0)
    FLOODLIGHTS.forEach((pos, i) => {
      dummy.position.set(pos[0], pos[1] / 2, pos[2])
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      poleRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(pos[0] * 0.96, pos[1] + 0.05, pos[2])
      dummy.lookAt(center.set(0, 0, pos[2] * 0.5))
      dummy.rotateX(-0.55)
      dummy.updateMatrix()
      headRef.current?.setMatrixAt(i, dummy.matrix)
      dummy.translateZ(0.085)
      dummy.updateMatrix()
      emitterRef.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(pos[0] * 0.96, pos[1], pos[2])
      dummy.rotation.set(0, 0, 0)
      dummy.lookAt(center.set(pos[0] * 0.3, 0, pos[2] * 0.6))
      dummy.rotateX(-Math.PI / 2)
      dummy.updateMatrix()
      conesRef.current?.setMatrixAt(i, dummy.matrix)
    })
    posts.forEach((p, i) => {
      dummy.position.copy(p)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      postRef.current?.setMatrixAt(i, dummy.matrix)
    })
    for (const ref of [poleRef, headRef, emitterRef, conesRef, postRef]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true
    }
    conesRef.current?.geometry.setAttribute("aGlow", coneGlow)
  }, [posts, coneGlow, high, low])

  useFrame(({ scene }) => {
    syncCourt(mats, state, coneGlow, emitterRef.current, scene.background, low)
  })

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} geometry={geos.floor} material={mats.floor} renderOrder={-2} />

      {!low ? <mesh geometry={geos.glass} material={mats.glass} renderOrder={2} /> : null}
      <mesh geometry={geos.fence} material={mats.fence} renderOrder={1} />
      <instancedMesh
        ref={postRef}
        args={[geos.post, mats.metal, posts.length]}
      />

      <group position={[0, 0, 0]}>
        <mesh
          position={[0, (COURT.netHeight - 0.06) / 2, 0]}
          geometry={geos.net}
          material={mats.net}
          renderOrder={1}
        />
        <mesh position={[0, COURT.netHeight - 0.03, 0]} geometry={geos.netBand} material={mats.tape} />
        <mesh position={[-HW - 0.12, 0.5, 0]} geometry={geos.netPost} material={mats.metal} />
        <mesh position={[HW + 0.12, 0.5, 0]} geometry={geos.netPost} material={mats.metal} />
      </group>

      <instancedMesh ref={poleRef} args={[geos.pole, mats.metal, FLOODLIGHTS.length]} />
      <instancedMesh ref={headRef} args={[geos.head, mats.housing, FLOODLIGHTS.length]} />
      <instancedMesh ref={emitterRef} args={[geos.emitter, mats.emitter, FLOODLIGHTS.length]} />
      {!low ? (
        <instancedMesh
          ref={conesRef}
          args={[geos.cone, mats.cone, FLOODLIGHTS.length]}
          renderOrder={3}
          frustumCulled={false}
        />
      ) : null}
    </group>
  )
}

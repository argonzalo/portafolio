import {
  BufferAttribute,
  Color,
  Euler,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PropertyBinding,
  Quaternion,
  SkinnedMesh,
  Vector3,
  type Bone,
  type Group,
  type Interpolant,
  type KeyframeTrack,
  type Object3D,
  type Texture,
} from "three"
import type { AnimationClip } from "three"
import type { QualityTier } from "@/experience/types"
import { SWING } from "./world"

export type JointId =
  | "nose"
  | "shoulderL"
  | "shoulderR"
  | "elbowL"
  | "elbowR"
  | "wristL"
  | "wristR"
  | "hipL"
  | "hipR"
  | "kneeL"
  | "kneeR"
  | "ankleL"
  | "ankleR"

/** Posiciones de mundo actualizadas por frame; las lee el HUD. */
export type PlayerJoints = Record<JointId, Vector3> & {
  racketHead: Vector3
  center: Vector3
}

const JOINT_BONES: Record<Exclude<JointId, "nose">, string> = {
  shoulderL: "upper_armL",
  shoulderR: "upper_armR",
  elbowL: "forearmL",
  elbowR: "forearmR",
  wristL: "handL",
  wristR: "handR",
  hipL: "thighL",
  hipR: "thighR",
  kneeL: "shinL",
  kneeR: "shinR",
  ankleL: "footL",
  ankleR: "footR",
}

export function createPlayerJoints(): PlayerJoints {
  const ids: JointId[] = ["nose", ...(Object.keys(JOINT_BONES) as JointId[])]
  const joints = Object.fromEntries(
    ids.map((id) => [id, new Vector3()])
  ) as Record<JointId, Vector3>
  return { ...joints, racketHead: new Vector3(), center: new Vector3() }
}

export function playerUrls(quality: QualityTier) {
  const tier = quality === "static" ? "low" : quality
  return [`/models/vibo/jugador.${tier}.glb`, `/models/vibo/paleta.${tier}.glb`]
}

/** Maniquí técnico monocromo por zona en pose de reposo (A-pose, metros, frente +Z). */
const KIT = {
  base: new Color("#2c3035"),
  shell: new Color("#4a5056"),
  head: new Color("#5d636a"),
  joint: new Color("#a3a9b0"),
  sole: new Color("#16191c"),
}

/** Bandas finas en articulaciones: (centro y, semiancho) en metros. */
const JOINT_BANDS: [number, number][] = [
  [0.5, 0.012], // rodillas
  [1.0, 0.01], // cintura
  [1.58, 0.01], // cuello
]

function kitColor(p: Vector3, out: Color): Color {
  const ax = Math.abs(p.x)
  const y = p.y
  if (y < 0.035) return out.copy(KIT.sole)
  if (y < 0.11) return out.copy(KIT.base)
  // Brazos: carcasa en el brazo, banda en el codo.
  if (ax > 0.21 && y > 0.78) {
    const fromShoulder = Math.hypot(ax - 0.2, y - 1.44)
    if (Math.abs(fromShoulder - 0.29) < 0.012) return out.copy(KIT.joint)
    return out.copy(fromShoulder < 0.29 ? KIT.shell : KIT.base)
  }
  for (const [center, half] of JOINT_BANDS) {
    if (Math.abs(y - center) < half) return out.copy(KIT.joint)
  }
  if (y > 1.58) return out.copy(KIT.head)
  // Carcasas: muslos y torso más claros que la base.
  if ((y > 0.52 && y < 0.98) || (y > 1.02 && y < 1.5)) return out.copy(KIT.shell)
  return out.copy(KIT.base)
}

/** Medidas del modelo fuente (metros) para deshacer la cuantización del GLB. */
const SOURCE_HEIGHT = 1.8
const SOURCE_MIN_Z = -0.1082

type RestFrame = { min: Vector3; scale: number; centerX: number }

/** Las posiciones vienen cuantizadas (i16 normalizado): se recupera la escala en metros. */
function restFrame(meshes: SkinnedMesh[]): RestFrame {
  const min = new Vector3(Infinity, Infinity, Infinity)
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  const v = new Vector3()
  for (const mesh of meshes) {
    const position = mesh.geometry.getAttribute("position")
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.bindMatrix)
      min.min(v)
      max.max(v)
    }
  }
  return { min, scale: SOURCE_HEIGHT / (max.y - min.y), centerX: (min.x + max.x) / 2 }
}

function dressMesh(mesh: SkinnedMesh, frame: RestFrame) {
  const geometry = mesh.geometry
  const position = geometry.getAttribute("position")
  const colors = new Float32Array(position.count * 3)
  const rest = new Vector3()
  const color = new Color()
  for (let i = 0; i < position.count; i++) {
    rest.fromBufferAttribute(position, i).applyMatrix4(mesh.bindMatrix)
    rest.set(
      (rest.x - frame.centerX) * frame.scale,
      (rest.y - frame.min.y) * frame.scale,
      (rest.z - frame.min.z) * frame.scale + SOURCE_MIN_Z
    )
    kitColor(rest, color)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3))
}

export type RimUniforms = {
  uRimColor: { value: Color }
  uRim: { value: number }
}

export function createRim(): RimUniforms {
  return { uRimColor: { value: new Color("#c4ccd4") }, uRim: { value: 0.35 } }
}

/** Fresnel de contorno estilo replay: refuerza la separación del fondo. */
function addRim(material: MeshStandardMaterial, rim: RimUniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = rim.uRimColor
    shader.uniforms.uRim = rim.uRim
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uRimColor;\nuniform float uRim;"
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float rimFres = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 3.0);
        totalEmissiveRadiance += uRimColor * rimFres * uRim;`
      )
  }
  material.customProgramCacheKey = () => "vibo-rim"
}

const LAYERED_BONES = [
  "hips",
  "thighL",
  "thighR",
  "shinL",
  "shinR",
  "footL",
  "footR",
  "spine01",
  "spine02",
]

export type Rig = {
  scene: Group
  bones: Map<string, Bone>
  meshes: SkinnedMesh[]
  body: MeshStandardMaterial
  /** Pistas del clip del golpe muestreadas a mano en cada pose. */
  channels: Channel[]
  /** Pose de reposo de los huesos que toca la capa procedural. */
  rest: Map<Bone, { position: Vector3; quaternion: Quaternion }>
}

type Channel = {
  target: Object3D
  property: "position" | "quaternion" | "scale"
  interpolant: Interpolant
}

/**
 * Sin `AnimationMixer`: solo escribe en la escena cuando el valor cambia entre
 * frames, y `poseRig` restaura el reposo en cada frame; con el golpe quieto el
 * clip no se aplicaría.
 */
function bindClip(scene: Group, clip: AnimationClip | undefined): Channel[] {
  if (!clip) return []
  const channels: Channel[] = []
  for (const track of clip.tracks) {
    const { nodeName, propertyName } = PropertyBinding.parseTrackName(track.name)
    const target = scene.getObjectByName(nodeName)
    if (!target) continue
    if (propertyName !== "position" && propertyName !== "quaternion" && propertyName !== "scale")
      continue
    // `createInterpolant` existe en runtime (GLTFLoader lo sobrescribe para CUBICSPLINE) pero no en los tipos.
    const interpolant = (track as KeyframeTrack & { createInterpolant: () => Interpolant }).createInterpolant()
    channels.push({ target, property: propertyName, interpolant })
  }
  return channels
}

function sampleClip(channels: Channel[], time: number) {
  for (const { target, property, interpolant } of channels) {
    target[property].fromArray(interpolant.evaluate(time))
  }
}

export function buildRig(scene: Group, animations: AnimationClip[], rim: RimUniforms): Rig {
  const bones = new Map<string, Bone>()
  const meshes: SkinnedMesh[] = []
  scene.traverse((object: Object3D) => {
    if ((object as Bone).isBone) bones.set(object.name, object as Bone)
    if ((object as SkinnedMesh).isSkinnedMesh) {
      const mesh = object as SkinnedMesh
      mesh.frustumCulled = false
      meshes.push(mesh)
    }
  })
  const body = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.48,
    metalness: 0.2,
    envMapIntensity: 0.7,
  })
  addRim(body, rim)
  const frame = restFrame(meshes)
  for (const mesh of meshes) {
    dressMesh(mesh, frame)
    const previous = mesh.material
    for (const m of Array.isArray(previous) ? previous : [previous]) m.dispose()
    mesh.material = body
  }
  const channels = bindClip(scene, animations[0])
  const rest = new Map<Bone, { position: Vector3; quaternion: Quaternion }>()
  for (const name of LAYERED_BONES) {
    const bone = bones.get(name)
    if (bone) rest.set(bone, { position: bone.position.clone(), quaternion: bone.quaternion.clone() })
  }
  return { scene, bones, meshes, body, channels, rest }
}

export type Racket = { scene: Group; materials: MeshStandardMaterial[] }

export function buildRacket(scene: Group): Racket {
  const materials: MeshStandardMaterial[] = []
  scene.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as MeshStandardMaterial
    mat.envMapIntensity = 1.1
    // Grises con la misma luminancia: conserva el contraste marco/cara sin color.
    mat.color.setHSL(0, 0, mat.color.getHSL({ h: 0, s: 0, l: 0 }).l)
    mat.map?.dispose()
    mat.map = null
    materials.push(mat)
  })
  // Paleta +Y (cabeza) → eje +Z del socket; cara hacia el frente del golpe.
  scene.rotation.set(Math.PI / 2, 0, 0)
  return { scene, materials }
}

export function applyEnvMap(rig: Rig, racket: Racket, envMap: Texture | null) {
  for (const mat of [rig.body, ...racket.materials]) {
    mat.envMap = envMap
    mat.needsUpdate = true
  }
}

export function attachRacket(rig: Rig, racket: Racket) {
  const socket = rig.bones.get("racket_socket")
  socket?.add(racket.scene)
  return () => {
    socket?.remove(racket.scene)
  }
}

export function disposeRig(rig: Rig, racket: Racket) {
  rig.body.dispose()
  for (const mesh of rig.meshes) mesh.geometry.dispose()
  for (const skeleton of new Set(rig.meshes.map((mesh) => mesh.skeleton))) skeleton.dispose()
  racket.scene.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    mesh.geometry.dispose()
    const mat = mesh.material as MeshStandardMaterial
    mat.normalMap?.dispose()
    mat.map?.dispose()
    mat.dispose()
  })
}

const extra = new Quaternion()
const euler = new Euler()
const RACKET_HEAD = new Vector3(0, 0.29, 0)

function bend(bones: Map<string, Bone>, name: string, x: number, y = 0, z = 0) {
  const bone = bones.get(name)
  if (!bone) return
  extra.setFromEuler(euler.set(x, y, z))
  bone.quaternion.multiply(extra)
}

/** Punto de impacto real: cabeza de la paleta en `SWING.contact`, en mundo. */
export type ContactProbe = { point: Vector3; ready: boolean }

export function createContactProbe(): ContactProbe {
  return { point: new Vector3(), ready: false }
}

export function measureContact(
  rig: Rig,
  racket: Racket,
  joints: PlayerJoints,
  probe: ContactProbe
) {
  rig.scene.parent?.updateWorldMatrix(true, false)
  poseRig(rig, racket, SWING.contact, joints)
  probe.point.copy(joints.racketHead)
  probe.ready = true
}

/** Pose del instante `s` (0..1) del golpe y escritura de articulaciones de mundo. */
export function poseRig(rig: Rig, racket: Racket, s: number, joints: PlayerJoints) {
  for (const [bone, pose] of rig.rest) {
    bone.position.copy(pose.position)
    bone.quaternion.copy(pose.quaternion)
  }
  sampleClip(rig.channels, MathUtils.lerp(SWING.clipStart, SWING.clipEnd, s))

  // Capa procedural sobre el clip: carga de piernas y giro de torso.
  const load =
    Math.sin(Math.PI * MathUtils.smoothstep(s, 0, 0.82)) * 0.85 +
    MathUtils.smoothstep(s, 0.55, 0.7) * 0.15 * (1 - MathUtils.smoothstep(s, 0.8, 1))
  const coil =
    -0.42 * MathUtils.smoothstep(s, 0, 0.45) + 0.72 * MathUtils.smoothstep(s, 0.45, 0.9)
  const bones = rig.bones
  const hips = bones.get("hips")
  if (hips) hips.position.y -= 0.045 * load
  bend(bones, "thighL", -0.16 * load)
  bend(bones, "thighR", -0.22 * load)
  bend(bones, "shinL", 0.3 * load)
  bend(bones, "shinR", 0.4 * load)
  bend(bones, "footL", -0.14 * load)
  bend(bones, "footR", -0.18 * load)
  bend(bones, "spine01", 0.12 * load, coil * 0.55, 0)
  bend(bones, "spine02", 0.06 * load, coil * 0.45, 0)
  rig.scene.updateMatrixWorld(true)

  bones.get("head")?.getWorldPosition(joints.nose)
  joints.nose.y += 0.06
  for (const id of Object.keys(JOINT_BONES) as (keyof typeof JOINT_BONES)[]) {
    bones.get(JOINT_BONES[id])?.getWorldPosition(joints[id])
  }
  racket.scene.localToWorld(joints.racketHead.copy(RACKET_HEAD))
  joints.center.copy(joints.hipL).add(joints.hipR).multiplyScalar(0.5)
}

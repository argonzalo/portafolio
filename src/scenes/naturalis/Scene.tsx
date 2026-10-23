import { useContext, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Object3D,
  Mesh,
  DoubleSide,
  type Material,
} from "three"
import type { SceneProps } from "@/experience/types"
import { PresentationContext, reveal } from "@/experience/presentation"
import { envelope, ramp } from "@/experience/choreography"
import { useGreyboxRig } from "../greybox/runtime"
import { Phone } from "../kit/devices/Phone"
import { Laptop } from "../kit/devices/Laptop"
import { useStudioEnvironment } from "../kit/devices/materials"
import { useDisposable } from "../kit/devices/hooks"
import { useScreenTexture } from "../kit/devices/screenTexture"
import {
  createRoundedSlabGeometry,
  createRoundedPlaneGeometry,
} from "../kit/devices/geometry"
import { Room } from "./Room"
import { KitHtml } from "../kit/KitHtml"
import { NaturalisOverlay } from "./Overlay"
import { version } from "./assets.json"
import { ArrivalGlow } from "./ArrivalGlow"
import { arrivalPulse } from "./timing"

// Leave real glass/halos translucent; solid shells keep depth during dissolves.
function prepareDissolve(root: Group | null, prepared: WeakSet<Material>) {
  root?.traverse((object) => {
    if (!(object instanceof Mesh)) return
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (prepared.has(material)) continue
      prepared.add(material)
      if (!material.transparent && material.depthWrite) {
        material.userData.solidDissolve = true
      }
    }
  })
}

// Absolute camera poses compose with T-A41's single camera director.
const cameras = [
  {
    at: 0,
    desktop: [6, 3.3, 10],
    mobile: [2.8, 3.5, 12],
    target: [0.1, 0.45, 0],
    mobileTarget: [0.15, 1, 0],
  },
  {
    at: 0.28,
    desktop: [5, 3.5, 9],
    mobile: [2.5, 3.6, 11],
    target: [0.4, 0.35, 0],
    mobileTarget: [0.65, 1, 0],
  },
  {
    at: 0.43,
    desktop: [3.9, 0.85, 3.25],
    mobile: [3.8, 1.4, 4.1],
    target: [2.35, -0.12, -0.7],
    mobileTarget: [3.5, 0.6, -0.7],
  },
  {
    at: 0.7,
    desktop: [4.1, 1, 3.5],
    mobile: [3.8, 1.4, 4.3],
    target: [2.35, -0.12, -0.7],
    mobileTarget: [3.5, 0.6, -0.7],
  },
  {
    at: 0.86,
    desktop: [5.3, 3, 10],
    mobile: [2.8, 3.5, 12],
    target: [0.1, 0.5, 0],
    mobileTarget: [0.15, 1, 0],
  },
  {
    at: 1,
    desktop: [5.3, 3, 10],
    mobile: [2.8, 3.5, 12],
    target: [0.1, 0.5, 0],
    mobileTarget: [0.15, 1, 0],
  },
] satisfies Parameters<typeof useGreyboxRig>[2]

function leafGeometry() {
  const positions: number[] = [],
    indices: number[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12,
      width = Math.sin(t * Math.PI) * 0.29
    for (const side of [-1, 0, 1])
      positions.push(
        width * side,
        t - 0.5,
        Math.sin(t * Math.PI) * (side === 0 ? 0.065 : 0)
      )
  }
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 2; j++) {
      const a = i * 3 + j
      indices.push(a, a + 1, a + 4, a, a + 4, a + 3)
    }
  const g = new BufferGeometry()
  g.setAttribute("position", new Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

export default function NaturalisScene(props: SceneProps) {
  const { progress, quality } = props
  const presentation = useContext(PresentationContext)
  useGreyboxRig(props, "#FAFDFC", cameras)
  const world = useRef<Group>(null),
    paper = useRef<Group>(null),
    devices = useRef<Group>(null)
  const phone = useRef<Group>(null),
    laptop = useRef<Group>(null)
  const leaves = useRef<InstancedMesh>(null),
    lights = useRef<InstancedMesh>(null)
  const leaf = useDisposable(useMemo(() => leafGeometry(), []))
  const pageShape = useDisposable(
    useMemo(
      () => createRoundedSlabGeometry(0.56, 0.7, 0.018, 0.025, 0.006, "low"),
      []
    )
  )
  const dummy = useMemo(() => new Object3D(), [])
  const prepared = useMemo(() => new WeakSet<Material>(), [])
  const pagePrint = useDisposable(
    useMemo(() => createRoundedPlaneGeometry(0.554, 0.694, 0.02, "low"), [])
  )
  const env = useStudioEnvironment()
  const agenda = useScreenTexture("/textures/naturalis/agenda.webp")
  const separation = () => envelope(progress.current, 0.43, 0.61, 0.045) * 0.65
  const deviceTier = quality === "high" ? "medium" : "low"
  useFrame(() => {
    prepareDissolve(devices.current, prepared)
    prepareDissolve(paper.current, prepared)
    const p = progress.current
    reveal(world.current, ramp(p, 0.015, 0.14))
    reveal(paper.current, envelope(p, 0.18, 0.455, 0.035))
    reveal(devices.current, ramp(p, 0.4, 0.47))
    if (phone.current) {
      phone.current.position.set(2.88, -0.17, -1.04)
      phone.current.rotation.set(-0.06, 0, 0)
    }
    if (laptop.current) {
      laptop.current.position.set(3.74, -0.594, -0.756)
      laptop.current.rotation.y = 0
    }
    if (leaves.current) {
      reveal(leaves.current, envelope(p, 0.43, 0.6, 0.03))
      for (let i = 0; i < 6; i++) {
        const t = ramp(p, 0.43 + i * 0.012, 0.54 + i * 0.012),
          size = Math.sin(t * Math.PI) * 0.1
        dummy.position.set(
          2.9 + t * 0.84,
          -0.04 + Math.sin(t * Math.PI) * 0.4,
          -1.04 - t * 0.22
        )
        dummy.rotation.set(0.4, t * 2, -0.6)
        dummy.scale.setScalar(size)
        dummy.updateMatrix()
        leaves.current.setMatrixAt(i, dummy.matrix)
      }
      leaves.current.instanceMatrix.needsUpdate = true
    }
    if (lights.current) {
      reveal(lights.current, envelope(p, 0.6, 0.8, 0.05))
      for (let i = 0; i < 6; i++) {
        const t = ramp(p, 0.605 + i * 0.016, 0.69 + i * 0.016)
        dummy.position.set(
          3.5 + Math.cos(i * 2.4) * 0.45,
          0.3 + i * 0.09 + Math.sin(t * Math.PI) * 0.25,
          -0.6 + Math.sin(i * 2.4) * 0.15
        )
        dummy.rotation.set(0, t * 3, i)
        dummy.scale.setScalar(0.035 + Math.sin(t * Math.PI) * 0.025)
        dummy.updateMatrix()
        lights.current.setMatrixAt(i, dummy.matrix)
      }
      lights.current.instanceMatrix.needsUpdate = true
    }
  }, -1)
  return (
    <>
      <group ref={world} position={[2, -1.6, 0]} scale={1.2}>
        <Room {...props} />
      </group>
      <group
        ref={paper}
        position={[3.45, -0.574, -0.756]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[i * 0.045, i * 0.025, i * 0.012]}
            rotation={[0, 0, (i - 1) * 0.08]}
            geometry={pageShape}
          >
            <meshStandardMaterial
              color="#fffdf4"
              metalness={0}
              roughness={0.94}
              envMap={env}
              envMapIntensity={0.65}
            />
            <mesh geometry={pagePrint} position={[0, 0, 0.0095]}>
              <meshBasicMaterial map={agenda} toneMapped={false} />
            </mesh>
          </mesh>
        ))}
      </group>
      <group ref={devices}>
        <group ref={phone}>
          <Phone
            quality={deviceTier}
            back={false}
            finish="silver"
            scale={0.58}
            screenAspect={470 / 1013}
            island={false}
            screen={{
              src: `/textures/naturalis/client.webp?v=${version}`,
              fit: "cover",
              brightness: 0.96,
              separation,
              layers: [
                {
                  id: "reservar",
                  rect: [0.035, 0.14, 0.93, 0.24],
                  depth: 0.15,
                  scale: 1.035,
                },
              ],
            }}
          />
        </group>
        <group ref={laptop}>
          <Laptop
            quality={deviceTier}
            finish="silver"
            scale={0.38}
            notch={false}
            open={() => ramp(progress.current, 0.405, 0.49)}
            screen={{
              src: `/textures/naturalis/admin.webp?v=${version}`,
              fit: "cover",
              brightness: 0.94,
              power: () => 0.94 + arrivalPulse(progress.current) * 0.06,
              separation,
              layers: [
                {
                  id: "agenda",
                  rect: [0.18, 0.07, 0.64, 0.15],
                  depth: 0.2,
                  scale: 1.025,
                },
              ],
            }}
          >
            <ArrivalGlow progress={progress} />
          </Laptop>
        </group>
      </group>
      <instancedMesh
        ref={leaves}
        args={[leaf, undefined, 6]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#56857D"
          roughness={0.65}
          metalness={0}
          side={DoubleSide}
          envMap={env}
        />
      </instancedMesh>
      <instancedMesh
        ref={lights}
        args={[leaf, undefined, 6]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color="#ffe1a1"
          roughness={0.5}
          metalness={0}
          emissive="#ffd586"
          emissiveIntensity={1.8}
          side={DoubleSide}
        />
      </instancedMesh>
      <KitHtml>
        <NaturalisOverlay {...props} presentation={presentation} />
      </KitHtml>
    </>
  )
}

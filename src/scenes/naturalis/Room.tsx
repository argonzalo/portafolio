import { useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import {
  DoubleSide,
  Mesh,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type Group,
  type Material,
} from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import type { SceneProps } from "@/experience/types"
import { experienceStore } from "@/experience/store"
import { version } from "./assets.json"
import { nightMix } from "./timing"

type RoomAsset = {
  group: Group
  update: (mix: number, wind: number) => void
  dispose: () => void
}

async function loadRoom(tier: string, isMobile: boolean): Promise<RoomAsset> {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  // allSettled allows releasing the successful half if either request fails.
  const [modelResult, nightResult] = await Promise.allSettled([
    loader.loadAsync(`/models/naturalis/sala.${tier}.glb?v=${version}`),
    new TextureLoader().loadAsync(
      `/textures/naturalis/night.${tier}.webp?v=${version}`
    ),
  ])
  const textures = new Set<Texture>()
  const originals = new Set<Material>()
  const materials: ShaderMaterial[] = []
  const group =
    modelResult.status === "fulfilled" ? modelResult.value.scene : null
  const night = nightResult.status === "fulfilled" ? nightResult.value : null
  if (night) {
    night.flipY = false
    night.colorSpace = SRGBColorSpace
    textures.add(night)
  }
  group?.traverse((o) => {
    if (!(o instanceof Mesh)) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      originals.add(m)
      for (const v of Object.values(m))
        if (v instanceof Texture) textures.add(v)
    }
  })
  const dispose = () => {
    group?.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose()
    })
    textures.forEach((t) => {
      t.dispose()
      if (t.image instanceof ImageBitmap) t.image.close()
    })
    originals.forEach((m) => m.dispose())
    materials.forEach((m) => m.dispose())
  }
  if (!group || !night) {
    dispose()
    throw new Error("No se pudo cargar la sala de Naturalis")
  }
  group.traverse((o) => {
    if (!(o instanceof Mesh)) return
    const day = o.material.map as Texture
    const curtain = o.name.includes("Cortina")
    o.visible = !curtain || !isMobile
    const material = new ShaderMaterial({
      side: DoubleSide,
      forceSinglePass: true,
      toneMapped: false,
      uniforms: {
        uDay: { value: day },
        uNight: { value: night },
        uMix: { value: 0 },
        uOpacity: { value: 1 },
        uWind: { value: 0 },
        uCurtain: { value: curtain ? 1 : 0 },
      },
      vertexShader: `varying vec2 vUv; uniform float uWind; uniform float uCurtain;
        void main(){vUv=uv;vec3 p=position;
        p.z+=sin(p.y*3.5+uWind)*.012*uCurtain*clamp(1.-p.y/2.8,0.,1.);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform sampler2D uDay;uniform sampler2D uNight;uniform float uMix;uniform float uOpacity;varying vec2 vUv;
        void main(){gl_FragColor=vec4(mix(texture2D(uDay,vUv).rgb,texture2D(uNight,vUv).rgb,uMix),uOpacity);
        #include <colorspace_fragment>
        }`,
    })
    material.userData.solidDissolve = true
    o.material = material
    materials.push(material)
  })
  return {
    group,
    dispose,
    update: (mix, wind) => {
      for (const m of materials) {
        m.uniforms.uMix.value = mix
        m.uniforms.uWind.value = wind
      }
    },
  }
}

export function Room({ progress, quality, isMobile }: SceneProps) {
  const [asset, setAsset] = useState<RoomAsset | null>(null)
  const tier = quality === "static" ? "low" : quality
  useEffect(() => {
    let cancelled = false
    void loadRoom(tier, isMobile)
      .then((value) => {
        if (cancelled) value.dispose()
        else {
          setAsset(value)
        }
      })
      .catch((error) => {
        if (!cancelled) console.error(error)
      })
    return () => {
      cancelled = true
    }
  }, [tier, isMobile])
  // Keep the old room visible until the new LOD commits; release it afterwards.
  useEffect(() => () => asset?.dispose(), [asset])
  useFrame(({ clock }) => {
    const mix = nightMix(progress.current)
    const wind = experienceStore.getSnapshot().reducedMotion
      ? 0
      : clock.elapsedTime * 0.4
    asset?.update(mix, wind)
  }, -1)
  return asset ? <primitive object={asset.group} dispose={null} /> : null
}

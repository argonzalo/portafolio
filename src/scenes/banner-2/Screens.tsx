import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Vector4, VideoTexture, type ShaderMaterial, type Texture } from "three"
import { ramp } from "@/experience/choreography"
import { experienceStore } from "@/experience/store"
import {
  getDisplayScreenSize,
  useScreenTexture,
  computeFitTransform,
  getTextureAspect,
} from "@/scenes/kit"
import { createRoundedPlaneGeometry } from "@/scenes/kit/devices/geometry"
import { CLIPS, videoBlend } from "./media"

const VERTEX = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const COLORSPACE = `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`
type ScreenProps = { progress: { readonly current: number }; isMobile: boolean }

function usePanelGeometry(variant: "monitor" | "signage") {
  const size = getDisplayScreenSize(variant, "landscape")
  const geometry = useMemo(
    () => createRoundedPlaneGeometry(size.width, size.height, 0.025, "medium"),
    [size.width, size.height]
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

function coverTransform(texture: Texture | null, clip: number) {
  const size = getDisplayScreenSize("signage")
  // Clip 1 includes 27/26 px baked letterboxing, confirmed across four frames.
  const trimmed = texture instanceof VideoTexture && clip === 1
  const cropHeight = trimmed ? 199 / 252 : 1
  const cropY = trimmed ? 26 / 252 : 0
  const fit = computeFitTransform(
    texture ? getTextureAspect(texture) / cropHeight : 16 / 9,
    size.width / size.height,
    "cover",
    "center"
  )
  return new Vector4(
    fit.repeat[0],
    cropHeight * fit.repeat[1],
    fit.offset[0],
    cropY + cropHeight * fit.offset[1]
  )
}

/** Four images slide inside the physical display; no per-frame bitmap uploads. */
export function InterfaceSlides({ progress, isMobile }: ScreenProps) {
  const suffix = isMobile ? "-mobile" : ""
  const a = useScreenTexture(`/textures/banner/interface${suffix}.webp`)
  const b = useScreenTexture(`/textures/banner/interface-3${suffix}.webp`)
  const c = useScreenTexture(`/textures/banner/interface-5${suffix}.webp`)
  const d = useScreenTexture(`/textures/banner/interface-6${suffix}.webp`)
  const geometry = usePanelGeometry("monitor")
  const shader = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uA: { value: a },
      uB: { value: b },
      uC: { value: c },
      uD: { value: d },
      uSlide: { value: 0 },
      uLoaded: {
        value: new Vector4(a ? 1 : 0, b ? 1 : 0, c ? 1 : 0, d ? 1 : 0),
      },
      uOpacity: { value: 1 },
    }),
    [a, b, c, d]
  )
  useFrame(() => {
    const p = experienceStore.getSnapshot().reducedMotion ? 0 : progress.current
    if (shader.current)
      shader.current.uniforms.uSlide.value =
        ramp(p, 0.17, 0.31) + ramp(p, 0.41, 0.55) + ramp(p, 0.65, 0.79)
  }, -1)
  return (
    <mesh
      geometry={geometry}
      position-z={0.114}
      renderOrder={2}
      name="banner-interface-slides"
    >
      <shaderMaterial
        ref={shader}
        uniforms={uniforms}
        vertexShader={VERTEX}
        toneMapped={false}
        fragmentShader={`uniform sampler2D uA,uB,uC,uD;uniform float uSlide,uOpacity;uniform vec4 uLoaded;varying vec2 vUv;
      vec3 photo(float i,vec2 uv){uv=clamp(uv,0.,1.);vec3 bg=vec3(.008,.006,.005);vec3 col=bg;
        if(i<.5)col=mix(bg,texture2D(uA,uv).rgb,uLoaded.x);
        else if(i<1.5)col=mix(bg,texture2D(uB,uv).rgb,uLoaded.y);
        else if(i<2.5)col=mix(bg,texture2D(uC,uv).rgb,uLoaded.z);
        else col=mix(bg,texture2D(uD,uv).rgb,uLoaded.w);
        return col;}
      void main(){float i=min(floor(uSlide),2.);float t=uSlide-i;
        vec3 a=photo(i,vUv+vec2(t,0.));vec3 b=photo(i+1.,vUv+vec2(t-1.,0.));
        float edge=1.-t;float feather=t<.0001?0.:(t>.9999?1.:smoothstep(edge-.008,edge+.008,vUv.x));
        vec3 col=mix(a,b,feather);col*=1.-.14*exp(-abs(vUv.x-edge)*65.)*sin(t*3.14159);
        gl_FragColor=vec4(col,uOpacity);${COLORSPACE}}`}
      />
    </mesh>
  )
}

/** GPU crossfade and a small Gaussian blur, staggered for each physical panel. */
export function VideoCrossfade({
  progress,
  isMobile,
  slot,
  textures,
}: ScreenProps & { slot: number; textures: (Texture | null)[] }) {
  const fallbackA = useScreenTexture(`/textures/banner/${CLIPS[slot]}.webp`)
  const fallbackB = useScreenTexture(`/textures/banner/${CLIPS[slot + 4]}.webp`)
  const a = textures[slot] ?? fallbackA,
    b = textures[slot + 4] ?? fallbackB
  const geometry = usePanelGeometry("signage")
  const shader = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uA: { value: a },
      uB: { value: b },
      uMix: { value: 0 },
      uReady: { value: [a ? 1 : 0, b ? 1 : 0] },
      uUvA: { value: coverTransform(a, slot) },
      uUvB: { value: coverTransform(b, slot + 4) },
      uOpacity: { value: 1 },
    }),
    [a, b, slot]
  )
  useFrame(() => {
    if (shader.current)
      shader.current.uniforms.uMix.value = experienceStore.getSnapshot()
        .reducedMotion
        ? 0
        : videoBlend(progress.current, slot, isMobile)
  }, -1)
  return (
    <mesh
      geometry={geometry}
      position-z={0.064}
      renderOrder={2}
      name={`banner-video-${slot}`}
    >
      <shaderMaterial
        ref={shader}
        uniforms={uniforms}
        vertexShader={VERTEX}
        toneMapped={false}
        fragmentShader={`uniform sampler2D uA,uB;uniform float uMix,uOpacity;uniform vec2 uReady;uniform vec4 uUvA,uUvB;varying vec2 vUv;
      vec3 sampleA(vec2 uv){return texture2D(uA,clamp(uv,uUvA.zw,uUvA.zw+uUvA.xy)).rgb;}
      vec3 sampleB(vec2 uv){return texture2D(uB,clamp(uv,uUvB.zw,uUvB.zw+uUvB.xy)).rgb;}
      vec3 blurA(vec2 uv,float r){uv=uv*uUvA.xy+uUvA.zw;vec2 d=r*uUvA.xy;return sampleA(uv)*.4+(sampleA(uv+vec2(d.x,0.))+sampleA(uv-vec2(d.x,0.))+sampleA(uv+vec2(0.,d.y))+sampleA(uv-vec2(0.,d.y)))*.15;}
      vec3 blurB(vec2 uv,float r){uv=uv*uUvB.xy+uUvB.zw;vec2 d=r*uUvB.xy;return sampleB(uv)*.4+(sampleB(uv+vec2(d.x,0.))+sampleB(uv-vec2(d.x,0.))+sampleB(uv+vec2(0.,d.y))+sampleB(uv-vec2(0.,d.y)))*.15;}
      void main(){float r=sin(uMix*3.14159)*.012;vec3 bg=vec3(.008,.006,.005);
        vec3 a=mix(bg,blurA(vUv,r),uReady.x),b=mix(bg,blurB(vUv,r),uReady.y);
        gl_FragColor=vec4(mix(a,b,uMix)*.95,uOpacity);${COLORSPACE}}`}
      />
    </mesh>
  )
}

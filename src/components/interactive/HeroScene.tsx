import { useEffect, useRef } from "react"

import { prefersReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { hasWebGL } from "@/lib/webgl"

type HeroSceneProps = {
  className?: string
}

export function HeroScene({ className }: HeroSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !hasWebGL() || prefersReducedMotion()) {
      return
    }

    const canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    canvas.className = "h-full w-full"
    root.appendChild(canvas)

    let disposed = false
    let stop: (() => void) | undefined

    void startScene(canvas).then((cleanup) => {
      if (disposed) {
        cleanup()
        return
      }

      stop = cleanup
    })

    return () => {
      disposed = true
      stop?.()
      canvas.remove()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={cn("bg-muted/60 h-full w-full rounded-3xl", className)}
      aria-hidden="true"
    />
  )
}

async function startScene(canvas: HTMLCanvasElement) {
  const THREE = await import("three")
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.z = 4.2

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const geometry = new THREE.IcosahedronGeometry(1.35, 1)
  const material = new THREE.MeshStandardMaterial({
    color: 0xb6f23a,
    roughness: 0.35,
    metalness: 0.15,
    wireframe: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  const light = new THREE.DirectionalLight(0xffffff, 1.4)
  light.position.set(2, 3, 4)
  scene.add(light)
  scene.add(new THREE.AmbientLight(0xffffff, 0.4))

  function resize() {
    const width = Math.max(canvas.clientWidth, 1)
    const height = Math.max(canvas.clientHeight, 1)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  resize()
  window.addEventListener("resize", resize)

  let frame = 0

  function render(time: number) {
    mesh.rotation.x = time / 7000
    mesh.rotation.y = time / 5000
    renderer.render(scene, camera)
    frame = window.requestAnimationFrame(render)
  }

  frame = window.requestAnimationFrame(render)

  return () => {
    window.cancelAnimationFrame(frame)
    window.removeEventListener("resize", resize)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
}

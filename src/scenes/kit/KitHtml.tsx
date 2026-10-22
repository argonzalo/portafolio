import { useEffect, useRef, type ReactNode } from "react"
import { useThree } from "@react-three/fiber"
import { createRoot, type Root } from "react-dom/client"

export type KitHtmlProps = {
  children: ReactNode
}

/**
 * Puente DOM liviano para componentes del Kit dentro del `<Canvas>` de R3F.
 *
 * A diferencia de `<Html fullscreen>` de `@react-three/drei`, monta el contenedor
 * en `useEffect` y difiere `root.unmount()` con `queueMicrotask` al desmontar,
 * evitando el error de React 19 ("Attempted to synchronously unmount a root
 * while React was already rendering").
 */
export function KitHtml({ children }: KitHtmlProps) {
  const gl = useThree((state) => state.gl)
  const rootRef = useRef<Root | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const parent = gl.domElement.parentElement
    if (!parent) return

    const host = document.createElement("div")
    host.style.position = "absolute"
    host.style.inset = "0"
    host.style.pointerEvents = "none"
    host.style.overflow = "hidden"
    parent.appendChild(host)

    const root = createRoot(host)
    hostRef.current = host
    rootRef.current = root
    root.render(children)

    return () => {
      rootRef.current = null
      hostRef.current = null
      queueMicrotask(() => {
        root.unmount()
        host.remove()
      })
    }
    // El contenedor se crea una sola vez por montaje en el padre del Canvas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  useEffect(() => {
    rootRef.current?.render(children)
  }, [children])

  return null
}

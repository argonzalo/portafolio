import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { experienceStore } from "@/experience/store"
import { ramp } from "@/experience/choreography"

gsap.registerPlugin(SplitText)
let cleanup: (() => void) | undefined

function mountManifesto() {
  cleanup?.()
  const root = document.querySelector("#manifesto")
  if (!root) return
  const media = gsap.matchMedia()
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const splits: SplitText[] = []
    const phrases = root.querySelectorAll<HTMLElement>(
      "[data-manifesto-phrase]"
    )
    const heading = root.querySelector("h2")
    const copy = root.querySelector(".manifesto-copy")
    const setOpacity = gsap.quickSetter(copy, "opacity")
    const setY = gsap.quickSetter(copy, "y", "px")
    // Oculta la fila completa: incluye tanto palabras como sus bordes.
    gsap.set(phrases, { opacity: 0 })
    gsap.set(heading, { opacity: 0 })
    const timeline = gsap.timeline({ paused: true })
    timeline.to(heading, { opacity: 1, duration: 0.35 }, 0)
    phrases.forEach((phrase, index) => {
      const split = SplitText.create(phrase, { type: "words", aria: "auto" })
      splits.push(split)
      const at = 0.3 + index * 1.15
      timeline.to(phrase, { opacity: 1, duration: 0.4 }, at)
      timeline.from(
        split.words,
        {
          rotationX: -45,
          yPercent: 35,
          opacity: 0,
          transformOrigin: "50% 100%",
          stagger: 0.2,
          duration: 1.4,
          ease: "sine.out",
        },
        at
      )
    })
    // Mismo cursor amortiguado que cámara e hilo, sin un segundo scrub que
    // quede rezagado. Revelado → lectura quieta → salida → entrada de Vibo.
    const update = () => {
      const p = experienceStore.progress("manifesto").current
      timeline.progress(Math.max(0, Math.min(1, p / 0.52)))
      const exit = ramp(p, 0.6, 0.74)
      setOpacity(1 - exit)
      setY(-12 * exit)
    }
    gsap.ticker.add(update)
    update()
    return () => {
      gsap.ticker.remove(update)
      timeline.revert()
      splits.forEach((split) => split.revert())
      // quickSetter no crea tweens que matchMedia pueda revertir.
      if (copy instanceof HTMLElement) {
        copy.style.removeProperty("opacity")
        copy.style.removeProperty("transform")
      }
    }
  })
  cleanup = () => media.revert()
}

document.addEventListener("astro:page-load", mountManifesto)
document.addEventListener("astro:before-swap", () => cleanup?.())
mountManifesto()

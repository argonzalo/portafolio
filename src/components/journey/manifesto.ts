import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(SplitText, ScrollTrigger)
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
    // Oculta la fila completa: incluye tanto palabras como sus bordes.
    gsap.set(phrases, { opacity: 0 })
    gsap.set(heading, { opacity: 0 })
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 68%",
        end: "top -38%",
        scrub: 0.75,
        invalidateOnRefresh: true,
      },
    })
    timeline.to(heading, { opacity: 1, duration: 0.35 }, 0)
    phrases.forEach((phrase, index) => {
      const split = SplitText.create(phrase, { type: "words", aria: "auto" })
      splits.push(split)
      timeline.to(phrase, { opacity: 1, duration: 0.3 }, index * 0.85)
      timeline.from(
        split.words,
        {
          rotationX: -75,
          yPercent: 65,
          opacity: 0,
          transformOrigin: "50% 100%",
          stagger: 0.18,
          duration: 1.15,
          ease: "power2.out",
        },
        index * 0.85
      )
    })
    // Pausa de lectura con el bloque fijado y salida gradual antes de que el
    // hilo termine de desplegarse en la cancha de Vibo.
    const exit = gsap.to(root.querySelector(".manifesto-copy"), {
      opacity: 0,
      y: -18,
      ease: "power1.inOut",
      scrollTrigger: {
        trigger: root,
        start: "top -56%",
        end: "top -92%",
        scrub: 0.45,
      },
    })
    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
      exit.scrollTrigger?.kill()
      exit.revert()
      splits.forEach((split) => split.revert())
    }
  })
  cleanup = () => media.revert()
}

document.addEventListener("astro:page-load", mountManifesto)
document.addEventListener("astro:before-swap", () => cleanup?.())
mountManifesto()

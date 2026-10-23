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
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: "top 65%",
        end: "top 10%",
        scrub: 0.45,
        invalidateOnRefresh: true,
      },
    })
    root
      .querySelectorAll<HTMLElement>("[data-manifesto-phrase]")
      .forEach((phrase, index) => {
        const split = SplitText.create(phrase, { type: "words", aria: "auto" })
        splits.push(split)
        timeline.from(
          split.words,
          {
            rotationX: -75,
            yPercent: 65,
            opacity: 0.12,
            transformOrigin: "50% 100%",
            stagger: 0.15,
            duration: 1,
            ease: "power2.inOut",
          },
          index * 0.7
        )
      })
    // Salida sincronizada sin retardo: el DOM deja el escenario antes de que
    // el handoff global empiece a mostrar Vibo, incluso en un scroll rápido.
    const exit = gsap.to(root.querySelector(".manifesto-copy"), {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "bottom 95%",
        end: "bottom 78%",
        scrub: true,
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

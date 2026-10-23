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
        end: "bottom 90%",
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
    root
      .querySelectorAll<HTMLElement>("[data-manifesto-phrase]")
      .forEach((phrase, index) => {
        const split = SplitText.create(phrase, {
          type: "words,chars",
          aria: "auto",
        })
        splits.push(split)
        // Tres gestos vinculados al significado. El scroll permite deshacerlos.
        if (index === 0) {
          timeline.from(
            split.chars,
            {
              x: (i) => Math.sin(i * 2.399) * 36,
              y: (i) => Math.cos(i * 2.399) * 26,
              rotation: (i) => Math.sin(i * 2.399) * 18,
              opacity: 0.12,
              stagger: { amount: 0.3, from: "center" },
              duration: 1,
              ease: "power2.inOut",
            },
            index * 0.95
          )
        } else if (index === 1) {
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
            index * 0.95
          )
        } else {
          timeline.from(
            split.chars,
            {
              yPercent: 105,
              scaleY: 0.6,
              opacity: 0.12,
              transformOrigin: "50% 100%",
              stagger: 0.025,
              duration: 0.7,
              ease: "power2.inOut",
            },
            index * 0.95
          )
        }
      })
    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
      splits.forEach((split) => split.revert())
    }
  })
  cleanup = () => media.revert()
}

document.addEventListener("astro:page-load", mountManifesto)
document.addEventListener("astro:before-swap", () => cleanup?.())
mountManifesto()

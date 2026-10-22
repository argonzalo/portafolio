import gsap from "gsap"
import { SplitText } from "gsap/SplitText"

gsap.registerPlugin(SplitText)
let cleanup: (() => void) | undefined

function mountManifesto() {
  cleanup?.()
  const root = document.querySelector("#manifesto")
  if (!root) return

  const media = gsap.matchMedia()
  media.add("(prefers-reduced-motion: no-preference)", () => {
    const splits: SplitText[] = []
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.unobserve(entry.target)
          const split = SplitText.create(entry.target, {
            type: "words",
            aria: "auto",
          })
          splits.push(split)
          // El texto siempre está visible en HTML; solo se anima al entrar.
          gsap.from(split.words, {
            yPercent: 35,
            duration: 0.65,
            stagger: 0.09,
            ease: "power2.out",
          })
        }
      },
      { threshold: 0.7 }
    )
    root
      .querySelectorAll("[data-manifesto-phrase]")
      .forEach((phrase) => observer.observe(phrase))
    return () => {
      observer.disconnect()
      splits.forEach((split) => {
        gsap.killTweensOf(split.words)
        split.revert()
      })
    }
  })
  cleanup = () => media.revert()
}

document.addEventListener("astro:page-load", mountManifesto)
document.addEventListener("astro:before-swap", () => cleanup?.())
mountManifesto()

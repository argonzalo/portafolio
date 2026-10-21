const PROJECTS_HASH = "#proyectos"

let bound = false

function jumpToProjects() {
  if (window.location.hash !== PROJECTS_HASH) {
    return
  }

  const section = document.getElementById("proyectos")
  if (!section) {
    return
  }

  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = "auto"
  section.scrollIntoView({ block: "start", behavior: "auto" })
  root.style.scrollBehavior = previous
}

function scheduleJump() {
  jumpToProjects()
  requestAnimationFrame(jumpToProjects)
}

export function initHashScroll() {
  if (!bound) {
    bound = true
    document.addEventListener("astro:after-swap", scheduleJump)
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        scheduleJump()
      }
    })
  }

  scheduleJump()
}

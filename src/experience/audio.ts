import type { ExperienceStore } from "./store"

/** Pistas autorizadas. Cada canal tiene su propia ganancia para fundir escenas. */
const TRACKS = [
  { chapter: "naturalis", src: "/audio/naturalis.mp3", volume: 0.35 },
]
const FADE_SECONDS = 0.45
const CHAPTERS_WITH_AUDIO = new Set(TRACKS.map((t) => t.chapter))

const ICON_SOUND_ON = `<svg class="size-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`

const ICON_SOUND_OFF = `<svg class="size-4 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`

/** Sin contexto, descarga ni reproducción hasta pulsar el control. */
export function mountAudio(store: ExperienceStore): () => void {
  let context: AudioContext | undefined
  let master: GainNode | undefined
  let enabled = false
  let disposed = false
  let pending = false
  const channels: {
    media: HTMLAudioElement
    gain: GainNode
    source: MediaElementAudioSourceNode
    chapter: string
    volume: number
  }[] = []

  const button = document.createElement("button")
  button.type = "button"
  button.dataset.audioControl = ""
  button.className =
    "fixed bottom-6 left-6 z-50 hidden md:flex size-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-black/85 hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-4 cursor-pointer"
  button.style.opacity = "0"
  button.style.pointerEvents = "none"
  button.style.transform = "translateY(12px)"

  function render(error = false) {
    button.setAttribute("aria-pressed", String(enabled))
    button.setAttribute(
      "aria-label",
      enabled ? "Desactivar sonido ambiente" : "Activar sonido ambiente"
    )
    button.innerHTML = error
      ? ICON_SOUND_OFF
      : enabled
        ? ICON_SOUND_ON
        : ICON_SOUND_OFF
    button.title = enabled
      ? "Sonido activado (clic para silenciar)"
      : "Sonido silenciado (clic para activar)"
  }

  function fail() {
    if (disposed) return
    enabled = false
    channels.forEach(({ media }) => media.pause())
    if (master && context) master.gain.setValueAtTime(0, context.currentTime)
    void context?.suspend().catch(() => {})
    render(true)
  }

  function sync() {
    if (disposed) return

    const chapter = store.getSnapshot().chapterId
    const hasAudio = chapter ? CHAPTERS_WITH_AUDIO.has(chapter) : false
    const isMobile =
      store.getSnapshot().isMobile ||
      (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches)

    // Mostrar solamente en escenas que tengan sonido y ocultar en mobile (decisión)
    if (!hasAudio || isMobile) {
      button.style.opacity = "0"
      button.style.pointerEvents = "none"
      button.style.transform = "translateY(12px)"
    } else {
      button.style.opacity = "1"
      button.style.pointerEvents = "auto"
      button.style.transform = "translateY(0)"
    }

    if (!context || !master) return

    const audible = enabled && !document.hidden && hasAudio && !isMobile
    const now = context.currentTime

    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(audible ? 1 : 0, now)

    if (!audible) {
      channels.forEach(({ media }) => media.pause())
      void context.suspend().catch(() => {})
      return
    }

    for (const channel of channels) {
      const active = channel.chapter === chapter
      channel.gain.gain.cancelScheduledValues(now)
      channel.gain.gain.setValueAtTime(channel.gain.gain.value, now)
      channel.gain.gain.linearRampToValueAtTime(
        active ? channel.volume : 0,
        now + FADE_SECONDS
      )
      if (active && channel.media.paused) void channel.media.play().catch(fail)
    }
  }

  async function toggle() {
    if (pending) return
    enabled = !enabled
    render()
    if (!enabled) {
      sync()
      return
    }
    pending = true
    try {
      if (!context) {
        context = new AudioContext()
        master = context.createGain()
        master.gain.value = 0
        master.connect(context.destination)
        for (const track of TRACKS) {
          const media = new Audio()
          media.preload = "none"
          media.loop = true
          media.src = track.src
          const gain = context.createGain()
          gain.gain.value = 0
          const source = context.createMediaElementSource(media)
          source.connect(gain).connect(master)
          channels.push({ ...track, media, gain, source })
          media.addEventListener("error", fail)
          void media.play().catch(fail)
        }
      }
      await context.resume()
      sync()
    } catch {
      fail()
    } finally {
      pending = false
    }
  }

  function onVisibility() {
    if (!document.hidden && enabled) {
      void context?.resume().then(sync).catch(fail)
    } else sync()
  }

  function onPageLoad() {
    if (!document.body.contains(button)) {
      document.body.append(button)
    }
    sync()
  }

  render()
  if (!document.body.contains(button)) {
    document.body.append(button)
  }
  button.addEventListener("click", toggle)
  document.addEventListener("visibilitychange", onVisibility)
  document.addEventListener("astro:page-load", onPageLoad)
  const unsubscribe = store.subscribe(sync)

  return () => {
    disposed = true
    unsubscribe()
    button.removeEventListener("click", toggle)
    document.removeEventListener("visibilitychange", onVisibility)
    document.removeEventListener("astro:page-load", onPageLoad)
    button.remove()
    for (const { media, gain, source } of channels) {
      media.removeEventListener("error", fail)
      media.pause()
      media.removeAttribute("src")
      media.load()
      source.disconnect()
      gain.disconnect()
    }
    master?.disconnect()
    void context?.close().catch(() => {})
  }
}

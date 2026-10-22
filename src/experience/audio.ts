import type { ExperienceStore } from "./store"

/** Pistas autorizadas. Cada canal tiene su propia ganancia para fundir escenas. */
const TRACKS = [
  { chapter: "naturalis", src: "/audio/naturalis.mp3", volume: 0.35 },
]
const FADE_SECONDS = 0.45

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
    "fixed bottom-6 left-6 z-50 min-h-11 rounded-full border border-current bg-black/80 px-4 py-2 text-sm text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4"
  button.style.minWidth = "44px"

  function render(error = false) {
    button.setAttribute("aria-pressed", String(enabled))
    button.setAttribute(
      "aria-label",
      enabled ? "Desactivar sonido ambiente" : "Activar sonido ambiente"
    )
    button.textContent = error
      ? "Reintentar sonido"
      : enabled
        ? "Sonido: activado"
        : "Sonido: apagado"
    button.title = "Ambiente de Naturalis; silencio en los demás capítulos"
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
    if (!context || !master || disposed) return
    const audible = enabled && !document.hidden
    const now = context.currentTime
    // La ocultación silencia inmediatamente; no depende de un timer en background.
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(audible ? 1 : 0, now)
    if (!audible) {
      channels.forEach(({ media }) => media.pause())
      void context.suspend().catch(() => {})
      return
    }
    const chapter = store.getSnapshot().chapterId
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
          // Desbloquea también el elemento durante el gesto (Safari/iOS).
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

  // Astro reemplaza el body, mientras Stage conserva esta instancia.
  function onPageLoad() {
    document.body.append(button)
    sync()
  }

  render()
  document.body.append(button)
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

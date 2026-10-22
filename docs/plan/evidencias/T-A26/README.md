# T-A26 — Sistema de audio

Implementado el 2026-10-22 con Web Audio nativo, sin dependencias nuevas.
`audio.ts` monta el mezclador y el botón; `Stage.tsx` añade únicamente su montaje
y limpieza (ampliación mínima de zona necesaria para conectar el sistema).

- Apagado por defecto, sin AudioContext ni solicitudes de audio antes del gesto.
- Botón nativo con `aria-pressed`, foco visible y área táctil mínima de 44 px.
- Canal Naturalis: pista autorizada `public/audio/naturalis.mp3`, loop, ganancia
  0.35 y fundidos de 450 ms. Resto del recorrido en silencio.
- Ganancia maestra a cero, elementos pausados y contexto suspendido al ocultar.
- La selección se conserva durante la navegación Astro; no entre recargas.
- Se desconectan nodos, eventos, suscripción y medios al desmontar Stage.
- Ante fallo de reproducción se apaga y ofrece reintentar.

## Validación

`npm run check`: exit 0, lint OK, Astro 0 errores/0 warnings/0 hints,
build y presupuestos OK. El bundler emite avisos de directivas de MDX en
contenido ajeno a esta tarea.

Chrome headless instalado, Playwright contra build local:

- Cero solicitudes de audio antes del clic; activar y desactivar con botón.
- Instrumentación de AudioContext real: ganancia Naturalis superior a 0.3
  tras el fundido, y cero al ir a Pirp.
- `visibilitychange` con propiedad `hidden` simulada: contexto `suspended`
  al ocultar y `running` al regresar. No sustituye un cambio real de app en iOS.
- Navegación home → caso Naturalis con router Astro: un único botón conservado,
  selección activada conservada y cero errores de página en esa prueba.
- Capturas revisadas: [desktop 1440×900](./desktop.png),
  [mobile 390×844](./mobile.png). Mobile es emulación de viewport.

La primera prueba de navegación agotó el timeout porque intentaba pulsar el
enlace de un capítulo fuera de vista. La repetición situando Naturalis y
activando su enlace comprobó la persistencia correctamente.

Para revisión manual: abrir `/?chapter=naturalis&progress=0.4`, activar sonido,
recorrer Naturalis → Pirp → Naturalis, ocultar y mostrar la pestaña, apagar con
teclado y navegar al caso. La pista debe oírse solo en Naturalis.

Pendiente: escucha humana, iPhone/Safari real, interrupciones del sistema,
mediciones FPS/GPU en dispositivo (no se modifican geometrías ni shaders).

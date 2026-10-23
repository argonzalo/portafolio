# T-A25 — Banner 2.0

Un solo beat de **100svh**, frente a los cinco / 500svh del greybox. Se conserva la
composición elegida por el humano: interfaz central con cuatro pantallas conectadas
(dos mobile). Zoom suave; slides `1 → 3 → 5 → 6`; cuatro recambios de video escalonados
con crossfade y blur en GPU. El scroll inverso recompone los mismos estados visuales.

Los videos usan `cover` sin deformarse. El clip de hamburguesa incluye letterboxing
en el original: `crop-analysis.json` registra cuatro fotogramas y justifica el
recorte de 27/26 px antes del encaje. Los MP4 originales no se modifican.

La entrada desde Naturalis separa la salida y la llegada de las geometrías sólidas,
oscurece el fondo antes de encender las pantallas y modula las luces de Banner.
`transition.json` y las capturas `*-entrada-*` documentan la revisión de ese par.

## Revisar

`/?chapter=banner-2&progress=0.12&quality=high`, luego `.30`, `.43`, `.56`, `.69`, `.85`.
Para la entrada: `/?chapter=naturalis&progress=0.90&quality=high`, luego `.92–.999`.
Mobile: 390×844 con `quality=low`. El caso completo sigue en `/projects/banner-2`.

Las capturas `desktop-*.webp` / `mobile-*.webp` muestran las transiciones internas,
entrada y salida. `metrics.json` conserva medidas, reproductores, preferencias,
recursos y longitud de sección; `transition.json`, la ausencia de mundos superpuestos.

## Verificación

- `npm run check`: lint, tipos, build y presupuestos.
- Posiciones desktop y mobile CPU×4, videos activos/pausados, ocultación simulada de
  pestaña, salida a Starbene y liberación de los decodificadores.
- Pósters generados de la composición inicial; static y reduced motion sin canvas.
- Texturas de captura hasta 1536 desktop / 1024 mobile, clips de 480 px. Los shaders
  hacen los slides y el difuminado; sin texturas de canvas subidas por frame.
- Se conservan los avisos previos de THREE.Clock, compilación numérica del driver
  Intel en materiales del kit y chunk compartido grande. Sin dependencias nuevas.
- Safari/iPhone, Android real y aprobación final de arte quedan a revisión humana.

## Medidas del build

| Medida | Desktop high | Mobile low, CPU ×4 |
| --- | --- | --- |
| FPS, muestras de 90 frames | 60.1–60.7 | 59.6–60.7 |
| p95 de rAF | ≤16.8 ms | ≤16.8 ms |
| Draw calls / triángulos | 28 / 4.706 | 18 / 2.164 |
| Assets usados | 760 KiB | 350 KiB |
| Presupuesto de assets | 1.200 KiB | 600 KiB |

El monitor continuo del runtime registró p95 de 17.4 ms desktop y 24.7 ms mobile;
usa una ventana distinta al muestreo de rAF. La emulación no reemplaza teléfonos
reales. En dos salidas y reentradas, los contadores de geometrías/texturas al salir
fueron estables y los videos liberaron sus fuentes.

`metrics.json` conserva el aviso X4000 detectado durante la revisión. Se corrigió
inicializando el resultado del shader de slides; `shader-check.json` documenta
la comprobación posterior del build sin ese aviso. `preferences.json` cubre medium
y el bloqueo de zoom, slides y fades cuando se fuerza WebGL con movimiento reducido.

## Reproducir

Servidor de revisión en 3011 con caché `.vite-a25`; `prepare.mjs` deriva las capturas
y fotogramas. `A25_POSTERS=1 node docs/plan/evidencias/T-A25/verify.mjs` captura dev y
genera los pósters. El mismo script sin esa variable revisa el build servido en 4191.
`transition.mjs` revisa 16 posiciones Naturalis→Banner; `crop-analysis.mjs`, las franjas.

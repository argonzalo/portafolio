# T-A14 — Greyboxes de primera línea

Implementación para revisar ritmo y encuadres de las fichas aprobadas en `03-escenas.md`. Vibo tiene cuatro beats; los otros mundos, cinco. Las geometrías, overlays, datos de Pirp y pantallas son provisionales. No se usaron assets de terceros ni dependencias nuevas.

## Alcance

- Vibo: cancha, jugador articulado, golpe por scroll, pausa/scrub, highlight de detección, pipeline, cobertura y tarjeta de lectura del partido. El overlay y la pose son esquemáticos: los datos reales y el rig final corresponden a T-A20.
- Pirp: señal, torrente instanciado, clasificación táctil y por teclado, agrupación, tendencia/alerta y estrategia ficticia.
- Naturalis: sala clara, agenda, teléfono y Natuadmin, traslados, noche y amanecer; encuadre vertical propio. Sin audio.
- Banner: pantalla inicial, desorden, editor/filtros, broker/workers, mapa con 10.000 instancias en high y videowall 2×2 mobile. Sin satélites ni logos de clientes.

La integración amplía la zona original de T-A14 de forma necesaria: registro, `SceneDirector`, rutas de laboratorio, contenedor DOM de los capítulos y pósters provisionales. El rig compartido vive en `src/scenes/greybox/`; no publica contratos nuevos ni sustituye T-A18. El director conserva el spike, carga las definiciones del registro, actualiza beats y desmonta al salir hacia capítulos sin escena. `deepLink.ts` usa scroll instantáneo para reproducir el estado aunque el sitio tenga desplazamiento suave. Se excluye `ui-mvp-public/` de ESLint/TypeScript porque es una fuente local de referencia, no código del portafolio.

La interpolación de la paleta global sigue en T-A15; el fallback integral y sin JavaScript del recorrido, en T-A16. Estos pósters cubren únicamente las cuatro escenas de T-A14. T-A20/23/24/25 siguen pendientes de revisión humana de sus greyboxes y del resto de sus dependencias.

## Reproducción

Con `npm run dev`, abrir `/lab/vibo`, `/lab/pirp`, `/lab/naturalis` o `/lab/banner-2`. El slider actualiza `?progress=`; la calidad se fuerza con `?quality=high|medium|low|static`. En producción estas cuatro rutas de lab no se generan.

En la home: `/?chapter=vibo&progress=0.4&quality=high&debug` (y los demás IDs). Recorrer hacia adelante y atrás; entrar a otro capítulo para comprobar el desmontaje.

QA automatizado en Windows con Edge instalado:

```powershell
npm run check
# Usar un servidor dedicado sin toolbar para evitar errores de la toolbar de Astro.
node --input-type=module -e "import {dev} from 'astro'; await dev({root:process.cwd(),devToolbar:{enabled:false},server:{port:3012,host:'127.0.0.1'},vite:{cacheDir:'.astro/a14-vite'}})"
# En otra terminal:
$env:A14_BASE_URL='http://127.0.0.1:3012'
node scripts/qa/a14.mjs
node scripts/qa/a14-flow.mjs
```

`a14.mjs` regenera capturas, pósters y `metricas.json`; `a14-flow.mjs` verifica los cuatro tiers, controles táctiles, reduced-motion y cinco vueltas de navegación. Los resultados completos están en `metricas.json` y `flujo.json`.

## Validación y límites

`npm run check` pasa: lint, 0 errores/warnings de typecheck, build y presupuestos GLB. El build conserva los avisos previos de directivas MDX y tamaño de chunk. El runtime conserva el aviso de deprecación de `THREE.Clock` y, en este driver, el aviso del shader del hilo existente; no se cambiaron esos módulos.

Las mediciones usan Edge headless en esta máquina, viewport desktop 1440×900 y mobile 390×844 con CPU ×4, DPR 1. Se tomaron 60 intervalos RAF por beat; no equivalen a validación de GPU o memoria en iPhone/Android reales. Los presupuestos de draw calls incluyen el hilo. Las cuatro escenas no descargan modelos ni texturas: assets WebGL externos = 0 KB en high/medium/low. Los pósters se descargan en static y su peso está registrado abajo.

La revisión humana del ritmo/arte y las pruebas en dispositivos reales de T-H06/T-H12 quedan pendientes. Este cambio no aprueba G1 ni las escenas finales.

## Métricas observadas

Mínimo FPS / máximo p95, calls y triángulos entre los beats capturados.

| Escena | Vista | FPS mín. | p95 máx. ms | Calls máx. | Triángulos máx. | Póster KB |
| --- | --- | --- | --- | --- | --- | --- |
| vibo | 1440×900 / high | 60.1 | 16.8 | 25 | 646 | 36.1 |
| vibo | 390×844 / low / CPU ×4 | 60.2 | 16.8 | 25 | 698 | 16.5 |
| pirp | 1440×900 / high | 60.1 | 16.8 | 8 | 1828 | 30.2 |
| pirp | 390×844 / low / CPU ×4 | 60.2 | 16.8 | 9 | 2108 | 15.5 |
| naturalis | 1440×900 / high | 60.8 | 16.8 | 53 | 962 | 27.8 |
| naturalis | 390×844 / low / CPU ×4 | 60.2 | 16.8 | 43 | 966 | 9.9 |
| banner-2 | 1440×900 / high | 60.2 | 16.8 | 34 | 20188 | 17.3 |
| banner-2 | 390×844 / low / CPU ×4 | 60.2 | 16.8 | 19 | 2268 | 4.6 |

## Capturas por beat y enlaces reproducibles

Las capturas se tomaron en lab sin el HUD de métricas; los controles propios de la escena permanecen visibles. Los enlaces son relativos al servidor local.

| Escena / beat | Enlace lab | Enlace recorrido | Desktop | Mobile |
| --- | --- | --- | --- | --- |
| vibo / mundo | [/lab/vibo?progress=0.1&quality=high](/lab/vibo?progress=0.1&quality=high) | [Recorrido](/?chapter=vibo&progress=0.1&quality=high&debug) | [1440×900](vibo-desktop-1.webp) | [390×844](vibo-mobile-1.webp) |
| vibo / razonamiento | [/lab/vibo?progress=0.4&quality=high](/lab/vibo?progress=0.4&quality=high) | [Recorrido](/?chapter=vibo&progress=0.4&quality=high&debug) | [1440×900](vibo-desktop-2.webp) | [390×844](vibo-mobile-2.webp) |
| vibo / solucion | [/lab/vibo?progress=0.7&quality=high](/lab/vibo?progress=0.7&quality=high) | [Recorrido](/?chapter=vibo&progress=0.7&quality=high&debug) | [1440×900](vibo-desktop-3.webp) | [390×844](vibo-mobile-3.webp) |
| vibo / resultado | [/lab/vibo?progress=0.9&quality=high](/lab/vibo?progress=0.9&quality=high) | [Recorrido](/?chapter=vibo&progress=0.9&quality=high&debug) | [1440×900](vibo-desktop-4.webp) | [390×844](vibo-mobile-4.webp) |
| pirp / mundo | [/lab/pirp?progress=0.1&quality=high](/lab/pirp?progress=0.1&quality=high) | [Recorrido](/?chapter=pirp&progress=0.1&quality=high&debug) | [1440×900](pirp-desktop-1.webp) | [390×844](pirp-mobile-1.webp) |
| pirp / problema | [/lab/pirp?progress=0.3&quality=high](/lab/pirp?progress=0.3&quality=high) | [Recorrido](/?chapter=pirp&progress=0.3&quality=high&debug) | [1440×900](pirp-desktop-2.webp) | [390×844](pirp-mobile-2.webp) |
| pirp / razonamiento | [/lab/pirp?progress=0.5&quality=high](/lab/pirp?progress=0.5&quality=high) | [Recorrido](/?chapter=pirp&progress=0.5&quality=high&debug) | [1440×900](pirp-desktop-3.webp) | [390×844](pirp-mobile-3.webp) |
| pirp / solucion | [/lab/pirp?progress=0.7&quality=high](/lab/pirp?progress=0.7&quality=high) | [Recorrido](/?chapter=pirp&progress=0.7&quality=high&debug) | [1440×900](pirp-desktop-4.webp) | [390×844](pirp-mobile-4.webp) |
| pirp / resultado | [/lab/pirp?progress=0.9&quality=high](/lab/pirp?progress=0.9&quality=high) | [Recorrido](/?chapter=pirp&progress=0.9&quality=high&debug) | [1440×900](pirp-desktop-5.webp) | [390×844](pirp-mobile-5.webp) |
| naturalis / mundo | [/lab/naturalis?progress=0.1&quality=high](/lab/naturalis?progress=0.1&quality=high) | [Recorrido](/?chapter=naturalis&progress=0.1&quality=high&debug) | [1440×900](naturalis-desktop-1.webp) | [390×844](naturalis-mobile-1.webp) |
| naturalis / problema | [/lab/naturalis?progress=0.3&quality=high](/lab/naturalis?progress=0.3&quality=high) | [Recorrido](/?chapter=naturalis&progress=0.3&quality=high&debug) | [1440×900](naturalis-desktop-2.webp) | [390×844](naturalis-mobile-2.webp) |
| naturalis / razonamiento | [/lab/naturalis?progress=0.5&quality=high](/lab/naturalis?progress=0.5&quality=high) | [Recorrido](/?chapter=naturalis&progress=0.5&quality=high&debug) | [1440×900](naturalis-desktop-3.webp) | [390×844](naturalis-mobile-3.webp) |
| naturalis / solucion | [/lab/naturalis?progress=0.7&quality=high](/lab/naturalis?progress=0.7&quality=high) | [Recorrido](/?chapter=naturalis&progress=0.7&quality=high&debug) | [1440×900](naturalis-desktop-4.webp) | [390×844](naturalis-mobile-4.webp) |
| naturalis / resultado | [/lab/naturalis?progress=0.9&quality=high](/lab/naturalis?progress=0.9&quality=high) | [Recorrido](/?chapter=naturalis&progress=0.9&quality=high&debug) | [1440×900](naturalis-desktop-5.webp) | [390×844](naturalis-mobile-5.webp) |
| banner-2 / mundo | [/lab/banner-2?progress=0.1&quality=high](/lab/banner-2?progress=0.1&quality=high) | [Recorrido](/?chapter=banner-2&progress=0.1&quality=high&debug) | [1440×900](banner-2-desktop-1.webp) | [390×844](banner-2-mobile-1.webp) |
| banner-2 / problema | [/lab/banner-2?progress=0.3&quality=high](/lab/banner-2?progress=0.3&quality=high) | [Recorrido](/?chapter=banner-2&progress=0.3&quality=high&debug) | [1440×900](banner-2-desktop-2.webp) | [390×844](banner-2-mobile-2.webp) |
| banner-2 / razonamiento | [/lab/banner-2?progress=0.5&quality=high](/lab/banner-2?progress=0.5&quality=high) | [Recorrido](/?chapter=banner-2&progress=0.5&quality=high&debug) | [1440×900](banner-2-desktop-3.webp) | [390×844](banner-2-mobile-3.webp) |
| banner-2 / solucion | [/lab/banner-2?progress=0.7&quality=high](/lab/banner-2?progress=0.7&quality=high) | [Recorrido](/?chapter=banner-2&progress=0.7&quality=high&debug) | [1440×900](banner-2-desktop-4.webp) | [390×844](banner-2-mobile-4.webp) |
| banner-2 / resultado | [/lab/banner-2?progress=0.9&quality=high](/lab/banner-2?progress=0.9&quality=high) | [Recorrido](/?chapter=banner-2&progress=0.9&quality=high&debug) | [1440×900](banner-2-desktop-5.webp) | [390×844](banner-2-mobile-5.webp) |

[Integración en el recorrido, mobile](recorrido-mobile.webp).

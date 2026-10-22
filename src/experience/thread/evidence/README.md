# Evidencia T-A13 · 2026-10-22

Chrome headless local, DPR 1. Desktop 1440×900 high; mobile 390×844 medium
con CPU ×4; low 1440×900. Progreso 0.45 en los cuatro capítulos.
FPS y frame times del monitor del runtime, después de estabilizar la carga.
No representa una medición en Android/iPhone reales ni una garantía de G1.
0 errores de consola en la captura final. La barra dev de Astro se desactivó
localmente tras identificar respuestas 504 en su entrypoint; no se modificó
la configuración del proyecto.

| Vista / capítulo | FPS · frame medio · p95 | Draw calls | Triángulos | Evidencia |
| --- | --- | --- | --- | --- |
| desktop / vibo | 60.0 Â· 16.7 ms Â· p95 17 ms | 1 | 0 | [captura](desktop-vibo.png) |
| desktop / pirp | midiendo Â· 16.7 ms Â· p95 16.8 ms | 1 | 0 | [captura](desktop-pirp.png) |
| desktop / naturalis | midiendo Â· 16.7 ms Â· p95 16.9 ms | 1 | 0 | [captura](desktop-naturalis.png) |
| desktop / banner-2 | midiendo Â· 16.7 ms Â· p95 16.8 ms | 1 | 0 | [captura](desktop-banner-2.png) |
| mobile / vibo | 60.1 Â· 16.7 ms Â· p95 18.4 ms | 2 | 480 | [captura](mobile-vibo.png) |
| mobile / pirp | midiendo Â· 16.7 ms Â· p95 17.2 ms | 2 | 480 | [captura](mobile-pirp.png) |
| mobile / naturalis | midiendo Â· 16.7 ms Â· p95 17.3 ms | 2 | 480 | [captura](mobile-naturalis.png) |
| mobile / banner-2 | 60.0 Â· 16.7 ms Â· p95 17.1 ms | 2 | 480 | [captura](mobile-banner-2.png) |
| low / vibo | midiendo Â· 16.7 ms Â· p95 16.8 ms | 2 | 280 | [captura](low-vibo.png) |
| low / pirp | midiendo Â· 16.7 ms Â· p95 16.8 ms | 2 | 280 | [captura](low-pirp.png) |
| low / naturalis | midiendo Â· 16.7 ms Â· p95 16.8 ms | 2 | 280 | [captura](low-naturalis.png) |
| low / banner-2 | midiendo Â· 16.7 ms Â· p95 16.8 ms | 2 | 280 | [captura](low-banner-2.png) |

Assets externos del hilo: **0 KB** en todos los niveles. Sin texturas.
Desktop C: 24.000 partículas (medium: 12.000), 1 geometría y 1 programa.
Mobile A medium: 2 geometrías y 2 programas; low usa 280 triángulos.
Cinco ciclos desktop/mobile vuelven a 1 geometría en desktop; static desmonta
el Canvas. Cinco ciclos home/caso conservan el mismo elemento Canvas.
`npm run check`: PASS (lint, tipos, build y assets). El build conserva los
avisos de directivas MDX existentes, sin errores. Script de regresión:
`node src/experience/thread/verify.mjs`: PASS, sin errores de consola.

No hay escenas reales registradas aún: la captura valida los presets del
hilo. Los beats y pósters de las escenas se validan en T-A14/T-A16.

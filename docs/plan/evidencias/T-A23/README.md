# T-A23 — Evidencia de implementación

Fecha: 2026-10-22. Chrome headless, Windows, GPU Intel Arc 140V. Viewports 1440×900 y 390×844, DPR 1; matriz mobile con CPU ×4. La emulación no acredita un teléfono real.

## Estado final tras revisión humana

- Noticias con profundidad única: se eliminó el z-fighting de las tarjetas solapadas. Dos frames consecutivos del agrupamiento son idénticos en ambas vistas.
- Grupos sin anillos ni conexiones decorativas. En mobile, las tarjetas de señales están ancladas abajo (`bottom: 100px`) y dejan libre el centro.
- Teléfono desktop +13 % respecto de la primera versión; mobile con presencia moderada (escala 3.7–3.85), desplazamiento e inclinación en tres ejes ligados al scroll. Altura geométrica según el aspecto real de la captura.
- Sin botonera ni galería en escena. Las capturas completas se consultan en el detalle del proyecto.
- Mobile con tarjetas superpuestas, transparencia y blur. Hilo oculto con el teléfono hasta el handoff.
- La primera tarjeta mobile queda oculta hasta 0.695, entra entre 0.695–0.735 y sale entre 0.76–0.795. La tendencia y la alerta acompañan esta ventana; el teléfono se ve despejado antes de su entrada. Todo es reversible.

## Capturas y deep links

| Beat / vista | Desktop | Mobile |
| --- | --- | --- |
| Mundo · `progress=0.12` | [captura](desktop-0.12.webp) | [captura](mobile-0.12.webp) |
| Problema · `progress=0.32` | [captura](desktop-0.32.webp) | [captura](mobile-0.32.webp) |
| Agrupamiento · `progress=0.52` | [captura](desktop-0.52.webp) | [captura](mobile-0.52.webp) |
| Solución · desktop 0.72 / mobile 0.75 | [captura](desktop-0.72.webp) | [captura](mobile-0.75.webp) |
| Resultado · `progress=0.85` | [captura](desktop-0.85.webp) | [captura](mobile-0.85.webp) |

Formato de enlace: `/?chapter=pirp&progress=0.52&quality=high`.

Detalle de la transición mobile: [teléfono despejado, 0.67](mobile-0.67.webp), [entrada, 0.715](mobile-0.715.webp), [salida, 0.78](mobile-0.78.webp). Opacidades observadas: 0 / 0,497 / 1 / 0,375 / 0 para progresos 0.67 / 0.715 / 0.75 / 0.78 / 0.85. Registro: [revision.json](revision.json).

## Verificaciones

- `npm run check`: lint, tipos, build y presupuestos de assets.
- Matriz high/medium/low en cinco beats de ambas vistas, mobile CPU ×4: [metrics.json](metrics.json). Incluye clasificación de las seis noticias, scroll inverso, salida/entrada y reduced-motion sin canvas.
- Smoke del build final en ambas vistas y controles de noticias: [production.json](production.json). Avisos de Three.js/PMREM y chunks compartidos registrados; no se presenta como ausencia de avisos.
- Tres ciclos de entrada/salida: [resources.json](resources.json). Después de liberar el render target PMREM completo, se vuelve a 2 geometrías / 1 textura del hilo persistente, sin acumulación.
- [revision.json](revision.json): estabilidad entre frames, ausencia de controles del teléfono y blur activo en mobile.

Assets por nivel: atlas 65.012 bytes + captura 38.782 bytes = **101,36 KiB**, dentro de los 200/150 KiB locales desktop/mobile. Agrupamiento: 1 draw call. Registro crudo de rendimiento en `metrics.json`.

## Límites de revisión

Arte final y dispositivo real pendientes del humano; G3 no se declara cerrada. Texturas WebP de 1024 en lugar de KTX2: desvío explícito para revisión (~5,8 MiB GPU con mipmaps). Pósters propios sin navegación global; T-A16 integral sigue diferida (ADR-012). No se incorporaron dependencias ni assets de terceros nuevos.

## Matriz de rendimiento final

Mínimos/máximos de cinco estados por calidad; canvas completo con hilo y escena siguiente cuando participa del handoff.

| Vista / calidad | FPS observados | p95 máximo | Draw calls máx. | Triángulos máx. |
| --- | --- | --- | --- | --- |
| Desktop high | 55,4–60 | 16,9 ms | 6 | 3.264 |
| Desktop medium | 60 | 17 ms | 6 | 2.040 |
| Desktop low | 57,4–60 | 17,1 ms | 7 | 1.504 |
| Mobile CPU ×4 high | 53,5–60,1 | 19,3 ms | 5 | 2.370 |
| Mobile CPU ×4 medium | 55,5–60,1 | 19,1 ms | 5 | 1.704 |
| Mobile CPU ×4 low | 54,1–60 | 18,5 ms | 5 | 1.504 |

La captura mobile `0.72` muestra la entrada progresiva de la tarjeta; `0.75` muestra su estado plenamente visible. El registro de dev conserva avisos de Three.js/PMREM y respuestas `504 Outdated Optimize Dep`; el smoke del build se informa por separado.

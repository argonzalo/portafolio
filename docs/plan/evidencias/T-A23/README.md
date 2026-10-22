# T-A23 — Evidencia de implementación

Fecha: 2026-10-22. Chrome headless, Windows, GPU Intel Arc 140V. Viewports 1440×900 y 390×844; mobile con CPU ×4 y DPR 1. La emulación no acredita rendimiento en un teléfono real.

## Capturas y deep links

Cada enlace usa el estado reproducible de la home. La galería de capturas está en el último beat.

| Beat | Deep link | Desktop | Mobile |
| --- | --- | --- | --- |
| Mundo | `/?chapter=pirp&progress=0.12&quality=high` | [captura](desktop-0.12.webp) | [captura](mobile-0.12.webp) |
| Problema | `/?chapter=pirp&progress=0.32&quality=high` | [captura](desktop-0.32.webp) | [captura](mobile-0.32.webp) |
| Razonamiento | `/?chapter=pirp&progress=0.52&quality=high` | [captura](desktop-0.52.webp) | [captura](mobile-0.52.webp) |
| Solución | `/?chapter=pirp&progress=0.72&quality=high` | [captura](desktop-0.72.webp) | [captura](mobile-0.72.webp) |
| Resultado | `/?chapter=pirp&progress=0.85&quality=high` | [captura](desktop-0.85.webp) | [captura](mobile-0.85.webp) |

## Métricas

Mínimos/máximos de cinco muestras por nivel. Métricas del canvas completo, incluido el hilo y la escena siguiente cuando participa del handoff. El laboratorio no sustituye la revisión de arte ni pruebas reales.

| Vista / nivel | FPS mín.–máx. | Frame p95 máximo | Draw calls máx. | Triángulos máx. | Texturas descargadas |
| --- | --- | --- | --- | --- | --- |
| Desktop high | 59,3–60 | 16,9 ms | 12 | 5.472 | 101,36 KiB |
| Desktop medium | 60 | 16,8 ms | 12 | 3.960 | 101,36 KiB |
| Desktop low | 56,7–60 | 16,9 ms | 13 | 3.160 | 101,36 KiB |
| Mobile CPU ×4 high | 50,7–60 | 18,3 ms | 13 | 4.152 | 101,36 KiB |
| Mobile CPU ×4 medium | 58,1–60,5 | 17,7 ms | 13 | 3.624 | 101,36 KiB |
| Mobile CPU ×4 low | 58,7–60 | 17,6 ms | 13 | 3.160 | 101,36 KiB |

Datos completos: [metrics.json](metrics.json). Presupuesto local: 55 draws, 20.000 triángulos, assets 200/150 KiB desktop/mobile. Atlas = 1 draw call. `npm run assets:check` confirma presupuesto global de `02`; el peso local anterior se verifica sumando ambos WebP.

## Controles verificados

- Seis noticias: clasificación por tema y sentimiento en desktop y mobile táctil (feed horizontal accesible para recorrer las seis).
- Galería: apertura, cambio de captura, Escape y devolución de foco.
- Reversibilidad: resultado → grafo → feed, seguido de selección de noticia; salida a Naturalis y retorno a Pirp.
- `prefers-reduced-motion`: sin canvas en ambas vistas. Póster específico registrado en la definición; T-A16 integral sigue diferido (ADR-012).
- `npm run check`: lint, typecheck (0 errores/warnings/hints), build y presupuestos pasan. El build conserva la advertencia de chunks grandes del runtime compartido.

## Recursos y corrección del kit

Se detectó una textura GPU adicional por cada ciclo al liberar solo `target.texture` del PMREM. El humano autorizó ampliar la zona a `src/scenes/kit/devices/materials.ts`; ahora se conserva el destructor del `WebGLRenderTarget` y se llama `target.dispose()`. El cambio es compartido por los dispositivos del kit, sin alterar su API.

Reproducción de tres ciclos y resultado: [resources.json](resources.json), generado por `node src/scenes/pirp/verify-resources.mjs`.

## Límites para revisión

- Arte y dispositivo real: pendientes de aprobación humana; no se declara G3 cerrada.
- Texturas WebP de 1024 en lugar de KTX2: desvío explícito para revisión. Se respetan descarga y dimensiones; ~5,8 MiB GPU con mipmaps entre ambos mapas.
- El dev server produjo respuestas `504 Outdated Optimize Dep` al actualizar módulos, además de avisos de `THREE.Clock` y precisión numérica de shaders compartidos. El registro crudo se conserva en `metrics.json`; no se presenta como consola limpia. El smoke del build se registra por separado.
- T-A42 sigue pendiente como componente de galería compartido; Pirp resuelve su propio acceso al producto dentro de su zona.

Resultado de los tres ciclos tras corregir PMREM: **2 geometrías / 1 textura** en los tres retornos a hero, igual al valor base (hilo persistente).

Smoke del build final: [production.json](production.json). **0 errores de consola** en cinco beats de ambas vistas, clasificación de las seis noticias y galería con Escape. Avisos de Three.js/PMREM conservados en ese archivo. Las métricas de rendimiento de metrics.json corresponden a la matriz anterior a la corrección de liberación; la verificación de memoria posterior está en esources.json. El cambio de liberación y el ajuste final de posición del teléfono no agregan geometrías ni descargas.

## Revisión con feedback humano

- Se quitaron anillos y conexiones luminosas entre grupos. El renderer del hilo se oculta durante 0.38–0.62 de Pirp; el reloj continúa para conservar las transiciones. El agrupamiento pasa de 12–13 a **1 draw call** en ambas vistas.
- Teléfono desktop +13 %; paginación 1/2 y ampliación bajo el teléfono, ancladas a su borde inferior en 3D. Se elimina el CTA de la estrategia.
- Recomendaciones con números, títulos y separadores.
- `Phone.screenAspect` adapta geometría del cuerpo, vidrio, pantalla y posición de botones/isla a la captura. Ancho, radios y grosor se conservan; los demás consumidores mantienen las dimensiones originales por defecto.
- La segunda captura optimizada se descarga al seleccionarla: 29.168 bytes. Total de ambos mapas de UI + atlas: **129,85 KiB** (primera visita: 101,36 KiB). Sigue dentro de los 150 KiB locales mobile. Metadatos obtenidos en el generador: `capture-dimensions.json`.
- Paginación, ampliación de la captura actual, Escape y foco comprobados en ambas vistas: [revision.json](revision.json). Las capturas principales y los pósters se regeneraron tras estos ajustes. Las métricas anteriores son conservadoras para draw calls/triángulos: se eliminaron mallas, sin agregar otras.

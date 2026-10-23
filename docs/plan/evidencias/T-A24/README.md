# T-A24 — Naturalis: evidencia

Fecha: 2026-10-22. Rama `t/A24-naturalis`.

Escena final con camilla propia, sala horneada en Blender y ciclo día/noche. Se incorporan las correcciones humanas: capturas `app-web/2.webp` y `natuadmin/2.webp`, libreta plana sobre la mesa, predominio crema/pastel, cortina oculta en mobile, follaje permanente y ausencia de botonera.

## Verificación

- `npm run check`: lint, typecheck (0 errores / 0 warnings), build y presupuestos correctos.
- Escena: 30 muestras (5 beats × 3 niveles × 2 vistas), audio opt-in, scroll inverso, handoff, recursos y reduced motion. Errores: 0.
- Build de producción: 10 deep links; 0 errores y 0 solicitudes fallidas.
- Los avisos registrados del runtime son la deprecación global de THREE.Clock, avisos numéricos del driver Intel al compilar materiales del kit y el aviso de Astro al activar reduced motion. El build conserva su aviso previo de chunk grande.
- Se desactivó la barra de desarrollo del servidor de revisión: su entrypoint emitía 504; no pertenecía a la escena. El informe final corresponde a la ejecución posterior.

## Capturas

| Beat | Desktop 1440×900 | Mobile 390×844 | Deep link |
| --- | --- | --- | --- |
| mundo | [Captura](./desktop-mundo.webp) | [Captura](./mobile-mundo.webp) | [Estado](/?chapter=naturalis&progress=0.12&quality=high&debug) |
| problema | [Captura](./desktop-problema.webp) | [Captura](./mobile-problema.webp) | [Estado](/?chapter=naturalis&progress=0.3&quality=high&debug) |
| razonamiento | [Captura](./desktop-razonamiento.webp) | [Captura](./mobile-razonamiento.webp) | [Estado](/?chapter=naturalis&progress=0.5&quality=high&debug) |
| solucion | [Captura](./desktop-solucion.webp) | [Captura](./mobile-solucion.webp) | [Estado](/?chapter=naturalis&progress=0.7&quality=high&debug) |
| resultado | [Captura](./desktop-resultado.webp) | [Captura](./mobile-resultado.webp) | [Estado](/?chapter=naturalis&progress=0.835&quality=high&debug) |

Handoff: muestras 0.87, 0.92, 0.97 y 0.999 en ambas vistas. Follaje: capturas 0.18 y 0.24 en ambas vistas. Pósters generados desde el canvas en `public/posters/naturalis/`.

## Métricas

Chrome headless, Intel Arc 140V, DPR 1; mobile con CPU ×4. FPS y p95 son las ventanas del monitor del runtime en cada muestra; no equivalen a un teléfono físico.

| Vista / nivel | FPS mín.–máx. | p95 máx. (ms) | Draw calls máx. | Triángulos máx. | Gráficos (KiB) |
| --- | --- | --- | --- | --- | --- |
| desktop / high | 58.1–60 | 18.1 | 24 | 26223 | 287.6 |
| desktop / medium | 59.4–60 | 17.2 | 18 | 14709 | 270.2 |
| desktop / low | 60–60.1 | 17.6 | 19 | 12541 | 253.7 |
| mobile / high | 52–59.5 | 19 | 24 | 25503 | 287.6 |
| mobile / medium | 55.4–59.4 | 18.8 | 18 | 14182 | 270.2 |
| mobile / low | 56.1–60.1 | 18.4 | 18 | 11893 | 253.7 |

Los gráficos incluyen GLB, atlas nocturno y las tres texturas comunes en cada nivel. Audio existente: 1696.7 KiB adicionales solo tras un gesto; no se descarga al entrar. Meshopt + WebP, atlas de 1024 px en todos los niveles para mantener la iluminación estable.

Continuidad: 31 muestras entre 0.55 y 0.85. Mayor variación media de canal entre muestras consecutivas de la región de control: 4.53/255. Los tres niveles mantienen el mismo color diurno en la región de pared comprobada.

Recursos al salir (tres recorridos ida/vuelta):
- desktop: geometrías 1 → 1; texturas 2 → 2.
- mobile: geometrías 2 → 2; texturas 2 → 2.

Informes completos: [metrics.json](./metrics.json), [production.json](./production.json).

## Límites pendientes de revisión humana

- Validación de arte y sensaciones en el preview; prueba en iPhone/Android reales y Safari.
- Arrastre de cortina: nice-to-have de la ficha; no implementado.
- KTX2 no verificado; se usa el fallback WebP admitido por el pipeline.
- Carousel compartido de T-A42 fuera de esta tarea; la botonera local fue retirada por pedido humano.

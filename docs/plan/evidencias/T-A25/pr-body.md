## Tarea

T-A25 · [Brief](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/briefs/T-A25.md)

## Qué cambia

Banner ocupa un solo tramo de 100svh, un 80% menos que el greybox. Conserva la composición elegida: interfaz central y cuatro pantallas conectadas (dos en mobile), con zoom suave, slides 1→3→5→6 y recambios de video escalonados con blur/crossfade según el scroll.

Los videos usan cover sin deformación; se recortan por UV las franjas incorporadas al clip de hamburguesa. Naturalis se retira antes de revelar Banner, con fondo e iluminación coordinados y orden de capas que mantiene visibles las imágenes durante el fundido.

Se incluyen ocho clips provistos por el humano, capturas optimizadas, pósters y evidencia. Sin dependencias ni contratos nuevos. Los dos cambios en archivos compartidos corresponden al pedido humano explícito de pulir Naturalis→Banner y están declarados en el tablero.

## Cómo verificar

- `npm run check` (pasó); lint y build posteriores al último ajuste de shader también pasaron.
- `/?chapter=banner-2&progress=0.12&quality=high`: recorrer hasta `.85` y volver; en mobile usar `quality=low`.
- `/?chapter=naturalis&progress=0.90&quality=high`: recorrer hasta `.999`; la sala no debe recortar las pantallas.
- Scripts y registros reproducibles en `docs/plan/evidencias/T-A25/README.md`.

## Evidencia

| Beat / vista | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| Composición inicial | [Desktop](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/desktop-0.12.webp) | [Mobile](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/mobile-0.12.webp) |
| Slides y recambio | [Desktop](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/desktop-0.56.webp) | [Mobile](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/mobile-0.56.webp) |
| Entrada desde Naturalis | [Desktop](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/desktop-entrada-0.97.webp) | [Mobile](https://github.com/argonzalo/portafolio/blob/t/A25-banner-2/docs/plan/evidencias/T-A25/mobile-entrada-0.97.webp) |

| Métrica | Desktop high | Mobile low (CPU ×4) | Presupuesto |
| --- | --- | --- | --- |
| FPS (90 frames por muestra) | 60.1–60.7 | 59.6–60.7 | 60 / ≥50 |
| Draw calls | 28 | 18 | ≤40 |
| Triángulos | 4.706 | 2.164 | ≤50.000 |
| Assets | 760 KiB | 350 KiB | 1.200 / 600 KiB |

p95 rAF ≤16.8 ms en ambas vistas. El monitor continuo registró p95 17.4 ms desktop / 24.7 ms mobile, con otra ventana de medida. Emulación y métricas no sustituyen revisión en teléfonos reales.

Pruebas: reproducción/pausa por visibilidad, dos ciclos de salida con fuentes de video liberadas y contadores estables, static, reduced motion y medium. Entrada revisada en 16 posiciones sin mundos superpuestos. Sin errores nuevos; `shader-check.json` confirma la corrección del aviso X4000 observado en la primera medición. Persisten avisos previos de Clock, precisión del driver Intel en el kit y chunk compartido grande.

## Checklist

- [x] `npm run check` pasa
- [x] Solo zona declarada, con excepción compartida solicitada por el humano
- [x] `high`, `medium`, `low` y póster `static`
- [x] `prefers-reduced-motion`; animación por scroll también táctil
- [x] Recursos liberados al salir
- [x] Licencias registradas
- [x] Tablero y documentos actualizados
- [ ] Aprobación final de arte y Safari/iPhone / Android reales

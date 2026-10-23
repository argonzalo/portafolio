# T-A43 — Cabecera y manifiesto

Pedido humano del 23/10/2026. Rama `t/A43-hero-retrato-manifiesto`.

## Resultado

- Retrato existente de 44.912 bytes, fragmentado con canvas 2D: hasta 98 triángulos desktop / 50 táctil, menos fragmentos transparentes descartados. Ensamblado inicial, dispersión reversible por scroll y atracción local al cursor.
- Composición en dos columnas desktop y retrato superior mobile; chips y jerarquía tipográfica renovados.
- Fondos opacos locales en los bloques de lectura: el hilo conserva su renderer global y permanece visible fuera del texto. La regla global de transparencia de capítulos no afecta estos bloques internos.
- GSAP + SplitText + ScrollTrigger: ensamblado de caracteres, despliegue de palabras y construcción escalonada. Sin dependencias nuevas. Se elimina “Así toma forma en Vibo”.
- Movimiento reducido: imagen HTML y frases sin dividir, sin listeners del retrato. Limpieza al navegar y restauración al volver.

## Verificación

`npm run check`: lint, typecheck, build y presupuestos de assets. Build conserva el aviso de chunks mayores a 500 kB.

`node docs/plan/evidencias/T-A43/verify.mjs` (servidor local en puerto 3010 y Chrome instalado): capturas 1440×900 y 390×844; scroll, magnetismo desktop, ausencia de overflow horizontal, navegación home → proyectos → atrás, cambio dinámico de movimiento reducido y ausencia del enlace eliminado. Cero errores JavaScript en ambos tamaños. Resultados en `checks.json`.

Muestreo de 90 intervalos rAF durante scroll del hero: mediana 16,7 ms (~60 FPS), p95 16,8 ms en desktop y mobile emulado con CPU ×4. No equivale a un benchmark de dispositivos físicos ni certifica el recorrido completo. La pieza nueva es canvas 2D: no agrega draw calls o triángulos WebGL al Stage. Su imagen pesa 43,9 KiB en ambos tamaños; no agrega GLB ni texturas GPU.

Las capturas `*-hero.png`, `*-fragments.png`, `*-phrase-{1,2,3}.png` y `*-reduced.png` corresponden al inicio, dispersión parcial, las frases resueltas y la alternativa estática. El script recorre las posiciones reales del DOM para que sea reproducible en cada viewport.

Pendiente: sensaciones en teléfono físico y aprobación estética humana. No se ejecutó QA multidispositivo del resto de escenas ni medición de fugas GPU (no modificadas).

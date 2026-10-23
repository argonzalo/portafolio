# T-A43 — Cabecera y manifiesto

Pedido humano del 23/10/2026. Rama `t/A43-hero-retrato-manifiesto`.

## Resultado

- Retrato existente de 44.912 bytes, fragmentado con canvas 2D: hasta 98 triángulos desktop / 50 táctil, menos fragmentos transparentes descartados. Núcleo facial compacto y contorno con dispersión radial marcada, especialmente lateral. Ensamblado inicial, dispersión reversible por scroll y atracción local al cursor. Canvas con todo el ancho del viewport y altura triple al retrato para alojar la dispersión sin recortes laterales del contenedor. Recalcula tamaño y origen al redimensionar.
- Composición en dos columnas desktop y retrato superior centrado en mobile. Retrato al 76 % de su columna y máximo 310px desktop; 44vw y máximo 180px móvil. Chips sin relleno, con borde neutro al 22 %, texto discreto y padding reducido para priorizar el título.
- Bloques de lectura totalmente transparentes, sin fondos ni sombras. El hilo conserva su renderer global: una curva editorial en el espacio libre a la derecha evita el texto. La curva también se aplica al destino del handoff para mantener continuidad al entrar en cada capítulo.
- GSAP + SplitText + ScrollTrigger: las tres frases comparten el despliegue por palabras de “Diseño experiencias”. Timeline con scrub de 0,45 s, secuencia entre top 65 % y top 10 % y capítulo de 100svh en flujo normal, sin sticky. La salida del texto acaba en bottom 85 %, antes del handoff a Vibo (0,70 de progreso); el modo reducido conserva el texto estático. Sin dependencias nuevas. Se elimina “Así toma forma en Vibo”.
- Ritmo pulido: el manifiesto alinea su contenido arriba con padding de 2–3rem. Su título aparece 157px antes en desktop y 200px antes en móvil emulado (medido comparando el layout previo). El handoff a Vibo pasa del último 14 % al 30 % del scroll del capítulo, con hilo, cámara, paleta y captions sincronizados; las demás transiciones mantienen 0,86.
- Movimiento reducido: imagen HTML y frases sin dividir, sin listeners del retrato. Limpieza al navegar y restauración al volver.

## Verificación

`npm run check`: lint, typecheck, build y presupuestos de assets. Build conserva el aviso de chunks mayores a 500 kB.

`node docs/plan/evidencias/T-A43/verify.mjs` (servidor local en puerto 3010 y Chrome instalado): capturas 1440×900 y 390×844; scroll, magnetismo desktop, ausencia de overflow horizontal, retrato centrado en móvil, canvas del ancho del viewport, texto retirado al entrar en Vibo y comprobación de fondos transparentes sin sombras, navegación home → proyectos → atrás, cambio dinámico de movimiento reducido y ausencia del enlace eliminado. Cero errores JavaScript en ambos tamaños. Resultados en `checks.json`.

Muestreo de 90 intervalos rAF durante scroll del hero: mediana 16,7 ms (~60 FPS), p95 16,8 ms en desktop y mobile emulado con CPU ×4. No equivale a un benchmark de dispositivos físicos ni certifica el recorrido completo. La pieza nueva es canvas 2D: no agrega draw calls o triángulos WebGL al Stage. Su imagen pesa 43,9 KiB en ambos tamaños; no agrega GLB ni texturas GPU.

Las capturas `*-hero.png`, `*-fragments.png`, `*-phrase-{1,2,3}.png` y `*-handoff.png` y `*-reduced.png` corresponden al inicio, dispersión parcial, el avance de la secuencia de frases y la alternativa estática. El script recorre las posiciones reales del DOM para que sea reproducible en cada viewport.

Pendiente: sensaciones en teléfono físico y aprobación estética humana. No se ejecutó QA multidispositivo del resto de escenas ni medición de fugas GPU (no se modificaron materiales, geometrías ni ciclo de montaje).

## Pulido de entrada a Vibo

`node docs/plan/evidencias/T-A43/transitions.mjs`: compara espaciado con el CSS previo, verifica el intervalo 0,70–1 (2,14 veces el recorrido original y un 36 % más que el ajuste previo de 22 %), captura cinco pasos desktop/mobile y vuelve al punto intermedio. Paleta idéntica al volver, textos del manifiesto ya ocultos y cero errores JavaScript. Evidencia en `transitions.json` y `*-vibo-entry-{0,1,2,3,4}.png`. Se conserva la misma curva quíntica y el destino del hilo. La duración temporal sigue dependiendo de la velocidad de scroll del visitante.

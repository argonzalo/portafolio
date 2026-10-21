# 02 — Rendimiento y mobile

> El rendimiento es un requisito de producto, no una tarea de pulido. Se mide desde F0 y cada PR de escena incluye sus números.

## 1. Presupuestos globales

| Recurso | Presupuesto | Cómo se verifica |
| --- | --- | --- |
| LCP (laboratorio, mobile 4G simulado) | ≤ 2,0 s | Lighthouse CI en cada PR |
| LCP (usuarios reales, p75) | ≤ 2,5 s | Vercel Speed Insights |
| INP | ≤ 150 ms | Lighthouse CI + Speed Insights |
| CLS | ≤ 0,05 | Lighthouse CI |
| JS inicial (antes del 3D), gzip | ≤ 90 KB | Visualizador de bundle + aserción en CI |
| Núcleo 3D (three + R3F + drei usados), gzip | ≤ 260 KB, cargado **después** del LCP | Visualizador de bundle |
| Código por escena, gzip | ≤ 60 KB | Visualizador de bundle |
| Fuentes | ≤ 2 pesos de Poppins precargados, subset latino, `font-display: swap` | Revisión |
| Contextos WebGL | 1 en todo el sitio | Overlay de debug |
| Escenas montadas a la vez | ≤ 2 | Overlay de debug |

## 2. Presupuestos por escena

| | Primera línea | Segunda línea (viñeta) | Tercera línea (archivo) |
| --- | --- | --- | --- |
| Assets desktop (`high`) | ≤ 1,5 MB | ≤ 400 KB | 0 (solo imágenes responsive) |
| Assets mobile (`low`/`medium`) | ≤ 600 KB | ≤ 200 KB | 0 |
| Triángulos desktop / mobile | ≤ 300 k / ≤ 100 k | ≤ 80 k / ≤ 40 k | — |
| Draw calls | ≤ 100 | ≤ 40 | — |
| Texturas | KTX2, máx. 2048 desktop · 1024 mobile | KTX2, máx. 1024 | — |
| FPS | 60 desktop · ≥ 50 Android medio | igual | — |
| Frame time p95 | ≤ 20 ms en Android medio | igual | — |

Si una escena no entra en el presupuesto, el orden para recortar es: postprocesado → partículas → resolución de texturas → geometría → luces en tiempo real. Nunca se recorta legibilidad ni respuesta al input.

## 3. Estrategias obligatorias

**Carga**

- El hero es **HTML y CSS**: el LCP es el titular, no el canvas. El 3D se inicializa en `requestIdleCallback` tras el primer render y aparece con un fundido.
- Cada escena es un chunk lazy; se precarga un capítulo antes de llegar.
- Imágenes de proyecto migradas a `astro:assets` (AVIF/WebP responsive con `srcset`); las de `public/images/proyects` se mueven a `src/assets/projects`.
- Pósters de fallback generados a partir de la propia escena (captura con Playwright en el nivel `high`), no hechos a mano.

**GPU**

- Iluminación horneada; sombras en tiempo real solo en `high` y solo si una escena lo justifica.
- `InstancedMesh` para todo lo repetido (pantallas de Banner, titulares de Pirp, hojas de Naturalis, articulaciones del jugador de Vibo).
- Compilar shaders antes de entrar a la escena (`renderer.compile` en idle) para evitar tirones.
- DPR adaptativo; tope 2 en desktop, 1,5 en mobile.
- Postprocesado: un único composer, efectos fusionados, solo en `high`.
- Liberar todo al desmontar; verificar en el overlay que geometrías y texturas vuelven al valor base.

**Hilo principal**

- Animaciones DOM solo con `transform` y `opacity` (GSAP); nada de animar `top`, `width` o filtros pesados en scroll.
- Ningún `setState` por frame; el progreso vive en un store mutable.
- Trabajo pesado de datos (layout de grafos de Pirp, heatmaps de Vibo) **precalculado en build**, no en el navegador.

**Respeto al usuario**

- `prefers-reduced-motion` → nivel `static` (o `low` sin movimiento de cámara si el usuario lo elige explícitamente).
- `Save-Data` o conexión 2G/3G lenta → `static` con opción de activar la experiencia.
- Pestaña oculta → loop pausado y audio silenciado.

## 4. Mobile: diseño propio, no versión recortada

Mobile y desktop se diseñan **a la vez** en cada ficha de escena (`03-escenas.md`), con encuadre propio:

- **Cámara por breakpoint:** cada escena define encuadres para vertical (mobile) y horizontal (desktop). En vertical se apila: escena arriba, texto abajo, o texto sobre una zona vacía prevista en la composición.
- **Sin dependencia del hover:** toda interacción tiene equivalente táctil (tap, arrastre corto). El hover es solo un plus en desktop.
- **Áreas táctiles** de al menos 44×44 px; nada importante en los bordes donde iOS/Android tienen gestos.
- **Altura de viewport:** usar `svh`/`dvh`; probar la barra de direcciones que aparece y desaparece en iOS Safari y Chrome Android (provoca saltos en ScrollTrigger si no se maneja).
- **Memoria en iOS Safari:** es el límite más estricto (la pestaña se recarga sin aviso). Presupuesto de assets mobile respetado de forma estricta y prueba en iPhone real desde G0.
- **Audio:** solo tras un gesto del usuario (requisito de iOS) y con control visible.
- **Overlays del HUD:** en mobile se muestran de a uno y por tap, no todos simultáneos.

## 5. Matriz de dispositivos de prueba

| Dispositivo | Por qué | Cuándo |
| --- | --- | --- |
| iPhone de 3–4 años (por ejemplo iPhone 12) con Safari | Límite de memoria y quirks de WebGL/viewport | Desde G0, en cada compuerta |
| Android de gama media (por ejemplo Samsung serie A5x) con Chrome | Es el piso del objetivo de ≥ 50 FPS | Desde G0, en cada compuerta |
| Android de gama baja | Verificar que cae a `low`/`static` con elegancia | G1 y G5 |
| Notebook con GPU integrada (Windows) | Desktop típico de un cliente | Desde G0 |
| Mac con pantalla retina | DPR 2, Safari desktop | G1 y G5 |
| Firefox desktop | Diferencias de WebGL y de scroll | G1 y G5 |

Las pruebas en dispositivos reales las hace el humano (T-H06, T-H13). Los agentes cubren lo automatizable con Playwright y emulación (viewport, CPU throttling, `prefers-reduced-motion`).

## 6. Medición continua

- **CI (GitHub Actions):** `npm run check` + Lighthouse CI sobre el preview de Vercel con aserciones de los presupuestos de §1. Un PR que rompe un presupuesto no se mergea sin una nota explícita del humano.
- **Por escena:** el PR incluye una tabla con FPS (desktop y mobile emulado), draw calls, triángulos, peso de assets por nivel y capturas desktop/mobile.
- **Producción:** Vercel Speed Insights (Core Web Vitals reales) y eventos propios con el nivel de calidad asignado, para saber qué parte de la audiencia ve cada nivel.

# Evidencia — T-A18: Kit de escena (`src/scenes/kit/` + `/lab/kit`)

## 1. Alcance cumplido

Implementación completa del **Kit de Escena** (`03-escenas.md` §1) y su laboratorio de inspección aislada en `/lab/kit`:

1. **Rig de cámara por beats (`src/scenes/kit/cameraRig.ts`)**
   - Hook `useBeatCameraRig` e interpolación pura `interpolateCameraState` con easing C² (`smootherPhase` quíntico) y curvas Catmull-Rom 3D entre *frames* de cámara, *targets* y FOV diferenciados para desktop y mobile (`390×844`).
   - Amortiguación exponencial libre de *dependencia de framerate* y respeto automático por `prefers-reduced-motion: reduce`.
   - Helpers matemáticos puros (`phase`, `smootherPhase`, `beatEnvelope`, `resampleCurvePoints`, `formatKitNumber`, `buildTrendSvgGeometry`) sin `setState` por frame.

2. **Líneas y trayectorias con el shader del hilo (`src/scenes/kit/ThreadLine.tsx`)**
   - Cinta 3D en espacio de vista con núcleo cálido, halo externo, trazado progresivo (`uDraw`) y pulsos luminosos que viajan por la curva (`uPulseTail`, `uPulseSpeed`), más cabeza emisiva `Points` en la punta activa.
   - Comparte el lenguaje visual del hilo conductor (`Filament.tsx` de T-A13) y soporta tanto fondos oscuros (`AdditiveBlending`) como temas claros (`NormalBlending`, caso Naturalis `#F4F9F7`).
   - Limpieza explícita de `BufferGeometry` y `ShaderMaterial` al desmontar.

3. **HUD anclado a coordenadas 3D (`src/scenes/kit/HudOverlay.tsx`)**
   - Proyección en `useFrame` desde espacio mundo 3D a píxeles de pantalla (`Vector3.project(camera)`) escribiendo directo en nodos DOM y atributos SVG (`transform`, `points`, `x1/y1/x2/y2`, `d`) con **cero `setState` por frame**.
   - **Bounding Boxes 3D (`HudBoundingBox3D`)**: proyecta las 8 esquinas del volumen 3D al rectángulo envolvente en pantalla con esquinas tipo *broadcast*, barra de estado interactiva y telemetría de confianza.
   - **Esqueleto de pose (`HudPoseSkeleton3D`)**: articulaciones y huesos proyectados en SVG con medidor de ángulo biométrico en vivo (`HudAngleGauge3D`).
   - **Marcadores y callouts (`HudMarkerItem`)**: pines táctiles de `44×44 px` con líneas guía quebradas en SVG y tarjetas de datos; en mobile (`390×844`) aplica la regla de **una sola tarjeta activa a la vez** (`02-rendimiento-y-mobile.md` §4) para evitar solapamientos.

4. **Grafo de nodos / agentes (`src/scenes/kit/AgentGraph.tsx`)**
   - Posiciones precalculadas (sin física por frame) con disposición automática en tira vertical para mobile (`02-rendimiento-y-mobile.md` §4).
   - Conexiones animadas mediante `<ThreadLine>` con pulsos dirigidos, esferas 3D con shader *rim-lit*, anillos de decisión y etiquetas proyectadas en DOM con estado de cada etapa (`idle` → `active` → `done`) e inspección por clic/tap (`≥ 44×44 px`).

5. **Contadores, barras y curva de tendencia (`src/scenes/kit/CountersAndCharts.tsx`)**
   - Componente `TelemetryDeck` que anima contadores numéricos (`font-variant-numeric: tabular-nums`), barras de distribución aceleradas por GPU (`transform: scaleX(...)`) y curvas de tendencia SVG con área bajo la curva, trazo progresivo por `scroll`, marcador de pico pulsante y banner de alerta.

6. **Partículas GPU con presupuesto por nivel (`src/scenes/kit/ParticleField.tsx`)**
   - Un único `Points` (*1 draw call*) con presupuestos por nivel (`high: 720`, `medium: 360`, `low: 140`) y tres modos (`stadium`, `stream`, `calm`).

7. **Paletas de producto y laboratorio `/lab/kit` (`src/scenes/kit/theme.ts`, `KitLab.tsx`, `src/pages/lab/kit.astro`)**
   - 4 temas de marca reales (`vibo`, `pirp`, `naturalis` claro, `banner` industrial) con tipografía, bordes y contrastes de producto real.
   - Controles de progreso (`0..1`), selector de los 5 beats, selector de paleta, marco `390×844`, *fallback* `static` con pósters reales (`public/posters/greybox/kit.png` y `kit-mobile.png`) y `<DebugOverlay alwaysVisible />`.

---

## 2. Cómo reproducir

1. Levantar el servidor de desarrollo:
   ```bash
   npm.cmd run dev
   ```
2. Abrir el laboratorio en el navegador:
   - **Beat 1 (Mundo y trayectorias con shader del hilo):** `http://localhost:4321/lab/kit?progress=0.12&preset=vibo&quality=high`
   - **Beat 2 (HUD anclado a 3D + Pose + Bounding Box):** `http://localhost:4321/lab/kit?progress=0.33&preset=vibo&quality=high`
   - **Beat 3 (Grafo de nodos / agentes):** `http://localhost:4321/lab/kit?progress=0.55&preset=vibo&quality=high`
   - **Beat 4 (Curva de tendencia y pico):** `http://localhost:4321/lab/kit?progress=0.75&preset=vibo&quality=high`
   - **Beat 5 (Contadores y síntesis):** `http://localhost:4321/lab/kit?progress=0.92&preset=vibo&quality=high`
   - **Paletas por escena:** `?preset=pirp`, `?preset=naturalis` (tema claro), `?preset=banner`
   - **Marco móvil `390×844` en escritorio:** `?frame=mobile&quality=low`
   - **Fallback estático (`static`):** `?quality=static`
3. Para ejecutar la batería automatizada de capturas, métricas e interacciones táctiles:
   ```bash
   node scripts/qa/a18.mjs
   ```

---

## 3. Tabla de métricas por beat

Mediciones obtenidas con `node scripts/qa/a18.mjs` (Edge headless, 60 muestras de `requestAnimationFrame` por beat + sondas de `GpuStatsProbe` y `DebugOverlay`; detalle completo en [`metricas.json`](./metricas.json)):

### Desktop (`1440×900`, nivel `high`)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 80) | Triángulos (máx ≤ 150k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Mundo y trayectorias** (`vibo/mundo`) | `0.12` | **60.5** | `16.8 ms` | `22` | `5.322` | `0` | `17` | `9` |
| **2. HUD 3D + Pose + BBox** (`vibo/razonamiento`) | `0.33` | **60.9** | `16.8 ms` | `23` | `5.578` | `0` | `19` | `9` |
| **3. Grafo de nodos** (`vibo/grafo`) | `0.55` | **60.6** | `16.8 ms` | `43` | `8.082` | `0` | `30` | `9` |
| **4. Tendencia y pico** (`vibo/tendencia`) | `0.75` | **60.3** | `16.8 ms` | `22` | `6.570` | `0` | `31` | `9` |
| **5. Contadores y síntesis** (`vibo/resultado`) | `0.92` | **60.3** | `16.8 ms` | `22` | `6.570` | `0` | `31` | `9` |

### Mobile (`390×844`, nivel `low`, CPU throttling ×4)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 35) | Triángulos (máx ≤ 35k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Mundo y trayectorias** (`vibo/mundo`) | `0.12` | **60.9** | `16.8 ms` | `17` | `2.606` | `0` | `14` | `7` |
| **2. HUD 3D + Pose + BBox** (`vibo/razonamiento`) | `0.33` | **61.0** | `16.7 ms` | `19` | `2.710` | `0` | `16` | `7` |
| **3. Grafo de nodos** (`vibo/grafo`) | `0.55` | **60.5** | `16.8 ms` | `35` | `3.870` | `0` | `23` | `7` |
| **4. Tendencia y pico** (`vibo/tendencia`) | `0.75` | **61.1** | `16.8 ms` | `18` | `4.038` | `0` | `24` | `7` |
| **5. Contadores y síntesis** (`vibo/resultado`) | `0.92` | **60.6** | `16.7 ms` | `18` | `4.038` | `0` | `24` | `7` |

### Pósters estáticos (`static` / `prefers-reduced-motion`)

| Archivo | Tamaño | Presupuesto (`02` §3) |
| :--- | :---: | :---: |
| `public/posters/greybox/kit.png` | **129,0 KB** | `≤ 150 KB` |
| `public/posters/greybox/kit-mobile.png` | **42,1 KB** | `≤ 150 KB` |

---

## 4. Capturas por beat y preset

### Desktop (`1440×900`, `high`)
- [`kit-desktop-1.webp`](./kit-desktop-1.webp) — Beat 1: Rig de cámara + Cancha 3D + Trayectorias con shader del hilo.
- [`kit-desktop-2.webp`](./kit-desktop-2.webp) — Beat 2: HUD proyectado en 3D + Esqueleto de pose 17p + Arco de ángulo + Bounding Box + Callouts.
- [`kit-desktop-3.webp`](./kit-desktop-3.webp) — Beat 3: Grafo de nodos / agentes con pulsos dirigidos y etiquetas de decisión.
- [`kit-desktop-4.webp`](./kit-desktop-4.webp) — Beat 4: Curva de tendencia SVG progresiva con detección de pico y barras GPU.
- [`kit-desktop-5.webp`](./kit-desktop-5.webp) — Beat 5: Contadores numéricos animados (`tabular-nums`) y síntesis de resultado.

### Mobile (`390×844`, `low`, CPU ×4)
- [`kit-mobile-1.webp`](./kit-mobile-1.webp) — Beat 1 (encuadre vertical móvil + trayectorias).
- [`kit-mobile-2.webp`](./kit-mobile-2.webp) — Beat 2 (HUD proyectado + tarjeta única activa al tocar pin de `44×44 px`).
- [`kit-mobile-3.webp`](./kit-mobile-3.webp) — Beat 3 (grafo de nodos reordenado en tira vertical para móvil).
- [`kit-mobile-4.webp`](./kit-mobile-4.webp) — Beat 4 (panel de tendencia inferior adaptado a `390×844`).
- [`kit-mobile-5.webp`](./kit-mobile-5.webp) — Beat 5 (contadores y barras en disposición móvil).

### Variantes de paleta para escenas y viñetas (T-A20 a T-A24)
- [`kit-preset-pirp.webp`](./kit-preset-pirp.webp) — Paleta **Pirp** (`#0F172A` + bordó `#62233E` + `#4F46E5`).
- [`kit-preset-naturalis.webp`](./kit-preset-naturalis.webp) — Paleta **Naturalis** tema claro (`#F4F9F7` + `#56857D` + `#466B95`).
- [`kit-preset-banner.webp`](./kit-preset-banner.webp) — Paleta **Banner** industrial (`#141110` + `#DA3E00` + `#FF7A33`).

---

## 5. Notas de alcance

- Los dispositivos 3D estilizados (teléfono, monitor y pantalla vertical en espacio 3D) pertenecen a la tarea **T-A19**, como indica explícitamente `docs/plan/tablero.md`.

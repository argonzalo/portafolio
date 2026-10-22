# Evidencia — T-A30: Viñeta Starbene (`src/scenes/starbene/` + `/lab/starbene`)

## 1. Alcance cumplido

Implementación completa de la viñeta de segunda línea **Starbene** (`03-escenas.md` §4 · `tier: 2`), bajo el concepto *«Toda la posventa en la palma de la mano»*:

1. **Definición y coreografía en 3 beats (`src/scenes/starbene/definition.ts`)**
   - `tier: 2`, `chapterId: "starbene"`, carga diferida (`() => import("./Scene")`) y paleta clínica oscura (`#0B1124` + azul médico `#4B6BFF` + menta `#7CC6B8`).
   - 3 beats sincronizados con el scroll:
     - **Beat 1 (`equipo`, `[0.00, 0.34]`):** Equipo médico-estético en vista explosionada (pedestal, chasis clínico, núcleo electromagnético RF con bobina toroidal, consola táctil superior y dos manípulos aplicadores) con bounding box 3D y callouts táctiles (`MOD 01` Capacitación, `MOD 02` Recambios, `MOD 03` Service).
     - **Beat 2 (`app`, `[0.34, 0.68]`):** Las secciones de la app **Starbene+** (`Mis Equipos · Serie #7741`, manuales, cursos y service) nacen de cada pieza del equipo conectadas mediante arcos `<ThreadLine>` hacia el `<Phone>` 3D (`/images/proyects/starbene/app-mobile/starbene-mobile-showcase.webp`) con capas de UI flotantes.
     - **Beat 3 (`web`, `[0.68, 1.00]`):** Integración con la vidriera web comercial en `<Laptop>` (`/images/proyects/starbene/web-comercial/1.webp`) y síntesis del ecosistema en `<TelemetryDeck>`.
   - Anclas del hilo conductor (`thread.anchors`) con *handoff* espacial suave desde `banner-2` (`p = 0`) hacia `agnt` (`p = 1`).

2. **Rúbrica técnica y artística (`03-escenas.md` §8 y `02-rendimiento-y-mobile.md` §2)**
   - **Cero primitivas desnudas:** todas las piezas del equipo médico usan geometrías con biseles redondeados (`createRoundedSlabGeometry`, `createRoundedPlaneGeometry`) y materiales PBR calibrados con PMREM de estudio compartido (`useStudioEnvironment`).
   - **Iluminación de 3 puntos:** `directionalLight` principal clínica (`#F5F8FF`), `directionalLight` de contra azul (`#4B6BFF`) y `pointLight` de acento menta (`#7CC6B8`), más piso con shader de anillos de telemetría.
   - **Limpieza de GPU:** `dispose()` explícito de todas las geometrías y materiales en el desmontaje.

---

## 2. Cómo reproducir

1. Levantar el servidor de desarrollo:
   ```bash
   npm.cmd run dev
   ```
2. Abrir en el navegador:
   - **Beat 1 (`equipo`):** `http://localhost:4321/lab/starbene?quality=high&progress=0.16`
   - **Beat 2 (`app`):** `http://localhost:4321/lab/starbene?quality=high&progress=0.50`
   - **Beat 3 (`web`):** `http://localhost:4321/lab/starbene?quality=high&progress=0.84`
   - **Vista mobile (`390×844`, `low`):** `http://localhost:4321/lab/starbene?quality=low&progress=0.50`
   - **En el recorrido principal:** `http://localhost:4321/?scene=starbene&progress=0.50&debug=1`

---

## 3. Tabla de métricas por beat

Mediciones obtenidas en Edge headless (60 muestras de `requestAnimationFrame` por beat + sondas de `DebugOverlay`; detalle completo en [`metricas.json`](./metricas.json)):

### Desktop (`1440×900`, nivel `high`)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 80k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Equipo explosionado** (`starbene/equipo`) | `0.16` | **60.2** | `16.8 ms` | `15` | `11.668` | `2` | `12` | `6` |
| **2. App Posventa Starbene+** (`starbene/app`) | `0.50` | **60.8** | `16.8 ms` | `33` | `14.873` | `4` | `27` | `14` |
| **3. Web Comercial + Ecosistema** (`starbene/web`) | `0.84` | **60.4** | `16.8 ms` | `35` | `32.964` | `5` | `28` | `13` |

### Mobile (`390×844`, nivel `low`, CPU throttling ×4)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 40k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Equipo explosionado** (`starbene/equipo`) | `0.16` | **60.5** | `16.8 ms` | `16` | `2.612` | `2` | `13` | `7` |
| **2. App Posventa Starbene+** (`starbene/app`) | `0.50` | **60.5** | `16.7 ms` | `24` | `3.688` | `3` | `21` | `10` |
| **3. Web Comercial + Ecosistema** (`starbene/web`) | `0.84` | **60.8** | `16.8 ms` | `25` | `9.342` | `3` | `22` | `9` |

### Pósters estáticos (`static` / `prefers-reduced-motion`)

| Archivo | Tamaño | Presupuesto (`02` §3) |
| :--- | :---: | :---: |
| `public/posters/greybox/starbene.png` | **65,2 KB** | `≤ 150 KB` |
| `public/posters/greybox/starbene-mobile.png` | **14,2 KB** | `≤ 150 KB` |

---

## 4. Capturas por beat

### Desktop (`1440×900`, `high`)
- [`starbene-desktop-1.webp`](./starbene-desktop-1.webp) — Beat 1 (`equipo`): Equipo médico-estético en vista explosionada con HUD 3D y callouts por módulo.
- [`starbene-desktop-2.webp`](./starbene-desktop-2.webp) — Beat 2 (`app`): Conexión de piezas explosionadas hacia la app Starbene+ en `<Phone>` con capas de UI flotantes.
- [`starbene-desktop-3.webp`](./starbene-desktop-3.webp) — Beat 3 (`web`): Vidriera web comercial en `<Laptop>` junto al equipo y panel `<TelemetryDeck>`.

### Mobile (`390×844`, `low`, CPU ×4)
- [`starbene-mobile-1.webp`](./starbene-mobile-1.webp) — Beat 1 (`equipo`, encuadre vertical móvil con tarjeta única activa).
- [`starbene-mobile-2.webp`](./starbene-mobile-2.webp) — Beat 2 (`app`, equipo + `<Phone>` en disposición vertical).
- [`starbene-mobile-3.webp`](./starbene-mobile-3.webp) — Beat 3 (`web`, `<Laptop>` + síntesis posventa en `390×844`).

# Evidencia — T-A31: Viñeta AGNT (`src/scenes/agnt/` + `/lab/agnt`)

## 1. Alcance cumplido

Implementación completa de la viñeta de segunda línea **AGNT** (`03-escenas.md` §4 · `tier: 2`), bajo el concepto *«El mercado de pases, ordenado»*:

1. **Definición y coreografía en 3 beats (`src/scenes/agnt/definition.ts`)**
   - `tier: 2`, `chapterId: "agnt"`, carga diferida (`() => import("./Scene")`) y paleta verde pizarra táctica (`#0B1513` + esmeralda `#38C898` + azul API `#6EA8FE`).
   - 3 beats sincronizados con el scroll:
     - **Beat 1 (`pizarra`, `[0.00, 0.34]`):** Pizarra táctica 3D biselada con demarcación reglamentaria en shader GLSL, fichas PBR de jugadores y nodos de representación en `<AgentGraph>` (`M. Rivas #10`, `Atlético Central`).
     - **Beat 2 (`traspasos`, `[0.34, 0.68]`):** Arcos 3D `<ThreadLine>` de traspasos entre clubes sobre la pizarra y barrido luminoso de sincronización en vivo con **API-Football** (`30 clubes · stats al día`).
     - **Beat 3 (`panel`, `[0.68, 1.00]`):** Explorador de jugadores e inteligencia en `<Display>` (`/images/proyects/agnt/3.webp`) y workspace de sincronización en `<Laptop>` (`/images/proyects/agnt/2.webp`), acompañados por `<TelemetryDeck>`.
   - Anclas del hilo conductor (`thread.anchors`) en modo `branching` con *handoff* suave desde `starbene` (`p = 0`) hacia `cielo-y-mar` (`p = 1`).

2. **Rúbrica técnica y artística (`03-escenas.md` §8 y `02-rendimiento-y-mobile.md` §2)**
   - **Geometrías biseladas y shaders dedicados:** marco de pizarra con `createRoundedSlabGeometry`, fichas tácticas metálicas con PMREM compartido (`useStudioEnvironment`) y shader de campo táctico con grilla antifragmentación (`fwidth`) y barrido de datos.
   - **Iluminación de 3 puntos:** `directionalLight` principal (`#F0FAF6`), `directionalLight` de contra esmeralda (`#38C898`) y `pointLight` azul (`#6EA8FE`).
   - **Limpieza de GPU:** `dispose()` explícito de todas las geometrías y materiales al desmontar.

---

## 2. Cómo reproducir

1. Levantar el servidor de desarrollo:
   ```bash
   npm.cmd run dev
   ```
2. Abrir en el navegador:
   - **Beat 1 (`pizarra`):** `http://localhost:4321/lab/agnt?quality=high&progress=0.16`
   - **Beat 2 (`traspasos`):** `http://localhost:4321/lab/agnt?quality=high&progress=0.50`
   - **Beat 3 (`panel`):** `http://localhost:4321/lab/agnt?quality=high&progress=0.84`
   - **Vista mobile (`390×844`, `low`):** `http://localhost:4321/lab/agnt?quality=low&progress=0.50`
   - **En el recorrido principal:** `http://localhost:4321/?scene=agnt&progress=0.50&debug=1`

---

## 3. Tabla de métricas por beat

Mediciones obtenidas en Edge headless (60 muestras de `requestAnimationFrame` por beat + sondas de `DebugOverlay`; detalle completo en [`metricas.json`](./metricas.json)):

### Desktop (`1440×900`, nivel `high`)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 80k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Pizarra táctica y nodos** (`agnt/pizarra`) | `0.16` | **60.8** | `16.8 ms` | `23` | `4.086` | `2` | `9` | `8` |
| **2. Arcos de traspasos + API** (`agnt/traspasos`) | `0.50` | **60.6** | `16.8 ms` | `33` | `5.526` | `2` | `19` | `8` |
| **3. Panel AGNT en vivo** (`agnt/panel`) | `0.84` | **61.0** | `16.8 ms` | `36` | `29.002` | `6` | `25` | `11` |

### Mobile (`390×844`, nivel `low`, CPU throttling ×4)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 40k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Pizarra táctica y nodos** (`agnt/pizarra`) | `0.16` | **60.7** | `16.7 ms` | `23` | `1.734` | `2` | `9` | `8` |
| **2. Arcos de traspasos + API** (`agnt/traspasos`) | `0.50` | **60.5** | `16.8 ms` | `28` | `2.254` | `2` | `14` | `8` |
| **3. Panel AGNT en vivo** (`agnt/panel`) | `0.84` | **60.8** | `16.7 ms` | `25` | `8.586` | `4` | `20` | `7` |

### Pósters estáticos (`static` / `prefers-reduced-motion`)

| Archivo | Tamaño | Presupuesto (`02` §3) |
| :--- | :---: | :---: |
| `public/posters/greybox/agnt.png` | **90,8 KB** | `≤ 150 KB` |
| `public/posters/greybox/agnt-mobile.png` | **16,0 KB** | `≤ 150 KB` |

---

## 4. Capturas por beat

### Desktop (`1440×900`, `high`)
- [`agnt-desktop-1.webp`](./agnt-desktop-1.webp) — Beat 1 (`pizarra`): Pizarra táctica 3D con fichas de jugadores y nodos de representación.
- [`agnt-desktop-2.webp`](./agnt-desktop-2.webp) — Beat 2 (`traspasos`): Arcos de traspasos entre clubes y sincronización automática con API-Football.
- [`agnt-desktop-3.webp`](./agnt-desktop-3.webp) — Beat 3 (`panel`): Ficha de jugador en `<Display>` + workspace de API-Football en `<Laptop>` + `<TelemetryDeck>`.

### Mobile (`390×844`, `low`, CPU ×4)
- [`agnt-mobile-1.webp`](./agnt-mobile-1.webp) — Beat 1 (`pizarra`, tira vertical de nodos tácticos en móvil).
- [`agnt-mobile-2.webp`](./agnt-mobile-2.webp) — Beat 2 (`traspasos`, flujo Jugador → Club → API-Football → Oferta en `390×844`).
- [`agnt-mobile-3.webp`](./agnt-mobile-3.webp) — Beat 3 (`panel`, dispositivos y telemetría de mercado en móvil).

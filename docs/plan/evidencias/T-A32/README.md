# Evidencia — T-A32: Viñeta Cielo y Mar (`src/scenes/cielo-y-mar/` + `/lab/cielo-y-mar`)

## 1. Alcance cumplido

Implementación completa de la viñeta de segunda línea **Cielo y Mar** (`03-escenas.md` §4 · `tier: 2`), bajo el concepto *«La calma del Caribe, en una vidriera»*:

1. **Definición y coreografía en 3 beats (`src/scenes/cielo-y-mar/definition.ts`)**
   - `tier: 2`, `chapterId: "cielo-y-mar"`, carga diferida (`() => import("./Scene")`) y paleta caribeña (`#0B1E2D` + turquesa `#16B5A8` + dorado cálido `#F4A261`).
   - 3 beats sincronizados con el scroll:
     - **Beat 1 (`mar`, `[0.00, 0.34]`):** Horizonte atmosférico del Caribe al caer el sol y agua turquesa cristalina con cáusticas sutiles y reflejo solar dorado en shader GLSL.
     - **Beat 2 (`suite`, `[0.34, 0.68]`):** La suite aparece como una postal arquitectónica enmarcada (`createRoundedSlabGeometry` + textura de `/images/proyects/varios/cielo-y-mar/1.webp`) flotando serenamente sobre el mar.
     - **Beat 3 (`sitio`, `[0.68, 1.00]`):** La postal da paso al sitio web dentro de una `<Laptop>` 3D (`/images/proyects/varios/cielo-y-mar/2.webp`) con capas de UI flotantes y síntesis de conversión en `<TelemetryDeck>`.
   - Anclas del hilo conductor (`thread.anchors`) en la orilla inferior con transición suave hacia la línea horizontal del Archivo 2D (`archive`) al final del capítulo.

2. **Rúbrica técnica y artística (`03-escenas.md` §8 y `02-rendimiento-y-mobile.md` §2)**
   - **Shader de mar caribeño + horizonte atmosférico y marco biselado:** superficie marina turquesa con normales analíticas, Fresnel hacia el horizonte cálido, cáusticas y marco de postal con bisel PBR e iluminación de estudio compartida (`useStudioEnvironment`).
   - **Iluminación cálida de 3 puntos:** `directionalLight` dorada de atardecer (`#FFD49E`), `directionalLight` de contra turquesa (`#16B5A8`) y `pointLight` cálida (`#F4A261`).
   - **Respeto por `prefers-reduced-motion` y limpieza de GPU:** el tiempo del shader marino se acopla de forma determinista al progreso cuando `reducedMotion` está activo, y todos los recursos (`BufferGeometry`, `Material`, `Texture` clonada) se liberan al desmontar.

---

## 2. Cómo reproducir

1. Levantar el servidor de desarrollo:
   ```bash
   npm.cmd run dev
   ```
2. Abrir en el navegador:
   - **Beat 1 (`mar`):** `http://localhost:4321/lab/cielo-y-mar?quality=high&progress=0.16`
   - **Beat 2 (`suite`):** `http://localhost:4321/lab/cielo-y-mar?quality=high&progress=0.50`
   - **Beat 3 (`sitio`):** `http://localhost:4321/lab/cielo-y-mar?quality=high&progress=0.84`
   - **Vista mobile (`390×844`, `low`):** `http://localhost:4321/lab/cielo-y-mar?quality=low&progress=0.50`
   - **En el recorrido principal:** `http://localhost:4321/?scene=cielo-y-mar&progress=0.50&debug=1`

---

## 3. Tabla de métricas por beat

Mediciones obtenidas en Edge headless (60 muestras de `requestAnimationFrame` por beat + sondas de `DebugOverlay`; detalle completo en [`metricas.json`](./metricas.json)):

### Desktop (`1440×900`, nivel `high`)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 80k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Mar al atardecer** (`cielo-y-mar/mar`) | `0.16` | **60.3** | `16.8 ms` | `3` | `8.194` | `1` | `3` | `3` |
| **2. Postal de suite** (`cielo-y-mar/suite`) | `0.50` | **60.3** | `16.8 ms` | `5` | `9.955` | `3` | `5` | `6` |
| **3. Sitio web en notebook** (`cielo-y-mar/sitio`) | `0.84` | **60.3** | `16.8 ms` | `19` | `29.482` | `5` | `17` | `11` |

### Mobile (`390×844`, nivel `low`, CPU throttling ×4)

| Beat | Progreso | FPS | Frame p95 (ms) | Draw calls (máx ≤ 40) | Triángulos (máx ≤ 40k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Mar al atardecer** (`cielo-y-mar/mar`) | `0.16` | **60.8** | `16.8 ms` | `4` | `2.330` | `1` | `4` | `4` |
| **2. Postal de suite** (`cielo-y-mar/suite`) | `0.50` | **60.7** | `16.8 ms` | `6` | `2.651` | `3` | `6` | `7` |
| **3. Sitio web en notebook** (`cielo-y-mar/sitio`) | `0.84` | **60.9** | `16.8 ms` | `13` | `9.060` | `3` | `13` | `8` |

### Pósters estáticos (`static` / `prefers-reduced-motion`)

| Archivo | Tamaño | Presupuesto (`02` §3) |
| :--- | :---: | :---: |
| `public/posters/greybox/cielo-y-mar.png` | **129,8 KB** | `≤ 150 KB` |
| `public/posters/greybox/cielo-y-mar-mobile.png` | **28,1 KB** | `≤ 150 KB` |

---

## 4. Capturas por beat

### Desktop (`1440×900`, `high`)
- [`cielo-y-mar-desktop-1.webp`](./cielo-y-mar-desktop-1.webp) — Beat 1 (`mar`): Shader de mar al atardecer con reflejo solar y arco arquitectónico sobre el horizonte.
- [`cielo-y-mar-desktop-2.webp`](./cielo-y-mar-desktop-2.webp) — Beat 2 (`suite`): Postal enmarcada de la suite flotando sobre el mar con callouts interactivos.
- [`cielo-y-mar-desktop-3.webp`](./cielo-y-mar-desktop-3.webp) — Beat 3 (`sitio`): Transformación hacia la vidriera web en `<Laptop>` con capas flotantes y `<TelemetryDeck>`.

### Mobile (`390×844`, `low`, CPU ×4)
- [`cielo-y-mar-mobile-1.webp`](./cielo-y-mar-mobile-1.webp) — Beat 1 (`mar`, horizonte caribeño en encuadre móvil).
- [`cielo-y-mar-mobile-2.webp`](./cielo-y-mar-mobile-2.webp) — Beat 2 (`suite`, postal y callout activo en `390×844`).
- [`cielo-y-mar-mobile-3.webp`](./cielo-y-mar-mobile-3.webp) — Beat 3 (`sitio`, `<Laptop>` y síntesis de la vidriera hotelera en móvil).

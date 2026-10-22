# Evidencia — T-A19: Kit de dispositivos (`src/scenes/kit/devices/` + `/lab/kit`)

## 1. Alcance cumplido

Implementación completa del **Kit de dispositivos 3D** (`03-escenas.md` §2) e integración demostrativa en el laboratorio `/lab/kit`:

1. **Especificaciones físicas reales y escala canónica (`src/scenes/kit/devices/specs.ts`)**
   - Escala unificada `1 unidad = 10 cm`:
     - **`PHONE_SPEC` (6,1", proporción 9:19,5):** `71,5 × 147,5 × 7,8 mm`, radio de chasis `11,5 mm`, bisel `2,2 mm`, *Dynamic Island* y módulo trasero de triple lente.
     - **`LAPTOP_SPEC` (14", proporción 16:10):** base `312,6 × 221,2 × 11,0 mm`, tapa `4,5 mm` con inclinación configurable (`open: 0..1` + amortiguación exponencial), *notch* de cámara, *trackpad* háptico y pozo de teclado.
     - **`DISPLAY_SPEC` (27", proporción 16:9):** panel `614 × 362 × 14 mm` con variante `monitor` (pie inclinado de aluminio `stand="studio"`) y variante `signage` (cartelería digital de bisel mínimo `orientation="landscape" | "portrait"`).
   - 5 acabados anodizados realistas (`space-black`, `silver`, `graphite`, `midnight`, `titanium`).

2. **Geometrías procedurales adaptativas por nivel de calidad (`src/scenes/kit/devices/geometry.ts`)**
   - `createRoundedSlabGeometry`: extrusión con bisel suave adaptativo según `QualityTier` (`high`, `medium`, `low`).
   - `createRoundedPlaneGeometry`: plano con esquinas redondeadas y UVs normalizadas `0..1` exactas para mapear capturas y recortes sin distorsión.
   - `createKeyboardGeometry`: teclado ANSI completo de 78 teclas fusionado en **una sola `BufferGeometry` (1 *draw call*)**.
   - Peso de red en `public/models/kit/`: **`0 KiB`** (cumple holgadamente los presupuestos de `≤ 500 KiB` por capítulo y `≤ 200 KiB` en viñetas de segunda línea de `02-rendimiento-y-mobile.md` §3; ver justificación en `assets-src/kit/README.md`).

3. **Materiales PBR de estudio y entorno HDR compartido (`src/scenes/kit/devices/materials.ts`)**
   - Entorno procedural de estudio fotográfico (*softboxes* cenital y laterales + horizonte) prefiltrado con `PMREMGenerator` y cacheado por `WebGLRenderer` (`useStudioEnvironment`), garantizando reflejos metálicos y de vidrio creíbles incluso en escenas que solo declaran luces puntuales o direccionales.
   - `useDeviceMaterials`: aluminio/titanio anodizado (`body`, `bodySatin`, `trim`), vidrio negro especular (`glassBlack`), dorso mate (`back`), cavidades (`void`) y óptica (`lens`).

4. **Pantalla texturizable y capas de UI flotantes 3D (`src/scenes/kit/devices/DeviceScreen.tsx`, `screenTexture.ts`, `softMask.ts`)**
   - `useScreenTexture`: carga y cachea con conteo de referencias capturas (`.webp`/`.png`/`.jpg`, `SRGBColorSpace`, anisotropía ×4) y videos HTML5 (`.mp4`/`.webm`, `muted`, `loop`, `playsInline`) con liberación diferida de VRAM.
   - `computeFitTransform`: encaje `fit: "cover" | "stretch"` y `align: "top" | "center" | "bottom"` mediante `repeat`/`offset` de UV.
   - `FloatingLayer`: cada `DeviceLayer` (`rect: [x, y, w, h]`, `depth`, `scale`, `accent`, `delay`) recorta automáticamente la región visible de la pantalla (o usa su propia textura), oscurece el hueco dejado en la pantalla base (`hole`), proyecta sombra suave desplazada (`alphaMap` radial de `softMask.ts`), añade halo aditivo opcional y anima su despegue en Z (`separation: 0..1`) + paralaje suave en `useFrame` con **cero `setState` por frame**.

5. **Integración en `/lab/kit` (`src/scenes/kit/devices/DeviceShowcase.tsx`, `KitShowcaseScene.tsx`, `KitLab.tsx`)**
   - Trío `Display` + `Laptop` + `Phone` integrado en los beats **04 (`progress=0.75`, dispositivos encendidos)** y **05 (`progress=0.92`, capas de UI despegadas y flotando en 3D)** para las 4 paletas (`vibo`, `pirp`, `naturalis`, `banner`), tanto en desktop (`1440×900`) como en mobile (`390×844`).

---

## 2. Cómo reproducir

1. Levantar el servidor de desarrollo:
   ```bash
   npm.cmd run dev
   ```
2. Abrir `/lab/kit` en el navegador:
   - **Dispositivos encendidos (Beat 4, Vibo):** `http://localhost:4321/lab/kit?progress=0.75&preset=vibo&quality=high`
   - **Capas de UI flotantes 3D (Beat 5, Vibo):** `http://localhost:4321/lab/kit?progress=0.92&preset=vibo&quality=high`
   - **Paleta Pirp (`graphite`):** `http://localhost:4321/lab/kit?progress=0.92&preset=pirp&quality=high`
   - **Paleta Naturalis (`silver`, tema claro):** `http://localhost:4321/lab/kit?progress=0.92&preset=naturalis&quality=high`
   - **Paleta Banner (`space-black`, `Display` en modo `signage`):** `http://localhost:4321/lab/kit?progress=0.92&preset=banner&quality=high`
   - **Marco móvil `390×844` (`low`):** `http://localhost:4321/lab/kit?progress=0.92&preset=vibo&quality=low&frame=mobile`
3. Ejecutar la batería automatizada de QA (16 capturas `.webp` + métricas de FPS/GPU + validación matemática de especificaciones y UVs):
   ```bash
   node scripts/qa/a19.mjs
   ```

---

## 3. Tabla de métricas por preset y estado

Mediciones obtenidas con `node scripts/qa/a19.mjs` (Edge headless, 60 muestras de `requestAnimationFrame` + sondas de `GpuStatsProbe` y `DebugOverlay`; detalle completo en [`metricas.json`](./metricas.json)):

### Desktop (`1440×900`, nivel `high`)

| Preset | Estado (`progress`) | FPS | Frame p95 (ms) | Draw calls (máx ≤ 80) | Triángulos (máx ≤ 150k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Vibo** (`midnight`) | Dispositivos (`0.75`) | **60.3** | `16.8 ms` | `42` | `33.386` | `6` | `32` | `14` |
| **Vibo** (`midnight`) | Capas flotantes (`0.92`) | **60.9** | `16.9 ms` | `66` | `33.921` | `7` | `50` | `16` |
| **Pirp** (`graphite`) | Dispositivos (`0.75`) | **60.3** | `16.8 ms` | `42` | `33.386` | `5` | `32` | `13` |
| **Pirp** (`graphite`) | Capas flotantes (`0.92`) | **60.8** | `16.8 ms` | `66` | `33.917` | `6` | `50` | `15` |
| **Naturalis** (`silver`) | Dispositivos (`0.75`) | **60.6** | `16.7 ms` | `42` | `33.386` | `6` | `32` | `13` |
| **Naturalis** (`silver`) | Capas flotantes (`0.92`) | **60.4** | `16.8 ms` | `57` | `33.819` | `7` | `47` | `14` |
| **Banner** (`space-black`) | Dispositivos (`0.75`) | **60.7** | `16.9 ms` | `42` | `31.786` | `6` | `32` | `13` |
| **Banner** (`space-black`) | Capas flotantes (`0.92`) | **60.7** | `16.8 ms` | `66` | `32.314` | `7` | `50` | `15` |

### Mobile (`390×844`, nivel `low`, CPU throttling ×4)

| Preset | Estado (`progress`) | FPS | Frame p95 (ms) | Draw calls (máx ≤ 35) | Triángulos (máx ≤ 35k) | Texturas | Geometrías | Programas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Vibo** (`midnight`) | Dispositivos (`0.75`) | **61.4** | `16.8 ms` | `31` | `10.915` | `5` | `28` | `10` |
| **Vibo** (`midnight`) | Capas flotantes (`0.92`) | **61.0** | `16.8 ms` | `34` | `11.022` | `5` | `31` | `10` |
| **Pirp** (`graphite`) | Dispositivos (`0.75`) | **60.4** | `16.7 ms` | `31` | `10.915` | `4` | `28` | `10` |
| **Pirp** (`graphite`) | Capas flotantes (`0.92`) | **60.5** | `16.7 ms` | `34` | `11.017` | `4` | `31` | `10` |
| **Naturalis** (`silver`) | Dispositivos (`0.75`) | **61.1** | `16.8 ms` | `31` | `10.915` | `5` | `28` | `10` |
| **Naturalis** (`silver`) | Capas flotantes (`0.92`) | **61.0** | `16.8 ms` | `34` | `11.020` | `5` | `31` | `10` |
| **Banner** (`space-black`) | Dispositivos (`0.75`) | **60.5** | `16.8 ms` | `31` | `10.659` | `5` | `28` | `10` |
| **Banner** (`space-black`) | Capas flotantes (`0.92`) | **61.0** | `16.8 ms` | `34` | `10.761` | `5` | `31` | `10` |

---

## 4. Capturas de evidencia

### Desktop (`1440×900`, `high`)
- **Vibo (`midnight`):** [`devices-vibo-desktop-devices.webp`](./devices-vibo-desktop-devices.webp) · [`devices-vibo-desktop-layers.webp`](./devices-vibo-desktop-layers.webp)
- **Pirp (`graphite`):** [`devices-pirp-desktop-devices.webp`](./devices-pirp-desktop-devices.webp) · [`devices-pirp-desktop-layers.webp`](./devices-pirp-desktop-layers.webp)
- **Naturalis (`silver`, tema claro):** [`devices-naturalis-desktop-devices.webp`](./devices-naturalis-desktop-devices.webp) · [`devices-naturalis-desktop-layers.webp`](./devices-naturalis-desktop-layers.webp)
- **Banner (`space-black`, `signage`):** [`devices-banner-desktop-devices.webp`](./devices-banner-desktop-devices.webp) · [`devices-banner-desktop-layers.webp`](./devices-banner-desktop-layers.webp)

### Mobile (`390×844`, `low`, CPU ×4)
- **Vibo:** [`devices-vibo-mobile-devices.webp`](./devices-vibo-mobile-devices.webp) · [`devices-vibo-mobile-layers.webp`](./devices-vibo-mobile-layers.webp)
- **Pirp:** [`devices-pirp-mobile-devices.webp`](./devices-pirp-mobile-devices.webp) · [`devices-pirp-mobile-layers.webp`](./devices-pirp-mobile-layers.webp)
- **Naturalis:** [`devices-naturalis-mobile-devices.webp`](./devices-naturalis-mobile-devices.webp) · [`devices-naturalis-mobile-layers.webp`](./devices-naturalis-mobile-layers.webp)
- **Banner:** [`devices-banner-mobile-devices.webp`](./devices-banner-mobile-devices.webp) · [`devices-banner-mobile-layers.webp`](./devices-banner-mobile-layers.webp)

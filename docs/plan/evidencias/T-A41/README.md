> Evidencia histórica de la primera entrega, rechazada por el humano. La corrección y validación vigente están en [revision/README.md](./revision/README.md).

# Evidencia — T-A41: Pulido de transiciones entre capítulos de primera línea

## 1. Alcance cumplido

Implementación completa de **T-A41** (`03-escenas.md` §6 y `tablero.md` F1) dentro de su zona declarada (`src/experience/thread/`, `src/experience/SceneDirector.tsx`, `src/scenes/*/definition.ts`):

1. **Handoff del hilo conductor (forma, velocidad, color y fase continua) (`src/experience/thread/`)**
   - **Interpolación C¹ Catmull-Rom (`forms.ts`):** `sampleForm` interpola curvas suaves sobre 32 muestras cuando `anchors` tiene 3 o más puntos, conservando los extremos exactos y eliminando quiebres poligonales en las tangentes del listón.
   - **Ventana de handoff sincronizada (`THREAD_HANDOFF_START = 0.82`):** en el tramo final de cada capítulo (`progress ≥ 0.82`, idéntico a `BLEND_START` de `palette.ts`), `updateThread` interpola forma (`points`), color de línea, color de cabeza, perfil de energía (`mix`) y contraste de esquema (`lightMix`) hacia el estado inicial (`progress = 0`) del capítulo siguiente.
   - **Continuidad de fase y flujo sin rebobinado (`runtime.ts`):** la fase avanza en el círculo unitario `[0..1)` desde `0.86` hasta `1.08` (`0.08 mod 1`), coincidiendo exactamente con la fase de entrada (`0.08`) del capítulo entrante. `flow` y `time` acumulan el recorrido por capítulo según el perfil de velocidad (`CHAPTER_THREAD_PROFILES`), evitando saltos hacia atrás al cruzar `Vibo → Pirp → Naturalis → Banner 2.0`.
   - **Contraste en tema claro (`Filament.tsx`, `Swarm.tsx`, `path.ts`):** mezcla premultiplicada (`CustomBlending` con `OneFactor` y `OneMinusSrcAlphaFactor`) pos-conversión sRGB (`#include <colorspace_fragment>`). En capítulos oscuros (`uLightScheme = 0`) se comporta como aditivo puro; en Naturalis (`uLightScheme = 1`, fondo `#FAFDFC`) aporta pigmento salvia/bosque (`#3E6E65` / `#26463F`) claramente legible. Además se eliminó el warning HLSL `X4000 (f_threadPath)` en `path.ts`.

2. **Encuadres de borde y curvas en `src/scenes/{vibo,pirp,naturalis,banner-2}/definition.ts`**
   - Cada definición exporta sus encuadres de borde (`viboBorderFrames`, `pirpBorderFrames`, `naturalisBorderFrames`, `bannerBorderFrames`) emparejados en cada frontera:
     - `vibo.exit` $\equiv$ `pirp.entry` (`desktop: [2.2, 1.8, 9.6]`, `mobile: [2.4, 3.2, 12.6]`, `target: [0, 0.1, 0]`)
     - `pirp.exit` $\equiv$ `naturalis.entry` (`desktop: [3.0, 1.6, 8.2]`, `mobile: [2.0, 2.0, 12.5]`, `target: [-0.35, 0.1, 0]`)
     - `naturalis.exit` $\equiv$ `banner.entry` (`desktop: [2.4, 1.5, 9.4]`, `mobile: [1.8, 2.1, 13.4]`, `target: [0, 0.25, 0]`)
   - Las funciones `thread.anchors(p)` evolucionan de manera continua por beat y convergen en cada frontera (`vibo(1) == pirp(0)`, `pirp(1) == naturalis(0)`, `naturalis(1) == banner(0)`), reemplazando también el escalón discontinuo `p > 0.6` de Banner por una rampa `smoothstep`.

3. **Continuidad de cámara, precarga y crossfade en `src/experience/SceneDirector.tsx`**
   - **Precarga de escenas vecinas (`preloadNeighbors`):** al activar un capítulo se precargan en caché los chunks de las escenas anterior y siguiente en `CHAPTER_SEQUENCE`, logrando cambio sincrónico sin demora de red al cruzar fronteras.
   - **Crossfade de materiales + deriva vertical/profundidad (`SceneLayer` / `SceneLayerPost`):** reemplaza el desplazamiento lateral brusco (`x = ±2.4`) por una transición en el eje vertical y de profundidad alineada con el sentido del scroll, acompañada de crossfade de opacidad sobre los materiales de la escena saliente y entrante (restaurando las propiedades originales al completar el blend) y ocultación inmediata de etiquetas DOM `<Html>` salientes.
   - **Puente de cámara y sincronía de fondo (`ScenePostDirector`):** corre después del rig de la escena activa, aplica los encuadres de borde en `[0..0.08]` y `[0.90..1.0]`, amortigua con `lerp` + `slerp` cualquier salto por navegación directa del índice y sincroniza `scene.background` con `getLivePalette().background` para que el color fijo de `useGreyboxRig` no pise la interpolación de paleta en `[0.82..1.0]`.

---

## 2. Cómo reproducir

```bash
npm.cmd run check
node src/experience/thread/verify.mjs
```

Enlaces directos para inspeccionar cada frontera en el recorrido:
- **Vibo → Pirp (salida / entrada):** [`/?chapter=vibo&progress=0.92&quality=high&debug`](/?chapter=vibo&progress=0.92&quality=high&debug) → [`/?chapter=pirp&progress=0.06&quality=high&debug`](/?chapter=pirp&progress=0.06&quality=high&debug)
- **Pirp → Naturalis (salida / entrada a tema claro):** [`/?chapter=pirp&progress=0.92&quality=high&debug`](/?chapter=pirp&progress=0.92&quality=high&debug) → [`/?chapter=naturalis&progress=0.06&quality=high&debug`](/?chapter=naturalis&progress=0.06&quality=high&debug)
- **Naturalis → Banner 2.0 (salida / entrada):** [`/?chapter=naturalis&progress=0.92&quality=high&debug`](/?chapter=naturalis&progress=0.92&quality=high&debug) → [`/?chapter=banner-2&progress=0.06&quality=high&debug`](/?chapter=banner-2&progress=0.06&quality=high&debug)

---

## 3. Métricas de transición y verificación matemática

Resultados obtenidos con `node src/experience/thread/verify.mjs` (Edge headless, detalle completo en [`metricas.json`](./metricas.json)):

- **Coincidencia exacta de cámara en frontera (`vibo↔pirp`, `pirp↔naturalis`, `naturalis↔banner-2`):** `true` en los 3 pares.
- **Delta de curva en frontera (`vibo(1) ↔ pirp(0)` y `pirp(1) ↔ naturalis(0)`):** `< 1e-15` (continuidad $C^0$ exacta).
- **Persistencia de `<Canvas>` tras 5 ciclos home ↔ caso (`/projects/vibo`) y regreso a `hero`:** `mountedScenes = 0`, `geometries = 1` (igual a base), `textures = 0` (igual a base), `0` errores de consola.

| Transición | Vista / Nivel | FPS | p95 (ms) | Draw calls | Triángulos | Paleta saliente (`0.92`) | Paleta entrante (`0.06`) | Captura salida | Captura entrada |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Vibo → Pirp** | Desktop `1440×900` (`high`) | **60.0** | `16.7` | `8` | `1.828` | `#121620` | `#17181A` | [`out`](./vibo-to-pirp-desktop-out.webp) | [`in`](./vibo-to-pirp-desktop-in.webp) |
| **Pirp → Naturalis** | Desktop `1440×900` (`high`) | **60.0** | `16.8` | `53` | `962` | `#c5c8c7` | `#FAFDFC` | [`out`](./pirp-to-naturalis-desktop-out.webp) | [`in`](./pirp-to-naturalis-desktop-in.webp) |
| **Naturalis → Banner 2.0** | Desktop `1440×900` (`high`) | **60.0** | `16.7` | `5` | `18` | `#aaacab` | `#151211` | [`out`](./naturalis-to-banner-2-desktop-out.webp) | [`in`](./naturalis-to-banner-2-desktop-in.webp) |
| **Vibo → Pirp** | Mobile `390×844` (`low`, CPU ×4) | **60.0** | `16.7` | `9` | `2.108` | `#121620` | `#17181A` | [`out`](./vibo-to-pirp-mobile-out.webp) | [`in`](./vibo-to-pirp-mobile-in.webp) |
| **Pirp → Naturalis** | Mobile `390×844` (`low`, CPU ×4) | **60.0** | `16.7` | `43` | `966` | `#c5c8c7` | `#FAFDFC` | [`out`](./pirp-to-naturalis-mobile-out.webp) | [`in`](./pirp-to-naturalis-mobile-in.webp) |
| **Naturalis → Banner 2.0** | Mobile `390×844` (`low`, CPU ×4) | **60.0** | `16.8` | `6` | `298` | `#aaacac` | `#151211` | [`out`](./naturalis-to-banner-2-mobile-out.webp) | [`in`](./naturalis-to-banner-2-mobile-in.webp) |

# Assets fuente — Vibo (T-H07 / I-02)

Paquete para T-A14-vibo / T-A20: overlays de detección + métricas.
Dirección creativa: **ADR-011** (personaje 3D + HUD; sin trayectoria 3D fiel).

## Paleta 3D — entrega T-A20-paleta (2026-10-22)

- Fuente: `paleta.blend`, una sola malla conectada y cerrada; textura normal empaquetada y copia en `textures/paleta-normal.png`.
- Export: `paleta.glb`, glTF 2.0 binario **sin compresión** (sin Draco/meshopt/KTX2 en esta etapa): **144.028 bytes**, **2.340 triángulos**, 2 materiales PBR / 2 primitivas de render. Normal map **512×512**; color por vértice. Materiales semimate, caras traseras descartadas.
- Vistas definitivas: `paleta-frente.png`, `paleta-perfil.png`, `paleta-tres-cuartos.png`. Son renders del **GLB final en Three.js**, sobre fondo `#121418`; copias explícitas `paleta-web-*.png`.
- Cuerpo: **45,5 cm** de largo, **25,18 cm** de ancho, **38 mm** de espesor. Correa flexible incluida: bounding box total de 51,84 cm de alto; el largo del cuerpo excluye el cordón.
- Pivot: centro del agarre `(0,0,0)`. glTF **+Y hacia la cabeza, +Z hacia el frente, +X hacia la derecha**. Transformación de nodo identidad; escala real en metros. En Blender, eje longitudinal +Z y frente −Y.
- Forma: cabeza redondeada con garganta en lágrima, corazón triangular abierto, marco con bevel dorado, cara azul profunda, grip gris azulado con costura espiral horneada y correa en la base. Sin logos ni marcas reales.
- Compromiso técnico frente a las referencias: **40 perforaciones reales de 11 mm y 8 lados**, con paredes suavizadas; se redujo cantidad/resolución para respetar 2.500 triángulos. Sin máscaras alpha ni discos negros.
- Validación: 0 bordes abiertos/no manifold, 0 vértices sueltos, 0 caras degeneradas, 1 componente conectado, volumen con orientación positiva, modificadores aplicados. UV0 único y empaquetado; 0 solapes con área > `1e-9` (máximo residual numérico `1,11e-10`).
- Evidencia: `paleta-metricas.json`, `paleta-validacion.json` (medición Blender previa al ajuste de tolerancia), `paleta-glb-validacion.json` (auditoría independiente del export final), `paleta-web-validacion.json` (GLTFLoader + WebGL: 2.340 triángulos, escala/origen correctos, sin errores de página).
- Copias versionadas de los renders e informes para revisión: [`docs/plan/evidencias/T-A20-paleta/`](../../docs/plan/evidencias/T-A20-paleta/README.md).
- `npm run check` terminó correctamente. El build emite avisos sobre directivas MDX / tamaño de chunks; esta entrega no modifica código ni dependencias del sitio. `assets:check` aún no evalúa esta fuente, porque no hay GLB optimizados publicados en `public/models/`.
- Se modeló en el archivo abierto `pala.blend` y se guardó como `paleta.blend`; el archivo de partida se conserva, también en `pala-inicial.blend`. El fuente final quedó abierto en una nueva ventana de Blender después de que la sesión original dejara de responder en un cierre de render.
- Scripts de construcción y verificación en `modelado/`. **Fuentes ignoradas por Git según ADR-010**: respaldar la carpeta de assets junto al `.blend`. La integración en el jugador y el pipeline de optimización corresponden a T-A20.

## Origen de datos

| Qué | Fuente |
| --- | --- |
| Golpes, stats agregadas | Firebase `vibo-beta-2e60f` → `videos` → `analysisResults` (`reference/`) |
| Bbox jugador/pelota + pose por frame de golpe | MVP UI → `mvp-ref/data/analyze-video-1.json` (mismo clip ~713 f @ 30 fps) |
| Punto demo con pose normalizada + video | `mvp-ref/data/demo-point-final.js` + `mvp-ref/videos/demo_point.mp4` |

El producto **no** persiste detecciones crudas en Firestore; el MVP conserva un export local con ellas. Los overlays curados usan ese export (pose en crop convertida a px de frame).

Snapshot completo del MVP: `ui-mvp-public/` (gitignored). Extraer aquí lo útil; no versionar el proyecto Next.

## Layout

```text
assets-src/vibo/
  reference/          # exports Firebase anon
  mvp-ref/
    data/             # analyze-video-1, demo-point*, hub, homography
    videos/           # demo_point.mp4, video_padel.mp4, punto_1.mp4
    frames/           # stills de golpes del punto demo
    img/              # hub-bg, hub-gold
  overlays/           # JSON curado por ventana de golpe (consumir en T-A20)
  metrics/            # métricas anonimizadas
  _curate-from-mvp.mjs
  _generate-simulated.mjs   # legado (pose sintética); preferir _curate-from-mvp
  README.md
```

## Esquema — overlays

Archivos: `overlays/golpe-*.json`.

| Campo | Descripción |
| --- | --- |
| `imageSpace` | Del análisis MVP: **1920×1080** px, origen top-left |
| `video.fps` | 30 |
| `shot` | Evento real (`key_frame`, tipo, mano, pelota en impacto) |
| `frames[]` | Ventana del golpe con bbox/pose reales |
| `frames[].boxes[]` | `{ id, label, x, y, w, h, conf }` — `player` \| `ball` |
| `frames[].keypoints[]` | `{ format: "coco17", space: "frame_px", points: [{ name, x, y, conf }] }` |
| `frames[].labels[]` | Etiquetas HUD |
| `frames[].ball` | Centro de pelota en px |

**Limitación:** perspectiva de cámara 2D. No reconstruir mundo 3D (ADR-011).

Regenerar overlays:

```bash
node assets-src/vibo/_curate-from-mvp.mjs
```

## Esquema — métricas

`metrics/jugador-anon.json`: mix de golpes + highlights; stats de velocidad/distancia desde Firebase anon si está disponible.

## Permiso

Datos de entorno beta propio (Vibo) + export local del MVP UI. Anonimizados. Ver `docs/plan/licencias.md`.

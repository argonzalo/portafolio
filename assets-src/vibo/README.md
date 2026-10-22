# Assets fuente — Vibo (T-H07 / I-02)

Paquete para T-A14-vibo / T-A20: overlays de detección + métricas.
Dirección creativa: **ADR-011** (personaje 3D + HUD; sin trayectoria 3D fiel).

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

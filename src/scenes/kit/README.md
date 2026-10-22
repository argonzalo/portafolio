# Kit de escena y dispositivos — T-A18 + T-A19 (`src/scenes/kit/`)

Piezas reutilizables de primera y segunda línea según `docs/plan/03-escenas.md` §2.
Los dispositivos 3D (`Phone`, `Laptop`, `Display`) viven en `src/scenes/kit/devices/` (**T-A19**) y se re-exportan desde `src/scenes/kit/`.

## Piezas incluidas

| Módulo | Export principal | Qué resuelve | Costo GPU |
| --- | --- | --- | --- |
| `devices/` (`Phone.tsx`, `Laptop.tsx`, `Display.tsx`, `DeviceScreen.tsx`) | `Phone`, `Laptop`, `Display`, `DeviceScreen`, `useScreenTexture`, `DEVICE_FINISHES` | Dispositivos 3D con proporciones físicas reales (`1 unidad = 10 cm`), 5 acabados anodizados (`space-black`, `silver`, `graphite`, `midnight`, `titanium`), mapa de entorno HDR de estudio compartido (`PMREMGenerator`), pantalla texturizable (`.webp`/`.png`/`.mp4`) con encaje sin deformación (`fit`/`align`) y **capas de UI que se despegan y flotan en 3D** (`layers` + `separation`) con sombra suave y halo. | `0 KiB` de descarga GLB · teclado fusionado en 1 malla · PMREM compartido |
| `cameraRig.ts` | `useBeatCameraRig`, `interpolateCameraState`, `phase`, `smootherPhase`, `beatEnvelope` | Interpola encuadres por beat (`desktop` / `mobile`, `target`, `fov`, `sway`) con splines Catmull-Rom C2 y amortiguación sin re-renders. Respeta `prefers-reduced-motion`. | 0 draw calls |
| `ThreadLine.tsx` | `ThreadLine`, `resampleCurvePoints` | Líneas y trayectorias 3D gruesas (listón indexado en espacio de vista) con el mismo shader del filamento del hilo conductor (`Filament.tsx`): núcleo + halo aditivo, dibujado progresivo (`draw`) y pulsos de energía con cabeza opcional. | 1–2 draw calls (`52–144` segs según tier) |
| `HudOverlay.tsx` | `HudOverlay` | HUD anclado a coordenadas 3D proyectadas en `useFrame` sobre un único `<Html fullscreen>`. Incluye bounding boxes 3D con esquinas broadcast, esqueleto de pose SVG con arco de ángulo en vivo y marcadores con línea guía. En mobile (`02` §4) muestra pines táctiles (`≥ 44×44 px`) y despliega una tarjeta a la vez al hacer tap. | 0 draw calls WebGL |
| `AgentGraph.tsx` | `AgentGraph` | Grafo de nodos/agentes con layout precalculado (horizontal/espacial en desktop, tira vertical en mobile), aristas con `<ThreadLine>` que transportan pulsos y tarjetas DOM de decisión que se encienden al cruzar `triggerAt`. | `N` esferas + `N` anillos + `E` aristas |
| `CountersAndCharts.tsx` | `TelemetryDeck`, `formatKitNumber`, `buildTrendSvgGeometry` | Contadores numéricos animados (`tabular-nums`), barras aceleradas por GPU (`scaleX`) y curva SVG progresiva con detección de pico y alerta en vivo. Cero `setState` por frame. | 0 draw calls WebGL |
| `ParticleField.tsx` | `ParticleField` | Campo de partículas GPU en un único draw call con presupuesto automático por nivel (`high: 720`, `medium: 360`, `low: 140`) y tres modos (`stadium`, `stream`, `calm`). | 1 draw call |
| `theme.ts` | `KIT_THEMES`, `getKitTheme` | Tokens visuales de producto para `vibo`, `pirp`, `naturalis` (tema claro) y `banner`. | — |

## Laboratorio (`/lab/kit`)

Ruta: `/lab/kit` (`src/pages/lab/kit.astro` → `src/scenes/kit/KitLab.tsx`).

Soporta deep links:
- `?progress=0..1` — posición en los 5 beats demostrativos (`0.12`, `0.33`, `0.55`, `0.75`, `0.92`).
- `?quality=high|medium|low|static` — fuerza el nivel de calidad y muestra el póster en `static`.
- `?preset=vibo|pirp|naturalis|banner` — cambia la paleta y el modo de luz/blending (incluyendo tema claro en `naturalis`).
- `?frame=mobile` — previsualiza el encuadre vertical `390×844` desde desktop.

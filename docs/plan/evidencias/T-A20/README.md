# Evidencia — T-A20: Escena Vibo completa (`src/scenes/vibo/`)

## 1. Alcance

Escena de primera línea **Vibo** (`03` §3.1, ADR-011 + enmienda estética) sobre el ritmo del greybox T-A14:

- **Jugador como maniquí técnico:** `jugador.glb` (T-A20-jugador, 6.464 tris, 23 huesos) + `paleta.glb` (T-A20-paleta) optimizados por nivel (meshopt + cuantización). Acabado monocromo sobrio por zonas de color de vértice (base grafito, carcasas de torso/muslos/brazos más claras, bandas finas en rodillas, codos, cintura y cuello), PBR satinado (roughness 0,48, metalness 0,2) y paleta en grises de igual luminancia. El rim de contorno es neutro y «Resaltar detección» lo lleva a blanco: el personaje no usa la paleta de la escena, que queda para el HUD. La volea real del rig se combina con capas procedurales (carga de piernas, giro de tronco) restaurando la pose de reposo cada frame. El clip se muestrea pista por pista (interpolantes del `KeyframeTrack`) en lugar de con `AnimationMixer`: el mixer solo escribe cuando el valor cambia entre frames, y con el scroll detenido el jugador volvía al reposo.
- **Cancha nocturna broadcast:** líneas que se dibujan, reflectores que encienden en cascada con conos volumétricos, key spot cálido + rim azul eléctrico/neutro + hemisférica de relleno. Acabado limpio tomado de canchas reales: cristal templado sin montantes (juntas de un píxel), perfil oscuro continuo de coronación en todo el perímetro y zócalo en los tramos de malla, 12 postes finos (5 cm) solo en esquinas y tramos de malla, y malla electrosoldada fina gris que se lee como un velo.
- **Paleta:** césped y HUD en azul eléctrico (`#1F7AFF`); el acento dorado se reemplazó por platino casi gris (`#CFD2D6`) en el trazo de líneas, el mapa de calor del jugador A, la estela, la pelota, la tarjeta de resultado y los acentos del HUD. El override vive en `src/scenes/vibo/theme.ts` (`VIBO_THEME`/`PLATINUM_THEME` sobre `KIT_THEMES.vibo`, sin tocar el kit).
- **Beats:**
  - `mundo` — líneas trazadas y reflectores encendiéndose; el hilo dibuja el contorno de la cancha y se cierra en un halo alrededor del jugador.
  - `razonamiento` — golpe en cámara lenta ligado al scroll, HUD de visión (bbox con etiqueta y confianza, 17 keypoints con esqueleto, marcador «Golpe detectado» en la cabeza de la paleta, brazo dominante) e inserto 2D «Pose» con el recorte del MVP. Sin controlador de scrub ni pie de métricas del bbox. Los títulos del pipeline quedan ocultos por ahora (commit `3944600`).
  - `solución` — cenital con mapa de calor, cobertura y perfil ofensivo/defensivo (marcadores con datos curados).
  - `resultado` — tarjeta local `MatchCard`: lectura de un partido de 60 min, con radar de estilo (centrado), mapa de calor de zonas y curva de desgaste. Sin `TelemetryDeck`.
- **Interacción:** el golpe lo mueve solo el scroll. El hover/tap de marcadores del HUD solo resalta.
- **Mobile:** encuadres propios, una sola pieza de información por vez (HUD + panel durante el golpe → cenital → retrato del jugador sobre la tarjeta), una línea de copy por beat.
- **Transición Vibo→Pirp:** el hilo sale por la trayectoria de la pelota tras el impacto y se aplana hacia la línea de Pirp (`thread.anchors` en `definition.ts`).

## 2. Cómo verificar

```bash
npm run dev
```

| Beat | Deep link |
| --- | --- |
| mundo | `/?chapter=vibo&progress=0.12&quality=high` |
| razonamiento (HUD) | `/?chapter=vibo&progress=0.30&quality=high` · `/?chapter=vibo&progress=0.40&quality=high` |
| razonamiento (terminación del golpe, mobile) | `/?chapter=vibo&progress=0.51&quality=high` |
| solución | `/?chapter=vibo&progress=0.72&quality=high` |
| resultado | `/?chapter=vibo&progress=0.90&quality=high` |
| laboratorio | `/lab/vibo?progress=0.42&quality=medium` |

Agregar `&debug` para el panel de runtime. El golpe avanza con el scroll del capítulo.

## 3. Métricas

Chromium (webview de Cursor), panel `debug` del recorrido. Desktop 1440×900 dpr 1; mobile 390×844 con CPU ×4.

### Desktop 1440×900

| Beat | Progreso | Nivel | FPS (p95) | Draw calls | Triángulos | Texturas | Geometrías | Programas |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| mundo | 0.12 | high | 60 (16,9 ms) | 18 | 77.706 | 5 | 17 | 14 |
| mundo | 0.12 | medium | 60 | 18 | 48.146 | 5 | 17 | 12 |
| mundo | 0.12 | low | 60 | 17 | 17.843 | 5 | 16 | 11 |
| razonamiento | 0.42 | high | 60 (16,9 ms) | 34 | 13.706 | 5 | 27 | 18 |
| razonamiento | 0.42 | medium | 60 | 38 | 48.898 | 5 | 27 | 17 |
| razonamiento | 0.42 | low | 60 | 34 | 18.643 | 5 | 25 | 16 |
| solución | 0.72 | high | 60 (16,9 ms) | 18 | 77.706 | 5 | 17 | 14 |
| solución | 0.72 | medium | 60 | 18 | 48.146 | 5 | 17 | 12 |
| solución | 0.72 | low | 60 | 17 | 17.843 | 5 | 16 | 11 |
| resultado | 0.90 | high | 60 (16,9 ms) | 13 | 17.362 | 5 | 16 | 14 |
| resultado | 0.90 | medium | 60 | 16 | 46.234 | 5 | 16 | 12 |
| resultado | 0.90 | low | 60 | 15 | 17.275 | 5 | 15 | 11 |

Los triángulos de `high` en planos abiertos vienen de la malla de la reja y los conos volumétricos; en primeros planos el frustum los descarta (por eso `high` < `medium` en 0.42/0.90).

### Mobile 390×844, CPU ×4

| Beat | Progreso | Nivel | FPS (p95) | Draw calls | Triángulos |
| --- | :---: | :---: | :---: | :---: | :---: |
| razonamiento | 0.42 | low | 59,1 (20,6 ms) | 12 | 6.579 |
| razonamiento | 0.42 | medium | 60 (18,6 ms) | 18 | 46.906 |
| razonamiento | 0.42 | high | 57,6 (20,9 ms) | 18 | 75.362 |
| solución | 0.72 | low | 60 (17,9 ms) | 17 | 17.843 |

### Assets por nivel (`npm run assets:check`)

| Nivel | Peso | Presupuesto |
| --- | :---: | :---: |
| high | 106 KiB | 1.536 KiB |
| medium | 106 KiB | 600 KiB |
| low | 88 KiB | 600 KiB |

Sin texturas externas: el mapa de calor y los conos son procedurales; el inserto 2D usa los frames curados ya existentes.

### Liberación de recursos

- Cambio de nivel high → medium → low → high: texturas estables en 5 (se corrigió la fuga de la textura de huesos con `skeleton.dispose()`).
- Recorrido: Vibo → AGNT → Vibo dos veces: geometrías/texturas vuelven al mismo valor en cada vuelta (40–41 / 6 con Pirp montado como siguiente); la capa DOM del panel (`BodyLayer`) se desmonta al salir.

### `prefers-reduced-motion`

Verificado con emulación `reduce`: la escena es estática salvo lo que mueve el scroll; el único movimiento por tiempo (sway de cámara) lo anula `interpolateCameraState(..., reduced)` del kit.

## 4. Capturas

| Beat | Desktop 1440×900 | Mobile 390×844 |
| --- | --- | --- |
| mundo (0.12) | [`vibo-desktop-1-mundo.webp`](./vibo-desktop-1-mundo.webp) | [`vibo-mobile-1-mundo.webp`](./vibo-mobile-1-mundo.webp) |
| razonamiento (0.40 · mobile 0.30) | [`vibo-desktop-2-razonamiento.webp`](./vibo-desktop-2-razonamiento.webp) | [`vibo-mobile-2a-razonamiento-hud.webp`](./vibo-mobile-2a-razonamiento-hud.webp) |
| razonamiento — terminación (mobile 0.51) | (incluido en la captura anterior) | [`vibo-mobile-2b-razonamiento-grafo.webp`](./vibo-mobile-2b-razonamiento-grafo.webp) |
| solución (0.72 · mobile 0.71) | [`vibo-desktop-3-solucion.webp`](./vibo-desktop-3-solucion.webp) | [`vibo-mobile-3-solucion.webp`](./vibo-mobile-3-solucion.webp) |
| resultado (0.90) | [`vibo-desktop-4-resultado.webp`](./vibo-desktop-4-resultado.webp) | [`vibo-mobile-4-resultado.webp`](./vibo-mobile-4-resultado.webp) |

## 5. Desvíos y pedidos fuera de zona

- **Triángulos del jugador:** la rúbrica `03` §8.2 pide 15–25k; el asset aprobado en T-A20-jugador tiene 6.464 (brief 3–8k). La silueta se sostiene con rim + key; subir densidad requiere una nueva subtarea de asset.
- **Texturas:** no se usó KTX2 (no hay texturas de color); el normal map de la paleta se exporta en WebP dentro del GLB.
- **Pedido a plataforma:** el botón global «Sonido» (`fixed bottom-6`) se superpone con UI inferior en mobile. La `MatchCard` queda a 88 px del borde.
- **Pirp (T-A23):** el heading del greybox de Pirp («Todo pasa rápido.») es visible mientras Pirp está montada como escena siguiente porque no respeta la opacidad de presentación.
- **Pósters `static`:** quedan para T-A35.

# I-12 (propuesto) — Assets 3D de Vibo (decisión)

> Decisión sobre los assets 3D de la escena Vibo (`03` §3.1, T-A20). Fecha: 2026-10-22.
>
> **Id de insumo:** [`../05-contenido.md`](../05-contenido.md) §4 no tiene un id para los assets 3D de Vibo. I-02 cubre solo los datos (overlays + métricas) e I-05 es Naturalis. Se propone **I-12**; queda sin registrar en `05` ni en `tablero.md` hasta que el humano lo confirme.
>
> **No se descargó nada.** Los dos elementos se modelan a mano (trabajo propio), así que no hay nada que registrar en [`../licencias.md`](../licencias.md).

Fuentes del proyecto consultadas: [`../03-escenas.md`](../03-escenas.md) §3.1 y §8, [`../decisiones.md`](../decisiones.md) ADR-011, [`../02-rendimiento-y-mobile.md`](../02-rendimiento-y-mobile.md) §2, [`../01-arquitectura.md`](../01-arquitectura.md) §7, [`../tablero.md`](../tablero.md) (T-A20, T-H06, I-02), [`../briefs/T-H07.md`](../briefs/T-H07.md), [`../../descripcion-de-producto.md`](../../descripcion-de-producto.md) §10, `assets-src/vibo/README.md`, `src/scenes/vibo/{definition.ts,Scene.tsx}`.

## 1. Qué pide el proyecto

- **Jugador** (`03` §3.1 Técnica y §8.2, ADR-011):
  - personaje 3D animado *estilizado-realista* (*cinematic stylized*) con proporciones humanas
  - rig atlético de 15–25k triángulos, vestimenta deportiva PBR semi-mate e iluminación de reflectores tipo replay TV
  - se rechazan el low-poly de bloques, el look infantil o cartoon y el photoreal AAA (T-H06, hallazgo #1)
- **Golpe:** animación en **slow motion** con **scrub obligatorio** (pausa + arrastrar) en desktop y mobile. El golpe es el héroe visual (`03` §3.1 Beats e Interacción).
- **Cancha:** procedural (líneas y planos), "sin modelo pesado" (`03` §3.1). §8.2 la detalla: suelo oscuro con textura sutil, cristal templado PBR, red y postes estilizados.
- **Paleta y entorno:** la descripción de producto §10 dice "si se muestra una paleta o una cancha, también se arma un entorno alrededor".
- **Overlays:** HUD de detección (bboxes, keypoints COCO-17, etiquetas) con los datos de T-H07. La trayectoria de pelota es **diseñada**, no se reconstruye (ADR-011).
- **Presupuestos** (`02` §2, primera línea):
  - ≤ 1,5 MB y ≤ 300k triángulos en desktop
  - ≤ 600 KB y ≤ 100k triángulos en mobile
  - ≤ 100 draw calls, KTX2 2048 / 1024, 60 FPS
  - `src/scenes/vibo/definition.ts` declara `maxTriangles: 100000` y `maxAssetKB` 1500 / 600
- **Arte** (`03` §8.1):
  - sin primitivas desnudas (bevel + mapas de rugosidad/normales)
  - iluminación de 3 puntos (key, fill y rim azul/dorado)
  - PBR calibrado
- **Pipeline** (`01` §7):
  - `assets-src/vibo/<nombre>.glb` → `npm run assets:build` → `public/models/vibo/<nombre>.{high,medium,low}.glb`
  - compresión meshopt + KTX2; **no Draco**

## 2. Estado actual

- **Greybox:** en `src/scenes/vibo/Scene.tsx`, el jugador está hecho con cajas y un icosaedro, y la cancha con planos y cajas. No hay loaders de modelos.
- **Datos de T-H07** (`assets-src/vibo/`, I-02 listo):
  - `overlays/golpe-drive-jugador.json` y `overlays/golpe-smash-bandeja.json`, con bbox y pose reales
  - `metrics/jugador-anon.json`
  - videos (`mvp-ref/videos/`) y frames de golpes (`mvp-ref/frames/`: Serve, Groundstroke, **Volley**, Smash-Bandeja)
- **Modelos publicados:** no existe `public/models/vibo/`. El repo `proyectos/vibo` solo tiene `ui-mvp/.../phone.glb`, que ya es la referencia del kit.
- **Búsqueda web (2026-10-22):** no se encontró ningún jugador de **pádel** gratis con rig y animaciones, ni una paleta liviana con licencia libre.

| Opción | Licencia | Por qué no encaja |
| --- | --- | --- |
| [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html) + [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) | CC0 | ~13k tris con rig, pero sin golpes de raqueta ni ropa deportiva; look de juego genérico |
| [Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | Libre de regalías (Adobe ID) | Solo FBX; no se pudieron verificar clips de tenis sin login; look genérico |
| [tennista + palla](https://sketchfab.com/3d-models/tennista-palla-92de6dd75f7648c1bfaae8a8b91e2624) | CC BY 4.0 | 43k tris, un solo clip, modelo antiguo, raqueta de tenis, créditos encadenados |
| [Carol Tennis Player Girl](https://sketchfab.com/3d-models/carol-tennis-player-girl-animated-3d-character-7e3c54909e834196aaed1661e2581413) | CC BY 4.0 | 64k tris, estilo cartoon, animaciones no confirmadas |
| [Tori_Athlete](https://sketchfab.com/3d-models/tori-athlete-2b1c4fb1403441c89f543fcff2f77881) | CC BY 4.0 | 77k tris, probablemente generado con IA, sin golpes de tenis |
| [Tennis Rally – Naomi Osaka](https://sketchfab.com/3d-models/tennis-rally-naomi-osaka-animated-ab66cdfe66da499d87e13b46c2799ae1) | CC BY 4.0 | Representa a una persona real: descartado |
| [Male Tennis Player Animated (Fab)](https://www.fab.com/listings/4eb88974-9a4c-4de7-8064-41f4eb91f275) | Pago | ~37k tris, rig Biped/Unreal, raqueta de tenis |
| Paletas: [Padel Racket (ARTEL_3D)](https://sketchfab.com/3d-models/padel-racket-028e03892166472fa2e8073d74565ae7), [Padel Racket gratis en CGTrader](https://www.cgtrader.com/free-3d-models/sports/equipment/padel-racket-86670c0d-fdb2-492e-b764-c59f1f8d92ca) | CC BY 4.0 / Royalty Free (no AI) | 500k y 73k polígonos: demasiado pesadas |

- **Ready Player Me** (mencionado en `03` §3.1 como opción de rig) **cerró el 31/01/2026**, tras la compra de Netflix. Ya no sirve como fuente.

## 3. Decisión

**Modelar a mano dos elementos: el jugador de pádel y la paleta.**

## 4. Argumento

- **Jugador:** no hace falta que sea súper detallado. Se modela como un **esqueleto / figura simple**, porque lo importante es que sea fácil hacer un movimiento leve, por ejemplo la flexión de rodillas y la flexión de brazos. No se necesita gran detalle: un esqueleto simple puede verse bien. Además, las capturas reales (overlays y videos de T-H07) ya existen y vienen después.
- **Paleta:** se hace **bien optimizada**, logrando un buen resultado.

> **⚠️ Desvío respecto del plan:** esta decisión se aparta de la descripción "atleta *cinematic stylized*, 15–25k tris, vestimenta deportiva" de `03` §3.1 / §8.2 y ADR-011. **Hay que reflejarla más adelante** en esos documentos; no se editan acá. Siguen vigentes las reglas de arte de `03` §8.1 (bevel, PBR calibrado, iluminación de 3 puntos), aplicadas a una figura simple.

## 5. Próximos pasos

1. Modelar en Blender el **esqueleto del jugador** y la **paleta** por separado.
   - Los prompts de Blender ya se le entregaron al modelador:
     - **esqueleto:** ~3k–8k tris (propuesta), rig con hueso `racket_socket` en la mano, rodilla 0–60°, codo 0–110°, movimiento de prueba simple tipo volea
     - **paleta:** ~1k–2,5k tris (propuesta), ≤ 45,5 × 26 cm, ~38 mm de espesor, origen en el puño
2. Integrarlos a la escena más adelante, como paso aparte:
   - pipeline `assets:build`
   - paleta anclada al hueso de la mano
   - scrub del golpe y overlays
3. No hay registro en `licencias.md`, porque es trabajo propio.
4. Más adelante: actualizar `03` §3.1 / §8.2 y ADR-011 con esta decisión, y confirmar el id I-12 en `05` y en `tablero.md`.

## Anexo — Animación del golpe (nota informal)

- La animación no tiene que ser súper espectacular: basta con un **movimiento simple**.
- Se pueden usar referencias de tenis, sobre todo la **volea**, que es parecida a un golpe de pádel. También sirve lo que haya del propio ejemplo de Vibo: los videos y frames del MVP con pose en `assets-src/vibo/mvp-ref/`, donde hay frames `shot_*_Volley_*`, además de los overlays de T-H07. Se usa lo que funcione mejor.
- No volverse loco con eso: flexión leve de rodillas + brazo que acompaña el golpe, en slow motion, alcanza para el scrub.

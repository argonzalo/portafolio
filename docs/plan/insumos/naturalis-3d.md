# I-05 — Assets 3D de Naturalis (investigación)

> Investigación previa para T-H09 / I-05 (escena `03` §3.3, T-A24). Fecha: 2026-10-22.
>
> **No se descargó nada.** Solo se verificaron las páginas y las licencias en la web. Cualquier asset de terceros que se use se registra en [`../licencias.md`](../licencias.md) (archivo, fuente, licencia, atribución, fecha) **antes** de mergear a `public/`.

Fuentes del proyecto consultadas: [`../03-escenas.md`](../03-escenas.md) §3.3, [`../02-rendimiento-y-mobile.md`](../02-rendimiento-y-mobile.md) §2–§3, [`../01-arquitectura.md`](../01-arquitectura.md) §7, [`../decisiones.md`](../decisiones.md) ADR-010, [`../07-riesgos-y-desafios.md`](../07-riesgos-y-desafios.md) D-11, [`../05-contenido.md`](../05-contenido.md) (I-05), [`../../descripcion-de-producto.md`](../../descripcion-de-producto.md) §4, §8 y §10, `assets-src/README.md`, `scripts/assets/config.mjs`, `src/scenes/naturalis/{definition.ts,Scene.tsx}`.

## 0. Estado actual

- No hay modelos de Naturalis: `assets-src/naturalis/` solo tiene `brand/`, y `public/models/` solo tiene `kit/README.md`.
- El greybox (`src/scenes/naturalis/Scene.tsx`) es todo primitivas de three.js (cajas, cilindros, esferas como hojas).
- Todavía no hay loaders en `src/` (ni `useGLTF`, ni `useKTX2`, ni Draco/KTX2Loader).
- Teléfono y notebook salen del kit de dispositivos, que es geometría procedural: 0 KiB de descarga (`public/models/kit/README.md`).
- Estilo pedido (`03` §3.3): luz de día, plantas y macetas, cortina de lino, camilla, sombras suaves horneadas, grano sutil, **único capítulo en tema claro**. Paleta salvia/teal `#56857D` / `#81AAA4` sobre crema `#FAFDFC`. Ambiente de centro de estética sin copiar la marca.
- Descripción de producto §10: "si se muestra una maceta, una camilla o una cortina, se crea un entorno 3D para eso".

## 1. Recursos 3D de ejemplo investigados

Pesos de Poly Haven: descarga glTF + texturas originales a 1k (o .hdr a 1k/2k), **antes** del pipeline. Sketchfab no muestra el peso de descarga sin iniciar sesión.

### 1.1 Poly Haven — CC0 (sin atribución obligatoria)

Licencia confirmada en <https://polyhaven.com/license>: CC0, uso comercial permitido, sin atribución obligatoria (agradecida).

| Recurso | Uso en la escena | URL | Formatos | Tris aprox. | Peso aprox. |
| --- | --- | --- | --- | --- | --- |
| Potted Plant 04 | Maceta protagonista (suculenta, 0,3 m) | <https://polyhaven.com/a/potted_plant_04> | glTF, FBX, Blend, USD | ~6k | ~2,1 MB (1k) |
| Potted Plant 02 | Planta en maceta alternativa (hojas con alpha) | <https://polyhaven.com/a/potted_plant_02> | glTF, FBX, Blend, USD | ~70k | ~2,6 MB (1k) |
| Anthurium Botany 01 | Planta de interior de hoja grande | <https://polyhaven.com/a/anthurium_botany_01> | glTF, FBX, Blend, USD | ~4,1k | ~3,2 MB (1k) |
| Fern 02 | Helecho; base para hojas instanciadas y el tallo que crece | <https://polyhaven.com/a/fern_02> | glTF, FBX, Blend, USD | ~6,2k | ~1,1 MB (1k) |
| Ceramic Vase 01 | Maceta/jarrón minimalista | <https://polyhaven.com/a/ceramic_vase_01> | glTF, FBX, Blend, USD | ~2,5k | ~0,4 MB (1k) |
| Ceramic Vase 02 / 03 / 04 | Variantes de jarrón | <https://polyhaven.com/a/ceramic_vase_02> · <https://polyhaven.com/a/ceramic_vase_03> · <https://polyhaven.com/a/ceramic_vase_04> | glTF, FBX, Blend, USD | ~2,2k–2,8k | — |
| Planter Pot Clay | Maceta de barro | <https://polyhaven.com/a/planter_pot_clay> | glTF, FBX, Blend, USD | ~3k | ~1,8 MB (1k) |
| Rough Linen (textura) | Lino de la cortina y tapizado | <https://polyhaven.com/a/rough_linen> | Material PBR (diffuse, normal, rough, AO, etc.) | — | ~6,5 MB set 1k |
| Terry Cloth (textura) | Toallas y tapizado de la camilla | <https://polyhaven.com/a/terry_cloth> | Material PBR | — | ~6,6 MB set 1k |
| Brown Photostudio 04 (HDRI) | Luz de día suave, poco contraste; para hornear o como entorno | <https://polyhaven.com/a/brown_photostudio_04> | .hdr / .exr | — | 1,6 MB (1k) · 6,5 MB (2k) |
| Blinds (HDRI) | Alternativa: luz de ventana con persianas | <https://polyhaven.com/a/blinds> | .hdr / .exr | — | 1,5 MB (1k) · 5,7 MB (2k) |

### 1.2 Sketchfab — CC BY 4.0 (atribución **obligatoria**)

Licencia confirmada en cada página ("CC Attribution", <https://creativecommons.org/licenses/by/4.0/>) y por la API. Todos son descargables. Hay que dar crédito al autor (nombre + enlace) en el sitio y en `licencias.md`.

| Recurso | Uso en la escena | URL | Autor | Tris aprox. | Nota |
| --- | --- | --- | --- | --- | --- |
| WULOP Massage Table | Camilla de masajes realista | <https://sketchfab.com/3d-models/wulop-massage-table-44bdcb008ae94521806ee2808f673f6f> | federico.scappiti | ~61k | Habría que reducir mucho los triángulos; el nombre parece de un producto comercial |
| CAMA CALEFACTADA | Alternativa a la camilla | <https://sketchfab.com/3d-models/cama-calefactada-3e2d4e7f50d9488f9aa1947d5b30eec1> | Jersahin Flores (@jersa) | ~11,3k | Es una cama de spa calefaccionada con mosaico, no una camilla de masajes |
| Toalla Doblada 1 (Materiales Editables) | Toalla doblada sobre la camilla | <https://sketchfab.com/3d-models/toalla-doblada-1-materiales-editables-ce98d25c5db145539a5895f7fff767c1> | Formando Arquitectura (@mbautistaa860) | ~10,2k | Existe "Toalla Doblada 2" del mismo autor |
| Candles | Velas para el beat nocturno ("pequeñas luces") | <https://sketchfab.com/3d-models/candles-92bb9f59fd9046b1beb9dca6b21489e2> | thegraphicsgeek | ~22,6k | — |
| Old Curtains | Cortina de referencia (12 paños + barra) | <https://sketchfab.com/3d-models/old-curtains-033b034de3244b02a5487e171e4888dd> | Pieter Ferreira (@Badboy17Aiden) | ~824 | Estilo "viejo". Marcado **NoAI**: no se puede usar para entrenar IA, pero no restringe el portafolio |

### 1.3 Descartados

- **Kenney** (<https://kenney.nl/assets/furniture-kit>, CC0): la estética low-poly de juguete no encaja con el look de Naturalis.
- **Spa Hot Stone** (Sketchfab, artel_3D, CC BY 4.0): ~500k tris, demasiado pesado.
- **Iris Treatment Table** (Sketchfab, CC BY 4.0): ~362k tris, demasiado pesado.

## 2. Qué hay que modelar a mano

- **Camilla:** prácticamente una caja con patas (y quizás un apoyacabezas). Tapizado con Terry Cloth o Rough Linen. Más barato y coherente que adaptar la WULOP.
- **Cortina de lino:** plano subdividido con el material Rough Linen y un **shader de viento en vértices** (barato), como pide `03` §3.3. Arrastrar la cortina es *nice-to-have*.
- **Piedras de spa:** piedras lisas modeladas a mano, muy pocos polígonos, en un solo material. Las rocas CC0 de Poly Haven son escaneos de naturaleza de decenas de miles de tris.
- **Sala completa en Blender:** paredes, piso, ventana y mobiliario base. Con **iluminación horneada en un atlas**, porque no hay ninguna sala de centro de estética CC0 que encaje.
- **Hojas:** tarjetas con transparencia (alpha) instanciadas con `InstancedMesh` (`02` §3: "hojas de Naturalis"). Se pueden sacar de la textura de Fern 02 o Potted Plant 02.
- **Tallo que crece (beat 1):** geometría propia que comparte el shader del hilo; no viene de ningún asset.
- **Agenda de papel (beat 2):** planos simples con textura; no hace falta modelo externo.

## 3. Optimización

### 3.1 Pipeline (`01` §7, ADR-010, `assets-src/README.md`, `scripts/assets/config.mjs`)

```text
assets-src/naturalis/<nombre>.glb|gltf  (fuentes, gitignored; .blend aparte)
        │  npm run assets:build   (@gltf-transform: dedup, prune, weld, simplify, meshopt, KTX2)
        ▼
public/models/naturalis/<nombre>.{high,medium,low}.glb
public/textures/naturalis/*.ktx2
```

| Nivel | Textura máx. | Geometría (simplify) | Meshopt |
| --- | --- | --- | --- |
| `high` | 2048 | sin simplificar (100 %) | high |
| `medium` | 1024 | ~50 % | high |
| `low` | 512 | ~25 % | medium |

- La compresión de geometría es **meshopt**, no Draco.
- KTX2 necesita `toktx` (KTX-Software) en el PATH. Si falta, se puede usar `ASSETS_TEXTURE_COMPRESS=webp` (ver `assets-src/README.md`).
- `npm run assets:check` verifica solo los presupuestos de `public/`.
- En runtime cada escena declara sus assets en `src/scenes/<id>/assets.ts`; la carga es con `useGLTF` / `useKTX2` de drei (`01` §1).

### 3.2 Presupuestos (`02-rendimiento-y-mobile.md` §2, primera línea)

| | Desktop (`high`) | Mobile (`medium` / `low`) |
| --- | --- | --- |
| Peso de assets | ≤ 1,5 MB | ≤ 600 KB |
| Triángulos | ≤ 300k | ≤ 100k |
| Draw calls | ≤ 100 | ≤ 100 |
| Texturas | KTX2, máx. 2048 | KTX2, máx. 1024 |
| FPS | 60 | ≥ 50 en Android medio (p95 ≤ 20 ms) |

### 3.3 Decisión abierta: presupuesto de triángulos

`src/scenes/naturalis/definition.ts` declara `budget.maxTriangles: 18000` (con `maxAssetKB` 1500 / 600). Eso choca con los **300k desktop / 100k mobile** de `02` §2.

**Pendiente de decisión del humano:** ¿18k es un tope del greybox que hay que subir, o es el objetivo real de la escena final? Esta investigación **no cambia código**. Hay que resolverlo antes de T-A24.

### 3.4 Estrategia para entrar en presupuesto

- **Lightmaps horneados para día y noche:** el ciclo se hace mezclando dos lightmaps, sin luces en tiempo real (`03` §3.3, `07` D-11). Las sombras en tiempo real van solo en `high` y solo si se justifica (`02` §3).
- **Atlas compartido:** sala y props en uno o pocos atlas de textura, para reducir draw calls y peso.
- **Pocos materiales:** reutilizar Rough Linen y Terry Cloth en tela, toallas y camilla; un material de cerámica para macetas y jarrones.
- **Texturas a 512–1024** en la mayoría de los assets; 2048 solo para el atlas principal en `high`.
- **Instancing:** hojas, velas y piedras repetidas con `InstancedMesh`.
- **Plantas:** preferir tarjetas con alpha antes que plantas escaneadas densas (por ejemplo, Potted Plant 02 tiene ~70k tris).
- **⚠️ Aviso:** los assets de Poly Haven a 1k pesan entre ~0,4 y ~3 MB cada uno, sin contar las texturas de tela (~6,5 MB por set) ni los HDRI. **Sumados sin pasar por el pipeline superan holgadamente los 600 KB de mobile.** Hace falta KTX2 a 512–1024, recortar mapas innecesarios (displacement, AO separado si ya está en el lightmap), atlas y simplify.
- **Orden de recorte si no entra** (`02` §2): postprocesado → partículas → resolución de texturas → geometría → luces en tiempo real.
- El HDRI conviene usarlo **para hornear** en Blender. Si se usa en runtime, que sea a 1k o un entorno precomputado pequeño, porque 1,5 MB de .hdr ya consume casi todo el presupuesto desktop.

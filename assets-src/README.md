# Fuentes de assets 3D (`assets-src/`)

Convención del pipeline (ADR-010, `docs/plan/01-arquitectura.md` §7).

## Qué va acá

Fuentes **pesadas** que no se publican ni se versionan en Git:

- `.blend`, `.glb` / `.gltf` sin optimizar
- texturas de origen (PNG/EXR…), capturas de referencia, videos crudos
- JSON de trabajo (por ejemplo overlays de Vibo) que aún no son salida pública

El backup lo hace el humano en Dropbox/Drive. **No** usamos Git LFS.

## Qué se versiona en el repo

| En el repo | Fuera de Git |
| --- | --- |
| Este README y `assets-src/<escena>/README.md` | Todo lo demás bajo `assets-src/` |
| Salidas en `public/models/`, `public/textures/`, `public/posters/`, … | |

`.gitignore` permite solo los README bajo `assets-src/`.

## Carpetas

```text
assets-src/
  README.md                 ← este archivo
  <escena>/                 ← vibo | pirp | naturalis | banner | kit | …
    README.md               ← opcional: origen, licencia, notas para la escena
    *.glb | *.gltf          ← entrada del pipeline
    reference/              ← refs, capturas, exports crudos (no se procesan)
```

El id de carpeta `<escena>` debe coincidir con el id del proyecto / kit (`vibo`, `pirp`, `kit`, …).

| Carpeta | Contenido |
| --- | --- |
| `vibo/` | Insumos escena Vibo (T-H07): exports Firebase, ref MVP, overlays curados, métricas, videos |
| `kit/` | Modelos fuente del kit (p. ej. `phone*.glb` del MVP UI) |

## Pipeline

```bash
# Requiere Node ≥ 22 y, para KTX2, `toktx` (KTX-Software) en el PATH:
# https://github.com/KhronosGroup/KTX-Software/releases

npm run assets:build
```

Para cada `assets-src/<escena>/<nombre>.glb` genera:

```text
public/models/<escena>/<nombre>.high.glb    # texturas ≤ 2048, sin simplify agresivo, meshopt
public/models/<escena>/<nombre>.medium.glb  # ≤ 1024, simplify ~50 %
public/models/<escena>/<nombre>.low.glb     # ≤ 512,  simplify ~25 %
```

Pasos de `@gltf-transform/cli optimize`: dedup / prune / weld / simplify (por nivel) + **meshopt** + **KTX2**.

Si no tenés `toktx` a mano:

```bash
ASSETS_TEXTURE_COMPRESS=webp npm run assets:build
```

(solo workaround local; la salida canónica es KTX2).

## Presupuestos

`npm run assets:build` y `npm run assets:check` fallan si el peso por escena×nivel supera `02` §2:

| Línea | `high` (desktop) | `medium` / `low` (mobile) |
| --- | --- | --- |
| Primera | ≤ 1,5 MiB | ≤ 600 KiB |
| Segunda (viñeta) | ≤ 400 KiB | ≤ 200 KiB |
| Tercera (archivo) | 0 (solo imágenes) | 0 |

El manifiesto por escena (`src/scenes/<id>/assets.ts`) declara qué archivo usa cada nivel en runtime; el pipeline solo garantiza peso y convención de nombres.

## Licencias

Todo asset de terceros o de cliente se registra en `docs/plan/licencias.md` antes de mergear la salida a `public/`.

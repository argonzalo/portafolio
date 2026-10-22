# Kit — fuentes de dispositivos (`assets-src/kit/` · T-A19)

## Decisión técnica (T-A19)

Los tres dispositivos reutilizables del kit (`Phone`, `Laptop`, `Display`) viven en `src/scenes/kit/devices/` como **geometría procedural paramétrica de alta precisión** con proporciones físicas reales (`1 unidad = 10 cm`) y detalle adaptado por `QualityTier` (`high` / `medium` / `low`):

- **`Phone`** (6,1" · `70,6 × 146,6 × 8,25 mm`): cuerpo de aluminio/titanio anodizado con bisel suave, vidrio frontal negro, *Dynamic Island*, botones laterales fusionados y módulo trasero de 3 lentes.
- **`Laptop`** (14" · `312,6 × 221,2 mm`): base y tapa de aluminio, teclado ANSI completo fusionado en **1 sola malla** (1 draw call), trackpad de vidrio satinado, rejillas de parlantes, bisagra articulada (`open: 0..1`) y pantalla con notch.
- **`Display`** (27" · `623 × 362 mm`): variantes `monitor` (con pie inclinado de aluminio `studio`) y `signage` (cartelería digital de bisel mínimo en `landscape` o `portrait`).

### Por qué no se publican `models/phone*.glb` en `public/models/kit/`

| Archivo en `assets-src/kit/models/` | Peso origen | Geometría | Motivo de descarte para runtime |
| --- | --- | --- | --- |
| `phone.glb`, `phone2.glb`, `phone3.glb` | 5,2 MiB c/u | 16 primitivas · 20.654 vértices · 30.032 triángulos + 4 texturas JPEG/PNG | Supera el presupuesto de escenas de segunda línea (`≤ 200 KiB` mobile / `≤ 400 KiB` desktop en `02` §2) y multiplica draw calls sin aportar capas de UI flotantes ni variantes `Laptop` / `Display`. |

Con la implementación procedural en `src/scenes/kit/devices/`:
- **Peso de descarga en `public/models/kit/`:** `0 KiB` (presupuesto intacto para las escenas de primera y segunda línea).
- **Mapa de entorno:** estudio fotográfico procedural HDR generado una sola vez con `PMREMGenerator` y compartido por referencia entre todos los dispositivos del mismo `WebGLRenderer`.
- **Pantallas y capas flotantes (`DeviceScreen`):** texturas `.webp`/`.png`/`.mp4` con caché por conteo de referencias y liberación diferida de VRAM, más capas `DeviceLayer` que recortan regiones normalizadas `[x, y, w, h]` de la captura y se despegan en `+Z` con sombra suave, halo y paralaje.

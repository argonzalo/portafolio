# Naturalis — insumos

## Marca (I-03)

Ver [`brand/README.md`](./brand/README.md) y `brand/palette.json`.

## Entorno 3D (I-05) — cerrado en T-H09 (2026-10-22)

- **Modelos 3D de sala:** Ensamble estilizado-realista con modelos CC0 libres de regalías (Poly Haven / Sketchfab CC0) para camilla, vegetación (ficus/monstera en tarjetas/low-poly optimizado) y cortina de lino con sombras horneadas (lightmap) según rúbrica de arte cinematográfica (`03-escenas.md` §8). El humano puede especificar ruta local para reemplazar piezas específicas si no satisfacen las expectativas.
- **Dispositivos y capturas de UI:**
  - `Phone` (App de clientes): `public/images/proyects/naturalis/app-web/1.webp`.
  - `Laptop` (Natuadmin): `public/images/proyects/naturalis/natuadmin/1.webp`.

## Audio ambiente (I-06) — cerrado en T-H09 (2026-10-22)

- Pista de audio provista por el humano: copiada a `public/audio/naturalis.mp3` (fuente original: `C:\Users\arave\Music\naturalis-audio.mp3`).
- Registrada en `docs/plan/licencias.md`.

## Camilla propia — 2026-10-22

Modelada en el archivo abierto de Blender por pedido del humano. Reemplaza la
camilla CC0 prevista arriba: geometría y texturas originales, referencias usadas
solo para proporciones y lenguaje de forma, sin marcas ni logos.

- `camilla.blend`: fuente guardada con texturas empaquetadas. Escena
  `CAMILLA_asset`, colección `CAMILLA_export`. Escena `PREVIEW_dia` con sala,
  cortina, planta, luces y cámara solo para presentación. La escena inicial se
  conserva aparte; `camilla.pre-modelado.blend` es el respaldo previo.
- `camilla.glb`: glTF 2.0 binario, **5.284 triángulos**, **280.956 bytes**
  (281 KB / 274,4 KiB), sin compresión ni extensiones. Tres mallas y tres
  primitivas/materiales: `camilla_base` (2.820 triángulos), `camilla_tapizado`
  (1.272, incluye almohada blanca) y `camilla_toalla` (1.192).
- `camilla-dia.png`: render Cycles de 1.400 × 1.050 con luz natural suave.
- `textures/camilla_basecolor.jpg` y `textures/camilla_normal.png`: atlas
  compartidos de 512 × 512, también embebidos en el GLB y empaquetados en Blender.
  Color, normal y roughness constantes por material; sin nodos procedurales.
- Dimensiones: largo 1,901 m; ancho máximo 0,667 m con la caída de la toalla;
  superficie de descanso aproximadamente 0,753 m; altura con almohada 0,824 m.
  Origen centrado en el piso, escala (1,1,1), Y arriba en glTF.
- `UV0` y `UV1` son dos canales independientes, con la misma distribución única
  de islas entre las tres mallas y margen de empaquetado 0,012. Sin UV repetidos
  entre piezas. `UV1` está preparado para el atlas de iluminación de la sala;
  **los lightmaps de día/noche se hornean al integrar la escena**, no en este asset.
- Bevels, espesor y triangulación aplicados; sin modificadores pendientes.
  Tres mallas cerradas, sin bordes no manifold ni caras degeneradas.

Verificación independiente del archivo final: `python assets-src/naturalis/verify_camilla.py`.
El informe `camilla-glb-validation.json` comprueba conteo real de primitivas,
triángulos, materiales, UV exportados, intersecciones de área UV, normales unitarias,
escala/origen, Y arriba, imágenes embebidas y ausencia de luces/cámaras/animación/
compresión. `camilla-report.json` contiene las métricas de la fuente.

`npm run check` pasó (lint, typecheck, build y presupuestos). El build emitió
avisos sobre directivas MDX, chunks grandes y bundling; no se modificó código de
aplicación. La revisión visual corresponde al render y al viewport de Blender.
Integración web, LOD, meshopt/KTX2, lightmaps de sala y prueba en teléfono real
quedan para T-A24 / el pipeline de assets.

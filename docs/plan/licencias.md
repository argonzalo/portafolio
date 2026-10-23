# Licencias y permisos

Registro obligatorio antes de mergear assets de terceros o de cliente a `public/` (`05-contenido.md` §5).

| Archivo o carpeta | Fuente | Licencia / permiso | Atribución | Fecha |
| --- | --- | --- | --- | --- |
| `assets-src/vibo/brand/*` | Repos locales Vibo (`vibo/beta-front`, `vibo/ui-mvp`, …); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `assets-src/pirp/brand/*` | Repo local `PIRP/frontend`; rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). No nombrar al cliente dueño de la paleta bordó | — | 2026-10-22 |
| `assets-src/banner/brand/*` | `banner-director/webui` (+ geometría de `banner-docs`); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). Logos de clientes → I-07 | — | 2026-10-22 |
| `assets-src/naturalis/brand/*` | Repos locales Naturalis (`natuadmin`, `naturalis`); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). Escena: atmósfera sin copiar marca en escena (`03` §3.3) | — | 2026-10-22 |
| `assets-src/naturalis/camilla.blend`, `camilla.glb`, `textures/camilla_*`, `camilla-dia.png` | Modelado y texturas originales creados en Blender para este portafolio por pedido humano | Asset propio; referencias humanas usadas solo como guía de forma/proporción. No incluye logos ni imágenes de referencia | — | 2026-10-22 |
| `assets-src/naturalis/sala.blend`, `sala.glb`, `public/models/naturalis/*`, atlas día/noche y agenda | Modelado, materiales y horneado originales de T-A24; integra la camilla propia | Assets propios, sin modelos ni texturas externas | — | 2026-10-22 |
| `public/textures/naturalis/{client,admin}.webp` | Derivadas de las capturas `app-web/2.webp` y `natuadmin/2.webp` indicadas por el humano en T-A24 | Uso en portafolio autorizado; identidades, contactos y notas privadas ocultos en la derivada de Natuadmin | — | 2026-10-22 |
| `assets-src/vibo/paleta.blend`, `paleta.glb`, `textures/paleta-normal.png`, `paleta-*.png` | Modelado y normal map originales creados en Blender por pedido humano; renders finales del GLB con Three.js | Asset propio; referencias humanas usadas como guía de silueta, perforaciones y construcción. Sin marcas, logos ni imágenes de referencia incorporadas | — | 2026-10-22 |
| `assets-src/vibo/jugador.blend`, `jugador.glb`, `jugador-{reposo,volea,rangos}.png` | Modelado, rig y acción de prueba originales creados en Blender por pedido humano | Asset propio desde el brief escrito; sin mallas, texturas, marcas ni animaciones de terceros. Referencias anunciadas aún no adjuntadas. Integración posterior en T-A20 | — | 2026-10-22 |
| Tipografías de marca (Poppins, Inter, Geist, Geist Mono, etc.) | [Google Fonts](https://fonts.google.com/) — enlaces en cada `assets-src/*/brand/README.md` | OFL / licencia Google Fonts; no se versionan archivos `.ttf`/`.woff` en el repo | Según fuente si se exige | 2026-10-22 |
| `public/images/proyects/**` | Capturas propias de producto | Uso en portafolio: **sí**; el humano puede reemplazarlas después | — | 2026-10-22 |
| `public/audio/naturalis.mp3` | Pista local provista por Gonzalo (`C:\Users\arave\Music\naturalis-audio.mp3`) | Uso en portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `assets-src/banner/brand/clients/*` | Repo local `banner-director/web-landing-2/public/assets/clientes/` | Uso de logos en videowall/cartelería del portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `public/videos/banner/*.mp4`, `public/textures/banner/*` | Ocho clips provistos por Gonzalo de `C:\Users\arave\Videos\mini clips\seleccionados`; fotogramas derivados; capturas propias `banner-2/{1,3,5,6}.webp` indicadas expresamente por el humano | Uso de clips y capturas en esta escena indicado por el humano en T-A25; no se presume licencia externa ni autoría de los clips. Recorte UV/cover, sin modificar los originales | — | 2026-10-23 |
| `assets-src/pirp/dataset-ficticio.json` | Dataset sintético de asuntos públicos/diplomacia sin nombres propios | Contenido ficticio original portafolio | — | 2026-10-22 |

## Notas

- Los binarios bajo `assets-src/` no se versionan (salvo `**/README.md`). Backup local / Drive.
- Paleta bordó de Pirp: es del cliente; en copy y metadatos decir solo “paleta del cliente”. **Decisión 2026-10-22:** usarla tal cual (`#7A1F2B` y escala en `assets-src/pirp/brand/palette.json`); no definir acento propio.
- I-07 (logos Grido, Açaí, Marea, Diarco, Leroma, etc.): logos vectoriales SVG copiados a `assets-src/banner/brand/clients/` y autorizados para el videowall/cartelería.

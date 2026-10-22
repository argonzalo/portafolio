# Licencias y permisos

Registro obligatorio antes de mergear assets de terceros o de cliente a `public/` (`05-contenido.md` §5).

| Archivo o carpeta | Fuente | Licencia / permiso | Atribución | Fecha |
| --- | --- | --- | --- | --- |
| `assets-src/vibo/brand/*` | Repos locales Vibo (`vibo/beta-front`, `vibo/ui-mvp`, …); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `assets-src/pirp/brand/*` | Repo local `PIRP/frontend`; rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). No nombrar al cliente dueño de la paleta bordó | — | 2026-10-22 |
| `assets-src/banner/brand/*` | `banner-director/webui` (+ geometría de `banner-docs`); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). Logos de clientes → I-07 | — | 2026-10-22 |
| `assets-src/naturalis/brand/*` | Repos locales Naturalis (`natuadmin`, `naturalis`); rutas en `brand/README.md` | Uso en portafolio: **sí** (Gonzalo). Escena: atmósfera sin copiar marca en escena (`03` §3.3) | — | 2026-10-22 |
| Tipografías de marca (Poppins, Inter, Geist, Geist Mono, etc.) | [Google Fonts](https://fonts.google.com/) — enlaces en cada `assets-src/*/brand/README.md` | OFL / licencia Google Fonts; no se versionan archivos `.ttf`/`.woff` en el repo | Según fuente si se exige | 2026-10-22 |
| `public/images/proyects/**` | Capturas propias de producto | Uso en portafolio: **sí**; el humano puede reemplazarlas después | — | 2026-10-22 |
| `public/audio/naturalis.mp3` | Pista local provista por Gonzalo (`C:\Users\arave\Music\naturalis-audio.mp3`) | Uso en portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `assets-src/banner/brand/clients/*` | Repo local `banner-director/web-landing-2/public/assets/clientes/` | Uso de logos en videowall/cartelería del portafolio: **sí** (Gonzalo) | — | 2026-10-22 |
| `assets-src/pirp/dataset-ficticio.json` | Dataset sintético de asuntos públicos/diplomacia sin nombres propios | Contenido ficticio original portafolio | — | 2026-10-22 |

## Notas

- Los binarios bajo `assets-src/` no se versionan (salvo `**/README.md`). Backup local / Drive.
- Paleta bordó de Pirp: es del cliente; en copy y metadatos decir solo “paleta del cliente”. **Decisión 2026-10-22:** usarla tal cual (`#7A1F2B` y escala en `assets-src/pirp/brand/palette.json`); no definir acento propio.
- I-07 (logos Grido, Açaí, Marea, Diarco, Leroma, etc.): logos vectoriales SVG copiados a `assets-src/banner/brand/clients/` y autorizados para el videowall/cartelería.

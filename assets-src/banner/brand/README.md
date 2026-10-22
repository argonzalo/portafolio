# Marca — Banner Director / Banner 2.0 (I-03)

Insumo **I-03 (Marcas y paletas)** para la escena Banner. Lo recopiló T-H03 el 2026-10-22.
Marca principal: **Banner 2.0**, repo `webui` (Nuxt 3 + Vuetify + Tailwind; `site.name: "Banner Director"`, `sistema.bannerdirector.com`). Lo bajó Gonzalo a `banner-director\webui` y se leyó en modo solo lectura.

## Origen

| Qué | Ruta de origen (`C:\Users\arave\Documents\proyectos\banner-director\`) |
| --- | --- |
| Logo inline (ícono + wordmark con badge "lite") | `webui\components\layout\BannerLogo.vue` |
| Wordmark "banner director" completo (sin badge) | `banner-docs\ui\components\BannerLogo.tsx` |
| Íconos PNG / favicon | `webui\public\favicon\{48,72,96,128,192,512}x….png`, `webui\public\favicon.ico` |
| Logos PNG chicos | `webui\public\static\logo-banner.png`, `webui\public\static\logo-banner-gris.png` |
| Paleta | `webui\assets\colorPalette.ts`, cargada en `webui\plugins\vuetify.ts` (tema por defecto: `dark`) |
| Tipografía | `webui\assets\styles\settings.scss`, `webui\nuxt.config.ts` |

## Logos

| Archivo | Formato | Tamaño | Uso recomendado |
| --- | --- | --- | --- |
| `logo-full-white.svg` | SVG | viewBox ≈303×78 | **Principal sobre fondo oscuro** (la escena es "oscuro industrial"): ícono + "banner director" en blanco |
| `logo-full-DA3E00.svg` | SVG | viewBox ≈303×78 | Principal sobre fondo claro: relleno `#DA3E00` |
| `icon-white.svg` | SVG | viewBox 92×60 | Isotipo solo, blanco (geometría de `webui`) |
| `icon-DA3E00.svg` | SVG | viewBox 92×60 | Isotipo solo, `#DA3E00` |
| `logo-lite-white.svg` / `logo-lite-DA3E00.svg` | SVG | viewBox ≈254×74 | Variante tal como aparece en `webui`, con badge "lite". En el wordmark de esta variante, la "o" y la "r" están recortadas para dejar lugar al badge |
| `icon-512.png` | PNG | 512×512 | Isotipo naranja (~`#E94504`) sobre casi blanco (`#FEFCFC`). Mejor raster en alta |
| `icon-192.png`, `icon-128.png`, `icon-96.png`, `icon-72.png`, `icon-48.png` | PNG | según nombre | Mismo ícono, otros tamaños |
| `favicon.ico` | ICO | 32×32 | Favicon de `webui` |
| `logo-full-white-144x35.png` | PNG | 144×35 | Logo completo blanco con fondo transparente. Chico: no usar en alta |
| `logo-full-gris-144x35.png` | PNG | 144×35 | Logo completo gris (~`#393D40`) con fondo transparente. Chico |

Cómo se armaron los SVG (todos son XML válido):
- `logo-full-*`: ícono y wordmark de `banner-docs` (`BannerLogo.tsx`), con la misma composición del componente (alto 78, separación 0,19 × alto).
- `icon-*` y `logo-lite-*`: geometría de `webui\components\layout\BannerLogo.vue`.
- Rellenos explícitos: `#FFFFFF` o `#DA3E00`.

## Paleta (Banner 2.0, `webui\assets\colorPalette.ts`)

Los valores ya están en hex en la fuente; no hubo conversión.

| Rol | Oscuro (por defecto) | Claro |
| --- | --- | --- |
| **Fondo** (background) | **`#151211`** (deep `#0F0D0C`) | `#F1F1F1` (deep `#DEDEDE`) |
| Superficie (surface) | `#1C1817` | `#FFFFFF` |
| Superficie variante | `#221E1C` | `#EDEDED` |
| **Texto** (on-background / on-surface) | **`#EDE0DD`** | `#201A19` |
| Texto secundario (on-surface-variant) | `#D8C2BC` | `#53433F` |
| **Acento / primary** | **`#FFB5A0`** (on-primary `#601400`) | **`#DA3E00`** (on-primary `#FFFFFF`) |
| Primary container | `#472619` (on `#FFDBD1`) | `#FFDBD1` (on `#3A0A00`) |
| Secondary | `#E7BDB2` | `#926F66` |
| Tertiary (azul violáceo) | `#BDC2FF` | `#636ED1` |
| Outline / border | `#999594` / `#383331` | `#8E8C8A` / `#EAEBEE` |
| Menú / input | `#2E2928` / `#262221` | `#FFFFFF` / `#F0F0F0` |
| Error | `#FF5555` | `#C20000` |

La fuente también define colores semánticos y decorativos que no son núcleo de marca: info `#D98B00` / `#F3BE80`, success `#6E9E49` / `#90F377`, orlando, ocean, emerald, indigo, lime, miami y las listas `vibrantVerse` / `lumenPulse` para gráficos.

## Tipografía

| Uso | Fuente | Enlace |
| --- | --- | --- |
| Principal (body de Vuetify) | **Poppins** 100–900 | https://fonts.google.com/specimen/Poppins |
| Cargada además (catálogo del editor de contenidos, no es de marca) | Montserrat | https://fonts.google.com/specimen/Montserrat |

## Permiso de uso en portafolio

**Sí** (confirmado por Gonzalo). Los logos de clientes (Grido, Açaí, Marea, Diarco, Leroma) son otro insumo, I-07, y no están acá.

## Notas y ambigüedades

- **Nota secundaria:** el portal interno `banner-docs` (`banner-docs\ui\app\globals.css`) usa un naranja más brillante, `#FA5113` (convertido de `oklch(66.397% 0.21453 37.072)`), con Inter. La marca de referencia para el portafolio es la de Banner 2.0 (`#DA3E00`). El primary oscuro coincide en ambos: `#FFB5A0`. El ícono raster está en ~`#E94504`, entre los dos.
- Hay otra copia del isotipo, con la palabra "Blog", en `naturalis\natuadmin\src\assets\img\blog-logo.svg` (blanco). Parece un archivo traspapelado; no se usó.
- El badge "lite" del logo de `webui` indica una variante del producto. Para el portafolio se recomienda el wordmark completo, sin badge (`logo-full-*`).
- Las 14 capturas de Banner 2.0 ya están en `portafolio\public\images\proyects\banner-director\banner-2\`.

# Marca — Vibo (I-03)

Insumo **I-03 (Marcas y paletas)** para la escena Vibo. Lo recopiló T-H03 el 2026-10-22 a partir de los repos locales de Vibo (solo lectura).
Marca principal: **`vibo\beta-front`** (app actual, con guía de marca en `src\styles-guide.md`).

## Origen

| Qué | Ruta de origen (`C:\Users\arave\Documents\proyectos\`) |
| --- | --- |
| Logo completo SVG (blanco) | `vibo\ui-mvp\assets\logo.svg` |
| Logo inline (ícono + texto) | `vibo\ui\components\common\LogoVIBO.tsx` |
| Ícono de app PNG | `vibo\beta-front\public\logo.png` |
| Favicons | `vibo\ui-mvp\src\app\favicon.ico`, `vibo\beta-front\public\favicon.ico` (= `vibo\ui\app\favicon.ico`) |
| Paleta | `vibo\beta-front\src\App.css`, `vibo\beta-front\src\utils\colors.js`, `vibo\beta-front\src\styles-guide.md`; mismas escalas en `vibo\ui\app\globals.css` |
| Tipografía | `vibo\beta-front\index.html`, `vibo\beta-front\src\App.css` |

## Logos

| Archivo | Formato | Tamaño | Uso recomendado |
| --- | --- | --- | --- |
| `logo-full-gold.svg` | SVG | viewBox 744×214 | **Principal** sobre fondo azul oscuro (#071739 / #0C1F2A): ícono + "VIBO" en gold-2 #E3C39D |
| `logo-full-white.svg` | SVG | viewBox 744×214 | Sobre fondos oscuros o fotos |
| `logo.svg` | SVG | 744×214 | Copia literal del original de `ui-mvp` (relleno blanco); misma geometría que los dos anteriores |
| `icon-gold.svg` | SVG | viewBox 120×214 | Isotipo solo, gold-2 |
| `icon-white.svg` | SVG | viewBox 120×214 | Isotipo solo, blanco |
| `icon-app-100.png` | PNG | 100×100 | Ícono de app (isotipo gold ~#E1C29D sobre azul ~#041F2B, esquinas redondeadas). Chico: no usar en alta |
| `favicon-256.ico` | ICO | 256×256 | Favicon de `ui-mvp` |
| `favicon.ico` | ICO | 50×50 | Favicon de `beta-front` / `ui` |

Los SVG `logo-full-*` e `icon-*` se extrajeron de `logo.svg` y de `LogoVIBO.tsx` con relleno explícito; son XML válido. Regla de la guía: isotipo en `vibo-gold-2` sobre `vibo-blue-4` o `vibo-blue-5`.

## Paleta

| Rol | Hex | Fuente |
| --- | --- | --- |
| Fondo de marca / superficie primaria (azul profundo) | `#071739` (blue-4), `#0C1F2A` (blue-5) | `App.css`, `colors.js`, `styles-guide.md` |
| Acento (dorado claro) | `#E3C39D` (gold-2) | ídem |
| Escala azul 1→5 | `#CDD5DB` `#A4B5C4` `#4B6382` `#071739` `#0C1F2A` | ídem |
| Escala dorada 1→5 | `#F2E3D1` `#E3C39D` `#A68868` `#6E5745` `#362916` | ídem |
| Fondo oscuro de app | `#121418` (degradé a `#171C22` / `#1B1F24`) | `App.css`, `manifest.webmanifest` (`background_color`) |
| Fondo claro / superficie clara | `#F4F5F7` / `#FFFFFF` | `App.css` |
| Texto principal / secundario (tema claro) | `#0F1419` / `#6B7280` | `App.css` |
| Texto sobre oscuro | `#F1F5F9` | `App.css` |
| Theme color (navy) | `#1A1F2B` | `index.html`, `manifest.webmanifest` |
| Tokens legados (la guía pide no mezclarlos) | gold `#C4A484`, gold-bright `#D4AF37`, cyan `#5EB8D4` | `App.css` |

Uso según la guía: azul 1–2 para tintes e inactivos; 3 para énfasis secundario; 4–5 para superficies primarias, texto sobre claro y sombras. Dorado 1–2 para resaltes e íconos sobre azul oscuro; 3–5 para acentos más profundos.

## Tipografía

| Uso | Fuente | Enlace |
| --- | --- | --- |
| Principal (beta-front) | **Poppins** 300–700 (+ itálica 400) | https://fonts.google.com/specimen/Poppins |
| `vibo\ui` (Next) | Inter, Geist / Geist Mono | https://fonts.google.com/specimen/Inter · https://fonts.google.com/specimen/Geist |
| `vibo\ui-mvp` (legado) | Orbitron, Space Grotesk | https://fonts.google.com/specimen/Orbitron · https://fonts.google.com/specimen/Space+Grotesk |

## Permiso de uso en portafolio

**Sí** (confirmado por Gonzalo).

## Notas y ambigüedades

- `vibo\ui-mvp` tiene otra paleta, anterior a la actual: primary `#519EE0`, steel `#F5F7FA` / `#1E2633` y secondary lima `#91D210`. No se recomienda usarla.
- `vibo\ui` usa blue-4 `#071739` como primary; su fondo claro es `#CECFD1` (convertido de `oklch(85.511% 0.00304 264.766)`) y su primary en oscuro es `#B9CEE3`.
- La ficha de la escena (`03-escenas.md`) pide "oscuros / azules / dorado", lo que coincide con este sistema.
- No hay un PNG del logo completo en alta. Si hace falta, se puede rasterizar desde los SVG.

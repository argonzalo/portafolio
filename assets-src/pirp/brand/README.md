# Marca — Pirp (I-03)

Insumo **I-03 (Marcas y paletas)** para la escena Pirp ("Panel Inteligente de Reputación Política"). Lo recopiló T-H03 el 2026-10-22 a partir del repo local `PIRP` (solo lectura).

> **Decisión 2026-10-22: usar el bordó tal cual** (sin nombrar al cliente). No definir un acento propio para Pirp.

## Origen

| Qué | Ruta de origen (`C:\Users\arave\Documents\proyectos\`) |
| --- | --- |
| Isologo SVG | `PIRP\frontend\public\landing\img\favicon.svg` |
| Íconos PNG | `PIRP\frontend\app\icon.png`, `PIRP\frontend\app\apple-icon.png` |
| Wordmark (solo texto en código) | `PIRP\frontend\components\brand.tsx` |
| Paleta de la app | `PIRP\frontend\app\globals.css` |
| Paleta de la landing | `PIRP\frontend\public\landing\css\style.css` |
| Paleta del cliente (bordó) | un archivo CSS dentro de `PIRP\frontend\assets\`, sacado de un PDF del cliente. **No se copió.** |
| Tipografía | `PIRP\frontend\app\layout.tsx` (fuentes locales en `app\fonts\`) |

## Logos

| Archivo | Formato | Tamaño | Uso recomendado |
| --- | --- | --- | --- |
| `logo-icon.svg` | SVG | viewBox 64×64 | **Principal (vector)**: "P" bordó `#7A1F2B` con sombra `#5C141D` sobre `#17181A`, esquinas redondeadas (rx 15) |
| `icon-512.png` | PNG | 512×512 | "P" roja (~`#901120`) sobre fondo oscuro con textura de madera, esquinas transparentes. Es el ícono de la app |
| `apple-icon-180.png` | PNG | 180×180 | Mismo ícono, opaco (iOS) |

El wordmark no tiene archivo: es texto "PIRP" en Poppins Bold, en mayúsculas y con tracking ajustado, seguido de un punto en el color de marca. Lleva el tagline "Panel Inteligente de Reputación Política" en versalitas (`components\brand.tsx`).

## Paleta

### Paleta del cliente (bordó), reutilizada en landing, favicon y login

| Rol | Hex | Fuente |
| --- | --- | --- |
| Acento / marca (bordó) | `#7A1F2B` | paleta del cliente; landing `style.css` (`--burgundy`); `favicon.svg` |
| Texto / fondos oscuros (tinta) | `#17181A` | paleta del cliente; landing (`--ink`); `favicon.svg` |
| Fondo (papel hueso) | `#EFE9DD` | paleta del cliente |
| Bordó oscuro | `#5C141D` | paleta del cliente; landing (`--burgundy-dark`); `favicon.svg` |
| Bordó claro (acento sobre oscuro) | `#A8434F` | paleta del cliente; landing (`--burgundy-light`) |
| Tostado | `#B98F6A` | paleta del cliente |
| Gris texto | `#6E6A63` | paleta del cliente; landing (`--muted`) |
| Líneas | `#DCD3C1` | paleta del cliente |

Guía de uso de esa paleta: ~50 % bordó · 30 % papel · 20 % tinta · 6 % tostado, sin degradados. Nunca bordó sobre bordó ni tostado sobre bordó. Sobre bordó pleno, logo y texto van en papel hueso.

### Tokens de la app (`app\globals.css`)

| Rol | Claro | Oscuro | Original (si se convirtió) |
| --- | --- | --- | --- |
| Fondo | `#F5F5F5` | `#0F1010` | `oklch(97% 0.00011 271.152)` / `oklch(17.189% 0.00164 197.663)` |
| Texto | `#17181A` | `#EFE9DD` | `oklch(0.209 0.004 264.5)` / `oklch(0.935 0.017 84.6)` |
| Primary | `#6E221E` | `#ECDFDD` (texto `#6B1222`) | — |
| Brand (acento) | `#9B2C2C` (tint `#7A1F2B`) | `#A8434F` (tint `#4E1B20`) | — |
| Card (oscuro) | — | `#242425` | `oklch(26.072% 0.00187 286.04)` |
| Muted foreground | `#6E6A63` | — | `oklch(0.526 0.012 81.8)` |
| Border | `#E6E4E0` | — | `oklch(91.93% 0.0057 84.454)` |
| Terciario (solo hashtags; no es marca) | `#4953AB` | `#ABB9FE` | `oklch(0.48 0.14 275)` / `oklch(0.8 0.1 275)` |

Landing (`style.css`), neutros propios: líneas `#E6E6E3`, fondo suave `#F7F7F5` y fondo general `#FFFFFF`.

## Tipografía

| Uso | Fuente | Enlace |
| --- | --- | --- |
| Principal (app) | **Poppins** 300–700 (archivos locales en `app\fonts\`) | https://fonts.google.com/specimen/Poppins |
| Mono | Geist Mono | https://fonts.google.com/specimen/Geist+Mono |
| Landing estática | Inter 400–800 | https://fonts.google.com/specimen/Inter |
| Solo en la nube de palabras | Libre Baskerville, Caveat | https://fonts.google.com/specimen/Libre+Baskerville · https://fonts.google.com/specimen/Caveat |

## Permiso de uso en portafolio

**Sí** (confirmado por Gonzalo). Pirp es un proyecto activo: no nombrar clientes y usar dataset ficticio (I-08).

## Notas y ambigüedades

- **La paleta bordó es del cliente**, no una marca propia de Pirp. El nombre del cliente **no debe aparecer** en el portafolio: en código, textos, nombres de archivo ni metadatos. Referirse a ella solo como "paleta del cliente".
- **Pirp no tiene una paleta propia independiente.** La landing (`--burgundy`, `--ink`, `--muted`) y el `favicon.svg` usan exactamente los valores de la paleta del cliente. Los tokens de la app (`#6E221E`, `#9B2C2C`) son bordós cercanos pero no idénticos. El `icon.png` (rojo ~`#901120` con textura de madera) es lo más parecido a una marca propia, y también es rojo/bordó.
- `frontend\docs\styles.md` describe el `brand` del modo oscuro como violeta, pero el CSS actual usa bordó. Ese documento está desactualizado.
- En el portafolio, el hilo de Pirp usa hoy un color provisional, `#ff5b4f` (`tablero.md`, 2026-10-21). Hay que reemplazarlo cuando se tome la decisión pendiente de arriba.

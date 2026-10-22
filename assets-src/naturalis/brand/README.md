# Marca — Naturalis (I-03)

Insumo **I-03 (Marcas y paletas)** para la escena Naturalis. Lo recopiló T-H03 el 2026-10-22 a partir de los repos locales de Naturalis (solo lectura).
Marca principal: la escala verde azulado que comparten `natuadmin` (app de administración: clientes y turnos, Firebase) y `naturalis\naturalis` (web y app pública de reservas).

## Origen

| Qué | Ruta de origen (`C:\Users\arave\Documents\proyectos\naturalis\`) |
| --- | --- |
| Logos PNG / WebP (email) | `natuadmin\public\email\logo.png`, `logo.webp`, `logo-icon.png`, `logo-text.png`, `logo-circle.png` |
| Ícono con fondo | `natuadmin\public\logo\with-background\icon-256x256.png` |
| Ícono PWA | `naturalis\public\icon-512x512.png` |
| Logo inline (ícono + texto) | `naturalis\src\components\naturalis\LogoIcon.jsx`, `LogoText.jsx` (composición en `Logo.jsx`) |
| Paleta | `natuadmin\src\assets\colors.js`, `natuadmin\tailwind.config.js`, `natuadmin\src\app\globals.css`, `naturalis\src\assets\colors.js`, `naturalis\tailwind.config.js`, `naturalis\public\manifest.json` |
| Tipografía | `natuadmin\src\app\layout.js`, `naturalis\src\assets\fonts.js` |

## Logos

| Archivo | Formato | Tamaño | Uso recomendado |
| --- | --- | --- | --- |
| `logo-full.svg` | SVG | viewBox 431×≈342 | **Principal (vector)**: hojas + "naturalis" apilados en `#81AAA4`. Armado a partir de `LogoIcon` + `LogoText` imitando el `logo.png` de email |
| `icon.svg` | SVG | viewBox 431×246 | Isotipo (hojas), `#81AAA4` |
| `wordmark.svg` | SVG | viewBox 302×50 | Texto "naturalis", `#81AAA4` |
| `logo-full.png` / `logo-full.webp` | PNG / WebP | 500×303 | Logo completo apilado, `#81AAA4` sobre fondo transparente. Mejor raster |
| `logo-icon-200.png` | PNG | 200×115 | Hojas solas, fondo transparente |
| `logo-text-500.png` | PNG | 500×83 | Texto solo, fondo transparente |
| `logo-circle-180.png` | PNG | 180×180 | Hojas `#81AAA4` en círculo blanco (avatar o email) |
| `icon-256-fondo.png` | PNG | 256×256 | Hojas blancas sobre fondo `#81AAA4` (cuadrado) |
| `icon-512.png` | PNG | 512×512 | Ícono PWA: hojas `#81AAA4` sobre `#FAFDFC`, opaco |

Los SVG se extrajeron de los componentes JSX con relleno explícito `#81AAA4` (primary-400, el color del logo en los PNG) y son XML válido. El `Logo.jsx` original arma la versión `full` en horizontal (ícono a la izquierda y texto a la derecha). La versión apilada sigue al `logo.png` de email.

## Paleta

| Rol | Hex | Original (si se convirtió) | Fuente |
| --- | --- | --- | --- |
| **Acento / color del logo** (primary-400) | **`#81AAA4`** | — | `colors.js` (ambas apps); muestreado de `logo.png` |
| **Primary** (admin) | `#53857B` (texto encima `#FAFDFC`); oscuro `#A6C3BF` (texto `#1C3330`) | — | `natuadmin\src\app\globals.css` |
| Primary (web) | `#2B4F49` (texto encima `#CCE0DD`); en el tema claro de `colors.js`, `#56857D` | — | `naturalis\tailwind.config.js`, `naturalis\src\assets\colors.js` |
| Escala primary 50→950 | `#FAFDFC` `#E6F0EF` `#CCE0DD` `#A6C3BF` `#81AAA4` `#6D9790` `#56857D` `#42645E` `#2B4F49` `#1C3330` `#182725` | — | `colors.js`, `naturalis\tailwind.config.js` |
| **Fondo** | `#FAFDFC` (web: `#F8FAFC` = `rgb(248, 250, 252)`) | — | `naturalis\public\manifest.json`, `naturalis\src\assets\colors.js`, `naturalis\tailwind.config.js` |
| Superficie | `#FFFFFF` | — | `naturalis\tailwind.config.js` |
| **Texto** | `#191C1C` (on-background) | — | `naturalis\src\assets\colors.js` |
| Texto (admin, default shadcn) | `#0F172A` | `hsl(222.2 47.4% 11.2%)` | `natuadmin\src\app\globals.css` |
| Texto secundario (admin) | `#64748B` | `hsl(215.4 16.3% 46.9%)` | `natuadmin\src\app\globals.css` |
| Secondary | `#4A6363` (container `#CCE8E8`) | — | `naturalis\src\assets\colors.js` |
| Terciario (marrón) | `#634B25` (texto encima `#FAF9F8`) | — | `naturalis\tailwind.config.js` |
| Muted | `#DAE3E2` | — | `naturalis\tailwind.config.js` |
| Outline / surface-variant | `#899393` / `#DAE4E4` | — | `naturalis\src\assets\colors.js` |

## Tipografía

| Uso | Fuente | Enlace |
| --- | --- | --- |
| Principal (ambas apps) | **Poppins** 100–900 (+ itálica en la web) | https://fonts.google.com/specimen/Poppins |

El wordmark del logo es un trazado vectorial; no corresponde a una fuente instalada en el repo.

## Permiso de uso en portafolio

**Sí** (confirmado por Gonzalo).

## Notas y ambigüedades

- La ficha de la escena (`03-escenas.md`) pide un ambiente de centro de estética "sin copiar su marca" (minimalismo y naturaleza). Esta paleta puede servir de guía para el tema claro de Naturalis (T-A15) sin reproducir el logo en escena.
- Hay tres "primary" distintos según la app: `#53857B` (admin), `#2B4F49` (web, Tailwind) y `#56857D` (web, `colors.js`). Para marca se recomienda el del logo, `#81AAA4`, y la escala completa para las variaciones.
- `natuadmin\src\assets\img\blog-logo.svg` no es de Naturalis: es el isotipo de Banner Director con la palabra "Blog".
- En `naturalis-firebase-functions\functions\assets\email-templates\img\` hay copias más chicas de los logos (por ejemplo `logo.png` de 80×80). No se copiaron.

# T-A12 — Hero y manifiesto

Implementación de `05-contenido.md` §2. Hero HTML servido visible, sin hidratación ni animación de entrada que retrase el titular. Tags de valor, acceso al método y a la lista. Manifiesto con SplitText por palabras al entrar; restaura DOM y cancela tweens/observer con movimiento reducido y antes de `astro:before-swap`.

El punto de entrada usa el azul `#91baff` del hilo existente de T-A13. Se mantienen `data-chapter=hero/manifesto` y los formularios existentes `line/branching`; no cambia el contrato ni el runtime 3D. El detalle HTML permanece visible en static. Sin dependencias ni assets nuevos.

## Evidencia visual

- [Hero desktop](desktop-hero.png) — `/?chapter=hero&progress=0.5&quality=high`
- [Manifiesto desktop](desktop-manifesto.png) — `/?chapter=manifesto&progress=0.5&quality=high`
- [Hero mobile](mobile-hero.png) — mismo deep link, 390×844.
- [Manifiesto mobile](mobile-manifesto.png) — mismo deep link, 390×844.

Capturas inspeccionadas en Edge headless (Chromium), desktop 1440×900 / mobile 390×844. Las capturas omiten el panel para mostrar el contenido; métricas crudas del panel en `verification.json`.

## Verificación

- `npm run check`: bloqueado por la copia local gitignored `ui-mvp-public/`: ESLint intenta resolver `eslint-config-next`. El typecheck sin exclusión reporta 83 errores en esa copia externa. No se modificó esa carpeta ni la configuración del proyecto.
- `node node_modules/eslint/bin/eslint.js --config eslint.config.js src`: pasa.
- `astro check` con tsconfig temporal que extiende el original y excluye `ui-mvp-public`: 131 archivos, 0 errores/warnings/hints.
- `npm run build`: pasa; warnings de directivas MDX y chunk >500 KB fuera de los componentes de T-A12.
- `npm run assets:check`: pasa.
- Smoke existente: 2/2 pasan con canal `msedge` mediante configuración temporal. Chromium empaquetado no está instalado localmente.
- Comprobación en navegador: high/medium/low/static, sin overflow horizontal; sin errores JavaScript; HTML visible sin JS; navegación cliente home → lista → atrás; SplitText activo al entrar y revertido al activar movimiento reducido. Ambos enlaces de recorrido son anclas HTML utilizables con teclado/táctil.

## Métricas locales

Muestra de 90 frames después de cargar cada capítulo, calidad high forzada. Mobile con CPU ×4 y DPR 1. Es una muestra de rAF local, no una certificación de dispositivos reales ni de rendimiento sostenido durante todas las transiciones.

- Desktop hero/manifiesto: 60 FPS; hilo existente: 1 draw call, 0 triángulos (Points), 1 geometría, 0 texturas.
- Mobile hero/manifiesto: 60–61 FPS; hilo existente: 2 draw calls, 720 triángulos, 2 geometrías, 0 texturas.
- Hero/manifiesto agregan 0 draw calls, 0 triángulos y 0 KB de modelos/texturas en todos los niveles. Static conserva todo el contenido en HTML; no necesita póster.

Pendiente: revisión humana del ritmo y dispositivos reales en T-H06; CI/preview del PR. El tablero queda en revisión, no hecho.

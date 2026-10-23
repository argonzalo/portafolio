# T-A23 — Pirp

Escena editorial oscura, Poppins, crema y bordó. El scroll convierte noticias ficticias en cuatro temas, una alerta y una estrategia. Todo el movimiento depende del progreso absoluto y es reversible.

- Atlas Poppins 1024×1024 en un `InstancedMesh`: 96/60/36 tarjetas high/medium/low; 36 en mobile. Cada instancia tiene una profundidad única para evitar z-fighting al agruparse.
- Dataset aprobado en T-H10, marcado como demo ficticia. Seis noticias se pueden clasificar en DOM por tap o teclado.
- Teléfono del kit con captura propia optimizada. `screenAspect` ajusta la geometría a la imagen, sin estirar marcos ni recortar UI. Sin paginación ni galería en la escena por decisión humana; las capturas completas están en el detalle del proyecto.
- Mobile: teléfono de fondo con escala moderada (3.7–3.85), inclinación en tres ejes y pequeño desplazamiento por scroll. Tarjetas anchas superpuestas: termómetro oscuro con transparencia y blur; estrategia en vidrio claro.
- La tarjeta del termómetro mobile permanece oculta hasta 0.695; aparece entre 0.695–0.735 y desaparece entre 0.76–0.795. El teléfono queda despejado antes de la tarjeta. Tendencia y alerta acompañan esa ventana.
- El hilo cede el foco al agrupamiento (0.38–0.62); en mobile también se oculta con el teléfono (0.58–0.96). El reloj continúa y se conserva el extremo que enlaza con Naturalis.
- DOM fuera del canvas `aria-hidden` mediante `KitHtml` + portal. Sin cambios a contratos ni dependencias nuevas.
- Texturas por caché de referencias del kit y recursos propios con `useDisposable`. Se corrigió la liberación PMREM compartida: se destruye el render target completo.

## Reproducir

Con dependencias instaladas y Chrome disponible, desde la raíz:

```sh
node src/scenes/pirp/build-atlas.mjs
npm run dev
node src/scenes/pirp/verify.mjs
node src/scenes/pirp/verify-revision.mjs
node src/scenes/pirp/verify-resources.mjs
npm run check
```

Contra el build servido con `node scripts/serve-preview.mjs --port 4173`: `node src/scenes/pirp/verify-production.mjs` y `node src/scenes/pirp/capture-posters.mjs`.

Descargas de escena: atlas 65.012 bytes + captura 38.782 bytes = **101,36 KiB** en todos los niveles. Resolución máxima 1024. Fuentes propias ya registradas en `docs/plan/licencias.md`; sin assets de terceros nuevos. Desvío explícito para revisión: WebP en lugar de KTX2.

Evidencia y límites de emulación: `docs/plan/evidencias/T-A23/README.md`. La aprobación de arte final y el dispositivo real siguen a cargo del humano.

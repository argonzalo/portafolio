# T-A24 — Naturalis

Una pausa cálida entre Pirp y Banner: sala arquitectónica propia con camilla,
ficus, lino, cerámica y roble. La luz se hornea en Blender con key de ventana,
fill frontal y rim de rebote. El runtime mezcla los atlas de día y noche, sin
luces ni sombras dinámicas para la sala. La cortina se oculta en mobile por
pedido humano; en desktop tiene una deformación suave de vértices.

Los cinco beats siguen el progreso absoluto del capítulo: tallo y planta →
agenda de papel desordenada → teléfono y Natuadmin con hojas que los conectan →
automatizaciones nocturnas → amanecer y cifras +900 / +70 confirmadas por el
humano. El encuadre, las apariciones y la salida a Banner son reversibles.
Se conserva la cámara y el fundido del director de T-A41. El follaje del ficus
permanece completo durante todo el recorrido; solo las hojas que conectan los
dispositivos son elementos narrativos separados de la planta.

## Insumos y decisiones humanas

- Camilla propia: `assets-src/naturalis/camilla.blend`, sin alterar la fuente.
- Sala generada: `assets-src/naturalis/sala.blend` y `sala.glb`; originales locales
  sin versionar según ADR-010. La receta reproducible sí se versiona.
- Capturas pedidas: `public/images/proyects/naturalis/app-web/2.webp` y
  `public/images/proyects/naturalis/natuadmin/2.webp`. Se generan copias WebP para
  pantallas y visor; la segunda oculta identidades, contactos y notas privadas
  según la restricción de contenido del proyecto. Los originales se conservan.
- `Phone` y `Laptop` del kit con pantalla real y una capa de UI que se despega.
  No hay botonera ni visor DOM por corrección humana; las capturas ampliadas
  siguen disponibles en la página de caso. El carousel compartido pertenece a T-A42.
- Audio existente: se reutiliza `mountAudio`, solo tras activar el control global.
- Techo de 32k triángulos: el humano pidió mantener el detalle y ocultar la
  cortina mobile. Se mantienen 1500 / 600 KB para gráficos desktop/mobile.

## Regenerar

Desde la raíz, ejecutar Blender en background con `--python
src/scenes/naturalis/bake-room.py`, después:

```sh
node src/scenes/naturalis/build-assets.mjs
```

El horneado emplea una única malla y un unwrap compartido para evitar solapes.
Los UV de la camilla se preservan durante el bake; la cortina se separa después
para poder ocultarla o animarla. Se producen LOD de geometría con meshopt y
atlas de 1024 px compartiendo la misma resolución e iluminación en todos los
niveles. El runtime conserva el LOD anterior hasta que el nuevo está listo, y
versiona las URL para impedir mezclar horneados anteriores del preview. WebP es el fallback admitido por el pipeline local
en ausencia de `toktx`; KTX2 no se declara verificado.

Para regenerar solo las pantallas: `node src/scenes/naturalis/build-assets.mjs
--screens-only`.

## Verificar

```sh
npm run check
node src/scenes/naturalis/serve-preview.mjs
node src/scenes/naturalis/verify.mjs
```

El servidor usa el puerto 3012, una caché Vite aislada y la barra de desarrollo
desactivada (su entrypoint devolvía 504; no era un recurso de la escena). El verificador registra
los cinco beats en desktop 1440×900 y mobile 390×844 con CPU ×4, los tres niveles,
ausencia de botonera, audio opt-in, scroll inverso, salida a Banner, recursos al
salir y reduced motion. Compara el color de la pared entre LOD y en 31 muestras
consecutivas del ciclo día/noche. Genera pósters desde el canvas, sin duplicar el DOM.

Para comprobar el build de Vercel sin servidor de desarrollo:

```sh
node scripts/serve-preview.mjs --port 4175
node src/scenes/naturalis/verify-production.mjs
```

Evidencia y resultados: `docs/plan/evidencias/T-A24/`. Las cifras emuladas no
equivalen a una prueba en iPhone/Android real; la aprobación de arte sigue
correspondiendo al humano. Arrastrar la cortina queda como el nice-to-have de la ficha.

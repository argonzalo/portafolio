# T-A23 — Pirp

Dirección: sala editorial oscura, Poppins, papel crema y bordó de marca. El gesto principal es el torrente que converge en cuatro grupos; el resto acompaña esa lectura. Cámaras propias desktop/vertical y coreografía determinada por progreso absoluto, reversible. No hay simulación física ni distribución de grafos en tiempo de ejecución.

## Implementación

- `dataset.json`: copia publicable del insumo aprobado en T-H10. Titulares, medios, cifras y estrategia son ficticios; se indica en pantalla durante los cinco beats.
- `Scene.tsx`: atlas editorial en un único `InstancedMesh` (96/60/36 tarjetas high/medium/low, 36 en mobile), grupos de temas con layout curado, iluminación key/fill/rim, teléfono del kit con captura propia optimizada.
- `Overlay.tsx`: DOM accesible, seis noticias seleccionables, detalle de tema/sentimiento, termómetro con tendencia y alerta, estrategia escrita por scroll. La capa vive en `document.body` mediante el puente del kit para mantener controles accesibles fuera del canvas `aria-hidden` y del contenedor con z-index negativo. No modifica el contrato ni Stage.
- Galería de las dos capturas existentes con anterior/siguiente, Escape, contención y devolución de foco. Este acceso es local a Pirp; T-A42 conserva la pieza compartida para el recorrido completo.
- La curva saliente ya convergía al tallo inicial de Naturalis. Se conserva ese extremo exacto y el handoff central a partir de 0.86.
- Las texturas se cargan con la caché por referencias del kit y se liberan a los dos segundos del desmontaje. Geometría y material propios usan `useDisposable`.

## Reproducir

Desde la raíz, con dependencias instaladas y Chrome disponible:

```sh
node src/scenes/pirp/build-atlas.mjs
npm run dev
node src/scenes/pirp/verify.mjs
npm run check
```

El generador usa Poppins local de `@fontsource/poppins`, crea el atlas de 1024×1024 y reduce la captura a 1024 px de alto. Salidas: `public/textures/pirp/`. No descarga fuentes ni invoca servicios externos. La verificación automatiza cinco beats, tres niveles, dos viewports (mobile CPU ×4), clasificación, galería, salida/entrada y movimiento reducido; escribe evidencia en `docs/plan/evidencias/T-A23/`.

Recursos: atlas 65.012 bytes + captura 38.782 bytes = **101,36 KiB** por nivel. Las capturas completas de la galería se cargan solo al abrirla. Son derivados de material ya registrado en `docs/plan/licencias.md`; no se incorporan assets de terceros nuevos.

Desvío para revisión: atlas y captura son WebP, no KTX2. Total de texturas de escena: ~5,8 MiB en GPU con mipmaps; resolución máxima 1024. La aprobación de arte y la prueba en dispositivos reales siguen a cargo del humano.

Corrección compartida autorizada por el humano: liberar el render target completo del entorno PMREM del kit. Tres ciclos vuelven a 2 geometrías y 1 textura (hilo persistente). Ver docs/plan/evidencias/T-A23/resources.json.

Smoke del build: iniciar 
ode scripts/serve-preview.mjs --port 4173 y ejecutar 
ode src/scenes/pirp/verify-production.mjs. Pósters sin navegación global: 
ode src/scenes/pirp/capture-posters.mjs.

Revisión humana: grupos sin anillos ni aristas y el hilo oculto durante su lectura; teléfono desktop +13 %, paginación de capturas y ampliación bajo el modelo; estrategia como lista numerada con títulos y separadores. El kit `Phone` acepta `screenAspect`: se ajustan la altura física y los anclajes sin estirar esquinas ni recortar la captura. Los tamaños de imagen se generan en `capture-dimensions.json`. La segunda captura agrega 28,48 KiB bajo demanda (129,85 KiB incluyendo atlas + ambas capturas).

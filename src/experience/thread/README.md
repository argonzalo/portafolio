# Hilo conductor v1 — T-A13

`Stage` monta `Thread` dentro del único Canvas. El hilo toma `SceneDefinition.thread`
del registro por `chapterId`; no requiere imports ni efectos desde la escena.
Los capítulos todavía sin definición usan presets provisionales en `forms.ts`.
No se modificaron los contratos congelados.

## API de escena

```ts
thread: {
  shape: "custom",
  color: "#7A1F2B",
  anchors: (progress) => [
    [-1, 0, 0],
    [0, progress, 0],
    [1, 0, 0],
  ],
}
```

`anchors(progress)` recibe el progreso local 0..1 y devuelve puntos ordenados
que el hilo recorre como una polilínea. Coordenadas en unidades del mundo del
Canvas; en portrait se aplica el desplazamiento vertical común del hilo.
32 muestras uniformes alimentan ambos shaders. La función debe ser barata y
sin efectos secundarios. Arrays vacíos o sin puntos finitos usan el preset.
Un solo punto concentra el hilo en esa posición. `custom` sin anchors usa una línea.
Los presets `branching` y `split` son trazos continuos estilizados; para grafos
con múltiples ramas simultáneas se debe usar el futuro kit T-A18.

El guía puede importar `threadTip` de `runtime.ts`: `position` es un Vector3
mutable en coordenadas de mundo, compartido por A/C, y `visible` indica si
hay hilo. Leer dentro de `useFrame` y proyectar con la cámara para anclar DOM.
No mutar esa posición desde un consumidor. No hay estado React por frame.

## Selección y movimiento

- C: landscape de más de 768 px, `high` o `medium`.
- A: ancho ≤768 px, portrait/cuadrado, `low`, movimiento reducido o `medium`
  adaptado por el monitor. `static`: sin Canvas, conforme a Stage.
- Curva, color y punta convergen al nuevo capítulo sin reiniciar el runtime.
  El scroll controla la fase, también al retroceder; no hay reloj autónomo.
- Resize y calidad conservan el store y el Canvas. El renderer saliente libera
  geometría y materiales. Las formas compartidas son arrays CPU, no texturas.
- El laboratorio original mantiene sus shaders y su reloj de comparación;
  los uniforms de ruta se activan solo al recibir un `ThreadFrame`.

## Verificación

Con el servidor dev del worktree en el puerto 3013:

```sh
npm run check
# Si la barra dev de Astro devuelve 504 en este entorno:
node node_modules/astro/bin/astro.mjs preferences disable devToolbar
node src/experience/thread/verify.mjs
```

Chrome local mediante Playwright. Verifica los renderizadores y su liberación,
cinco ciclos home/caso con el mismo Canvas, cinco ciclos desktop/mobile,
`low`, `static`, reduced motion y anchors personalizados; falla ante errores
JavaScript o de consola. La ruta del puerto está fijada en el script.

Las capturas y métricas de revisión están en `evidence/`. Deep links:
`/?chapter=<vibo|pirp|naturalis|banner-2>&progress=0.45&quality=<high|medium|low>&debug`.
Las escenas greybox, los pósters `static` y la paleta clara de Naturalis son
T-A14/T-A16/T-A15. No se afirma validación en teléfonos reales.

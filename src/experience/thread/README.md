# Hilo conductor v1 y transiciones — T-A13 / T-A41

`Stage` monta `Thread` dentro del único Canvas. El hilo toma `SceneDefinition.thread`
del registro por `chapterId`; no requiere imports ni efectos desde la escena.
Los capítulos todavía sin definición usan presets provisionales en `forms.ts`.
No se modificaron los contratos congelados.

## API de escena y encuadres de borde

```ts
export const viboBorderFrames: SceneBorderFrames = {
  entry: { desktop: [4.5, 4.2, 9.5], mobile: [5.5, 7.0, 14.0], target: [0, 0.15, 0] },
  exit: { desktop: [2.2, 1.8, 9.6], mobile: [2.4, 3.2, 12.6], target: [0, 0.1, 0] },
  entrySpan: 0.08,
  exitStart: 0.9,
}

thread: {
  shape: "trajectory",
  color: "#f5c451",
  anchors: (progress) => [
    [-4, 0.05, 2],
    [0, 2, -1],
    [3, 0.15, -3],
  ],
}
```

`anchors(progress)` recibe el progreso local 0..1 y devuelve puntos ordenados
que el hilo recorre. Con 3 o más puntos, `sampleForm` aplica interpolación C¹
Catmull-Rom (conservando extremos exactos) sobre 32 muestras uniformes que
alimentan ambos shaders.

### Handoff entre capítulos (`T-A41` / `03-escenas.md` §6)

En el tramo final de cada capítulo (`progress ≥ 0.82`, sincronizado con `BLEND_START`
de `palette.ts`):

1. **Forma y color del hilo:** `updateThread` interpola los 32 puntos del capítulo
   actual (`progress`) hacia el estado inicial (`0`) del capítulo siguiente, junto
   con el color de línea, color de cabeza y contraste de esquema (`lightMix` para
   el tema claro de Naturalis mediante mezcla premultiplicada `OneFactor` / `OneMinusSrcAlphaFactor`).
2. **Velocidad y fase continua:** cada capítulo define su perfil en `CHAPTER_THREAD_PROFILES`
   (`mix` y `speed`). La fase avanza en el círculo `[0..1)` desde `0.86` hasta `1.08`
   (`0.08 mod 1`), coincidiendo sin rebobinado con la fase de entrada (`0.08`) del
   capítulo siguiente. `flow` y `time` son acumulativos por capítulo.
3. **Continuidad de cámara y crossfade (`SceneDirector.tsx`):**
   - Precarga de los módulos de escena vecinos para cambio instantáneo sin espera asíncrona.
   - Los pares `vibo.exit == pirp.entry`, `pirp.exit == naturalis.entry` y
     `naturalis.exit == banner.entry` comparten el mismo encuadre de borde en `[0.90..1.0]`
     y `[0.0..0.08]`, más puente cuaterniónico (`slerp` + `lerp`) ante saltos de índice.
   - Crossfade de opacidad de materiales y deriva vertical/profundidad alineada con
     la dirección del scroll, ocultando etiquetas DOM salientes y manteniendo
     `scene.background` sincronizado con `getLivePalette().background`.

El guía puede importar `threadTip` de `runtime.ts`: `position` es un Vector3
mutable en coordenadas de mundo, compartido por A/C, y `visible` indica si
hay hilo. Leer dentro de `useFrame` y proyectar con la cámara para anclar DOM.

## Selección y movimiento

- C: landscape de más de 768 px, `high` o `medium`.
- A: ancho ≤768 px, portrait/cuadrado, `low`, movimiento reducido o `medium`
  adaptado por el monitor. `static`: sin Canvas, conforme a Stage.
- Curva, color y punta convergen al nuevo capítulo sin reiniciar el runtime.
  El scroll controla la fase, también al retroceder; no hay reloj autónomo.
- Resize y calidad conservan el store y el Canvas. El renderer saliente libera
  geometría y materiales.

## Verificación

```sh
npm run check
node src/experience/thread/verify.mjs
```

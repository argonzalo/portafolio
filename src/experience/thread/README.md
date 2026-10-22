# Hilo conductor y continuidad — T-A13 / T-A41

`Stage` mantiene un Canvas. `Thread` lee `SceneDefinition.thread` sin modificar
los contratos públicos de escena. C es el enjambre desktop; A es el filamento
mobile/low. `static` conserva los pósters existentes.

## Un solo progreso

`scroll.ts` amortigua la posición absoluta del documento (constante de tiempo
120 ms), calcula todos los progresos y recién después publica el capítulo.
El scroll nativo sigue disponible. Los deep links posicionan el cursor mediante
`experience:seek`; no reproducen todos los capítulos intermedios.

`choreography.ts` define `HANDOFF_START = 0.86` y una rampa quíntica con velocidad
y aceleración nulas en los extremos. Cámara, paleta, hilo y fundidos usan ese
mismo intervalo. No hay una transición autónoma de 550 ms ni un segundo filtro
que retrase el hilo respecto de la cámara.

## Cámara y mundos

`SceneDirector` mantiene el capítulo actual y el siguiente, con claves estables.
La escena entrante ya está montada en progreso cero antes de la frontera; al
cruzarla conserva geometrías, materiales, transformaciones y cámara. Los módulos
anterior/siguiente se precargan también para la navegación inversa.

Los rigs publican ojo y objetivo en `PresentationContext`. Solo el director
escribe la cámara del recorrido, interpolando ambos encuadres durante el handoff.
No se aplican los antiguos `BorderFrames`, deriva vertical ni cambios de escala
al grupo raíz. El último mundo vuelve al encuadre neutro antes del siguiente
capítulo DOM. Las escenas en `/lab` conservan su rig local.

Orden de frame: envolvente de capítulo (-4), rigs (-3), cámara/paleta (-2),
animación e hilo (-1), composición de materiales y proyección HTML (0).

## Revelados y HTML

`presentation.ts` compone las envolventes de los objetos con la opacidad del
capítulo, conservando opacidad, transparencia y profundidad originales de cada
material. Los shaders propios participan mediante `uOpacity`. Las etiquetas HTML
usan la misma envolvente; no flotan sobre una escena que ya desapareció.

Los títulos permanecen anclados al viewport, sin placas de degradado. Los fondos
de sección no cubren el canvas con rectángulos translúcidos. Los tokens del body
heredan la paleta viva en lugar de taparla con los valores estáticos de `.dark`.

## Hilo

`anchors(progress)` devuelve coordenadas de mundo; `sampleForm` interpola 32
muestras Catmull-Rom. En el handoff se mezclan forma, color, energía y contraste
con la entrada del siguiente capítulo. Fase, flujo y tiempo son continuos en la
frontera. `threadTip` sigue disponible como referencia mutable para el guía.

## Verificación

```sh
npm run check
# Con el servidor dev de este checkout; A41_BASE_URL permite otra dirección.
node src/experience/thread/verify.mjs
```

La verificación actual recorre la página real en ambas direcciones y observa la
cámara y el path efectivamente conectado al shader; no deduce continuidad de
constantes de cámara que el render pudiera no usar. Capturas y límites en
`docs/plan/evidencias/T-A41/revision/`.

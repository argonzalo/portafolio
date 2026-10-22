# T-A41 — Corrección de continuidad

Resultado visual aprobado explícitamente por el humano el 22/10/2026. No se hicieron ajustes adicionales después de esa aprobación.

## Implementación

- Un único cursor de scroll suavizado dirige escenas, hilo, cámara y paleta; funciona también al retroceder.
- Una sola cámara interpola las poses reales. La escena entrante mantiene identidad al cruzar el límite; se eliminaron desplazamientos y escalados artificiales del contenedor.
- Las apariciones locales componen su opacidad con la transición global. El panel principal de Banner persiste entre pantalla, editor y publicación.
- Fondos CSS transparentes sobre el color del canvas, actualizado en el mismo frame. Títulos fijos sin placas rectangulares ni degradados que corten la imagen.
- Encuadres móviles específicos y trayectorias sin reinicios por módulo. Naturalis deja de escalar el ambiente completo.
- Se extrajo el script del manifiesto a TypeScript externo porque el servidor de desarrollo fallaba al analizarlo. La verificación usa la aplicación real, sin interceptar ni reemplazar respuestas.

## Verificación reproducible

```sh
npm run check
node src/experience/thread/verify.mjs
```

El segundo comando espera el servidor de desarrollo en `http://localhost:4321`; puede cambiarse con `A41_BASE_URL`. Ejecutar después del build, no simultáneamente, para evitar recargas del servidor durante la medición.

Deep links: `/?chapter=vibo&progress=0.84&quality=high`, `/?chapter=pirp&progress=0.91&quality=high`, `/?chapter=naturalis&progress=0.95&quality=high`. Revisar también el scroll inverso. Cada archivo de captura incluye capítulo y progreso en el nombre.

## Evidencia

- [20 beats desktop](desktop-beats.webp), [20 beats mobile](mobile-beats.webp).
- Además, cuatro capturas intermedias por cada una de las tres uniones y viewport: archivos `*-handoff-*.webp`.
- [Métricas completas](metricas.json) y [verificador](verify.mjs).
- `npm run check`: lint, tipos, build y presupuestos de assets aprobados. No hay nuevos assets GLB ni dependencias.
- Las seis comprobaciones de unión (tres por viewport), avance y retroceso, pasan. Delta de posición de cámara menor que 0,000003 unidades y del punto del hilo menor que 0,0014 entre muestras a ambos lados del límite.
- Máximo dos escenas montadas. Tres ciclos de entrada/salida por viewport regresan a la misma cantidad de geometrías y texturas. El mismo canvas persiste al navegar a un caso y volver.
- High/medium/low ejercitados; reduced motion retira el canvas y utiliza el fallback existente.

| Métrica observada | Desktop 1440×900 | Mobile 390×844, CPU ×4 |
| --- | --- | --- |
| FPS en las tres transiciones de 3 s | 59–60 | 29,5–33,2 |
| Tiempo de frame p95 | 16,8 ms | 66,6–66,7 ms |
| Draw calls máximos muestreados | 53 | 44 |
| Triángulos máximos muestreados | 20.350 | 20.912 |
| Assets 3D externos nuevos | 0 KB | 0 KB |

## Límites y pendientes fuera del cierre visual

La medición móvil emulada no alcanza el objetivo de 50 FPS/20 ms del plan; queda registrada para rendimiento (T-A36) y no equivale a una prueba en teléfono real. No se ejecutó Lighthouse ni la matriz de navegadores/dispositivos reales.

Sin errores de consola. Persisten el aviso de deprecación `THREE.Clock` y un aviso de deep link sin capítulo durante navegación Astro; figuran en el JSON. No se afirma consola sin warnings.

Se corrigió la continuidad de los modelos actuales. El arte definitivo y la sustitución de los greyboxes siguen correspondiendo a T-A20/23/24/25; esta entrega no acredita esas tareas ni la compuerta G1 completa.

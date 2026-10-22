# Plan maestro — Rediseño del portafolio

> Fuente de verdad del **producto**: [`docs/descripcion-de-producto.md`](../descripcion-de-producto.md).
> Fuente de verdad de la **ejecución**: esta carpeta. `docs/core.md` está obsoleto y no debe seguirse.

## 1. Qué vamos a construir (en una frase)

Un recorrido continuo, cinematográfico y de alto rendimiento donde **una sola mente** (un hilo visual que atraviesa todo el sitio) presenta cómo se piensan y resuelven problemas reales, proyecto por proyecto, cada uno con su propio mundo 3D/2D, acompañado por un **agente de IA que observa la sesión y ayuda solo cuando hace falta**.

## 2. Mapa de documentos

| Archivo | Para qué sirve | Quién lo lee |
| --- | --- | --- |
| [`00-vision-y-concepto.md`](./00-vision-y-concepto.md) | Interpretación del producto, recorrido narrativo, hilo conductor, criterios de éxito | Todos, primero |
| [`01-arquitectura.md`](./01-arquitectura.md) | Stack, estructura de carpetas, runtime de escenas, contratos TypeScript | Agentes de código |
| [`02-rendimiento-y-mobile.md`](./02-rendimiento-y-mobile.md) | Presupuestos, niveles de calidad, pipeline de assets, medición | Agentes + humano (QA) |
| [`03-escenas.md`](./03-escenas.md) | Ficha de cada escena (análisis previo obligatorio), kit reutilizable | Agentes de escena + humano (dirección de arte) |
| [`04-agente-ia.md`](./04-agente-ia.md) | Diseño del guía atento: señales, reglas, backend, límites, seguridad, costos | Agentes de IA/back |
| [`05-contenido.md`](./05-contenido.md) | Modelo de contenido, presentación personal, insumos que debe aportar el humano | Humano + agentes |
| [`06-coordinacion.md`](./06-coordinacion.md) | Roles, flujo de trabajo en paralelo, reglas anti-conflicto, definición de terminado | Todos, antes de tomar una tarea |
| [`07-riesgos-y-desafios.md`](./07-riesgos-y-desafios.md) | Todos los desafíos a resolver y riesgos con su mitigación | Todos |
| [`tablero.md`](./tablero.md) | **Backlog vivo**: tareas, dueño, dependencias, estado, zona de archivos | Todos, a diario |
| [`decisiones.md`](./decisiones.md) | Registro de decisiones (ADR): propuestas, abiertas y cerradas | Todos |
| [`plantillas/`](./plantillas/) | Brief de tarea, ficha de escena, prompt para lanzar agentes | Quien crea o toma tareas |

## 3. Principios que gobiernan todas las decisiones

1. **Rendimiento antes que espectáculo.** Si una idea no entra en el presupuesto (ver `02`), se rediseña, no se acepta "porque se ve bien".
2. **Problema → enfoque → decisión → resultado.** El stack es secundario en todo el contenido.
3. **Una sola mente.** Cada escena tiene su mundo, pero todas comparten el hilo conductor, los tokens de movimiento y el mismo runtime.
4. **Contratos primero, arte después.** La plataforma (runtime, contratos, presupuestos) se congela antes de producir escenas para que todo pueda avanzar en paralelo.
5. **Greybox antes que detalle.** Cada escena se valida en bruto (ritmo, cámara, mobile, rendimiento) antes de invertir en modelado.
6. **Reutilizar para escalar.** Las escenas de segunda línea se arman con el kit (dispositivos 3D, HUD, grafos de nodos), no desde cero.
7. **Texto en HTML, 3D como escenario.** Todo el contenido legible vive en el DOM (SEO, accesibilidad, nitidez); el 3D nunca es la única vía para acceder a la información.
8. **Siempre hay salida.** Sin WebGL, con movimiento reducido o en equipos débiles el sitio sigue siendo excelente (nivel `static`).

## 4. Fases y compuertas (gates)

Cada fase termina en una **compuerta** verificable. No se pasa a la siguiente fase sin cumplirla; dentro de cada fase, las tareas corren en paralelo.

```text
F0 Fundaciones ──► G0 ──► F1 Esqueleto ──► G1 ──► F2 Escena insignia ──► G2 ──► F3 Primera línea ──► G3 ──► F4 Segunda/tercera línea ──► G4 ──► F5 Pulido y lanzamiento
                                                         └──── en paralelo desde F2: agente de IA (backend → observador → interfaz) ────┘
```

| Fase | Duración orientativa | Resultado | Compuerta |
| --- | --- | --- | --- |
| **F0 Fundaciones** | 1 semana | Decisiones cerradas, contratos, runtime 3D probado, CI con presupuestos, contenido migrado | **G0**: spike del runtime con 2 escenas de prueba a 60 fps en desktop y ≥ 50 fps en un Android medio, sin fugas de memoria al navegar; contratos aprobados |
| **F1 Esqueleto** | 1–1,5 semanas | Recorrido completo de la home con escenas en greybox, hilo conductor prototipo, hero nuevo, fallbacks, deploy de preview | **G1**: el recorrido entero en preview cumple los presupuestos de `02` en mobile y desktop; el humano aprueba ritmo y orden |
| **F2 Escena insignia** | 1,5–2 semanas | Vibo terminada (define la vara de calidad), kits de escena, backend del guía IA | **G2**: Vibo aprobada por el humano y dentro de presupuesto; endpoint del guía con límites funcionando |
| **F3 Primera línea** | 2–3 semanas | Pirp, Naturalis y Banner 2.0 en paralelo; interfaz y observador del guía | **G3**: las cuatro escenas de primera línea aprobadas; guía funcionando de punta a punta |
| **F4 Segunda y tercera línea** | 1,5–2 semanas | Viñetas con el kit, archivo de tercera línea, páginas de proyecto, sobre mí, contacto, cierre cíclico | **G4**: sitio completo en contenido; todos los proyectos accesibles también en la vista lista |
| **F5 Pulido y lanzamiento** | 1 semana | Endurecimiento de rendimiento, accesibilidad, SEO, analítica, QA en dispositivos reales | **G5**: checklist de lanzamiento completo (ver `06`) |

Total orientativo: **8 a 11 semanas**, dependiendo sobre todo de la disponibilidad del humano para aportar insumos (assets y narrativas), que es el cuello de botella real.

## 5. Ruta crítica

Lo que retrasa todo si se demora; se prioriza por encima de cualquier otra tarea:

1. **Cerrar decisiones de F0** (`decisiones.md`: ADR-001 a ADR-005) → desbloquea a todos los agentes.
2. **Spike del runtime 3D persistente** (T-A06) → sin esto no se puede producir ninguna escena con seguridad.
3. **Decisión del hilo conductor** (ADR-006: C desktop / A mobile, cerrada 2026-10-22) → T-A13 integra el híbrido; afecta a la transición de todas las escenas.
4. **Insumos de Vibo** (overlays + métricas reales, T-H07 / ADR-011) → la escena insignia depende de ellos.
5. **Aprobación de Vibo** (G2) → fija la vara de calidad que replican las demás escenas.

Lo que **no** está en la ruta crítica y por eso se usa para llenar huecos: contenido de segunda y tercera línea, kit de dispositivos, analítica, OG images.

## 6. Cómo arrancar hoy

**Humano (hoy y mañana):**

1. Lanzar en paralelo a los agentes de F0 que no dependen de ninguna decisión: `T-A02` (CI y presupuestos), `T-A09` (pipeline de assets) y `T-A10` (borradores de narrativa), con el prompt de [`plantillas/prompt-agente.md`](./plantillas/prompt-agente.md). Trabajan solos mientras hacés lo siguiente.
2. `T-H01`: leer `00` y `decisiones.md` y aceptar o corregir las decisiones propuestas (30–45 min). Al cerrarlas pasan a `listo` `T-A01`, `T-A03`, `T-A04`, `T-A05` y `T-A08`.
3. `T-H02`: cuentas (Vercel, Upstash) y tope de gasto en OpenAI.
4. `T-H07`: exportar/curar overlays y métricas desde Firebase (`vibo-beta-2e60f`); es el insumo más crítico del proyecto (ADR-011).

**Agentes:** leer `06-coordinacion.md` y tomar solo tareas con estado `listo` en `tablero.md`.

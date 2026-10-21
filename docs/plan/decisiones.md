# Registro de decisiones (ADR)

Estados: **propuesta** (el plan la recomienda, falta aprobación del humano) · **abierta** (hay que explorar antes de decidir) · **aceptada** · **reemplazada**.

Para agregar una decisión: copiar la plantilla del final, siguiente número libre. Solo el humano cambia el estado a `aceptada`.

| ADR | Tema | Estado | Fecha límite | Bloquea |
| --- | --- | --- | --- | --- |
| 001 | Librería 3D: R3F + drei sobre three.js | aceptada | — | Todo el runtime 3D |
| 002 | Canvas único persistente con View Transitions | aceptada | — | Runtime, páginas de caso |
| 003 | Contenido en Content Collections (MDX + Zod) | aceptada | — | Contenido, guía |
| 004 | Hosting en Vercel con adaptador y una sola ruta de servidor | aceptada | — | Agente IA |
| 005 | AI SDK + Upstash Redis para el guía y sus límites | aceptada | — | Agente IA |
| 006 | Hilo conductor visual | abierta (spike A+C; default A) | Antes de G1 | Transiciones, interfaz del guía |
| 007 | Orden del recorrido y ubicación de la segunda línea | aceptada | — | Estructura del recorrido |
| 008 | Identidad del guía (cómo se presenta) | aceptada | — | Prompt del guía |
| 009 | Limpieza de `proyectos-facu/` y `proyectos-facu.zip` del repo | aceptada | — | Limpieza |
| 010 | Almacenamiento de fuentes 3D pesadas (`assets-src/`) | aceptada | — | Pipeline de assets |

---

## ADR-001 — Librería 3D: React Three Fiber + drei

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Contexto:** el sitio ya usa islas React; habrá 7+ escenas hechas por distintos agentes, con necesidades comunes (carga de glTF/KTX2, texto SDF, monitor de rendimiento, varias vistas en un mismo canvas).
- **Decisión:** three.js con `@react-three/fiber` y `@react-three/drei` (imports puntuales), `@react-three/postprocessing` solo en nivel `high`. Prioridad: velocidad de producción con varios agentes.
- **Alternativa descartada:** three.js "vanilla" con un runtime propio. Más control y ~40–50 KB gzip menos, pero más lento de producir en paralelo.
- **Consecuencias:** escenas como componentes React declarativos, más fáciles de aislar por carpeta; disciplina obligatoria de no usar estado de React por frame (ver `01` §2). El núcleo 3D se carga después del LCP, así que el peso extra no afecta la primera impresión.

## ADR-002 — Canvas único persistente

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** un único `<Canvas>` fijo, montado una vez en el layout con `transition:persist`, que renderiza el hilo conductor y como máximo dos escenas. Las páginas de caso lo reutilizan.
- **Condición explícita:** prioridad a rendimiento y a la experiencia mobile (presupuestos de `02`, niveles de calidad, prueba en iPhone/Android reales en G0). Si el spike T-A06 falla en memoria o FPS mobile, plan B: canvas por página con transición visual que disimule el corte.
- **Por qué:** un solo contexto WebGL (límites en mobile), transiciones continuas entre home y casos, sin recompilar shaders al navegar.
- **Riesgo:** fugas de memoria y estado colgado al navegar — mitigado por la compuerta G0.

## ADR-003 — Content Collections

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** migrar `src/lib/projects.ts` a `src/content/projects/<id>.mdx` con el esquema de `05` §1.
- **Por qué (optimizado para agentes):** un archivo por proyecto reduce conflictos de merge cuando varios agentes editan contenido en paralelo; Zod valida el esquema en build; el mismo contenido alimenta recorrido, casos, lista y guía. El humano casi no toca el contenido; los agentes son el editor principal.

## ADR-004 — Vercel con adaptador

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** `@astrojs/vercel`; todas las páginas prerenderizadas; solo `/api/guide` con `prerender = false`. Previews por PR para revisión y para Lighthouse CI.
- **Alternativa descartada:** hosting estático + función separada (Cloudflare Workers u otro).

## ADR-005 — AI SDK + Upstash Redis

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** `ai` + `@ai-sdk/openai` (streaming y tools tipadas con Zod) usando `OPEN_AI_API_KEY` y `OPEN_AI_MODEL` del `.env`; límites con `@upstash/ratelimit` sobre Upstash Redis instalado desde el Marketplace de Vercel; regla de Vercel Firewall como capa externa. Límites serios desde el día uno.
- **Alternativas descartadas:** SDK oficial de OpenAI directo; Vercel AI Gateway; guía sin Redis.

## ADR-006 — Hilo conductor visual

- **Estado:** abierta (alcance del spike acotado el 2026-10-21)
- **Opciones a explorar:** A. filamento de luz · C. enjambre de partículas. Detalle en `00` §4.
- **Descartada para el spike:** B. forma geométrica mutante (no explorar).
- **Cómo se decide:** spike T-A08 con A y C en `/lab/thread`, cada una con transición Vibo→Pirp y versión mobile; el humano elige en desktop y teléfono.
- **Fecha límite:** antes de G1. Si no se decide a tiempo, se implementa **A** por defecto.
- **Condición:** C solo se acepta si cumple presupuestos mobile de `02`; si no, gana A.

## ADR-007 — Orden del recorrido

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** el orden de `00` §3: Hero → Cómo pienso → Vibo → Pirp → Naturalis → Banner 2.0 (+ App Etiquetas y Web Landing como satélites en el mismo mundo) → Starbene, AGNT, Cielo y Mar → Archivo → Quién soy → Hablemos.
- **Nota:** App Etiquetas y Web Landing van junto a Banner 2.0 por coherencia visual y costo; siguen siendo proyectos independientes en la vista lista, con su propia página.

## ADR-008 — Identidad del guía

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** el guía se presenta como "el guía de este portafolio" y habla de Gonzalo en tercera persona. No promete precios, plazos ni disponibilidad: deriva al contacto.
- **Alternativas descartadas:** "asistente de Gonzalo" en plural; hablar como Gonzalo.

## ADR-009 — Limpieza de duplicados

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Contexto:** `proyectos-facu/` (con `lista-proyectos.ts` e imágenes) y `proyectos-facu.zip` están versionados y duplican `public/images/proyects`.
- **Decisión:** quitarlos del repositorio (quedan en el historial de Git) y agregarlos a `.gitignore`. Confirmado: no hay nada único que conservar ahí.

## ADR-010 — Fuentes 3D pesadas

- **Estado:** aceptada
- **Fecha:** 2026-10-21
- **Decisión:** `assets-src/` vive en el árbol del proyecto local pero está en `.gitignore`. El humano hace backup en Dropbox/Drive. En el repo solo se versionan las salidas optimizadas (`public/models/`, `public/textures/`, etc.) y un `assets-src/README.md` con la convención de carpetas.
- **Alternativas descartadas:** Git LFS; versionar las fuentes pesadas en Git.

---

## Plantilla

```md
## ADR-0XX — Título

- **Estado:** propuesta | abierta | aceptada | reemplazada por ADR-0YY
- **Fecha:** AAAA-MM-DD
- **Contexto:** qué problema o tensión hay.
- **Decisión:** qué se hace.
- **Alternativas:** qué se descartó y por qué.
- **Consecuencias:** qué cambia, qué riesgos quedan, qué documentos actualizar.
```

# 01 — Arquitectura

> Las decisiones marcadas con ADR están en [`decisiones.md`](./decisiones.md). Si un ADR cambia, este documento se actualiza en el mismo PR.

## 1. Stack

| Capa | Elección | Estado | Notas |
| --- | --- | --- | --- |
| Framework | **Astro 7** (ya instalado) | Se mantiene | Páginas prerenderizadas; islas React para lo interactivo |
| Lenguaje | TypeScript estricto | Se mantiene | |
| Estilos | Tailwind CSS v4 + CSS variables | Se mantiene | Tokens por capítulo vía variables (paleta que cambia con el scroll) |
| UI funcional | shadcn/ui (Radix) | Se mantiene, uso mínimo | Diálogos, índice, sheet del guía en mobile, tooltips |
| 3D | **three.js + @react-three/fiber + @react-three/drei** | ADR-001 (aceptada) | drei solo con imports puntuales: `View`, `Text`, `useGLTF`, `useKTX2`, `PerformanceMonitor`, `AdaptiveDpr` |
| Postprocesado | `postprocessing` (vía `@react-three/postprocessing`) | Solo nivel `high` | Un único `EffectComposer` con efectos fusionados |
| Movimiento | **GSAP 3.15** (ScrollTrigger, SplitText; todos los plugins son gratuitos) | Se mantiene | Sin Lenis: si hace falta scroll suave, `ScrollSmoother` de GSAP, evaluado por rendimiento |
| Navegación | View Transitions (`ClientRouter`) + `transition:persist` | ADR-002 (aceptada) | El canvas 3D persiste entre páginas |
| Contenido | Content Collections (MDX + Zod) | ADR-003 (propuesta) | Reemplaza `src/lib/projects.ts` |
| Hosting | **Vercel** + `@astrojs/vercel` | ADR-004 (propuesta) | Todo prerenderizado salvo `/api/guide` |
| Agente IA | AI SDK (`ai` + `@ai-sdk/openai`) | ADR-005 (propuesta) | Streaming, tools con Zod, modelo desde `OPEN_AI_MODEL` |
| Límite de uso | Upstash Redis (Marketplace de Vercel) + `@upstash/ratelimit` | ADR-005 | Más una regla de Vercel Firewall sobre `/api/guide` como capa externa |
| Audio | Web Audio API nativa | Sin dependencia | Siempre apagado por defecto |
| Pipeline de assets | `@gltf-transform/cli` (Meshopt + KTX2) | Dev dependency | Script `npm run assets:build` |
| Medición | Lighthouse CI, `rollup-plugin-visualizer`, Vercel Speed Insights | Dev / prod | Presupuestos como aserciones en CI |
| Tests | Playwright (smoke + capturas desktop/mobile) | Dev dependency | Las capturas acompañan cada PR de escena |

**Regla de dependencias:** solo las tareas de plataforma agregan dependencias (evita conflictos en `package-lock.json`). Una escena que necesita una librería nueva la pide en el tablero con una línea de justificación (¿qué aporta?, ¿cuánto pesa?, ¿se puede hacer con lo que ya hay?).

## 2. Modelo de render

```text
┌──────────────────────────────────────────────────────────────┐
│  DOM (Astro)  — texto, navegación, CTAs, overlays HUD         │  ← siempre legible, SEO, accesible
├──────────────────────────────────────────────────────────────┤
│  Capa del guía IA (isla React liviana)                        │  ← burbuja / sheet mobile
├──────────────────────────────────────────────────────────────┤
│  Canvas WebGL único, fijo, persistente (isla React + R3F)     │  ← un solo contexto WebGL en todo el sitio
│   ├─ Hilo conductor (siempre montado)                         │
│   ├─ Escena activa                                            │
│   └─ Escena siguiente (precargada, montada solo en transición)│
└──────────────────────────────────────────────────────────────┘
```

Decisiones de fondo:

- **Un solo canvas y un solo contexto WebGL** para todo el sitio (mobile tiene límites de contextos y de memoria; Safari iOS cierra la pestaña si se excede). Las páginas de proyecto reutilizan el mismo canvas gracias a `transition:persist`.
- **Como máximo dos escenas montadas** a la vez (la activa y la siguiente durante la transición). El resto se desmonta y libera GPU (`dispose` de geometrías, materiales y texturas).
- **El scroll no causa renders de React.** ScrollTrigger escribe el progreso en un store mutable; las escenas lo leen dentro de `useFrame`. Prohibido `setState` por frame.
- **`frameloop` controlado**: el loop se pausa con la pestaña oculta, cuando el canvas no aporta nada en pantalla (por ejemplo en el archivo o en el contacto si no hay animación) y en nivel `static`.
- **El texto legible nunca está en WebGL.** Los overlays tipo HUD se hacen en DOM posicionado desde coordenadas 3D proyectadas (nítidos y baratos) o con texto SDF (`drei/Text`) solo cuando es decorativo.

## 3. Estructura de carpetas objetivo

```text
src/
├── content/
│   ├── projects/<id>.mdx          # un archivo por proyecto (modelo en 05-contenido.md)
│   └── guide/                     # persona, FAQs y aperturas del guía (YAML/MD)
├── content.config.ts              # esquemas Zod
├── pages/
│   ├── index.astro                # el recorrido
│   ├── projects/index.astro       # vista lista
│   ├── projects/[id].astro        # caso completo
│   ├── lab/[scene].astro          # SOLO dev: escena aislada (excluida del build de producción)
│   └── api/guide.ts               # endpoint del agente (prerender = false)
├── layouts/
├── components/
│   ├── ui/                        # shadcn
│   ├── layout/                    # header, índice, footer
│   ├── journey/                   # capítulos DOM del recorrido (hero, manifiesto, archivo, contacto…)
│   ├── project/                   # piezas de la página de caso
│   └── guide/                     # interfaz del agente
├── experience/                    # PLATAFORMA (zona caliente: solo tareas de plataforma)
│   ├── Stage.tsx                  # canvas persistente, montaje/desmontaje de escenas
│   ├── store.ts                   # progreso, capítulo activo, nivel de calidad (store mutable + suscripción)
│   ├── scroll.ts                  # ScrollTrigger → store
│   ├── quality.ts                 # detección y adaptación de nivel de calidad
│   ├── deepLink.ts                # deep links de estado (?chapter, ?progress, ?quality, ?debug)
│   ├── thread/                    # hilo conductor
│   ├── audio.ts                   # mezclador Web Audio (opcional)
│   ├── debug.tsx                  # overlay ?debug, sampler de calidad (solo dev o con flag)
│   └── types.ts                   # CONTRATOS (ver §4)
├── scenes/
│   ├── registry.ts                # lista de SceneDefinition (zona caliente)
│   ├── kit/                       # piezas reutilizables (dispositivos, HUD, grafos, partículas)
│   ├── vibo/                      # cada escena es una carpeta aislada = zona de un agente
│   ├── pirp/
│   ├── naturalis/
│   ├── banner/                    # incluye satélites App Etiquetas y Web Landing
│   ├── starbene/
│   ├── agnt/
│   └── cielo-y-mar/
├── guide/                         # lógica cliente del agente: observador, reglas, acciones
├── lib/                           # utilidades compartidas
└── styles/
public/
├── models/<escena>/               # .glb ya optimizados (salida del pipeline)
├── textures/<escena>/             # .ktx2
├── posters/<escena>/              # fallbacks estáticos (AVIF/WebP) y video opcional
└── audio/<escena>/
assets-src/                        # fuentes pesadas (.blend, .glb sin optimizar) — fuera del build, ver §7
```

## 4. Contratos (se congelan en G0)

Estos tipos viven en `src/experience/types.ts`. Cambiarlos después de G0 requiere un ADR.

```ts
export type QualityTier = "high" | "medium" | "low" | "static"

export type ProjectId =
  | "vibo" | "pirp" | "naturalis" | "banner-2"
  | "app-etiquetas" | "web-landing" | "starbene" | "agnt" | "cielo-y-mar"
  | "venta-duplex" | "arcor-demo" | "forme" | "agro-ia-tesis" | "teams"

/** Momento narrativo de una escena, en coordenadas de progreso del capítulo (0..1). */
export type SceneBeat = {
  id: string                       // "mundo" | "problema" | "razonamiento" | "solucion" | "resultado" | propio
  range: [start: number, end: number]
  label: string                    // texto corto para el índice y el guía
}

export type ScenePalette = {
  background: string               // también alimenta las CSS variables del DOM en ese capítulo
  foreground: string
  accent: string
  accentAlt?: string
  scheme: "dark" | "light"
}

/** Cómo se transforma el hilo conductor dentro de la escena. */
export type ThreadForm = {
  shape: "line" | "trajectory" | "branching" | "growth" | "split" | "custom"
  color: string
  anchors?: (progress: number) => [x: number, y: number, z: number][]
}

export type SceneProps = {
  /** Lee siempre con `progress.current` dentro de useFrame. Nunca lo copies a estado de React. */
  progress: { readonly current: number }
  quality: QualityTier
  isMobile: boolean
  /** true mientras la escena es la principal (no la que entra o sale en una transición). */
  active: boolean
}

export type SceneDefinition = {
  id: ProjectId
  tier: 1 | 2 | 3
  chapterId: string                // id de la sección DOM que la controla
  load: () => Promise<{ default: React.ComponentType<SceneProps> }>   // chunk lazy
  preload?: (quality: QualityTier) => Promise<void>                    // assets + warmup de shaders
  palette: ScenePalette
  thread: ThreadForm
  beats: SceneBeat[]
  fallback: { poster: string; posterMobile?: string; video?: string }
  budget: { maxTriangles: number; maxDrawCalls: number; maxAssetKB: { desktop: number; mobile: number } }
}
```

Eventos que la experiencia emite para el agente de IA (detallados en `04-agente-ia.md`):

```ts
export type JourneySignal =
  | { type: "chapter:enter"; chapterId: string; at: number }
  | { type: "beat:enter"; sceneId: ProjectId; beatId: string; at: number }
  | { type: "scroll:reverse"; chapterId: string; at: number }
  | { type: "interact"; target: string; at: number }
  | { type: "idle"; ms: number; at: number }
```

Acciones que el agente puede pedir a la experiencia (lista cerrada, validada con Zod):

```ts
export type GuideAction =
  | { type: "goToChapter"; chapterId: string }
  | { type: "goToBeat"; sceneId: ProjectId; beatId: string }
  | { type: "highlight"; target: string }          // ids registrados por cada escena
  | { type: "openProject"; id: ProjectId }
  | { type: "showContact" }
```

## 5. Flujo de una escena

1. El capítulo DOM (`<section data-chapter="vibo">`) entra en zona de precarga (un capítulo antes) → `registry.preload(quality)`: descarga assets del nivel correspondiente y compila shaders (`renderer.compile`) en `requestIdleCallback`, para que no haya tirones al entrar.
2. Entra en pantalla → `Stage` monta la escena y ejecuta la transición desde la anterior (el hilo conductor hace de puente; si hace falta, crossfade por render target).
3. ScrollTrigger mapea el scroll del capítulo a `progress` 0..1; la escena interpreta sus `beats`.
4. Sale de pantalla → se desmonta tras la transición y se liberan recursos. Se verifica con `renderer.info` en el overlay de debug.

## 6. Niveles de calidad

| Nivel | Cuándo | Qué cambia |
| --- | --- | --- |
| `high` | Desktop con GPU dedicada o integrada moderna | DPR hasta 2, postprocesado, sombras horneadas + algún efecto en tiempo real, partículas completas |
| `medium` | Desktop modesto, mobile de gama media-alta | DPR hasta 1,5, sin postprocesado pesado, partículas al 50 % |
| `low` | Mobile de gama media-baja, o caída sostenida de FPS | DPR 1, geometría simplificada, sin postprocesado, texturas 1024 o menos |
| `static` | Sin WebGL, `prefers-reduced-motion`, `Save-Data`, o FPS < 30 sostenido en `low` | Sin canvas: pósters y animaciones CSS mínimas; el contenido completo sigue disponible |

Detección inicial (en `quality.ts`): soporte WebGL2, `navigator.hardwareConcurrency`, `navigator.deviceMemory`, renderer de la GPU (`WEBGL_debug_renderer_info` cuando esté disponible), tamaño de pantalla y `Save-Data`. Adaptación en vivo con `PerformanceMonitor` de drei, con histéresis (no sube y baja constantemente). El nivel se guarda en `sessionStorage` y se puede forzar con `?quality=`.

Implementación (T-A07):

- `classifyQuality` es pura (recibe las señales del dispositivo) y se puede probar sin navegador. Un render por software (SwiftShader, llvmpipe, Basic Render Driver) cae directo a `static`; `prefers-reduced-motion`, `Save-Data` y conexiones 2G/3G también, y esas restricciones no se adaptan.
- `QualityMonitor` (dentro del Canvas) mide ventanas de 1,5 s con histéresis explícita en lugar del `PerformanceMonitor` de drei: baja tras 2 ventanas por debajo de 45 FPS en `high` o 40 en `medium` (3 por debajo de 28 en `low`); sube tras 5 ventanas por encima de 55/57 FPS, con 20 s de enfriamiento, como máximo 2 subidas por sesión y techo `medium` en mobile (y en anchos ≤ 768 px). Se eligió el monitor propio porque la histéresis queda medible y testeable.
- El nivel se persiste en `sessionStorage` (`experience:quality`); `?quality=` lo fuerza sin persistirlo. En `static` no se monta el Canvas (los pósters llegan con T-A16) y el `<div data-experience-stage>` desaparece.
- El DPR sale de `QUALITY_DPR`: `high` 1–2, `medium` 1–1,5, `low` 1.

## 7. Pipeline de assets

```text
assets-src/<escena>/*.blend|*.glb  ──►  npm run assets:build  ──►  public/models/<escena>/<nombre>.<nivel>.glb
                                         (gltf-transform: dedup, prune,                  public/textures/<escena>/*.ktx2
                                          weld, simplify por nivel, meshopt,
                                          KTX2 / resize 2048·1024·512)
```

- Las fuentes pesadas (`assets-src/`) no se publican; si superan el tamaño razonable para Git, se versionan con Git LFS o se guardan fuera del repo (decidir en T-A09).
- Iluminación **horneada** en Blender siempre que se pueda (una textura de luz es mucho más barata que sombras en tiempo real).
- Un `manifest` por escena (`src/scenes/<id>/assets.ts`) declara qué archivo usar por nivel; el pipeline verifica que se cumplan los presupuestos y falla si no.

## 8. Rutas y contenido

- `/` → recorrido. `/projects` → vista lista. `/projects/<id>` → caso completo. Las redirecciones actuales de `astro.config.ts` se mantienen.
- **Decisión T-A11 (rutas legacy):** ninguna de `/skills`, `/about`, `/experience` ni `/contact` conserva página propia por SEO (el texto útil vive en el recorrido y se indexa desde `/` y `/projects/<id>`). `/skills` → `/`. `/about` y `/experience` → `/?chapter=about`. `/contact` → `/?chapter=contact`. Hoy las redirecciones viven en las páginas Astro; conviene registrarlas también en `astro.config.ts` (pedido a plataforma).
- Capítulos DOM del recorrido (`data-chapter`, ADR-007): `hero` → `manifesto` → `vibo` → `pirp` → `naturalis` → `banner-2` → `starbene` → `agnt` → `cielo-y-mar` → `archive` → `about` → `contact`.
- Pirp se agrega como proyecto con id `pirp` (hoy figura como `analisis-rep-politica`, con redirección de la ruta vieja).

## 9. Herramientas para iterar rápido (clave para agentes)

- **Deep links de estado:** `/?chapter=vibo&progress=0.45&quality=low&debug` deja la experiencia en un punto exacto. Permite a un agente sacar capturas reproducibles y al humano revisar un beat concreto. `deepLink.ts` parsea `chapter`, `progress`, `quality` y `debug`; mueve el scroll al punto equivalente del trigger y escribe el progreso en el store, así la escena arranca en ese beat aunque todavía no esté montada. Se reengancha en cada `astro:page-load`.
- **Laboratorio de escenas:** `/lab/<escena>` monta una sola escena con un slider de progreso, selector de nivel y panel de métricas. Solo existe en desarrollo: en producción `getStaticPaths` devuelve una lista vacía y no se genera el archivo. Hoy sirve las escenas dummy del spike (`/lab/spike-alpha`, `/lab/spike-beta`); cuando lleguen las reales, el índice sale del registry.
- **Overlay `?debug`:** FPS, frame time (promedio y p95), draw calls, triángulos, texturas y geometrías vivas, escenas montadas, nivel de calidad con su motivo, beat activo y el deep link del estado actual. Permite forzar `high`/`medium`/`low`/`static` y volver a `auto`.
- **Script `npm run check`:** lint + typecheck + build + verificación de presupuestos de assets. Es lo mínimo antes de abrir un PR. Implementado en T-A02 con lint, typecheck y build; la verificación de presupuestos de assets se suma cuando exista el pipeline de T-A09.

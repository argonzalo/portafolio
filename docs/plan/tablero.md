# Tablero

> Backlog vivo. Lo mantiene el orquestador; el humano lo revisa a diario. Reglas en [`06-coordinacion.md`](./06-coordinacion.md).

**Estados:** `pendiente` (faltan dependencias) · `listo` (se puede tomar) · `en curso (<quién>)` · `en revisión (<PR>)` · `hecho` · `bloqueado (<motivo>)`
**Dueño:** `H-` humano · `A-` agente. **Zona:** carpetas/archivos que la tarea puede modificar (exclusivas mientras está en curso).

---

## F0 — Fundaciones · Compuerta G0

> **G0:** spike del runtime con 2 escenas de prueba a 60 fps en desktop y ≥ 50 fps en Android medio, sin fugas al navegar 5 veces ida y vuelta entre home y un caso; contratos de `01` §4 aprobados; CI corriendo.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H01 | Leer `00` y `decisiones.md`; aceptar o corregir ADR-001 a 005, 007, 008, 009 | — | `docs/plan/decisiones.md` | hecho (grilling 2026-10-21; ADR-006 spike A+C pendiente de elección visual) |
| T-H02 | Cuentas y secretos: vincular repo a Vercel, instalar Upstash Redis desde el Marketplace, configurar tope de gasto mensual en OpenAI, confirmar `OPEN_AI_MODEL` y elegir `OPEN_AI_MODEL_FALLBACK` | — | Paneles externos, `.env` local | hecho (2026-10-21; modelo `gpt-6-luna`, fallback `gpt-5.4-mini`; Upstash `upstash-kv-lime-lantern`; preview https://portafolio-coral-zeta-55.vercel.app) |
| T-H03 | Arrancar la recolección de insumos de primera línea: I-03 (marcas), I-08 (qué se puede contar de Pirp), I-04 (capturas) | — | `assets-src/`, `docs/plan/licencias.md` | listo |
| T-H05 | Moodboard y validación de la ficha de Vibo (`03` §3.1 + ADR-011: golpe en slow-mo + overlays); después Pirp, Naturalis y Banner | — | `docs/plan/03-escenas.md` | listo |
| T-H07 | I-02 / ADR-011: exportar de Firebase (`vibo-beta-2e60f` → `videos.analysisResults`) 1–2 clips anonimizados; curar JSON de overlays (bboxes + keypoints en la ventana del golpe) + métricas de jugador; sin trayectoria 3D fiel | — | `assets-src/vibo/` | listo |
| T-A01 | Higiene del repo: README actualizado, scripts de `package.json` documentados, quitar `proyectos-facu/` y `.zip`, `.gitignore` (incl. `assets-src/` salvo README) | ADR-009, ADR-010 | Raíz (`README.md`, `.gitignore`), `proyectos-facu/` | hecho (2026-10-21; PR #3) |
| T-A02 | Tooling de calidad: script `npm run check`, GitHub Actions (lint, typecheck, build), Lighthouse CI con presupuestos de `02` §1 sobre el preview, `rollup-plugin-visualizer`, Playwright con un smoke test | — | `package.json` (scripts, devDeps), `.github/`, `lighthouserc.*`, `playwright.config.*`, `tests/`, `README.md`, `src/components/projects/LightboxStage.tsx`, `src/components/interactive/ExperienceTimeline.tsx`, `src/experience/SceneDirector.tsx` (tipos), `astro.config.ts` (visualizer), `scripts/analyze.mjs`, `scripts/serve-preview.mjs` | hecho (2026-10-21; PR #9) |
| T-A03 | Adaptador Vercel + `astro:env` (esquema server/secret para las variables de `04` §2) + `/api/health` + redirección `analisis-rep-politica → pirp` + `.env.example` actualizado; preview funcionando | ADR-004, T-H02 | `astro.config.ts`, `package.json`, `src/pages/api/`, `.env.example` | hecho (2026-10-21; preview https://portafolio-git-t-a03-vercel-argonzalos-projects.vercel.app) |
| T-A04 | Content collections: esquema de `05` §1, migración de los 14 proyectos + Pirp como `pirp`, helpers de consulta; `src/lib/projects.ts` queda como fachada temporal para no romper páginas | ADR-003 | `src/content/`, `src/content.config.ts`, `src/lib/projects.ts` | hecho (2026-10-21; PR #5) |
| T-A05 | Contratos y store: `src/experience/types.ts` (contratos de `01` §4), store mutable de progreso/capítulo/calidad, `registry.ts` vacío, emisor de `JourneySignal`; instalar R3F y drei | ADR-001, ADR-002 | `src/experience/`, `src/scenes/registry.ts`, `src/guide/signals.ts`, `package.json` | hecho (2026-10-21; PR #4) |
| T-A06 | **Spike del runtime** (ruta crítica): `Stage` persistente con `transition:persist`, ScrollTrigger → store, 2 escenas dummy con montaje/desmontaje y transición, navegación home ↔ caso sin perder el canvas, medición de memoria | T-A05 | `src/experience/`, `src/layouts/`, `src/pages/index.astro` (temporal) | hecho (2026-10-21; PR #6) |
| T-A07 | Calidad adaptativa (`quality.ts`, `PerformanceMonitor`), overlay `?debug`, deep links de estado, ruta `/lab/[scene]` solo en dev | T-A06 | `src/experience/quality.ts`, `src/experience/debug.tsx`, `src/experience/deepLink.ts`, `src/experience/Stage.tsx` (integración), `src/experience/gpuStats.ts`, `src/experience/SceneDirector.tsx` (métricas), `src/pages/lab/` | hecho (2026-10-21; PR #7) |
| T-A08 | **Spike del hilo conductor:** opciones A y C de ADR-006 en `/lab/thread`, con transición Vibo→Pirp y versión mobile; best-of-N (una variante por worktree). Default A si no hay elección a tiempo; C solo si cumple mobile | ADR-001 | `src/experience/thread/`, `src/pages/lab/thread.astro` | en revisión ([PR #13](https://github.com/argonzalo/portafolio/pull/13)) |
| T-A09 | Pipeline de assets: `npm run assets:build` con gltf-transform (meshopt, KTX2, LOD por nivel), verificación de presupuestos, `assets-src/` gitignored + README de convención (ADR-010) | ADR-010 | `scripts/assets/`, `assets-src/README.md`, `.gitignore`, `package.json` (script) | en revisión (https://github.com/argonzalo/portafolio/pull/10) |
| T-A10 | Borradores de narrativa (problema, enfoque, decisiones, desafíos, impacto) de los 4 proyectos de primera línea a partir de `docs/descripciones-proyectos-originales.md`, marcando con `TODO(humano)` lo que solo él sabe | — | `docs/plan/borradores/` | hecho (2026-10-21; PR #2) |

## F1 — Esqueleto del recorrido · Compuerta G1

> **G1:** recorrido completo en el preview con escenas en greybox, hilo conductor v1, hero nuevo, fallbacks y vista lista; presupuestos de `02` cumplidos; el humano aprueba ritmo, orden y sensaciones en su teléfono y en desktop.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H04 | Corregir y completar las narrativas de primera línea (I-01) sobre los borradores de T-A10 | T-A10 | `docs/plan/borradores/`, `src/content/projects/` | listo |
| T-H06 | Revisión del esqueleto en dispositivos reales (matriz de `02` §5); lista de ajustes | T-A11 a T-A16 | `docs/plan/tablero.md` | pendiente |
| T-A11 | Estructura del recorrido en DOM: capítulos con `data-chapter`, índice overlay, vista lista `/projects`, contacto siempre visible, eliminar `/skills` y decidir el destino de `/about`, `/experience`, `/contact` | T-A04, T-A06, ADR-007 | `src/pages/`, `src/components/journey/`, `src/components/layout/` | en revisión (https://github.com/argonzalo/portafolio/pull/11) |
| T-A12 | Hero y manifiesto: copy de `05` §2, tags, frases, animación con SplitText, hero 100 % HTML (LCP), punto de entrada del hilo | T-A11 | `src/components/journey/Hero*`, `src/components/journey/Manifesto*`, `src/lib/site.ts` | pendiente |
| T-A13 | Hilo conductor v1 con la opción elegida, integrado en `Stage`, con API para que cada escena defina su `ThreadForm` | ADR-006, T-A06 | `src/experience/thread/` | pendiente |
| T-A14 | Greybox de las 4 escenas de primera línea (un agente por escena: `T-A14-vibo`, `-pirp`, `-naturalis`, `-banner`): beats, cámaras desktop/mobile, ritmo, en `/lab` y en el recorrido | T-A07, ficha validada (T-H05) | `src/scenes/<id>/` | pendiente |
| T-A15 | Paletas por capítulo: interpolación de CSS variables con el progreso, cambio a tema claro en Naturalis, sincronía con el canvas | T-A06, T-A11 | `src/experience/palette.ts`, `src/styles/` (con permiso de plataforma) | pendiente |
| T-A16 | Nivel `static`: recorrido sin canvas con pósters provisionales, `prefers-reduced-motion`, `Save-Data`, sin WebGL | T-A07, T-A11 | `src/components/journey/Fallback*`, `public/posters/` | pendiente |
| T-A17 | Página de caso `/projects/[id]` con la estructura problema → enfoque → decisiones → desafíos → resultado → piezas → stack; header con escena o póster | T-A04, T-A06 | `src/pages/projects/[...slug].astro`, `src/components/project/` | en revisión (https://github.com/argonzalo/portafolio/pull/12) |

## F2 — Escena insignia, kits y backend del guía · Compuerta G2

> **G2:** Vibo terminada, aprobada por el humano y dentro de presupuesto en desktop y mobile; kits publicados con ejemplos en `/lab`; `/api/guide` responde con streaming y aplica los cuatro límites.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H08 | Persona del guía, FAQs y aprobación de las ofertas proactivas (I-09); el agente propone borradores | ADR-008 | `src/content/guide/` | pendiente |
| T-H12 | Revisión de arte de cada escena al cerrar su greybox y antes del merge final (recurrente) | — | Comentarios en PR | pendiente |
| T-A18 | Kit de escena: HUD anclado a 3D, grafo de nodos/agentes, líneas con el shader del hilo, contadores, rig de cámara por beats; ejemplos en `/lab/kit` | T-A07, T-A13 | `src/scenes/kit/` (salvo dispositivos) | pendiente |
| T-A19 | Kit de dispositivos: `Phone`, `Laptop`, `Display` low-poly con pantalla texturizable y capas de UI flotantes | T-A07, T-A09 | `src/scenes/kit/devices/`, `assets-src/kit/`, `public/models/kit/` | pendiente |
| T-A20 | **Escena Vibo completa** (`03` §3.1, ADR-011): personaje 3D en slow-mo + overlays de detección, interacción, transición Vibo→Pirp (lado saliente) | T-A14-vibo aprobado, T-A18, T-H07 | `src/scenes/vibo/`, `public/models/vibo/`, `public/textures/vibo/` | pendiente |
| T-A21 | Backend del guía: `/api/guide` con AI SDK, tools de la lista cerrada, contexto generado en build, límites (sesión, IP, global), kill switch, fallback de modelo, tests | T-A03, T-A04, ADR-005, ADR-008 | `src/pages/api/guide.ts`, `src/server/guide/`, `scripts/guide-context.*` | pendiente |
| T-A22 | Observador y motor de reglas del guía (`04` §3) con panel de debug que muestra el estado detectado | T-A05, T-A11 | `src/guide/` | pendiente |

## F3 — Resto de la primera línea e interfaz del guía · Compuerta G3

> **G3:** Pirp, Naturalis y Banner 2.0 aprobadas y dentro de presupuesto; todas las transiciones entre capítulos de primera línea terminadas; guía funcionando de punta a punta en desktop y mobile.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H09 | Assets de Naturalis (I-05) y pista de audio (I-06) | — | `assets-src/naturalis/`, `licencias.md` | pendiente |
| T-H10 | Insumos de Pirp (I-03, I-08): marca, capturas, validación del dataset ficticio y de los textos de estrategia | — | `assets-src/pirp/` | pendiente |
| T-H11 | Insumos de Banner (I-07): permiso de logos, capturas elegidas | — | `assets-src/banner/` | pendiente |
| T-A23 | Escena Pirp (`03` §3.2) + transición Pirp→Naturalis (lado saliente) | T-A14-pirp aprobado, T-A18, T-H10 | `src/scenes/pirp/`, assets de pirp | pendiente |
| T-A24 | Escena Naturalis (`03` §3.3) + transición Naturalis→Banner (lado saliente) | T-A14-naturalis aprobado, T-A18, T-A19, T-H09 | `src/scenes/naturalis/`, assets de naturalis | pendiente |
| T-A25 | Escena Banner 2.0 (`03` §3.4) + transición hacia la segunda línea | T-A14-banner aprobado, T-A18, T-A19, T-H11 | `src/scenes/banner/`, assets de banner | pendiente |
| T-A26 | Sistema de audio (Web Audio): mezclador, activación por gesto, control visible, silenciado al ocultar | T-A06 | `src/experience/audio.ts`, `public/audio/` | listo |
| T-A27 | Interfaz del guía integrada con el hilo (`04` §7): burbuja, panel, sheet mobile, ejecución de `GuideAction`, accesibilidad | T-A13, T-A21, T-A22, T-A20 | `src/components/guide/`, `src/guide/actions.ts` | pendiente |
| T-A28 | Evals del guía (`npm run guide:eval`), calibración de umbrales con sesiones de prueba, estimación de costos con el precio real del modelo | T-A27 | `scripts/guide-eval.*`, `tests/guide/` | pendiente |

## F4 — Segunda y tercera línea, páginas y cierre · Compuerta G4

> **G4:** todos los proyectos presentes en el recorrido, en la vista lista y con página de caso; cierre cíclico funcionando; imágenes optimizadas y pósters definitivos.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H14 | Narrativas cortas de segunda y tercera línea (I-10) sobre borradores del agente | T-A04 | `src/content/projects/` | pendiente |
| T-A29 | Satélites de Banner: App Etiquetas y Web Landing dentro del mundo Banner | T-A25 | `src/scenes/banner/satellites/` | pendiente |
| T-A30 | Viñeta Starbene | T-A18, T-A19 | `src/scenes/starbene/` | pendiente |
| T-A31 | Viñeta AGNT | T-A18, T-A19 | `src/scenes/agnt/` | pendiente |
| T-A32 | Viñeta Cielo y Mar | T-A18, T-A19 | `src/scenes/cielo-y-mar/` | pendiente |
| T-A33 | Archivo de tercera línea (2D interactivo) + páginas de caso breves | T-A11, T-A17 | `src/components/journey/Archive*` | pendiente |
| T-A34 | Quién soy + Hablemos + cierre cíclico hacia el hero | T-A13, T-A11 | `src/components/journey/About*`, `src/components/journey/Contact*` | pendiente |
| T-A35 | Imágenes de proyectos a `astro:assets` (AVIF/WebP responsive) + pósters definitivos generados con Playwright desde cada escena | T-A20 a T-A25 | `src/assets/projects/`, `public/posters/`, `scripts/posters.*` | pendiente |

## F5 — Pulido y lanzamiento · Compuerta G5

> **G5:** checklist de lanzamiento de `06` §8 completo.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H13 | QA en dispositivos reales (matriz completa) | G4 | `docs/plan/tablero.md` | pendiente |
| T-H15 | Revisión final de textos y lanzamiento (dominio, variables de producción, `GUIDE_ENABLED`) | T-H13 | Vercel | pendiente |
| T-A36 | Endurecimiento de rendimiento: auditoría de bundle, warmup de shaders, INP, pesos de assets, Lighthouse en todas las rutas | G4 | Según hallazgos (coordinar con el orquestador) | pendiente |
| T-A37 | Auditoría de accesibilidad: teclado, foco, contraste por paleta, lectores de pantalla, nivel `static` | G4 | Según hallazgos | pendiente |
| T-A38 | SEO: metadatos por página, OG image por proyecto (render de su escena), sitemap, datos estructurados | G4 | `src/components/layout/Seo.astro`, `public/og/` | pendiente |
| T-A39 | Analítica: Vercel Web Analytics + Speed Insights + eventos del recorrido y del guía | G4 | `src/lib/analytics.ts`, layout | pendiente |
| T-A40 | QA automatizado: Playwright con capturas por capítulo en Chrome, WebKit y Firefox, desktop y mobile | G4 | `tests/` | pendiente |

---

## Bloqueos y preguntas

> Los agentes anotan acá lo que no pueden resolver solos. El humano responde a diario.

| Fecha | Tarea | Pregunta o bloqueo | Respuesta |
| --- | --- | --- | --- |
| 2026-10-21 | T-A08 | **ADR-006 lista para decidir:** A (filamento) y C (enjambre) están en `/lab/thread` del preview, con transición Vibo→Pirp y mobile. Las dos cumplen presupuesto en mobile emulado (CPU ×4); falta probar en iPhone y Android reales y elegir. El color de Pirp es provisional (`#ff5b4f`) hasta I-03. | |
| 2026-10-21 | T-A08 | Varios agentes locales comparten la carpeta principal del repo y cambian de rama en ella: el trabajo sin commitear de T-A08 terminó en un `git stash` ajeno (recuperado). Pedido: que cada agente local use su propio worktree (`06` §3, paso 2). | |
| 2026-10-21 | T-A01 / T-A05 | `npm run lint` y `npm run typecheck` ya fallan en `main` por código previo: `LightboxStage.tsx` (ref en render + deps de `useEffect`; `stage` posiblemente `null`) y `ExperienceTimeline.tsx` (`offsetHeight` sobre `Element`). `npm run build` pasa. Bloquea el `npm run check` de T-A02. ¿Lo arregla T-A02 o una tarea de QA? | Resuelto en T-A02: baseline de lint/typecheck en verde y `npm run check` (lint + typecheck + build) disponible. |

## Pedidos a plataforma

> Cambios que una tarea necesita en archivos calientes o dependencias nuevas.

| Fecha | Pedido por | Qué se necesita y por qué | Tarea que lo resuelve |
| --- | --- | --- | --- |
| 2026-10-21 | T-H02 | `.gitignore` ignora `.env*` y también excluye `.env.example`. Hay que exceptuar `!.env.example` para versionar el esquema de variables. | T-A01 (resuelto en `t/A01-higiene`) |
| 2026-10-21 | T-A11 | Registrar en `astro.config.ts` redirects 301: `/skills` → `/`, `/about` y `/experience` → `/?chapter=about`, `/contact` → `/?chapter=contact` (hoy están en páginas Astro). Opcional: ampliar `hashScroll` en `src/lib/hashScroll.ts` a cualquier `#capítulo` del recorrido (hoy solo `#proyectos`). | plataforma / orquestador |
| 2026-10-21 | T-A09 | Documentar en `README.md` (tabla Scripts) `assets:build`, `assets:check` y que `check` incluye presupuestos de assets. Fuera de la zona de T-A09. | orquestador / higiene |

## Estado de insumos del humano

> Detalle de cada insumo en `05-contenido.md` §4.

| Insumo | Estado | Nota |
| --- | --- | --- |
| I-01 Narrativas primera línea | pendiente | Borradores en `docs/plan/borradores/` (T-A10); falta corrección humana T-H04 |
| I-02 Datos reales de Vibo | pendiente | **Crítico** para T-A20. Fuente: Firebase `vibo-beta-2e60f` / `videos.analysisResults`. Uso: overlays + métricas (ADR-011), no reconstrucción 3D |
| I-03 Marcas y paletas | pendiente | |
| I-04 Capturas en alta | pendiente | |
| I-05 Assets Naturalis | pendiente | |
| I-06 Audio | pendiente | |
| I-07 Logos de clientes de Banner | pendiente | |
| I-08 Alcance de Pirp + dataset | pendiente | |
| I-09 Persona y FAQs del guía | pendiente | |
| I-10 Narrativas segunda y tercera línea | pendiente | |
| I-11 Fotos personales | pendiente | Opcional |

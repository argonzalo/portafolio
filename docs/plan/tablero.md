# Tablero

> Backlog vivo. Lo mantiene el orquestador; el humano lo revisa a diario. Reglas en [`06-coordinacion.md`](./06-coordinacion.md).

**Estados:** `pendiente` (faltan dependencias) · `listo` (se puede tomar) · `en curso (<quién>)` · `en revisión (<PR>)` · `hecho` · `bloqueado (<motivo>)`
**Dueño:** `H-` humano · `A-` agente. **Zona:** carpetas/archivos que la tarea puede modificar (exclusivas mientras está en curso).

---

## F0 — Fundaciones · Compuerta G0

> **G0:** spike del runtime con 2 escenas de prueba a 60 fps en desktop y ≥ 50 fps en Android medio, sin fugas al navegar 5 veces ida y vuelta entre home y un caso; contratos de `01` §4 aprobados; CI corriendo.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H01 | Leer `00` y `decisiones.md`; aceptar o corregir ADR-001 a 005, 007, 008, 009 | — | `docs/plan/decisiones.md` | hecho (grilling 2026-10-21; ADR-006 cerrada 2026-10-22: C desktop / A mobile) |
| T-H02 | Cuentas y secretos: vincular repo a Vercel, instalar Upstash Redis desde el Marketplace, configurar tope de gasto mensual en OpenAI, confirmar `OPEN_AI_MODEL` y elegir `OPEN_AI_MODEL_FALLBACK` | — | Paneles externos, `.env` local | hecho (2026-10-21; modelo `gpt-6-luna`, fallback `gpt-5.4-mini`; Upstash `upstash-kv-lime-lantern`; preview https://portafolio-coral-zeta-55.vercel.app) |
| T-H03 | Arrancar la recolección de insumos de primera línea: I-03 (marcas), I-08 (qué se puede contar de Pirp), I-04 (capturas) | — | `assets-src/`, `docs/plan/licencias.md` | hecho (2026-10-22; brand en `assets-src/*/brand/`; capturas = `public/images/proyects/`; I-08 parcial → T-H10; `licencias.md` + `insumos/capturas.md`) |
| T-H05 | Moodboard y validación de la ficha de Vibo (`03` §3.1 + ADR-011: golpe en slow-mo + overlays); después Pirp, Naturalis y Banner | — | `docs/plan/03-escenas.md` | hecho (2026-10-22; Vibo + Pirp + Naturalis + Banner fichas validadas en `03`) |
| T-H07 | I-02 / ADR-011: exportar de Firebase (`vibo-beta-2e60f` → `videos.analysisResults`) 1–2 clips anonimizados; curar JSON de overlays (bboxes + keypoints en la ventana del golpe) + métricas de jugador; sin trayectoria 3D fiel | — | `assets-src/vibo/` | hecho (2026-10-21; overlays con bbox/pose reales del MVP + stats Firebase; `ui-mvp-public/` gitignored) |
| T-A01 | Higiene del repo: README actualizado, scripts de `package.json` documentados, quitar `proyectos-facu/` y `.zip`, `.gitignore` (incl. `assets-src/` salvo README) | ADR-009, ADR-010 | Raíz (`README.md`, `.gitignore`), `proyectos-facu/` | hecho (2026-10-21; PR #3) |
| T-A02 | Tooling de calidad: script `npm run check`, GitHub Actions (lint, typecheck, build), Lighthouse CI con presupuestos de `02` §1 sobre el preview, `rollup-plugin-visualizer`, Playwright con un smoke test | — | `package.json` (scripts, devDeps), `.github/`, `lighthouserc.*`, `playwright.config.*`, `tests/`, `README.md`, `src/components/projects/LightboxStage.tsx`, `src/components/interactive/ExperienceTimeline.tsx`, `src/experience/SceneDirector.tsx` (tipos), `astro.config.ts` (visualizer), `scripts/analyze.mjs`, `scripts/serve-preview.mjs` | hecho (2026-10-21; PR #9) |
| T-A03 | Adaptador Vercel + `astro:env` (esquema server/secret para las variables de `04` §2) + `/api/health` + redirección `analisis-rep-politica → pirp` + `.env.example` actualizado; preview funcionando | ADR-004, T-H02 | `astro.config.ts`, `package.json`, `src/pages/api/`, `.env.example` | hecho (2026-10-21; preview https://portafolio-git-t-a03-vercel-argonzalos-projects.vercel.app) |
| T-A04 | Content collections: esquema de `05` §1, migración de los 14 proyectos + Pirp como `pirp`, helpers de consulta; `src/lib/projects.ts` queda como fachada temporal para no romper páginas | ADR-003 | `src/content/`, `src/content.config.ts`, `src/lib/projects.ts` | hecho (2026-10-21; PR #5) |
| T-A05 | Contratos y store: `src/experience/types.ts` (contratos de `01` §4), store mutable de progreso/capítulo/calidad, `registry.ts` vacío, emisor de `JourneySignal`; instalar R3F y drei | ADR-001, ADR-002 | `src/experience/`, `src/scenes/registry.ts`, `src/guide/signals.ts`, `package.json` | hecho (2026-10-21; PR #4) |
| T-A06 | **Spike del runtime** (ruta crítica): `Stage` persistente con `transition:persist`, ScrollTrigger → store, 2 escenas dummy con montaje/desmontaje y transición, navegación home ↔ caso sin perder el canvas, medición de memoria | T-A05 | `src/experience/`, `src/layouts/`, `src/pages/index.astro` (temporal) | hecho (2026-10-21; PR #6) |
| T-A07 | Calidad adaptativa (`quality.ts`, `PerformanceMonitor`), overlay `?debug`, deep links de estado, ruta `/lab/[scene]` solo en dev | T-A06 | `src/experience/quality.ts`, `src/experience/debug.tsx`, `src/experience/deepLink.ts`, `src/experience/Stage.tsx` (integración), `src/experience/gpuStats.ts`, `src/experience/SceneDirector.tsx` (métricas), `src/pages/lab/` | hecho (2026-10-21; PR #7) |
| T-A08 | **Spike del hilo conductor:** opciones A y C de ADR-006 en `/lab/thread`, con transición Vibo→Pirp y versión mobile; best-of-N (una variante por worktree). Default A si no hay elección a tiempo; C solo si cumple mobile | ADR-001 | `src/experience/thread/`, `src/pages/lab/thread.astro` | hecho (2026-10-21; PR #13) |
| T-A09 | Pipeline de assets: `npm run assets:build` con gltf-transform (meshopt, KTX2, LOD por nivel), verificación de presupuestos, `assets-src/` gitignored + README de convención (ADR-010) | ADR-010 | `scripts/assets/`, `assets-src/README.md`, `.gitignore`, `package.json` (script) | hecho (2026-10-21; PR #10) |

| T-A10 | Borradores de narrativa (problema, enfoque, decisiones, desafíos, impacto) de los 4 proyectos de primera línea a partir de `docs/descripciones-proyectos-originales.md`, marcando con `TODO(humano)` lo que solo él sabe | — | `docs/plan/borradores/` | hecho (2026-10-21; PR #2) |

## F1 — Esqueleto del recorrido · Compuerta G1

> **G1:** recorrido completo en el preview con escenas en greybox, hilo conductor v1, hero nuevo y vista lista; presupuestos de `02` cumplidos; el humano aprueba ritmo, orden y sensaciones en su teléfono y en desktop. *(Nivel `static` / T-A16: diferido, ADR-012 — no bloquea G1.)*

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H04 | Corregir y completar las narrativas de primera línea (I-01) sobre los borradores de T-A10 | T-A10 | `docs/plan/borradores/`, `src/content/projects/` | hecho (2026-10-22; grilling Vibo/Pirp/Naturalis/Banner) |
| T-H06 | Revisión del esqueleto en dispositivos reales (matriz de `02` §5); lista de ajustes | T-A11 a T-A15, T-A17 | `docs/plan/tablero.md` | hecho (2026-10-22; re-check post T-A41 OK — scroll ida/vuelta, sin saltos/bandas, FPS OK; #1/#4/#5 quedan como seguimiento en T-A20/T-A42 + T-H12; T-A16 fuera de alcance) |
| T-A11 | Estructura del recorrido en DOM: capítulos con `data-chapter`, índice overlay, vista lista `/projects`, contacto siempre visible, eliminar `/skills` y decidir el destino de `/about`, `/experience`, `/contact` | T-A04, T-A06, ADR-007 | `src/pages/`, `src/components/journey/`, `src/components/layout/` | hecho (2026-10-21; PR #11) |
| T-A12 | Hero y manifiesto: copy de `05` §2, tags, frases, animación con SplitText, hero 100 % HTML (LCP), punto de entrada del hilo | T-A11 | `src/components/journey/Hero*`, `src/components/journey/Manifesto*`, `src/lib/site.ts` | hecho (2026-10-22; merge local #16) |
| T-A13 | Hilo conductor v1 (ADR-006: C desktop / A mobile), integrado en `Stage`, con API para que cada escena defina su `ThreadForm` | ADR-006, T-A06 | `src/experience/thread/`, `src/experience/Stage.tsx` (montaje) | hecho (2026-10-22; PR #14) |
| T-A14 | Greybox de las 4 escenas de primera línea (un agente por escena: `T-A14-vibo`, `-pirp`, `-naturalis`, `-banner`): beats, cámaras desktop/mobile, ritmo, en `/lab` y en el recorrido | T-A07, ficha validada (T-H05) | `src/scenes/<id>/` | hecho (ritmo/estructura 2026-10-22; **arte no aprobado** — ver T-H06/T-H12; continuidad T-A41 hecha; calidad final en T-A20/23/24/25 + T-A42) |
| T-A15 | Paletas por capítulo: interpolación de CSS variables con el progreso, cambio a tema claro en Naturalis, sincronía con el canvas | T-A06, T-A11 | `src/experience/palette.ts`, `src/styles/` (con permiso de plataforma); montaje mínimo en `Stage.tsx` | hecho (2026-10-22; main, sin PR por pedido) |
| T-A17 | Página de caso `/projects/[id]` con la estructura problema → enfoque → decisiones → desafíos → resultado → piezas → stack; header con escena o póster | T-A04, T-A06 | `src/pages/projects/[...slug].astro`, `src/components/project/` | hecho (2026-10-21; PR #12) |
| T-A41 | **Corregir continuidad** tras rechazo humano del 22/10: scroll reversible, cámara única, entradas por beat, fondo sin bandas y handoff entre escenas | T-A13, T-A15 | `src/experience/`, `src/scenes/{greybox,vibo,pirp,naturalis,banner-2}/`, `src/components/journey/` (extracción TS del manifiesto para desbloquear dev), `src/styles/palette.css`, evidencia y verificación | hecho (2026-10-22; cerrado por humano — resultado visual OK; rama `t/A41-continuidad-recorrido`; evidencia `evidencias/T-A41/revision`; hallazgo T-H06 #2 resuelto) |
| T-A42 | **Referencias de captura en escena:** en cada capítulo de primera línea, acceso inmediato a capturas reales (dispositivo 3D con UI texturizada y/o superficie flotante + carousel/lightbox DOM); no depender solo de la página de caso | T-A18, T-A19 (dispositivo), I-04 | `src/scenes/kit/` (pieza compartida), `src/components/journey/` (carousel), integración en `src/scenes/{vibo,pirp,naturalis,banner-2}/` | pendiente |


## F2 — Escena insignia, kits y backend del guía · Compuerta G2

> **G2:** Vibo terminada, aprobada por el humano y dentro de presupuesto en desktop y mobile; kits publicados con ejemplos en `/lab`; `/api/guide` responde con streaming y aplica los cuatro límites.

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H08 | Persona del guía, FAQs y aprobación de las ofertas proactivas (I-09); el agente propone borradores | ADR-008 | `src/content/guide/` | pendiente |
| T-H12 | Revisión de arte de cada escena al cerrar su greybox y antes del merge final (recurrente) | — | Comentarios en PR | hecho (grilling 2026-10-22: barra *cinematic stylized* cerrada, rúbrica técnica vinculante en `03` §8; revisiones recurrentes continuarán en cada PR de escena) |
| T-A18 | Kit de escena: HUD anclado a 3D, grafo de nodos/agentes, líneas con el shader del hilo, contadores, rig de cámara por beats; ejemplos en `/lab/kit`. **Vara:** piezas con look de producto, no placeholders grises. | T-A07, T-A13 | `src/scenes/kit/` (salvo dispositivos) | hecho (2026-10-22: rig de cámara por beats, `ThreadLine` con shader del hilo, `HudOverlay` 3D con bbox/pose/ángulo/callouts 44×44, `AgentGraph` con tira vertical mobile, `TelemetryDeck` con contadores `tabular-nums` y curva SVG progresiva, `ParticleField` GPU, 4 paletas de marca y `/lab/kit`; evidencia en `docs/plan/evidencias/T-A18/`) |
| T-A19 | Kit de dispositivos: `Phone`, `Laptop`, `Display` con proporción realista, materiales creíbles, pantalla texturizable y capas de UI flotantes (no look “juguete”) | T-A07, T-A09 | `src/scenes/kit/devices/`, `assets-src/kit/`, `public/models/kit/` (+ integración mínima lab: `KitShowcaseScene`/`KitLab`/`index`/`theme`) | hecho (2026-10-22: `Phone` 6,1", `Laptop` 14" con teclado fusionado en 1 malla y tapa articulada, `Display` 27" monitor/signage, 5 acabados PBR con PMREM de estudio compartido, `DeviceScreen` `.webp`/`.mp4` y capas de UI flotantes 3D; integrado en `/lab/kit`; evidencia en `docs/plan/evidencias/T-A19/`) |
| T-A20 | **Escena Vibo completa** (`03` §3.1, ADR-011 + enmienda estética): personaje **estilizado-realista** (proporciones humanas, materiales/luz de replay TV), overlays de detección, interacción, transición Vibo→Pirp; fuera de alcance: low-poly infantil / silueta de bloques | T-A14 (ritmo), T-A18, T-H07, ficha actualizada | `src/scenes/vibo/`, `public/models/vibo/`, `public/textures/vibo/` | listo |
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
| T-A30 | Viñeta Starbene | T-A18, T-A19 | `src/scenes/starbene/` | listo |
| T-A31 | Viñeta AGNT | T-A18, T-A19 | `src/scenes/agnt/` | listo |
| T-A32 | Viñeta Cielo y Mar | T-A18, T-A19 | `src/scenes/cielo-y-mar/` | listo |
| T-A33 | Archivo de tercera línea (2D interactivo) + páginas de caso breves | T-A11, T-A17 | `src/components/journey/Archive*` | pendiente |
| T-A34 | Quién soy + Hablemos + cierre cíclico hacia el hero | T-A13, T-A11 | `src/components/journey/About*`, `src/components/journey/Contact*` | pendiente |
| T-A35 | Imágenes de proyectos a `astro:assets` (AVIF/WebP responsive) + pósters definitivos generados con Playwright desde cada escena | T-A20 a T-A25 | `src/assets/projects/`, `public/posters/`, `scripts/posters.*` | pendiente |

## F5 — Pulido y lanzamiento · Compuerta G5

> **G5:** checklist de lanzamiento de `06` §8 completo. T-A16 es **opcional** (ADR-012).

| ID | Tarea y criterio de terminado | Depende de | Zona | Estado |
| --- | --- | --- | --- | --- |
| T-H13 | QA en dispositivos reales (matriz completa) | G4 | `docs/plan/tablero.md` | pendiente |
| T-H15 | Revisión final de textos y lanzamiento (dominio, variables de producción, `GUIDE_ENABLED`) | T-H13 | Vercel | pendiente |
| T-A16 | **(Opcional)** Nivel `static`: recorrido sin canvas con pósters, `prefers-reduced-motion`, `Save-Data`, sin WebGL. Diferido al final; no bloquea G1–G4 | T-A07, T-A11, preferible tras T-A35 (pósters definitivos) | `src/components/journey/Fallback*`, `public/posters/` | diferido / opcional (ADR-012; 2026-10-22) |
| T-A36 | Endurecimiento de rendimiento: auditoría de bundle, warmup de shaders, INP, pesos de assets, Lighthouse en todas las rutas | G4 | Según hallazgos (coordinar con el orquestador) | pendiente |
| T-A37 | Auditoría de accesibilidad: teclado, foco, contraste por paleta, lectores de pantalla; nivel `static` solo si T-A16 se hace | G4 | Según hallazgos | pendiente |
| T-A38 | SEO: metadatos por página, OG image por proyecto (render de su escena), sitemap, datos estructurados | G4 | `src/components/layout/Seo.astro`, `public/og/` | pendiente |
| T-A39 | Analítica: Vercel Web Analytics + Speed Insights + eventos del recorrido y del guía | G4 | `src/lib/analytics.ts`, layout | pendiente |
| T-A40 | QA automatizado: Playwright con capturas por capítulo en Chrome, WebKit y Firefox, desktop y mobile | G4 | `tests/` | pendiente |

---

## Bloqueos y preguntas

> Los agentes anotan acá lo que no pueden resolver solos. El humano responde a diario.

| Fecha | Tarea | Pregunta o bloqueo | Respuesta |
| --- | --- | --- | --- |
| 2026-10-22 | T-A16 | ¿Mantener el nivel `static` como requisito de G1 o diferirlo? | **ADR-012 (2026-10-22):** diferido a F5 como **opcional**; no bloquea G1–G4. Agentes: no tomar. |
| 2026-10-22 | T-H06 / T-H12 | **Feedback de sensaciones (parcial):** (1) Vibo too low-poly / look infantil → subir a realismo estilizado broadcast; (2) transiciones entre escenas principales bruscas; (3) rendimiento OK; (4) capturas/galería deben estar integradas en el mundo 3D o en superficie flotante con carousel; (5) las 4 escenas 3D lucen poco profesionales / de principiante. Rendimiento no es el problema; la vara de arte sí. | **Techo cerrado 2026-10-22:** *cinematic stylized* — humano creíble + luz/materiales premium, presupuesto web. No photoreal AAA. Ficha Vibo + ADR-011; T-A14 solo ritmo/estructura. **(2) cerrado con T-A41.** **Re-check dispositivos 2026-10-22:** continuidad + FPS OK (humano). **Grilling T-H12 cerrado:** rúbrica vinculante en `03` §8 aprobada; T-A20 desbloqueada a `listo`. Quedan (4) → T-A42 y revisiones en PRs. |
| 2026-10-21 | T-A08 | **ADR-006 lista para decidir:** A (filamento) y C (enjambre) están en `/lab/thread` del preview, con transición Vibo→Pirp y mobile. Las dos cumplen presupuesto en mobile emulado (CPU ×4); falta probar en iPhone y Android reales y elegir. El color de Pirp es provisional (`#ff5b4f`) hasta I-03. | **Cerrado 2026-10-22:** C en desktop, A en mobile (ADR-006). Acento Pirp `#7A1F2B` (fila siguiente). |
| 2026-10-22 | T-H03 / I-03 | **Acento Pirp:** ¿usar el bordó del cliente (`#7A1F2B`, sin nombrarlo) o definir un acento propio para portafolio/hilo? Hoy el hilo usa `#ff5b4f`. | **Bordó del cliente** (`#7A1F2B` / escala en `assets-src/pirp/brand/palette.json`); no nombrar al cliente. Aplicar en T-A13 (reemplazar `#ff5b4f`). |
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
| I-01 Narrativas primera línea | listo | T-H04 cerrado; MDX en `src/content/projects/` (vibo, pirp, naturalis, banner-2) |
| I-02 Datos reales de Vibo | listo para T-A20 | Overlays curados con bbox/pose reales (MVP `analyze-video-1`) + stats Firebase. Videos/frames en `assets-src/vibo/mvp-ref/`. `ui-mvp-public/` ignorado |
| I-03 Marcas y paletas | listo | Logos + `palette.json` + tipografías (enlaces GF) en `assets-src/{vibo,pirp,banner,naturalis}/brand/`; permiso sí; registro en `licencias.md`. Pirp: acento = bordó cliente `#7A1F2B` (sin nombrarlo) |
| I-04 Capturas en alta | listo (usar existentes) | Índice en `docs/plan/insumos/capturas.md` → `public/images/proyects/`; el humano puede reemplazar después |
| I-05 Assets Naturalis | pendiente | |
| I-06 Audio | pendiente | |
| I-07 Logos de clientes de Banner | nombres OK | Grido, Açaí, Marea, Diarco, Leroma autorizados en copy; faltan archivos de logo si se muestran en escena |
| I-08 Alcance de Pirp + dataset | parcial | Arranque en `assets-src/pirp/README.md`: escena ficticia, capturas UI sí, no nombrar clientes; dataset/textos → T-H10 |
| I-09 Persona y FAQs del guía | pendiente | |
| I-10 Narrativas segunda y tercera línea | pendiente | |
| I-11 Fotos personales | pendiente | Opcional |

### Alcance T-A13

Integración mínima en `Stage.tsx` incluida para cumplir el criterio explícito de T-A13. Sin cambios en contratos. ADR-006 cerrada: C desktop / A mobile.

### Alcance T-A15

`palette.ts` interpola `ScenePalette` del registro (y paleta de sitio en capítulos DOM) en el tramo final de cada capítulo (`progress ≥ 0.82`). Escribe CSS vars shadcn + `--journey-*`; Naturalis quita `.dark` (`scheme: light`). `Stage` monta el loop y pinta el fondo WebGL con `getLivePalette()` (prioridad −1, por encima de los rigs greybox). Sin cambios de contratos ni dependencias.

### Alcance T-A14

Greyboxes de las cuatro escenas integrados en el recorrido y en lab. La conexión mínima incluye `SceneDirector`, `deepLink`, rutas lab, contenedor DOM de escenas, registro, rig interno compartido, pósters y scripts/evidencia de QA. `ui-mvp-public/` se excluye de lint/typecheck como fuente local de referencia. Sin cambios de contratos ni dependencias.

**Cierre 2026-10-22 (humano):** ritmo/estructura/presupuestos aceptables; **arte no aprueba G1**. Transiciones (T-H06 #2) **resueltas en T-A41** y **re-verificadas en dispositivos** el mismo día (scroll ida/vuelta sin saltos ni bandas; FPS OK). G1 sigue condicionado a T-A42 y a la barra estética en T-A18→T-A20/23/24/25.

### Lista de ajustes T-H06 (2026-10-22)

| # | Hallazgo | Severidad | Tarea |
| --- | --- | --- | --- |
| 1 | Vibo luce low-poly / infantil; hace falta mayor realismo | alta | Ficha + ADR-011 enmendados → T-A20 (seguimiento; no bloquea cierre T-H06) |
| 2 | Transiciones entre escenas principales bruscas | alta | **hecho** — T-A41 + re-check dispositivos 2026-10-22 |
| 3 | Rendimiento general OK | ok | Confirmado de nuevo en re-check post T-A41 |
| 4 | Capturas poco accesibles; integrar en modelo/superficie + carousel | alta | T-A42 (seguimiento) |
| 5 | Las 4 escenas 3D poco impactantes / look principiante | alta | Vara de arte en T-A18/19 y escenas finales; greybox no cuenta como look final (T-H12) |

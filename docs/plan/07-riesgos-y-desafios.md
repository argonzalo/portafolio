# 07 — Desafíos y riesgos

## 1. Desafíos a resolver

Cada desafío indica dónde se resuelve (tarea o documento). Si aparece uno nuevo, se agrega acá y se crea su tarea.

### Técnicos

| # | Desafío | Cómo se resuelve | Dónde |
| --- | --- | --- | --- |
| D-01 | Mantener un único contexto WebGL vivo entre páginas con View Transitions sin fugas de memoria | Canvas en isla React con `transition:persist`; montaje/desmontaje de escenas con `dispose` verificado | T-A06 |
| D-02 | Sincronizar scroll, DOM, cámara, hilo y paleta sin tirones | Un único store de progreso escrito por ScrollTrigger y leído en `useFrame`; animaciones DOM solo con transform/opacity | T-A06, T-A15 |
| D-03 | Evitar picos al entrar a una escena (descarga + compilación de shaders) | Precarga un capítulo antes y `renderer.compile` en idle | T-A06, T-A07 |
| D-04 | Que el mismo diseño funcione en vertical y horizontal | Encuadres por breakpoint en cada beat, HUD por tap en mobile, fichas con diseño mobile | `03`, cada escena |
| D-05 | Elegir el nivel de calidad correcto sin benchmarks largos | Heurística inicial + `PerformanceMonitor` con histéresis | T-A07 |
| D-06 | Límite de memoria de iOS Safari | Presupuestos mobile estrictos, una escena + una entrante como máximo, prueba en iPhone real desde G0 | `02`, T-H06 |
| D-07 | Saltos de layout por la barra de direcciones móvil | `svh/dvh`, `ScrollTrigger.config({ ignoreMobileResize: true })`, `normalizeScroll` evaluado | T-A11 |
| D-08 | Texto legible y SEO con una experiencia mayormente visual | Todo el texto en DOM, vista lista, páginas de caso prerenderizadas | `01` §2, T-A11, T-A17 |
| D-09 | 10.000 pantallas (Banner) y miles de titulares (Pirp) en tiempo real | Instancing + atlas de texturas + estado en shader; layouts precalculados en build | T-A23, T-A25 |
| D-10 | Personaje de Vibo creíble sin el costo de un modelo con skinning | Keypoints reales como articulaciones instanciadas + huesos con shader de líneas | T-A20 |
| D-11 | Ciclo día/noche de Naturalis sin luces en tiempo real | Mezcla de dos lightmaps horneados | T-A24 |
| D-12 | Audio que no moleste ni rompa en iOS | Apagado por defecto, se activa con gesto, se silencia al ocultar la pestaña | T-A26 |
| D-13 | Recorrido "cíclico" sin romper el scroll ni la accesibilidad | El final reconstruye el estado del hero y ofrece volver arriba con una transición; no scroll infinito real | T-A34 |
| D-14 | Mantener las rutas viejas funcionando | Redirecciones existentes + nuevas (`pirp`) | T-A04 |

### Agente de IA

| # | Desafío | Cómo se resuelve | Dónde |
| --- | --- | --- | --- |
| D-15 | Detectar "detenido" y "trabado" sin falsos positivos molestos | Reglas simples con umbrales calibrables, reglas de cortesía, modo silencioso tras dos descartes, panel de debug para calibrar | T-A22, `04` §3 |
| D-16 | Costo y abuso | Límites por sesión, IP y globales; tope en OpenAI; kill switch; ofertas sin LLM | T-A21, `04` §5 |
| D-17 | Que responda bien sobre los proyectos sin inventar | Contexto generado desde las content collections + evals | T-A21, T-A28 |
| D-18 | Que sus acciones sobre la escena sean seguras | Lista cerrada de acciones validada contra el registro de escenas | T-A21, T-A27 |
| D-19 | Integrarlo visualmente sin un chatbot genérico | El guía es la punta del hilo conductor | T-A27, ADR-006 |

### Creativos y de contenido

| # | Desafío | Cómo se resuelve | Dónde |
| --- | --- | --- | --- |
| D-20 | Que escenas hechas por distintos agentes se sientan "una sola mente" | Hilo conductor + patrón de 5 beats + kit compartido + tokens de movimiento + revisión de arte del humano en cada escena | `00`, `03` |
| D-21 | Concepto propio sin copiar referencias | Fichas con análisis previo obligatorio; variantes best-of-N; el humano elige | `03` §7 |
| D-22 | Pasar de "tecnologías" a "forma de resolver problemas" en todos los textos | Esquema de contenido centrado en problema/enfoque/decisiones; plantilla de narrativa | `05` |
| D-23 | Mostrar proyectos con confidencialidad (Pirp activo, datos de Vibo, logos de clientes) | Datos ficticios o anonimizados, permisos explícitos registrados | `05` §4–5 |
| D-24 | Volumen de escenas vs. tiempo disponible | Niveles de inmersión, kit reutilizable, satélites dentro del mundo Banner, archivo 2D para tercera línea | `03` §1 |

### Coordinación

| # | Desafío | Cómo se resuelve | Dónde |
| --- | --- | --- | --- |
| D-25 | Varios agentes trabajando a la vez sin conflictos | Zonas de archivos, archivos calientes, contratos congelados, worktrees | `06` §4 |
| D-26 | Que los agentes no se bloqueen esperando al humano | Insumos pedidos con anticipación, placeholders, borradores generados por agentes | `05` §4 |
| D-27 | Que la revisión no sea el cuello de botella | Límite de 3–4 ejecutores, PRs chicos, capturas y métricas en cada PR, deep links de estado | `06` §5, §7 |

## 2. Registro de riesgos

Probabilidad (P) e impacto (I): A = alto, M = medio, B = bajo.

| # | Riesgo | P | I | Mitigación | Señal de alarma |
| --- | --- | --- | --- | --- | --- |
| R-01 | Mal rendimiento en mobile | A | A | Presupuestos desde F0, compuerta G1 con greybox, niveles de calidad, `static` siempre disponible | FPS < 50 en Android medio en cualquier compuerta |
| R-02 | Alcance creativo sin fin | A | A | Niveles de inmersión, timebox por escena (greybox 2–3 días, escena tier 1 completa ≤ 2 semanas), Vibo fija la vara | Una escena supera su timebox en un 50 % |
| R-03 | Cuello de botella en insumos del humano | A | A | Insumos front-loaded, borradores por agentes, placeholders, prioridad en el tablero | Tareas `bloqueado` por insumos más de 3 días |
| R-04 | Incoherencia visual entre escenas | M | A | Hilo conductor, kit, tokens, revisión de arte por escena | Feedback del humano "parece otro sitio" |
| R-05 | Conflictos de merge entre agentes | M | M | Reglas de `06` §4 | Más de un conflicto por semana en archivos calientes |
| R-06 | Abuso o costo del agente IA | M | A | Límites multicapa, tope de gasto, kill switch | Gasto diario > 50 % del tope |
| R-07 | Guía percibido como invasivo | M | M | Reglas de cortesía, modo silencioso, métricas de descarte | Tasa de descarte > 70 % |
| R-08 | Fugas de memoria con View Transitions + WebGL | M | A | Spike T-A06 como compuerta, verificación en overlay | Memoria GPU creciente tras navegar ida y vuelta 5 veces |
| R-09 | Quirks de Safari iOS (WebGL, audio, viewport) | A | M | Pruebas en iPhone real desde G0 | Cualquier recarga de pestaña en iOS |
| R-10 | Licencias de assets o permisos de clientes | M | M | Registro de licencias obligatorio; preferir CC0 | Asset sin registro en un PR |
| R-11 | Datos políticos sensibles (Pirp) | M | A | Dataset ficticio validado por el humano | Nombres reales en el dataset |
| R-12 | El modelo `OPEN_AI_MODEL` cambia, falla o es lento | M | M | Variable configurable + `OPEN_AI_MODEL_FALLBACK` + timeout con respuesta fija | Latencia del primer token > 2 s |
| R-13 | Bundle inflado por dependencias | M | M | Regla de dependencias, visualizador en CI | Núcleo 3D > 260 KB gzip |
| R-14 | El 3D tapa el mensaje comercial | M | A | Hero en HTML que comunica en 3 s, índice y contacto siempre visibles | En pruebas con terceros no saben qué ofrecés tras 10 s |
| R-15 | Decisión del hilo conductor demorada | M | A | Timebox: spike en F0, decisión antes de G1 | Llega F1 sin ADR-006 cerrado |

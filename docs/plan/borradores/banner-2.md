# Borrador — Banner 2.0

> T-A10 · id previsto: `banner-2` · tier 1 · Fuentes: Banner 2.0 V2 + contexto organización Banner Director, ficha `03` §3.4. App Etiquetas y Web Landing son satélites (proyectos aparte); aquí solo se menciona el vínculo operativo.

## Metadatos (para el frontmatter)

| Campo | Borrador |
| --- | --- |
| title | Banner 2.0 |
| client | Banner Director |
| organization | Banner Director (plataforma de Digital Signage; ver texto de organización en descripciones) |
| period | 2023 — 2026 |
| location | Córdoba, Argentina |
| status | activo |
| url | https://v2.bannerdirector.com |
| oneLiner | Una decisión de contenido llega con precisión a miles de pantallas en múltiples locales. |
| stack | Go, Vue, PostgreSQL, TypeScript, Kotlin, Docker, Kubernetes |

---

## 1. Problema (`problem`)

Las grandes cadenas y franquicias necesitan gobernar lo que muestran miles de pantallas en muchos locales: qué se ve, dónde y cuándo. Sin un sistema central con reglas finas y reproductores autónomos, la operación se vuelve intervenir equipo por equipo, con contenido desfasado, errores locales y nula escala.

`TODO(humano):` ¿el dolor más concreto era desactualización de precios/promos, falta de segmentación por región, o caídas/offline de equipos?

---

## 2. Enfoque (`approach`)

1. Separar “decidir el contenido” (panel + editor visual) de “ejecutarlo” (app Android en kiosco que descarga e interpreta plantillas sola).
2. Expresar la publicación como reglas de segmentación (región, fecha, entidad, criterios, etiquetas), no como una playlist única para todos.
3. Llevar cada nueva configuración por un broker de colas con workers y prioridades hasta el equipo correcto.
4. Normalizar medios (video, imagen, audio, videowall) en el servidor antes de distribuir, para que el dispositivo reproduzca con menos sorpresas.
5. Permitir convivencia con ajustes locales (p. ej. App Etiquetas vía Wi‑Fi) sin pisar la estrategia global.

`TODO(humano):` ¿la idea clave del 2.0 vs. la plataforma histórica fue el editor de plantillas, el modelo de servicios, o la escala del player?

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Tres pilares: panel Vue, backend Go/PostgreSQL, player Android/Kotlin | Cada capa tiene un trabajo distinto (diseño de contenido, orquestación, reproducción robusta en local). |
| Distribución asíncrona por colas en lugar de “empujar” en vivo a cada pantalla | Escala y tolerancia a redes inestables: el equipo se alinea cuando puede, sin bloquear el centro. |
| Editor visual de plantillas + reglas de segmentación | El operador piensa en negocio (quién ve qué y cuándo), no en archivos sueltos por equipo. |
| Procesador de medios dedicado (incl. videowall) | Homogeneiza formatos y sincronización antes de llegar al dispositivo. |
| Publicación de versiones de servicios y APKs desde el propio panel | Operar la flota sin un canal paralelo opaco. |

`TODO(humano):` priorizar 2–3 decisiones que fueron realmente tuyas / del equipo en el que estuviste; recortar el resto si no querés atribuirte toda la arquitectura.

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Escala: miles de equipos con configuraciones distintas | Mensajes de configuración por cola, workers con prioridad, reproductores autónomos. |
| Redes locales poco confiables / equipos offline | Descarga e interpretación local; el equipo sigue mostrando lo último válido hasta re-sincronizar. |
| Segmentación compleja (región, fecha, entidad, etiquetas) sin volver el panel inusable | Modelo de reglas en el editor + traducción a configuración por equipo. |
| Sincronización de videowall y medios heterogéneos | Normalización en servidor + sincronización opcional entre pantallas en el player. |

`TODO(humano):` ¿cuál fue el incidente o limitación real más dura (cola saturada, APK, editor, cliente grande)?

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| +600 | equipos funcionando *(dato del subproyecto Banner 2.0 en el portafolio vigente)* |
| ≈10.000 | equipos activos *(dato del texto de organización Banner Director)* |

`TODO(humano):` **contradicción a resolver.** El copy de organización habla de “casi 10.000 equipos activos”; el stat de Banner 2.0 dice “+600 equipos funcionando”. ¿Cuál aplica a 2.0, cuál a la plataforma histórica, y qué números son publicables? Clientes nombrables (Grido, Açaí, Marea, Diarco, Leroma) dependen de permiso I-07.

---

## 6. Confidencialidad / qué no se puede mostrar

- Logos de clientes: solo con permiso (I-07 / T-H11).
- Detalles internos de infraestructura, credenciales, métricas no públicas de un cliente.
- `TODO(humano):` qué capturas del editor son actuales y autorizadas.

---

## Vínculo con satélites (no son este caso)

- **App Etiquetas** — ajuste local por Wi‑Fi (p. ej. disponibilidad de productos) sin alterar la configuración global.
- **Web Landing** — puerta de entrada comercial de Banner Director.

En el recorrido inmersivo viven como beats extra del mundo Banner; en la vista lista son proyectos propios.

## Notas para T-H04

- Tono de escena: potencia y escala (“una decisión, diez mil pantallas”).
- El caso debe mostrar el camino decisión → reglas → colas → mapa de pantallas, no solo el editor.
- Conviene una frase corta “Sobre Banner Director” en `organization` para no perder el contexto de la plataforma histórica.

# Borrador — PIRP

> T-H04 · id: `pirp` · tier 1 · Cerrado en grilling 2026-10-21. Escena del portafolio: dataset **100 % ficticio** (I-08).

## Metadatos (para el frontmatter)

| Campo | Valor |
| --- | --- |
| title | PIRP |
| client | PIRP |
| period | 2026 |
| location | Córdoba, Argentina |
| status | activo |
| url | https://www.pirp.com.ar/inicio |
| oneLiner | Convierte el ruido de noticias y redes en una lectura clara de reputación y en estrategias concretas. |
| stack | NestJS, Next.js, Supabase |
| scene | pirp (datos de demo ficticios) |

---

## 1. Problema (`problem`)

Un candidato o su jefe de campaña no puede seguir a mano todo lo que sale en noticias y redes. Sin una lectura unificada, el equipo no sabe qué temas lo están definiendo, llega tarde a las crisis y acumula datos sin una estrategia clara.

---

## 2. Enfoque (`approach`)

1. Monitorear de forma continua (casi en vivo) la presencia del titular en noticias, X, Instagram y YouTube.
2. Unificar esas fuentes en una sola lectura de reputación y temas — no un feed por red.
3. Combinar un algoritmo de reputación (varios factores) con análisis de IA: resúmenes, tendencias e impacto de las temáticas actuales.
4. Cerrar con propuestas de estrategia accionables; el flujo natural es que el equipo de campaña decide.
5. Alertas cuando un tema pega en la reputación (mencionar de pasada en el copy; no es el claim central).

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Una sola lectura a partir de varias fuentes, no un feed por red | El valor es entender la reputación, no acumular menciones sueltas. |
| Primero mapa de temas y reputación; la estrategia después | Evita vender “la IA decide la campaña”; el producto diagnostica y propone. |
| Casi en vivo | En política, llegar tarde a un pico no sirve. |

Stack (NestJS / Next.js / Supabase) queda en metadatos, no en la narrativa.

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Separar qué temas te definen (y los picos) del ruido mediático diario | Algoritmo de reputación con múltiples factores + análisis de IA sobre tendencias e impacto. |
| Ruido, sarcasmo y contexto político | Mix: reglas/factores del algoritmo + pensamiento de la IA; el equipo interpreta y actúa. |
| Proyecto activo con usuarios de prueba | En el portafolio: capturas de UI sí; clientes reales no; escena con datos ficticios. |

---

## 5. Impacto (`impact`)

Solo cualitativo (sin números inventados):

| value | label |
| --- | --- |
| Temas + reputación | lectura clara del ruido mediático |
| Estrategias concretas | del diagnóstico a la acción |

La app expone alcance, menciones y puntaje de reputación, entre otros; no se publican cifras en el caso hasta tener métricas aprobadas.

---

## 6. Confidencialidad / qué no se puede mostrar (I-08)

| Ítem | ¿Se puede? |
| --- | --- |
| Nombrar el producto como PIRP | Sí |
| URL pública | Sí — https://www.pirp.com.ar/inicio |
| Capturas reales de la UI | Sí |
| Nombrar clientes o políticos como clientes | No (usuarios de prueba; producto en desarrollo) |
| Escena / demos del recorrido | **100 % ficticia** (políticos, medios y titulares inventados) |
| Guía IA | Foco en la solución (valor de negocio), no en detalle técnico |

---

## Notas de escena

- Tono: vértigo controlado → claridad (no cinismo político).
- El caso muestra: torrente → mapa de temas/reputación → estrategia; no un dashboard genérico.

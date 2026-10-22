# Borrador — Naturalis (Centro de estética)

> T-H04 · id: `naturalis` · tier 1 · Cerrado en grilling 2026-10-21. En uso; nombre y capturas OK; URL definitiva.

## Metadatos (para el frontmatter)

| Campo | Valor |
| --- | --- |
| title | Naturalis — Centro de estética |
| client | Naturalis |
| period | 2024 — 2026 |
| location | Buenos Aires, Argentina |
| status | activo |
| url | https://naturalis.vercel.app/ |
| oneLiner | Turnos y operación de un centro de estética: el cliente reserva, el equipo atiende sin Excel ni WhatsApp. |
| stack | Next.js, Firebase, Node |

---

## 1. Problema (`problem`)

Antes, la operación vivía en Excel y WhatsApp: sin catálogo claro de tratamientos, sin sincronización ni registro organizado, precios difíciles de mantener al día y comunicación repartida en hilos. Lo típico de un sistema de turnos improvisado —carga para el equipo y fricción para quien quiere reservar.

---

## 2. Enfoque (`approach`)

1. Una sola fuente de verdad del turno en dos piezas: web para clientes y Natuadmin para el equipo.
2. Reserva autónoma (tratamiento → turno → confirmación) que impacta la agenda real.
3. Automatizar lo repetitivo: turnos fijos, mails, estadísticas — mientras el equipo atiende.
4. Historial, notas y rankings confiables por cliente; blog y mailing en el mismo panel.
5. Hablar a ambos lados: el cliente reserva con claridad; el equipo opera sin pelearse con planillas.

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Dos apps (cliente + admin) sobre la misma base | Roles distintos; una sola agenda. |
| Automatizar confirmaciones, turnos fijos y stats | El dolor era administración repetitiva, no “tener una web bonita”. |
| Catálogo, precios y comunicación centralizados | Sacó del Excel/WhatsApp lo que el cliente y el equipo necesitan ver al día. |

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Turnos recurrentes y cancelaciones sin romper la agenda | Modelo de turnos fijos + jobs; mails y recálculo al cambiar. |
| Stats y estados inconsistentes | Recálculo idempotente ante alta/cambio/baja. |
| Salir de Excel + WhatsApp sin perder al equipo ni al cliente | Misma fuente de verdad en panel y web app. |

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| +900 | clientes registrados |
| +70 | turnos por mes |

Números confirmados por el humano (en uso). Nombre del centro y capturas: OK para mostrar.

---

## 6. Confidencialidad

| Ítem | ¿Se puede? |
| --- | --- |
| Nombre Naturalis + capturas actuales | Sí |
| URL definitiva | Sí — https://naturalis.vercel.app/ |
| Datos personales de clientes | No |

---

## Piezas (`parts`)

1. **Natuadmin** — panel del equipo.
2. **Web App** — reserva y agenda del cliente.

## Notas de escena

- Tono: calma, orden sin esfuerzo; contraste después de Pirp.
- Mostrar las dos piezas y la automatización “mientras el equipo descansa”.

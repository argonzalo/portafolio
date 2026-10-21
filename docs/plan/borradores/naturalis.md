# Borrador — Naturalis (Centro de estética)

> T-A10 · id previsto: `naturalis` · tier 1 · Fuentes: descripción unificada V2 + partes Natuadmin / Web App, ficha `03` §3.3.

## Metadatos (para el frontmatter)

| Campo | Borrador |
| --- | --- |
| title | Naturalis — Centro de estética |
| client | Naturalis |
| period | 2024 — 2025 |
| location | Buenos Aires, Argentina |
| status | finalizado |
| url | https://naturalis.vercel.app/ |
| oneLiner | Digitaliza turnos y operación de un centro de estética para que el equipo atienda, no administre. |
| stack | Next.js, Firebase, Node |

`TODO(humano):` confirmar `status` (¿sigue en uso el centro? ¿demo pública?). Ajustar oneLiner si el mensaje debe enfatizar al cliente final o al equipo interno.

---

## 1. Problema (`problem`)

Antes de la plataforma, la operación del centro vivía en agendas de papel, mensajes sueltos y cancelaciones difíciles de seguir. El equipo perdía tiempo en administración repetitiva —turnos fijos, confirmaciones, estadísticas— y los clientes no tenían un canal claro para reservar y ver su agenda sin depender del teléfono o del WhatsApp del local.

`TODO(humano):` corregir el “antes” real (¿Excel, papel, otra app?). ¿El dolor más fuerte era no-shows, doble reserva, o carga del personal?

---

## 2. Enfoque (`approach`)

1. Unificar el ciclo del turno en dos piezas conectadas: web para clientes y panel (Natuadmin) para el equipo, sobre la misma base de datos.
2. Hacer la reserva autónoma y guiada (tratamiento → turno → confirmación), de modo que cada alta impacte la agenda real del centro.
3. Automatizar lo repetitivo con funciones serverless: generación nocturna de turnos fijos, mails de confirmación/cancelación, recálculo de estadísticas por cliente.
4. Dar al equipo historial, notas por cliente y rankings de asistencia/cancelación confiables (no distorsionados por pocos datos).
5. Sumar blog y mailing en el mismo panel para comunicación sin otra herramienta.

`TODO(humano):` ¿la idea clave fue “una sola fuente de verdad para el turno” u otra (p. ej. rankings con intervalo de Wilson)?

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Dos apps (cliente + admin) compartiendo datos, no un monolito de pantalla única | Roles distintos: el cliente reserva; el equipo opera y comunica. |
| Triggers / jobs idempotentes para stats y mails ante cada cambio de turno | Evitar trabajo manual y estados inconsistentes cuando hay altas, cambios y bajas. |
| Rankings de asistencia/cancelación con intervalo de Wilson (límite inferior) | Un cliente con pocos turnos no distorsiona el ranking frente a uno con historial largo. |
| Firebase + Next.js para velocidad de entrega en un negocio chico/mediano | `TODO(humano):` confirmar si fue trade-off consciente vs. otro backend. |

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Turnos recurrentes y cancelaciones sin romper la agenda | Modelo de turnos fijos + generación anticipada por job nocturno; cancelaciones que disparan mail y recálculo. |
| Estadísticas desactualizadas o dobles si fallan los triggers | Recálculo idempotente ante alta/cambio/baja. |
| Comunicación fragmentada (blog, novedades, confirmaciones) | Editor enriquecido, mailing y mails transaccionales dentro de Natuadmin. |
| Imágenes del blog/contenido pesadas | Procesamiento de imágenes en servidor al publicar. |

`TODO(humano):` ¿hubo un desafío de adopción del equipo o de los clientes que merezca figurar?

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| +650 | clientes registrados |
| +60 | turnos por mes |

Datos del portafolio vigente (`projects.ts` / descripciones).

`TODO(humano):` confirmar si esos números siguen siendo los correctos y si son publicables tal cual; agregar otros si hay (reducción de no-shows, horas ahorradas, etc.).

---

## 6. Confidencialidad / qué no se puede mostrar

- Datos personales de clientes reales: no.
- `TODO(humano):` ¿el nombre del centro y capturas actuales se pueden mostrar sin restricción? ¿La URL de Vercel es la definitiva o solo demo?

---

## Piezas (`parts`) — recordatorio

1. **Natuadmin** — panel del equipo (turnos, tratamientos, horarios, personal, blog, mailing, stats).
2. **Web App** — reserva y agenda del cliente.

## Notas para T-H04

- Tono de escena: calma, orden sin esfuerzo; contraste deliberado después de Pirp.
- El caso debe mostrar las dos piezas y la automatización “mientras el equipo descansa”, no solo pantallas bonitas.

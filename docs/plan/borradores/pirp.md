# Borrador — Pirp

> T-A10 · id previsto: `pirp` (hoy en repo: `analisis-rep-politica`; redirección prevista en ADR / T-A03–T-A04) · tier 1 · Fuentes: descripción V2 del análisis de reputación política, ficha `03` §3.2. **Proyecto activo: la mayoría de los hechos concretos dependen de I-08 / T-H10.**

## Metadatos (para el frontmatter)

| Campo | Borrador |
| --- | --- |
| title | Pirp |
| client | `TODO(humano):` nombre comercial / cómo quiere figurar |
| period | 2026 |
| location | `TODO(humano)` |
| status | activo |
| url | `TODO(humano):` ¿pirp.com.ar u otra URL pública del producto? |
| oneLiner | Convierte el ruido de noticias y redes en una lectura clara de reputación y en estrategias concretas. |
| stack | NestJS, Next.js, Supabase |

`TODO(humano):` confirmar title (“Pirp” vs. nombre largo) y oneLiner sin sobreprometer capacidades aún no públicas.

---

## 1. Problema (`problem`)

Un político (o su equipo) no puede leer a mano todo lo que sale en noticias y redes. La conversación es demasiado rápida: entre el torrente de titulares y posts se pierde la tendencia, el pico de crisis y la oportunidad de responder con una estrategia a tiempo.

`TODO(humano):` ¿el usuario primario es el candidato, el jefe de campaña, la consultora? ¿El dolor era “llegamos tarde a la crisis”, “no sabemos qué temas nos definen”, u otro?

---

## 2. Enfoque (`approach`)

1. Monitorear de forma continua la presencia del titular en noticias y redes (no un informe semanal estático).
2. Clasificar y agrupar el flujo por sentimiento y por tema para pasar del torrente a un mapa legible.
3. Exponer reputación y tendencias (termómetro / curvas) de modo que un pico dispare atención.
4. Cerrar con propuestas de estrategia accionables a partir del diagnóstico — no solo dashboards.
5. `TODO(humano):` paso clave del producto que no está en la descripción corta (alertas, comparables, equipos, etc.).

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Enfocarse en reputación + estrategia, no solo en “escucha social” genérica | El valor para el usuario político es decidir qué hacer, no acumular menciones. |
| Stack app web (NestJS / Next.js / Supabase) para iterar producto activo | `TODO(humano):` confirmar por qué esta base y no otra. |
| `TODO(humano):` decisión de fuentes de datos / APIs / frecuencia de ingesta | Define frescura, costo y riesgos legales. |
| `TODO(humano):` qué se automatiza vs. qué queda en manos del analista humano | Evita sobrevender “la IA decide la campaña”. |

En el portafolio, los datos de escena serán **ficticios** (ficha `03` §3.2) para no exponer casos reales.

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Volumen y velocidad del flujo mediático | `TODO(humano):` cómo se prioriza, deduplica o resume en el producto. |
| Ruido, sarcasmo y contexto político en sentimiento | `TODO(humano):` enfoque real (modelos, reglas, revisión humana). |
| Confidencialidad: proyecto activo con clientes/políticos reales | Dataset ficticio en la escena; alcance narrativo acotado por I-08. |
| Separar señal de tendencia de un pico aislado | `TODO(humano):` criterio de alertas / umbrales si existe. |

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| `TODO(humano)` | titulares o medios monitoreados / latencia típica |
| `TODO(humano)` | resultado de negocio publicable (si lo hay) |

No hay stats en el portafolio vigente.

---

## 6. Confidencialidad / qué no se puede mostrar

- **Crítico (I-08):** qué se puede contar del producto en vivo, nombres de clientes, capturas reales, métricas internas.
- Escena y demos del portafolio: políticos, medios y titulares **inventados**; textos de estrategia validados por el humano (T-H10).
- `TODO(humano):` lista explícita de “sí se puede / no se puede” para copy, capturas y guía IA.

---

## Notas para T-H04

- Tono de escena: vértigo controlado → claridad (no cinismo político).
- Priorizar corrección humana de este borrador antes que los otros tres: es el de menor evidencia en el repo.
- Al migrar contenido (T-A04 / T-H04), renombrar id a `pirp` y mantener redirección desde `analisis-rep-politica`.

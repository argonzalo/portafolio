# Borrador — VIBO (Pádel Análisis)

> T-H04 · id: `vibo` · tier 1 · Cerrado en grilling 2026-10-21. Escena sin trayectoria 3D fiel (ADR-011). Material de ejemplo: MVP `ui-mvp-public/` / `assets-src/vibo/mvp-ref/` (T-H07).

## Metadatos (para el frontmatter)

| Campo | Valor |
| --- | --- |
| title | VIBO — Pádel Análisis |
| client | VIBO |
| period | 2025 — 2026 |
| location | Londres, Inglaterra |
| status | activo |
| url | https://vibopadel.com/ |
| oneLiner | Convierte el video de un partido de pádel en datos claros sobre cómo jugás. |
| stack | Python, GCP, Docker, Next.js, Firebase |

---

## 1. Problema (`problem`)

Un partido grabado con el celular no explica cómo jugaste. El jugador ve el video, pero no ve estilo, cobertura de cancha, reparto con el compañero, desgaste ni qué golpes dominan. Sin ese recorte, mejorar queda en intuición. No había un “antes” con otra herramienta: había video sin lectura.

---

## 2. Enfoque (`approach`)

1. Partir del video del partido y convertirlo en una lectura del juego (estilo, cobertura, golpes, desgaste), no en un highlight reel.
2. Hablar en metros y zonas reales de cancha, para que cobertura e intensidad tengan sentido.
3. Entender golpes y tramos de juego con visión e IA entrenada para pádel.
4. Mostrar métricas que el jugador entiende —ofensivo/defensivo, reparto con el compañero, zonas, agilidad— en una experiencia web.
5. Cerrar el circuito con aviso cuando el análisis está listo.

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Priorizar estilo, cobertura y golpes sobre un marcador genérico | El jugador ya sabe el resultado; le falta entender *cómo* jugó. |
| Demo web temprana antes de cerrar la plataforma | Validar qué datos importaban al jugador. |
| En el portafolio: overlays y métricas, sin trayectoria 3D fiel | ADR-011: la escena muestra el razonamiento del golpe, no una reconstrucción física completa. |

Detalle de pipeline/infra queda fuera de la narrativa del caso.

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Pasar de un video ruidoso a una lectura confiable del juego | Motor de visión + reglas de pádel; recorte de tramos sin juego; asignación de golpes al jugador correcto. |
| Que el resultado se entienda sin ser entrenador | Métricas en lenguaje de jugador y demo web para validar la lectura. |
| Material sensible en marketing/portafolio | Overlays y clips de referencia del MVP (`ui-mvp-public` / `assets-src/vibo/mvp-ref`); sin nombrar partners ni publicar precisión de modelos. |

---

## 5. Impacto (`impact`)

Solo cualitativo:

| value | label |
| --- | --- |
| Estilo + cobertura + golpes | lectura del juego que el video solo no da |
| Del partido al dato | el jugador sabe qué mirar para mejorar |

---

## 6. Confidencialidad / qué no se puede mostrar

| Ítem | ¿Se puede? |
| --- | --- |
| Nombrar VIBO y URL | Sí |
| Partners / datasets / precisión de modelos | No (no es necesario en el portafolio) |
| Clips / overlays de ejemplo | Sí, desde referencia MVP (`ui-mvp-public/lib` → curado en `assets-src/vibo/`) |
| Trayectoria 3D fiel en la escena | No (solo portafolio / ADR-011) |

---

## Piezas (`parts`)

1. **Pádel Video Análisis** — motor Python / GCP.
2. **Web Demo** — Next.js para validación inicial.

## Notas de escena

- Tono: asombro + precisión (“ciencia aplicada al deporte”).
- El caso muestra pipeline → golpe entendido → métricas, no solo la tarjeta final.

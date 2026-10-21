# Borrador — VIBO (Pádel Análisis)

> T-A10 · id previsto: `vibo` · tier 1 · Fuentes: descripciones originales (V2 + motor), ficha `03` §3.1.

## Metadatos (para el frontmatter)

| Campo | Borrador |
| --- | --- |
| title | VIBO — Pádel Análisis |
| client | VIBO |
| period | 2025 — 2026 |
| location | Londres, Inglaterra |
| status | activo |
| url | https://vibopadel.com/ |
| oneLiner | Convierte el video de un partido de pádel en datos claros sobre cómo jugás. |
| stack | Python, GCP, Docker, Next.js, Firebase |

`TODO(humano):` confirmar si el oneLiner debe hablar al jugador (“cómo jugás”) o al producto (“cómo juega cada jugador”).

---

## 1. Problema (`problem`)

Un partido grabado con el celular no explica cómo jugaste. El jugador (y el entrenador) ven el video, pero no ven estilo, cobertura de cancha, reparto con el compañero, desgaste ni qué golpes dominan. Sin ese recorte, mejorar queda en intuición.

`TODO(humano):` ¿el dolor principal era del jugador amateur, del entrenador, o de ambos? ¿Había un “antes” concreto (planillas, apps genéricas, nada)?

---

## 2. Enfoque (`approach`)

1. Partir del video del partido y convertirlo en eventos de juego (jugadores, pelota, golpes, tramos activos), no en un highlight reel.
2. Calibrar la cancha para pasar de píxeles a metros reales y poder hablar de cobertura, distancia e intensidad con sentido físico.
3. Inferir golpes con lógica de pádel (cruces de red, pose, zona) y clasificarlos, en lugar de etiquetar a mano cada impacto.
4. Traducir ese pipeline en métricas que el jugador entiende: estilo ofensivo/defensivo, reparto con el compañero, zonas, agilidad y desgaste a lo largo del partido.
5. Cerrar el circuito con una experiencia web (demo primero, producto después) y aviso cuando el análisis está listo.

`TODO(humano):` ¿qué idea fue “la que otros no veían”? (p. ej. priorizar estilo y cobertura sobre estadísticas de score genéricas.)

---

## 3. Decisiones (`decisions`)

| decision | why |
| --- | --- |
| Pipeline asíncrono en la nube (GPU) en vez de análisis solo en el dispositivo | El video es pesado; hace falta normalización, varias pasadas de visión y modelos entrenados sin bloquear al usuario. |
| Homografía / calibración de cancha como paso explícito | Sin metros reales, cobertura e intensidad son decorativas. |
| Clasificación de golpes con reglas de pádel + pose (no solo “hay un impacto”) | El valor está en *qué* golpe fue y en qué zona, no en contar contactos. |
| Demo web temprana para alinear producto antes de la plataforma definitiva | Validar qué datos y visualizaciones importaban antes de cerrar el alcance del motor. |

`TODO(humano):` ¿cuál de estas (u otra) fue realmente la decisión más costosa o polémica? ¿Hubo rechazo consciente de reconstruir trayectoria 3D fiel en el producto o solo en la escena del portafolio (ADR-011)?

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| Pelota y reflejos: detecciones ruidosas, trayectorias rotas | Filtros (p. ej. Kalman), descarte de reflejos/estáticos y unificación de trayectorias en el motor. |
| Separar juego válido de tiempos muertos / fuera de punto | Recorte automático de tramos sin juego antes de acumular métricas. |
| Asignar un golpe al jugador correcto sin etiquetado manual | Buscar el impacto hacia atrás desde el cruce de red y asignarlo al jugador más cercano; refinar con zona y pose. |
| Coste y latencia del procesamiento en GPU | Contenedores en GCP, subida por URL firmada, resultados fragmentados y notificación push al terminar. |

`TODO(humano):` ¿qué fue lo *más* difícil en la práctica (dato, modelo, producto, despliegue)? Corregir o reemplazar filas.

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| `TODO(humano)` | métrica de uso o retención (partidos analizados, usuarios activos, etc.) |
| Estilo + cobertura + golpes | lectura del juego que el video solo no da (cualitativo; pulir wording) |

Datos del portafolio vigente: proyecto activo; no hay stats numéricas en `projects.ts` para Vibo.

`TODO(humano):` números reales que se puedan publicar; si no hay, dejar impacto cualitativo aprobado.

---

## 6. Confidencialidad / qué no se puede mostrar

- En la escena del portafolio: overlays y métricas a partir de export anonimizado (I-02 / T-H07); sin trayectoria 3D fiel (ADR-011).
- `TODO(humano):` ¿se pueden nombrar partners, datasets de entrenamiento o precisión de modelos? ¿clips de partidos reales en marketing/portafolio?

---

## Piezas (`parts`) — recordatorio

1. **Pádel Video Análisis** — motor Python / GCP.
2. **Web Demo** — Next.js para validación inicial.

## Notas para T-H04

- Tono de escena: asombro + precisión (“ciencia aplicada al deporte”), no hype vacío.
- El caso debe mostrar el *razonamiento* (pipeline → golpe entendido), no solo la tarjeta final de métricas.

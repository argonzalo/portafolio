# Borrador — Banner 2.0

> T-H04 · id: `banner-2` · tier 1 · Cerrado en grilling 2026-10-21. Rol del autor: frontend completo; resto del sistema: participación sin toma de decisión.

## Metadatos (para el frontmatter)

| Campo | Valor |
| --- | --- |
| title | Banner 2.0 |
| client | Banner Director |
| organization | banner-director |
| period | 2023 — 2026 |
| location | Córdoba, Argentina |
| status | activo |
| url | https://v2.bannerdirector.com |
| oneLiner | Una decisión de contenido llega con precisión a miles de pantallas en múltiples locales. |
| stack | Go, Vue, PostgreSQL, TypeScript, Kotlin, Docker, Kubernetes |

---

## 1. Problema (`problem`)

Las cadenas necesitan gobernar qué se ve en miles de pantallas: precios y promos al día, segmentación por región/local, y equipos que sigan operando offline. La generación anterior se quedaba corta: interfaz poco intuitiva y poco moderna, funcionalidades básicas frente a lo que el negocio pedía, y una sincronización que no estaba a la altura (hoy, actualización más inmediata vía sockets). Intervenir equipo por equipo no escala.

---

## 2. Enfoque (`approach`)

1. Rediseño completo: interfaz, arquitectura backend y app Android — todo de nuevo, con tecnologías modernas.
2. Separar “decidir el contenido” (panel + editor visual) de “ejecutarlo” (player Android autónomo).
3. Publicar con reglas de segmentación (región, fecha, entidad, criterios, etiquetas).
4. Llevar la configuración hasta cada equipo con robustez de red; sincronización más inmediata donde aplica.
5. Convivencia con ajustes locales (App Etiquetas) sin pisar la estrategia global.

---

## 3. Decisiones (`decisions`)

Narrativa alineada al rol (encargado del frontend de punta a punta; participación en el resto sin decisión final):

| decision | why |
| --- | --- |
| Interfaz y editor rediseñados para operadores de negocio | La versión previa era poco intuitiva; el valor se juega en decidir contenido con claridad. |
| Editor visual de plantillas + reglas de segmentación en el panel | El operador piensa en quién ve qué y cuándo, no en archivos sueltos por equipo. |
| Contar el 2.0 como reconstrucción completa (UI + backend + Android) | El mensaje del caso es el salto de producto, sin atribuir al autor las decisiones de arquitectura ajenas al frontend. |

---

## 4. Desafíos (`challenges`)

| challenge | solution |
| --- | --- |
| UX de un panel potente sin volverlo inusable | Rediseño de interfaz y flujos del editor/segmentación a cargo del frontend. |
| Escala y redes poco confiables (lado plataforma) | Players autónomos + distribución asíncrona; el caso lo describe sin detallar infra. |
| Migración gradual desde la plataforma histórica | Aún se migran equipos a 2.0; el copy distingue flota histórica vs. 2.0. |

---

## 5. Impacto (`impact`)

| value | label |
| --- | --- |
| +800 | equipos en Banner 2.0 (migración en curso) |
| ≈10.000 | equipos activos en Banner Director (plataforma histórica / flota total) |

Clientes nombrables (permiso humano): Grido, Açaí, Marea, Diarco, Leroma.

---

## 6. Confidencialidad

| Ítem | ¿Se puede? |
| --- | --- |
| Nombrar clientes (Grido, Açaí, Marea, Diarco, Leroma) | Sí |
| Capturas actuales del editor | Sí |
| Detalles internos de infra / credenciales | No |

---

## Rol (para no sobre-atribuir)

- **Frontend:** encargado de forma completa e íntegra.
- **Resto del sistema:** participación en el armado, sin toma de decisión.

## Vínculo con satélites

- **App Etiquetas** / **Web Landing** — proyectos aparte; en el recorrido, beats del mundo Banner.

## Notas de escena

- Tono: potencia y escala (“una decisión, miles de pantallas”).
- Camino: decisión → reglas → distribución → mapa de pantallas; no solo el editor.

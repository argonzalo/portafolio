# 06 — Coordinación entre humano y agentes

> Objetivo: que varios agentes y el humano avancen a la vez sin pisarse, sin esperar de más y sin perder coherencia. Todo agente lee este documento antes de tomar una tarea.

## 1. Roles

| Rol | Quién | Responsabilidades | No hace |
| --- | --- | --- | --- |
| **Director** | Humano | Cierra decisiones (ADR), valida fichas de escena, aprueba compuertas, aporta insumos (narrativas, datos, assets, permisos), prueba en dispositivos reales, configura cuentas y secretos | No implementa plataforma ni escenas (salvo que quiera) |
| **Orquestador** | Un agente en un chat persistente, supervisado por el humano | Mantiene `tablero.md`, redacta briefs, lanza agentes ejecutores, revisa PRs contra la definición de terminado, resuelve conflictos de merge, mantiene la coherencia de los documentos | No toma decisiones de producto sin el humano |
| **Ejecutores** | Agentes de código (uno por tarea) | Implementan **una** tarea en su rama/worktree, dentro de su zona de archivos, y abren un PR con evidencia | No tocan archivos fuera de su zona, no agregan dependencias, no cambian contratos |

## 2. Fuentes de verdad

| Qué | Dónde |
| --- | --- |
| Qué es el producto | `docs/descripcion-de-producto.md` |
| Cómo se construye | `docs/plan/*.md` |
| Qué hay que hacer y quién lo hace | `docs/plan/tablero.md` |
| Qué se decidió y por qué | `docs/plan/decisiones.md` |
| Contratos de código | `src/experience/types.ts` (desde G0) |

Si un agente encuentra una contradicción entre documentos, **no elige**: la anota en la sección "Bloqueos y preguntas" del tablero y sigue con lo que no depende de eso.

## 3. Flujo de una tarea

```text
pendiente → listo → en curso → en revisión → hecho
                       └──► bloqueado (con motivo y qué lo destraba)
```

1. **Tomar:** solo tareas en estado `listo` (dependencias cumplidas; el orquestador pasa de `pendiente` a `listo` cuando se cumplen). Cambiar a `en curso` con el nombre del agente o del chat.
2. **Aislar:** crear rama `t/<ID>-<slug>` (por ejemplo `t/A20-escena-vibo`). Para agentes locales en paralelo, usar un **git worktree por agente**; los agentes en la nube ya trabajan aislados.
3. **Contexto mínimo:** leer el brief de la tarea, el documento del plan que corresponde y el código de su zona. No hace falta leer todo el plan.
4. **Implementar** dentro de la zona de archivos de la tarea.
5. **Verificar:** `npm run check` y, si es una escena o algo visual, capturas desktop/mobile (deep link de estado) y la tabla de métricas.
6. **PR** con la plantilla (`.github/pull_request_template.md`). Squash merge a `main` tras la revisión.
7. **Cerrar:** el orquestador mueve la tarea a `hecho` y destraba las que dependían de ella.

## 4. Reglas anti-conflicto

- **Zonas de archivos:** cada tarea declara en el tablero qué carpetas puede modificar. Dos tareas en curso no comparten zona.
- **Archivos calientes** (solo los modifican tareas de plataforma o el orquestador): `package.json`, `package-lock.json`, `astro.config.ts`, `src/content.config.ts`, `src/experience/**`, `src/scenes/registry.ts`, `src/styles/globals.css`, `AGENTS.md`, `docs/plan/decisiones.md`.
- **¿Una escena necesita algo de un archivo caliente?** Se anota en el tablero como pedido (por ejemplo "registrar escena vibo en registry"). Excepción permitida: agregar la **propia** entrada de la escena en `registry.ts`, en una línea, al final del PR.
- **Contratos congelados** desde G0: cambiarlos requiere un ADR aprobado y una tarea de plataforma.
- **Dependencias nuevas:** solo por pedido justificado, las agrega una tarea de plataforma.
- **PRs chicos:** idealmente < 600 líneas cambiadas (sin contar assets). Una escena grande se parte en greybox → assets → interacción → integración.
- **Rebase frecuente** sobre `main` (al menos al empezar cada sesión de trabajo).

## 5. Paralelismo recomendado

**Límite de trabajo en curso:** 3–4 agentes ejecutores a la vez + el humano. Más que eso satura la revisión, que es el verdadero límite.

| Fase | Carriles en paralelo |
| --- | --- |
| F0 | Plataforma (A01→A02, A03) · Contenido (A04, A10) · Runtime (A05→A06→A07) · Creativo (A08) · Assets (A09) · Humano (H01–H05) |
| F1 | Recorrido DOM (A11, A12) · Runtime visual (A13, A15, A16) · Greybox ×4 (A14, idealmente un agente por escena) · Caso (A17) |
| F2 | Kit (A18, A19) · Vibo (A20, empieza con greybox ya aprobado y avanza con el kit) · Guía (A21→A22) |
| F3 | Pirp (A23) · Naturalis (A24) · Banner (A25) · Guía UI (A27) — un agente por escena |
| F4 | Viñetas (A29–A32) · Archivo (A33) · Quién soy y contacto (A34) · Imágenes y pósters (A35) |
| F5 | Rendimiento (A36) · Accesibilidad (A37) · SEO (A38) · Analítica (A39) · QA (A40) |

**Exploración creativa:** para greyboxes de primera línea y para el hilo conductor, lanzar 2–3 variantes en worktrees aislados (best-of-N) y que el humano elija. Para tareas de plataforma, una sola implementación.

## 6. Ritmo de sincronización (asincrónico)

- **Diario (10–15 min del humano):** revisar el tablero, contestar "Bloqueos y preguntas", aprobar o pedir cambios en PRs con capturas, cerrar decisiones pendientes.
- **Por compuerta:** sesión de revisión en dispositivos reales con el checklist de la compuerta; el resultado queda en el tablero (aprobado / ajustes con tareas nuevas).
- **El orquestador** al inicio de cada sesión: lee el tablero, re-prioriza según la ruta crítica (README §5), lanza ejecutores para las tareas `listo` sin dueño.

## 7. Definición de terminado (DoD)

**Toda tarea**

- [ ] `npm run check` pasa (lint, typecheck, build, presupuestos de assets).
- [ ] Sin errores ni warnings nuevos en consola.
- [ ] Solo se modificó la zona de archivos declarada.
- [ ] Documentación del plan actualizada si cambió algo de lo descrito.
- [ ] Tablero actualizado.

**Además, toda escena o pieza visual**

- [ ] Capturas desktop (1440×900) y mobile (390×844) de cada beat, con su deep link.
- [ ] Métricas: FPS desktop y mobile emulado (CPU ×4), draw calls, triángulos, peso de assets por nivel. Dentro de presupuesto (`02`).
- [ ] Funciona en `high`, `medium`, `low` y tiene póster para `static`.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Interacciones con equivalente táctil.
- [ ] Al salir de la escena, geometrías y texturas vuelven a su valor base (overlay `?debug`).
- [ ] Assets de terceros registrados en `licencias.md`.

**Además, todo lo que toca el agente de IA**

- [ ] La API key no aparece en ningún bundle de cliente (verificado buscando en `dist/`).
- [ ] Límites probados (sesión, IP, global, kill switch).
- [ ] Evals pasan.

## 8. Checklist de lanzamiento (G5)

- [ ] Presupuestos de `02` cumplidos en la matriz de dispositivos.
- [ ] Lighthouse mobile: Performance ≥ 90, Accesibilidad ≥ 95, SEO ≥ 95, Best Practices ≥ 95.
- [ ] Recorrido completo sin errores en Chrome, Safari (macOS e iOS), Firefox y Chrome Android.
- [ ] Nivel `static` completo y navegable.
- [ ] Todos los proyectos accesibles desde la vista lista y con página de caso.
- [ ] OG image por proyecto, sitemap, robots, metadatos.
- [ ] Guía con límites activos, tope de gasto en OpenAI configurado, `GUIDE_ENABLED` verificado.
- [ ] Analítica y Speed Insights activos.
- [ ] Licencias y permisos registrados.
- [ ] Redirecciones de rutas viejas verificadas.

## 9. Cómo lanzar un agente

Usar el prompt de [`plantillas/prompt-agente.md`](./plantillas/prompt-agente.md), completando el ID de tarea. Para tareas grandes o ambiguas, el orquestador primero escribe un brief con [`plantillas/brief-tarea.md`](./plantillas/brief-tarea.md) en `docs/plan/briefs/<ID>.md`.

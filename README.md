# Portafolio

Sitio personal donde un **recorrido continuo** presenta, proyecto por proyecto, cómo se piensan y resuelven problemas reales: cada proyecto tiene su propio mundo 3D/2D, unidos por un hilo visual, y un agente de IA acompaña la sesión sin interrumpir.

- **Qué es el producto y por qué:** [`docs/descripcion-de-producto.md`](./docs/descripcion-de-producto.md)
- **Cómo se construye:** [`docs/plan/README.md`](./docs/plan/README.md) (índice del plan)
- **Qué falta y quién lo hace:** [`docs/plan/tablero.md`](./docs/plan/tablero.md)
- **Antes de tocar código:** [`docs/plan/06-coordinacion.md`](./docs/plan/06-coordinacion.md) y [`AGENTS.md`](./AGENTS.md)

> `docs/core.md` está **obsoleto**: no seguirlo.

## Requisitos

- Node.js `>= 22.12.0`
- npm

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:3010
```

El sitio funciona sin variables de entorno. Solo el guía de IA y los límites necesitan secretos: copiá `.env.example` a `.env` y completá lo que corresponda.

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en el puerto **3010**. |
| `npm run build` | Build de producción (`dist/`). |
| `npm run preview` | Sirve el build de producción. |
| `npm run lint` | ESLint sobre todo el repo. |
| `npm run format` | Prettier sobre `ts`, `tsx` y `astro`. |
| `npm run typecheck` | Chequeo de tipos con `astro check`. |
| `npm run images:webp` | Convierte las imágenes de `public/images/proyects` a WebP (calidad 82) y reporta el ahorro. `--keep` conserva los originales. |
| `npm run astro` | CLI de Astro para comandos puntuales (`astro add`, `astro sync`…). |

## Variables de entorno

El esquema tipado vive en `astro.config.ts` (`astro:env`, contexto `server` / acceso `secret`). Todas son opcionales: el guía se apaga con `GUIDE_ENABLED=false`. Ver [`docs/plan/04-agente-ia.md`](./docs/plan/04-agente-ia.md) §2.

| Variable | Para qué |
| --- | --- |
| `OPEN_AI_API_KEY` | Clave de OpenAI (solo servidor). |
| `OPEN_AI_MODEL`, `OPEN_AI_MODEL_FALLBACK` | Modelo principal y de respaldo. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Redis de Upstash para los límites del guía. |
| `GUIDE_ENABLED`, `GUIDE_DAILY_BUDGET_USD`, `GUIDE_SESSION_SECRET` | Interruptor, tope diario de gasto y firma de sesión. |

`.env`, `.env.local` y variantes están en `.gitignore`; **solo se versiona `.env.example`**. En Vercel se configuran en *Project → Settings → Environment Variables* (Upstash las inyecta desde el Marketplace).

## Assets

- **Fuentes** (`assets-src/`, fuera de Git según ADR-010): modelos, texturas y videos de origen. El humano las respalda aparte; en el repo solo vive `assets-src/README.md` con la convención de carpetas.
- **Salidas optimizadas** (`public/models/`, `public/textures/`, `public/images/`, `public/posters/`): lo único que se versiona y lo que consume el sitio.
- `proyectos-facu/` y `proyectos-facu.zip` se retiraron (ADR-009); siguen en el historial de Git si hicieran falta.

## Estructura

```text
src/
  pages/        rutas (home, /projects, /api/health, 404…)
  layouts/      BaseLayout, ProjectLayout
  components/   UI (React + Astro)
  content/      content collections de proyectos
  lib/          helpers (site, projects, stack, motion, webgl…)
  styles/       Tailwind y tokens globales
public/         imágenes, fuentes, modelos, robots.txt
scripts/        utilidades de build/asset pipeline
docs/plan/      plan de ejecución, tablero, ADR y plantillas
```

## Despliegue

Adaptador de Vercel (`@astrojs/vercel`). El sitio es **estático por defecto**; las rutas API optan por render en servidor con `export const prerender = false`. Las redirecciones de rutas viejas se declaran en `astro.config.ts`.

Preview de producción: <https://portafolio-coral-zeta-55.vercel.app>

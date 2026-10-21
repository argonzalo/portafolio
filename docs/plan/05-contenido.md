# 05 — Contenido

## 1. Modelo de contenido de proyecto

Cada proyecto pasa a ser un archivo `src/content/projects/<id>.mdx` validado con Zod en `src/content.config.ts`. El humano edita texto en MDX (más cómodo que TypeScript) y los agentes consumen datos tipados. El esquema pone el problema en el centro; el stack queda al final.

```ts
const project = z.object({
  id: z.string(),                       // coincide con ProjectId
  title: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  order: z.number(),
  client: z.string().optional(),        // "VIBO", "Banner Director"…
  organization: z.string().optional(),  // referencia a un registro de organización (Banner Director)
  period: z.string(),
  location: z.string().optional(),
  status: z.enum(["activo", "finalizado", "demo", "cancelado"]),
  url: z.string().url().optional(),

  // Mensaje
  oneLiner: z.string().max(110),        // qué resuelve, en una línea (índice, archivo, guía)
  problem: z.string(),                  // el problema real, en lenguaje de negocio
  approach: z.array(z.string()).min(2).max(5),     // cómo lo pensé: pasos o ideas clave
  decisions: z.array(z.object({ decision: z.string(), why: z.string() })).max(5),
  challenges: z.array(z.object({ challenge: z.string(), solution: z.string() })).max(5),
  impact: z.array(z.object({ value: z.string(), label: z.string() })).default([]), // "+650", "clientes registrados"

  // Respaldo
  parts: z.array(partSchema).default([]),          // piezas de una solución unificada (app + web)
  stack: z.array(z.string()),
  notes: z.array(z.string()).default([]),          // avisos tipo "imágenes ilustrativas"
  media: z.array(mediaSchema).default([]),

  // Experiencia
  scene: z.string().optional(),                    // id de SceneDefinition si tiene escena
  guide: z.object({
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }).default({}),
})
```

El cuerpo del MDX es el caso completo para `/projects/<id>`. La migración (T-A04) traslada los datos actuales de `src/lib/projects.ts` (incluidas las Versiones 2 de las descripciones) y deja los campos nuevos con borradores marcados `TODO(humano)`.

### 1.1 Implementación (T-A04)

Los esquemas concretos viven en `src/content/schema.ts` y se conectan a las colecciones en `src/content.config.ts`:

- `projects`: `src/content/projects/<id>.mdx`, un archivo por proyecto.
- `organizations`: `src/content/organizations/<id>.md`, registros referenciados desde el campo `organization` (por ejemplo `banner-director`).

Además del esquema de arriba se definen:

```ts
const partSchema = z.object({
  title: z.string(),
  period: z.string(),
  stack: z.array(z.string()).default([]),
  description: z.string(),
  url: z.url().optional(),
  stats: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]), // avisos: confidencialidad, imágenes ilustrativas…
})

const mediaSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})

const organizationSchema = z.object({
  name: z.string(),
  summary: z.string(),
  description: z.string(),
  period: z.string(),
  location: z.string().optional(),
})
```

Los avisos que antes eran un string (`alert`) pasan a ser `notes: string[]` en el proyecto y en cada pieza; la fachada los vuelve a unir para las páginas actuales.

**Fachada temporal:** `src/lib/projects.ts` conserva la API síncrona que usan las páginas (`projects`, `getSortedProjects`, `getProjectById`, `getProjectRoutes`, `getOrganization`, `getProjectCover`, `getProjectInitial`). Lee el frontmatter con `import.meta.glob` para no obligar a reescribir páginas antes de T-A11/T-A17, y no importa `astro:content` porque la API debe ser síncrona (`getStaticPaths`, listados). Cuando esas tareas consulten las colecciones con `getCollection`/`render`, la fachada se elimina.

## 2. Presentación personal (set de textos base)

| Pieza | Texto base (de la descripción) |
| --- | --- |
| Cabecera | **Tu próxima gran idea hecha realidad** |
| Descripción | Diseño y construyo productos digitales, automatizaciones y soluciones de inteligencia artificial para negocios que estén listos para un siguiente paso. |
| Frase puente | Desde ideas ambiciosas a productos funcionales |
| Método (manifiesto) | Pienso productos · Diseño experiencias · Construyo tecnología |
| Tags | Software · Inteligencia artificial aplicada · Automatización · Software customizado · Productos conectados |

Cambios en el sitio que esto implica:

- `src/lib/site.ts`: `tagline` y `hero` se reescriben; desaparece `skills` del hero.
- Se elimina la página `/skills` y el componente de habilidades del hero.
- "Sobre mí" conserva la parte humana actual (curiosidad, música, deporte) reescrita con el mismo criterio; el pádel funciona como puente natural con Vibo.
- La experiencia laboral (`src/lib/experience.ts`) deja de ser una sección protagonista; queda como dato en "Quién soy" y en los casos.

## 3. Plantilla de narrativa por proyecto (para el humano)

Responder en lenguaje simple; el agente lo pule después. 15–25 minutos por proyecto de primera línea.

1. **¿Qué le dolía al cliente o al usuario?** (antes de que existiera la solución)
2. **¿Qué viste que otros no?** (la idea clave del enfoque)
3. **¿Cuáles fueron las 2–3 decisiones más importantes y por qué?**
4. **¿Qué fue lo más difícil y cómo lo destrabaste?**
5. **¿Qué cambió después?** (números si los hay; si no, cambios concretos)
6. **¿Qué no se puede mostrar o contar?** (confidencialidad)

Flujo optimizado: el agente genera un borrador desde las descripciones existentes (T-A10), el humano corrige y agrega lo que solo él sabe (T-H04). Corregir un borrador es mucho más rápido que escribir desde cero.

## 4. Insumos que aporta el humano

Este es el cuello de botella real del proyecto. Se piden **antes** de que la tarea que los necesita empiece; mientras tanto los agentes trabajan con placeholders.

| ID | Insumo | Para | Necesario antes de | Prioridad |
| --- | --- | --- | --- | --- |
| I-01 | Narrativas de primera línea (plantilla §3) | Vibo, Pirp, Naturalis, Banner 2.0 | F2 | Alta |
| I-02 | Export anonimizado de `analysisResults` (Firebase `vibo-beta-2e60f`) + JSON curado de overlays (bboxes, pose keypoints en la ventana del golpe) + métricas de un jugador. No se exige trayectoria 3D fiel (ADR-011) | Vibo | Inicio de T-A20 | **Crítica** |
| I-03 | Paleta, logo y permiso de uso de marca | Vibo, Pirp, Banner, Naturalis | Fichas validadas | Alta |
| I-04 | Capturas actualizadas en alta resolución (desktop y mobile) | Todos los de primera y segunda línea | Kit de dispositivos | Media |
| I-05 | Assets 3D de Naturalis (o aprobación de assets con licencia propuestos por el agente) | Naturalis | Fin del greybox de Naturalis | Alta |
| I-06 | Pista de audio con licencia | Naturalis (y opcional otras) | F3 | Baja |
| I-07 | Permiso para mostrar logos de clientes de Banner (Grido, Açaí, Marea, Diarco, Leroma) | Banner 2.0 | F3 | Media |
| I-08 | Qué se puede contar de Pirp (proyecto activo) y validación del dataset ficticio | Pirp | Inicio de T-A23 | Alta |
| I-09 | Persona del guía, FAQs, aprobación de ofertas proactivas | Agente IA | F3 | Media |
| I-10 | Narrativas de segunda y tercera línea (versión corta: preguntas 1, 2 y 5) | Viñetas y archivo | F4 | Media |
| I-11 | Fotos personales nuevas (si se quiere renovar) | Quién soy, OG | F4 | Baja |

## 5. Registro de licencias y permisos

Todo asset de terceros (modelos, texturas, HDRI, audio, tipografías) y todo permiso de cliente se anota en `docs/plan/licencias.md` (se crea con el primer asset) con: archivo, fuente, licencia, atribución requerida y fecha. Sin registro, el asset no se mergea.

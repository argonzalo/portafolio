import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"

import { organizationSchema, projectSchema } from "./content/schema"

/**
 * Contenido del sitio (ADR-003). Los esquemas viven en `src/content/schema.ts`
 * y el modelo está documentado en `docs/plan/05-contenido.md` §1.
 */

/** Un archivo MDX por proyecto: `src/content/projects/<id>.mdx`. */
const projects = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/content/projects",
  }),
  schema: projectSchema,
})

/** Organizaciones que agrupan proyectos (por ejemplo Banner Director). */
const organizations = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/organizations",
  }),
  schema: organizationSchema,
})

export const collections = {
  projects,
  organizations,
}

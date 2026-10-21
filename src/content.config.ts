import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

/** Reservado para case studies en MDX. Los proyectos actuales viven en `src/lib/projects.ts`. */
const projects = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
})

export const collections = {
  projects,
}

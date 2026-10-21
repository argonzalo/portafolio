import { z } from "astro/zod"

/**
 * Esquemas de contenido compartidos entre `src/content.config.ts` y las consultas
 * tipadas. Viven fuera de `content.config.ts` para que también puedan importarse
 * desde código que no pasa por `astro:content` (por ejemplo la fachada temporal
 * `src/lib/projects.ts`).
 *
 * Modelo documentado en `docs/plan/05-contenido.md` §1.
 */

/** Pieza de una solución unificada (por ejemplo la app y la web de un mismo producto). */
export const partSchema = z.object({
  title: z.string(),
  period: z.string(),
  stack: z.array(z.string()).default([]),
  description: z.string(),
  url: z.url().optional(),
  stats: z.array(z.string()).default([]),
  /** Avisos o aclaraciones (confidencialidad, imágenes ilustrativas, proyecto abandonado…). */
  notes: z.array(z.string()).default([]),
})

export const mediaSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
})

export const projectSchema = z.object({
  id: z.string(), // coincide con ProjectId (docs/plan/01-arquitectura.md §4)
  title: z.string(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  order: z.number(),
  client: z.string().optional(),
  /** id de un registro de `src/content/organizations/`. */
  organization: z.string().optional(),
  period: z.string(),
  location: z.string().optional(),
  status: z.enum(["activo", "finalizado", "demo", "cancelado"]),
  url: z.url().optional(),

  // Mensaje
  oneLiner: z.string().max(110),
  problem: z.string(),
  approach: z.array(z.string()).min(2).max(5),
  decisions: z
    .array(z.object({ decision: z.string(), why: z.string() }))
    .max(5)
    .default([]),
  challenges: z
    .array(z.object({ challenge: z.string(), solution: z.string() }))
    .max(5)
    .default([]),
  impact: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .default([]),

  // Respaldo
  parts: z.array(partSchema).default([]),
  stack: z.array(z.string()),
  notes: z.array(z.string()).default([]),
  media: z.array(mediaSchema).default([]),

  // Experiencia
  scene: z.string().optional(),
  guide: z
    .object({
      faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    })
    .default({ faq: [] }),
})

export const organizationSchema = z.object({
  name: z.string(),
  summary: z.string(),
  description: z.string(),
  period: z.string(),
  location: z.string().optional(),
})

export type ProjectData = z.infer<typeof projectSchema>
export type ProjectPartData = z.infer<typeof partSchema>
export type ProjectMediaData = z.infer<typeof mediaSchema>
export type OrganizationData = z.infer<typeof organizationSchema>

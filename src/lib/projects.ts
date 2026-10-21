import type {
  OrganizationData,
  ProjectData,
  ProjectMediaData,
  ProjectPartData,
} from "@/content/schema"

/**
 * Fachada temporal de contenido (T-A04).
 *
 * La fuente de verdad son las Content Collections de `src/content/projects/*.mdx`
 * (ADR-003) y sus esquemas en `src/content/schema.ts`. Este módulo mantiene la
 * API síncrona que usan las páginas actuales para no romperlas mientras llegan
 * T-A11 (recorrido), T-A17 (página de caso) y T-A21 (contexto del guía), que
 * consultarán las colecciones con `getCollection`/`render` de `astro:content`.
 *
 * No importa `astro:content` a propósito: la fachada necesita ser síncrona para
 * que `getStaticPaths` y las páginas actuales sigan funcionando sin cambios.
 * Las consultas nuevas (cuerpo del caso, guía) deben hacerse con
 * `getCollection`/`getEntry`/`render` en las tareas que reemplacen esta fachada.
 */

/** Prioridad de presentación: 1 = primera línea, 3 = última línea. */
export type ProjectTier = 1 | 2 | 3

export type ProjectStatus = "activo" | "finalizado" | "demo" | "cancelado"

export type ProjectImage = {
  src: string
  alt: string
  caption?: string
}

/** Contexto de la organización a la que pertenece un proyecto (p. ej. Banner Director). */
export type ProjectOrganization = OrganizationData

/** Pieza de un proyecto unificado (p. ej. la app y la web de una misma solución). */
export type ProjectPart = {
  title: string
  period: string
  stack: string[]
  description: string
  url?: string
  stats?: string[]
  notes: string[]
  /** Compatibilidad con la UI actual: notas unidas en un solo texto. */
  alert?: string
  active?: boolean
}

export type ProjectDecision = { decision: string; why: string }
export type ProjectChallenge = { challenge: string; solution: string }
export type ProjectImpact = { value: string; label: string }
export type ProjectFaq = { q: string; a: string }

/**
 * Forma que consumen las páginas actuales. Conserva los nombres heredados
 * (`company`, `cardDescription`, `description`, `stats`, `alert`, `active`,
 * `images`) y agrega los campos del modelo nuevo.
 */
export type Project = {
  id: string
  order: number
  tier: ProjectTier
  title: string
  company?: string
  organization?: ProjectOrganization
  cardDescription: string
  period: string
  stack: string[]
  description: string
  location?: string
  url?: string
  stats?: string[]
  alert?: string
  active?: boolean
  parts?: ProjectPart[]
  images: ProjectImage[]

  // Modelo nuevo (05-contenido.md §1)
  client?: string
  status: ProjectStatus
  oneLiner: string
  problem: string
  approach: string[]
  decisions: ProjectDecision[]
  challenges: ProjectChallenge[]
  impact: ProjectImpact[]
  notes: string[]
  media: ProjectImage[]
  scene?: string
  guide: { faq: ProjectFaq[] }
}

/** Los ids válidos viven en el contrato `ProjectId` de `src/experience/types.ts` (T-A05). */

/** Frontmatter crudo de cada MDX (sin los valores por defecto del esquema). */
type ProjectFrontmatter = ProjectData

const projectModules = import.meta.glob<ProjectFrontmatter>(
  "../content/projects/*.mdx",
  { eager: true, import: "frontmatter" }
)

const organizationModules = import.meta.glob<OrganizationData>(
  "../content/organizations/*.md",
  { eager: true, import: "frontmatter" }
)

function moduleId(path: string, extension: string) {
  return path.split("/").pop()!.replace(extension, "")
}

const organizationsById = Object.fromEntries(
  Object.entries(organizationModules).map(([path, data]) => [
    moduleId(path, ".md"),
    data,
  ])
) as Record<string, ProjectOrganization>

export function getOrganization(id: string): ProjectOrganization | undefined {
  return organizationsById[id]
}

function toImage(media: ProjectMediaData): ProjectImage {
  return {
    src: encodeURI(media.src),
    alt: media.alt,
    ...(media.caption ? { caption: media.caption } : {}),
  }
}

function toPart(part: ProjectPartData): ProjectPart {
  const notes = part.notes ?? []

  return {
    title: part.title,
    period: part.period,
    stack: part.stack ?? [],
    description: part.description,
    ...(part.url ? { url: part.url } : {}),
    ...(part.stats?.length ? { stats: part.stats } : {}),
    notes,
    ...(notes.length ? { alert: notes.join(" ") } : {}),
  }
}

function toProject(data: ProjectFrontmatter): Project {
  const organization = data.organization
    ? getOrganization(data.organization)
    : undefined

  if (data.organization && !organization) {
    throw new Error(
      `[projects] El proyecto "${data.id}" referencia la organización ` +
        `"${data.organization}", que no existe en src/content/organizations/.`
    )
  }

  const notes = data.notes ?? []
  const media = (data.media ?? []).map(toImage)
  const impact = data.impact ?? []
  const guide = data.guide ?? { faq: [] }

  return {
    id: data.id,
    order: data.order,
    tier: data.tier,
    title: data.title,
    company: data.client,
    organization,
    cardDescription: data.oneLiner,
    period: data.period,
    stack: data.stack,
    // TODO(T-A17): las páginas de caso deben renderizar el cuerpo del MDX;
    // mientras tanto se conserva la descripción heredada para no romperlas.
    description: data.problem,
    location: data.location,
    url: data.url,
    stats: impact.length
      ? impact.map(({ value, label }) => `${value} ${label}`.trim())
      : undefined,
    alert: notes.length ? notes.join(" ") : undefined,
    active: data.status === "activo",
    parts: (data.parts ?? []).map(toPart),
    images: media,

    client: data.client,
    status: data.status,
    oneLiner: data.oneLiner,
    problem: data.problem,
    approach: data.approach,
    decisions: data.decisions ?? [],
    challenges: data.challenges ?? [],
    impact,
    notes,
    media,
    scene: data.scene,
    guide,
  }
}

/** Todos los proyectos, ordenados por `order`. */
export const projects: Project[] = Object.values(projectModules)
  .map(toProject)
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

export function getProjects(): Project[] {
  return projects
}

export function getSortedProjects(): Project[] {
  return projects
}

export function getProjectsByTier(tier: ProjectTier): Project[] {
  return projects.filter((project) => project.tier === tier)
}

export function getProjectById(id: string): Project | undefined {
  return projects.find((project) => project.id === id)
}

export function getProjectCover(project: Project): string | undefined {
  return project.images[0]?.src
}

export function getProjectInitial(title: string): string {
  return title.trim().charAt(0).toUpperCase()
}

export function getProjectRoutes() {
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }))
}

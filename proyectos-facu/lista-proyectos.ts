export type ProjectImage = {
  src: string
  alt: string
}

export type ProjectSubproject = {
  id: string
  order: number
  title: string
  period: string
  stack: string[]
  description: string
  url?: string
  stats?: string[]
  alert?: string
  active?: boolean
  images: ProjectImage[]
}

export type Project = {
  id: string
  order: number
  title: string
  company?: string
  cardDescription: string
  period: string
  stack: string[]
  description: string
  location?: string
  active?: boolean
  subprojects: ProjectSubproject[]
  images: ProjectImage[]
}

const ROOT = "/images/proyects"

function img(path: string, alt: string): ProjectImage {
  return { src: encodeURI(path), alt }
}

function gallery(
  folder: string,
  files: string[],
  altPrefix: string
): ProjectImage[] {
  return files.map((file, index) =>
    img(`${ROOT}/${folder}/${file}`, `${altPrefix} ${index + 1}`)
  )
}

export const projects: Project[] = [
  {
    id: "banner-director",
    order: 1,
    title: "Banner Director",
    company: "Banner Director",
    cardDescription:
      "Software de gestión y distribución de contenido digital para cartelería de forma centralizada.",
    period: "2021 — 2026",
    stack: [
      "Go",
      "Vue",
      "PostgreSQL",
      "TypeScript",
      "Kotlin",
      "Docker",
      "Next.js",
      "Firebase",
      "Kubernetes",
    ],
    description:
      "Plataforma de Digital Signage que permite gestionar de forma centralizada el contenido de miles de pantallas en múltiples locales. Actualmente cuenta con casi 10.000 equipos activos y clientes como Grido, Açaí, Marea, Diarco y Leroma, entre otros.",
    location: "Córdoba, Argentina",
    images: [],
    subprojects: [
      {
        id: "banner-2",
        order: 1,
        title: "Banner 2.0",
        period: "2023 — 2026",
        stack: [
          "Go",
          "Vue",
          "PostgreSQL",
          "TypeScript",
          "Kotlin",
          "Docker",
          "Kubernetes",
        ],
        description:
          "Sistema de Digital Signage para grandes franquicias, basado en tres pilares: interfaz gráfica en Vue, con un potente editor visual para crear y gestionar contenido; backend en Go y base de datos PostgreSQL; y Android / Kotlin para la operación y reproducción de contenido en los equipos. El sistema permite administrar contenidos con configuraciones avanzadas por regiones, fechas, entidades y más.",
        url: "https://v2.bannerdirector.com",
        stats: ["+600 equipos funcionando"],
        images: gallery(
          "banner-director/banner-2",
          [
            "1.webp",
            "2.webp",
            "3.webp",
            "4.webp",
            "5.webp",
            "6.webp",
            "7.webp",
            "8.webp",
            "9.webp",
            "10.webp",
            "11.webp",
            "12.webp",
            "13.webp",
            "14.webp",
          ],
          "Banner 2.0"
        ),
      },
      {
        id: "app-etiquetas",
        order: 2,
        title: "App Etiquetas",
        period: "2025",
        stack: ["Flutter"],
        description:
          "App mobile para la configuración local — conexión desde la misma red Wi‑Fi a los equipos — para gestionar contenido de forma particular, sin alterar la configuración global. Especialmente útil para la gestión de disponibilidad de productos.",
        images: gallery(
          "banner-director/app-etiquetas",
          ["1.webp", "2.webp"],
          "App Etiquetas"
        ),
      },
      {
        id: "web-landing",
        order: 3,
        title: "Web Landing",
        period: "2024",
        stack: ["Next.js", "Firebase"],
        description: "Sitio web de la empresa.",
        url: "https://web.bannerdirector.com/",
        images: gallery(
          "banner-director/web-landing",
          ["1.webp"],
          "Web Landing de Banner Director"
        ),
      },
      {
        id: "teams",
        order: 4,
        title: "Banner Teams",
        period: "2026",
        stack: ["NestJS", "TypeScript", "PostgreSQL", "Prisma", "Next.js"],
        description:
          "Sistema interno de la empresa para la gestión de tareas, clientes, ventas, seguimiento de envíos y operación diaria del equipo.",
        images: gallery("banner-director/teams", ["1.webp"], "Banner Teams"),
      },
    ],
  },
  {
    id: "vibo",
    order: 2,
    title: "VIBO — Pádel Análisis",
    company: "VIBO",
    cardDescription: "Análisis por video de partidos de pádel.",
    period: "2025 — 2026",
    active: true,
    stack: ["Python", "GCP", "Docker", "Next.js", "Firebase"],
    description:
      "El usuario registra su partido en video y la plataforma procesa el material mediante una combinación de algoritmos de visión por computadora, inteligencia artificial y modelos matemáticos para extraer datos del juego, reconstruir y analizar diferentes eventos y generar métricas de rendimiento e información relevante para evaluar y mejorar el desempeño.",
    location: "Londres, Inglaterra",
    images: [],
    subprojects: [
      {
        id: "padel-video-analisis",
        order: 1,
        title: "Pádel Video Análisis",
        period: "2025 — 2026",
        stack: ["Python", "GCP", "Docker"],
        description:
          "Backend en Python. Incluye el entrenamiento de modelos, el desarrollo de algoritmos para la extracción de datos de juego y el despliegue en Google Cloud.",
        url: "https://vibopadel.com/",
        images: gallery(
          "vibo/padel-video-analisis",
          [
            "1.webp",
            "2.webp",
            "3.webp",
            "4.webp",
            "5.webp",
            "6.webp",
            "7.webp",
            "8.webp",
          ],
          "Pádel Video Análisis"
        ),
      },
      {
        id: "web-demo",
        order: 2,
        title: "Web Demo",
        period: "2026",
        stack: ["Next.js"],
        description:
          "Sitio web demo para la presentación inicial e interna del proyecto.",
        images: gallery(
          "vibo/web-demo",
          ["1.webp", "2.webp", "3.webp"],
          "Web Demo de VIBO"
        ),
      },
    ],
  },
  {
    id: "naturalis",
    order: 3,
    title: "Naturalis — Centro de estética",
    company: "Naturalis",
    cardDescription:
      "Sistema de gestión de turnos, tratamientos, empleados, blog y mailing de un centro de estética.",
    period: "2024 — 2025",
    stack: ["Next.js", "Firebase"],
    description:
      "Plataforma para un centro de estética: el equipo administra turnos, tratamientos, horarios y comunicación, mientras los clientes reservan y consultan su agenda desde la web.",
    location: "Buenos Aires, Argentina",
    images: [],
    subprojects: [
      {
        id: "natuadmin",
        order: 1,
        title: "Natuadmin",
        period: "2024 — 2025",
        stack: ["Node", "Firebase", "Next.js"],
        description:
          "Sistema administrativo. Permite a los empleados gestionar turnos, información de tratamientos, horarios y mails. Incluye un editor de texto enriquecido para el blog y el envío de novedades.",
        stats: ["+650 clientes registrados", "+60 turnos por mes"],
        images: gallery(
          "naturalis/natuadmin",
          [
            "1.webp",
            "2.webp",
            "3.webp",
            "4.webp",
            "5.webp",
            "6.webp",
            "7.webp",
            "8.webp",
          ],
          "Natuadmin"
        ),
      },
      {
        id: "web-app",
        order: 2,
        title: "Web App",
        period: "2024 — 2025",
        stack: ["Next.js"],
        description:
          "Interfaz para los clientes. Les permite reservar y consultar turnos, ver los tratamientos disponibles y seguir el estado de su agenda.",
        url: "https://naturalis.vercel.app/",
        images: gallery(
          "naturalis/app-web",
          [
            "1.webp",
            "2.webp",
            "3.webp",
            "4.webp",
            "5.webp",
            "6.webp",
            "7.webp",
            "8.webp",
          ],
          "Web App de Naturalis"
        ),
      },
    ],
  },
  {
    id: "agnt",
    order: 4,
    title: "AGNT",
    company: "AGNT",
    cardDescription:
      "Plataforma para agencias de representantes de jugadores de fútbol.",
    period: "2025 — 2026",
    stack: ["TypeScript", "Firebase"],
    description:
      "Permite a las agencias gestionar representantes, jugadores, órdenes de clubes y traspasos. Se conecta con distintas APIs de fútbol para mantener actualizada la información.",
    location: "Córdoba, Argentina / Ciudad de México, México",
    images: gallery("agnt", ["1.webp", "2.webp", "3.webp", "4.webp"], "AGNT"),
    subprojects: [],
  },
  {
    id: "starbene",
    order: 5,
    title: "Starbene — Medicina estética",
    company: "Starbene",
    cardDescription:
      "App y sitio comercial para un proveedor de medicina estética: equipos, capacitación y servicios.",
    period: "2023 — 2025",
    stack: ["React Native", "Next.js", "Firebase"],
    description:
      "Marca de medicina estética. El trabajo cubrió una app para clientes — gestión de equipos, capacitación, documentación, recambios y servicios de reparación — y un sitio comercial de productos, soluciones y cursos.",
    location: "Buenos Aires, Argentina",
    images: [],
    subprojects: [
      {
        id: "app-mobile",
        order: 1,
        title: "App Mobile",
        period: "2023",
        stack: ["React Native"],
        description:
          "Aplicación mobile para clientes. Permitía gestionar equipos, capacitarse y obtener documentación, comprar recambios y solicitar servicios de reparación.",
        alert:
          "El proyecto se abandonó antes de salir a producción por cambios en las necesidades de la empresa.",
        images: gallery(
          "starbene/app-mobile",
          ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
          "App Mobile de Starbene"
        ),
      },
      {
        id: "web-landing",
        order: 2,
        title: "Web App",
        period: "2023",
        stack: ["Next.js"],
        description:
          "Web comercial. Listaba productos, soluciones, cursos y la oferta de la marca.",
        url: "https://www.starbene.com/",
        alert:
          "Las imágenes son ilustrativas: la empresa cuenta hoy con su propio equipo de desarrollo y el sitio tuvo múltiples modificaciones.",
        images: gallery(
          "starbene/web-comercial",
          ["1.webp", "2.webp", "3.webp"],
          "Web comercial de Starbene"
        ),
      },
    ],
  },
  {
    id: "varios",
    order: 6,
    title: "Varios",
    cardDescription: "Proyectos varios, MVPs, demos y piezas puntuales.",
    period: "2022 — 2026",
    stack: ["TypeScript", "Python", "Supabase", "Next.js", "Firebase"],
    description:
      "Proyectos variados: desde productos terminados hasta demos y MVPs que no llegaron a producción.",
    images: [],
    subprojects: [
      {
        id: "venta-duplex",
        order: 1,
        title: "Venta Duplex",
        period: "2022",
        stack: ["React"],
        description: "Sitio web para la presentación de un dúplex a la venta.",
        images: gallery(
          "varios/venta-duplex",
          ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"],
          "Venta Duplex"
        ),
      },
      {
        id: "agro-ia-tesis",
        order: 2,
        title: "Agro IA Tesis",
        period: "2025",
        stack: ["Next.js"],
        description:
          "Sitio web para la presentación de un proyecto de tesis de un curso de inteligencia artificial en Barcelona, España.",
        images: [],
      },
      {
        id: "arcor-demo",
        order: 3,
        title: "Arcor demo",
        period: "2023",
        stack: ["React"],
        description:
          "Web app simple para la demo de un sistema de premios en kioscos Arcor.",
        images: gallery(
          "varios/arcor-demo",
          ["1.webp", "2.webp"],
          "Arcor demo"
        ),
      },
      {
        id: "cielo-y-mar",
        order: 4,
        title: "Cielo y Mar — Suites",
        period: "2023",
        stack: ["Next.js", "Firebase"],
        description:
          "Sitio web para un hotel en Playa del Carmen, México.",
        url: "https://www.suitescieloymar.com/",
        alert:
          "Las imágenes son ilustrativas y corresponden a los primeros bocetos; el sitio tuvo múltiples modificaciones posteriores.",
        images: gallery("varios/cielo-y-mar", ["1.webp"], "Cielo y Mar Suites"),
      },
      {
        id: "analisis-rep-politica",
        order: 5,
        title: "Análisis de reputación política",
        period: "2026",
        active: true,
        stack: ["NestJS", "Next.js", "Supabase"],
        description:
          "App web para políticos: recopila la información del usuario en noticias y redes, analiza tendencias e imagen, y propone estrategias a seguir.",
        images: [],
      },
      {
        id: "forme",
        order: 6,
        title: "Forme — MeLi BR",
        period: "2025",
        stack: ["Python", "React"],
        description:
          "Demo / MVP para la presentación de un proyecto para ForMe. La plataforma hacía seguimiento de campañas mediante análisis de sentimiento en redes sociales. Se presentó a Mercado Libre Brasil; tras algunas reuniones y avances, se canceló.",
        images: gallery("varios/forme", ["1.webp"], "Forme"),
      },
    ],
  },
]

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id)
}

export function getSortedProjects() {
  return [...projects].sort((a, b) => a.order - b.order)
}

export function getProjectCover(project: Project) {
  const firstSub = [...project.subprojects].sort((a, b) => a.order - b.order)[0]
  return firstSub?.images[0]?.src ?? project.images[0]?.src
}

export function getProjectInitial(title: string) {
  return title.trim().charAt(0).toUpperCase()
}

export function getSubprojectById(project: Project, subId?: string) {
  if (project.subprojects.length === 0) {
    return null
  }

  if (!subId) {
    return [...project.subprojects].sort((a, b) => a.order - b.order)[0]
  }

  return project.subprojects.find((item) => item.id === subId) ?? null
}

export function getProjectRoutes() {
  return getSortedProjects().flatMap((project) => {
    const base = {
      params: { slug: project.id },
      props: {
        project,
        subproject: getSubprojectById(project),
      },
    }

    const nested = project.subprojects.map((subproject) => ({
      params: { slug: `${project.id}/${subproject.id}` },
      props: { project, subproject },
    }))

    return [base, ...nested]
  })
}

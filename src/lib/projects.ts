export type ProjectImage = {
  src: string
  alt: string
}

/** Prioridad de presentación: 1 = primera línea (escenas más personalizadas), 3 = última línea. */
export type ProjectTier = 1 | 2 | 3

/** Contexto de la organización a la que pertenece un proyecto (p. ej. Banner Director). */
export type ProjectOrganization = {
  name: string
  summary: string
  description: string
  period: string
  location?: string
}

/** Pieza de un proyecto unificado (p. ej. la app y la web de una misma solución). */
export type ProjectPart = {
  title: string
  period: string
  stack: string[]
  description: string
  url?: string
  stats?: string[]
  alert?: string
  active?: boolean
}

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

function numbered(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${index + 1}.webp`)
}

const BANNER_DIRECTOR: ProjectOrganization = {
  name: "Banner Director",
  summary:
    "Software de gestión y distribución de contenido digital para cartelería de forma centralizada.",
  description:
    "Plataforma de Digital Signage que permite a grandes cadenas y franquicias controlar, desde un único lugar, lo que muestran miles de pantallas en múltiples locales: qué se ve, dónde y cuándo, sin intervenir equipo por equipo. Cada pantalla ejecuta su programación de forma autónoma y se mantiene alineada con las decisiones centrales, lo que permite escalar la operación a miles de equipos sin perder el control. Actualmente cuenta con casi 10.000 equipos activos y clientes como Grido, Açaí, Marea, Diarco y Leroma, entre otros.",
  period: "2021 — 2026",
  location: "Córdoba, Argentina",
}

export const projects: Project[] = [
  {
    id: "vibo",
    order: 1,
    tier: 1,
    title: "VIBO — Pádel Análisis",
    company: "VIBO",
    cardDescription: "Análisis por video de partidos de pádel.",
    period: "2025 — 2026",
    active: true,
    stack: ["Python", "GCP", "Docker", "Next.js", "Firebase"],
    description:
      "Análisis inteligente de partidos de pádel que revela cómo juega realmente cada jugador. VIBO identifica su estilo de juego y si es más ofensivo o defensivo, compara cómo se reparte el juego con su compañero y cuánta cancha cubre en relación con él y con los rivales. Mide su dinámica de movimiento —qué tan rápido y ágil se desplaza y si se cansa a medida que avanza el partido—, muestra qué tipos de golpe ejecuta con más frecuencia y en qué zonas de la cancha se mueve más, y permite compartir los resultados con otros jugadores. Todo se apoya en inteligencia artificial y visión por computadora para convertir cada partido en información concreta para mejorar.",
    location: "Londres, Inglaterra",
    url: "https://vibopadel.com/",
    parts: [
      {
        title: "Pádel Video Análisis",
        period: "2025 — 2026",
        stack: ["Python", "GCP", "Docker"],
        description:
          "El motor que entiende el juego de cada jugador: detecta su estilo y su perfil ofensivo o defensivo, el reparto de juego con su compañero, la cancha que cubre frente a compañero y rivales, su velocidad, agilidad y desgaste a lo largo del partido, sus golpes más frecuentes y sus zonas dominantes. Funciona con modelos de inteligencia artificial y visión por computadora entrenados para el pádel y desplegados en la nube.",
        url: "https://vibopadel.com/",
      },
      {
        title: "Web Demo",
        period: "2026",
        stack: ["Next.js"],
        description:
          "Demo navegable con la que se presentó VIBO por primera vez: llevó a una experiencia visual la propuesta del producto —entender el juego de cada jugador a partir de sus datos— para validar la idea interna e inicialmente antes de construir la plataforma definitiva.",
      },
    ],
    images: [
      ...gallery("vibo/padel-video-analisis", numbered(8), "Pádel Video Análisis"),
      ...gallery("vibo/web-demo", numbered(3), "Web Demo de VIBO"),
    ],
  },
  {
    id: "naturalis",
    order: 2,
    tier: 1,
    title: "Naturalis — Centro de estética",
    company: "Naturalis",
    cardDescription:
      "Sistema de gestión de turnos, tratamientos, empleados, blog y mailing de un centro de estética.",
    period: "2024 — 2025",
    stack: ["Next.js", "Firebase", "Node"],
    description:
      "Plataforma que digitaliza la gestión completa de un centro de estética, formada por dos piezas conectadas: Natuadmin, el panel desde el que el equipo administra turnos, tratamientos, horarios y comunicación, y una web app donde los clientes reservan y siguen su agenda online. Automatiza el trabajo repetitivo —turnos fijos, confirmaciones y cancelaciones por mail, estadísticas de cada cliente— para que el equipo se enfoque en atender y no en administrar.",
    location: "Buenos Aires, Argentina",
    url: "https://naturalis.vercel.app/",
    stats: ["+650 clientes registrados", "+60 turnos por mes"],
    parts: [
      {
        title: "Natuadmin",
        period: "2024 — 2025",
        stack: ["Node", "Firebase", "Next.js"],
        description:
          "El centro de operaciones del equipo: turnos (incluidos recurrentes y cancelaciones), tratamientos, horarios, personal, blog y mailing en un solo panel. Permite conocer a cada cliente por su historial, sus notas y sus estadísticas de asistencia y cancelación, que se actualizan solas y alimentan rankings estadísticamente confiables. Incluye un editor de texto enriquecido para el blog y el envío de novedades.",
        stats: ["+650 clientes registrados", "+60 turnos por mes"],
      },
      {
        title: "Web App",
        period: "2024 — 2025",
        stack: ["Next.js"],
        description:
          "Reserva de turnos online, simple y autónoma: los clientes eligen tratamiento, reservan, reciben la confirmación por mail y siguen el estado de su agenda desde su perfil. Cada reserva impacta directamente en la agenda del equipo.",
        url: "https://naturalis.vercel.app/",
      },
    ],
    images: [
      ...gallery("naturalis/natuadmin", numbered(8), "Natuadmin"),
      ...gallery("naturalis/app-web", numbered(8), "Web App de Naturalis"),
    ],
  },
  {
    id: "banner-2",
    order: 3,
    tier: 1,
    title: "Banner 2.0",
    company: "Banner Director",
    organization: BANNER_DIRECTOR,
    cardDescription: BANNER_DIRECTOR.summary,
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
      "Nueva generación de la plataforma, pensada para grandes franquicias: permite decidir con precisión qué contenido se ve en cada pantalla según región, fecha, entidad y más, y publicarlo en toda la red desde un potente editor visual. Cada equipo recibe su configuración y la reproduce de forma autónoma, con la robustez necesaria para operar a escala. Construida sobre servicios en Go, un panel en Vue y una app Android nativa en Kotlin.",
    location: "Córdoba, Argentina",
    url: "https://v2.bannerdirector.com",
    stats: ["+600 equipos funcionando"],
    images: gallery("banner-director/banner-2", numbered(14), "Banner 2.0"),
  },
  {
    id: "starbene",
    order: 4,
    tier: 2,
    title: "Starbene — Medicina estética",
    company: "Starbene",
    cardDescription:
      "App y sitio comercial para un proveedor de medicina estética: equipos, capacitación y servicios.",
    period: "2023 — 2025",
    stack: ["React Native", "Next.js", "Firebase"],
    description:
      "Ecosistema digital para una marca de medicina estética: una app que concentraba toda la posventa de sus equipos —capacitación, documentación, recambios y servicio técnico— y un sitio comercial que presenta productos, soluciones y cursos.",
    location: "Buenos Aires, Argentina",
    url: "https://www.starbene.com/",
    parts: [
      {
        title: "App Mobile",
        period: "2023",
        stack: ["React Native"],
        description:
          "Toda la posventa de los equipos en una sola app para clientes: gestión de sus equipos, capacitación, documentación, compra de recambios y solicitud de servicios de reparación.",
        alert:
          "El proyecto se abandonó antes de salir a producción por cambios en las necesidades de la empresa.",
      },
      {
        title: "Web App",
        period: "2023",
        stack: ["Next.js"],
        description:
          "Vidriera digital de la marca: presenta de forma clara el catálogo de productos, las soluciones y la oferta de cursos.",
        url: "https://www.starbene.com/",
        alert:
          "Las imágenes son ilustrativas: la empresa cuenta hoy con su propio equipo de desarrollo y el sitio tuvo múltiples modificaciones.",
      },
    ],
    images: [
      ...gallery("starbene/app-mobile", numbered(5), "App Mobile de Starbene"),
      ...gallery("starbene/web-comercial", numbered(3), "Web comercial de Starbene"),
    ],
  },
  {
    id: "agnt",
    order: 5,
    tier: 2,
    title: "AGNT",
    company: "AGNT",
    cardDescription:
      "Plataforma para agencias de representantes de jugadores de fútbol.",
    period: "2025 — 2026",
    stack: ["TypeScript", "Firebase"],
    description:
      "Plataforma que ordena el negocio de las agencias de representación de jugadores de fútbol: representantes, cartera de jugadores, órdenes de clubes y traspasos en un único sistema, para seguir cada operación de punta a punta. Se mantiene actualizada de forma automática gracias a la integración con distintas APIs de fútbol, para que las decisiones se tomen siempre sobre datos vigentes.",
    location: "Córdoba, Argentina / Ciudad de México, México",
    images: gallery("agnt", numbered(4), "AGNT"),
  },
  {
    id: "cielo-y-mar",
    order: 6,
    tier: 2,
    title: "Cielo y Mar — Suites",
    cardDescription: "Sitio web para un hotel en Playa del Carmen, México.",
    period: "2023",
    stack: ["Next.js", "Firebase"],
    description:
      "Vidriera digital de un hotel en Playa del Carmen, México: presenta las suites y la propuesta del hotel para atraer huéspedes.",
    url: "https://www.suitescieloymar.com/",
    alert:
      "Las imágenes son ilustrativas y corresponden a los primeros bocetos; el sitio tuvo múltiples modificaciones posteriores.",
    images: gallery("varios/cielo-y-mar", numbered(1), "Cielo y Mar Suites"),
  },
  {
    id: "app-etiquetas",
    order: 7,
    tier: 2,
    title: "App Etiquetas",
    company: "Banner Director",
    organization: BANNER_DIRECTOR,
    cardDescription:
      "Control local del contenido de cada pantalla desde el celular, sin tocar la configuración global.",
    period: "2025",
    stack: ["Flutter"],
    description:
      "Control local e inmediato del contenido de cada pantalla, sin tocar la configuración global. Desde el celular y conectado a la misma red Wi‑Fi que los equipos, el personal del local ajusta lo que muestra un equipo puntual —especialmente la disponibilidad de productos— mientras la estrategia de contenido sigue gobernada de forma centralizada.",
    location: "Córdoba, Argentina",
    images: gallery("banner-director/app-etiquetas", numbered(2), "App Etiquetas"),
  },
  {
    id: "web-landing",
    order: 8,
    tier: 2,
    title: "Web Landing",
    company: "Banner Director",
    organization: BANNER_DIRECTOR,
    cardDescription:
      "Sitio institucional y puerta de entrada comercial de Banner Director.",
    period: "2024",
    stack: ["Next.js", "Firebase"],
    description:
      "Puerta de entrada comercial de Banner Director: sitio institucional que comunica la propuesta de cartelería digital centralizada y sus soluciones a potenciales clientes.",
    location: "Córdoba, Argentina",
    url: "https://web.bannerdirector.com/",
    images: gallery(
      "banner-director/web-landing",
      numbered(1),
      "Web Landing de Banner Director"
    ),
  },
  {
    id: "analisis-rep-politica",
    order: 9,
    tier: 2,
    title: "Análisis de reputación política",
    cardDescription: "Monitoreo de imagen pública y estrategia para políticos.",
    period: "2026",
    active: true,
    stack: ["NestJS", "Next.js", "Supabase"],
    description:
      "Inteligencia de reputación para políticos: monitorea su presencia en noticias y redes, detecta tendencias en su imagen pública y propone estrategias concretas a seguir.",
    images: [],
  },
  {
    id: "forme",
    order: 10,
    tier: 3,
    title: "Forme — MeLi BR",
    cardDescription:
      "Seguimiento de campañas con análisis de sentimiento en redes sociales.",
    period: "2025",
    stack: ["Python", "React"],
    description:
      "Seguimiento de campañas mediante análisis de sentimiento en redes sociales: una demo / MVP para ForMe que medía la percepción del público para evaluar el impacto de cada campaña. Se presentó a Mercado Libre Brasil; tras algunas reuniones y avances, se canceló.",
    images: gallery("varios/forme", numbered(1), "Forme"),
  },
  {
    id: "agro-ia-tesis",
    order: 11,
    tier: 3,
    title: "Agro IA Tesis",
    cardDescription:
      "Presentación web de una tesis de un curso de inteligencia artificial en Barcelona.",
    period: "2025",
    stack: ["Next.js"],
    description:
      "Presentación web de un proyecto de tesis de un curso de inteligencia artificial en Barcelona, España: convierte el trabajo de investigación en una experiencia clara y navegable.",
    images: [],
  },
  {
    id: "venta-duplex",
    order: 12,
    tier: 3,
    title: "Venta Duplex",
    cardDescription: "Presentación digital de un dúplex a la venta.",
    period: "2022",
    stack: ["React"],
    description:
      "Presentación digital de un dúplex a la venta: muestra la propiedad de forma atractiva y concentra en un solo lugar la información clave para potenciales compradores.",
    images: gallery("varios/venta-duplex", numbered(5), "Venta Duplex"),
  },
  {
    id: "arcor-demo",
    order: 13,
    tier: 3,
    title: "Arcor demo",
    cardDescription: "Prototipo de un sistema de premios para kioscos Arcor.",
    period: "2023",
    stack: ["React"],
    description:
      "Prototipo funcional de un sistema de premios para kioscos Arcor: una web app liviana para mostrar la mecánica de premios y presentar la propuesta antes de un desarrollo completo.",
    images: gallery("varios/arcor-demo", numbered(2), "Arcor demo"),
  },
  {
    id: "teams",
    order: 14,
    tier: 3,
    title: "Banner Teams",
    company: "Banner Director",
    organization: BANNER_DIRECTOR,
    cardDescription:
      "Sistema interno para la operación diaria: tareas, clientes, ventas y envíos.",
    period: "2026",
    stack: ["NestJS", "TypeScript", "PostgreSQL", "Prisma", "Next.js"],
    description:
      "Una única fuente de verdad para la operación interna de la empresa: tareas, clientes, ventas y seguimiento de envíos en un mismo sistema, para acompañar a cada cliente desde la venta hasta la entrega y coordinar el trabajo diario del equipo desde un solo lugar.",
    location: "Córdoba, Argentina",
    images: gallery("banner-director/teams", numbered(1), "Banner Teams"),
  },
]

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id)
}

export function getSortedProjects() {
  return [...projects].sort((a, b) => a.order - b.order)
}

export function getProjectCover(project: Project) {
  return project.images[0]?.src
}

export function getProjectInitial(title: string) {
  return title.trim().charAt(0).toUpperCase()
}

export function getProjectRoutes() {
  return getSortedProjects().map((project) => ({
    params: { slug: project.id },
    props: { project },
  }))
}

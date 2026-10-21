export type ExperienceStage = {
  title: string
  company: string
  start: string
  end: string
  description: string
  current?: boolean
}

export const experience: ExperienceStage[] = [
  {
    title: "Desarrollador independiente",
    company: "Independiente",
    start: "2021",
    end: "Actualidad",
    current: true,
    description:
      "Trabajo por mi cuenta en proyectos de distinto tipo: sistemas para negocios, análisis de video, plataformas a medida y algunos MVPs. En cada uno me ocupo de armar el producto — interfaz, backend e infraestructura.",
  },
  {
    title: "Desarrollador Full Stack Senior",
    company: "Banner Director",
    start: "2022",
    end: "2026",
    description:
      "Trabajé en el software de cartelería digital de la empresa, sobre todo en Banner 2: el sistema web con su gestor de contenido y editor gráfico, el backend con Go y PostgreSQL. También participé en el desarrollo de herramientas internas, sitios comerciales, aplicaciones moviles y diseños en general.",
  },
]

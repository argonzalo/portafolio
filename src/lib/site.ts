export const site = {
  name: "Gonzalo Aravena",
  tagline: "Interfaces, sistemas y experiencias web.",
  description:
    "Portfolio de desarrollador. Proyectos reales, decisiones de arquitectura y experiencias interactivas.",
  locale: "es",
} as const

export const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/about", label: "Sobre mí" },
  { href: "/projects", label: "Proyectos" },
  { href: "/skills", label: "Skills" },
  { href: "/experience", label: "Experiencia" },
  { href: "/contact", label: "Contacto" },
] as const

export const site = {
  name: "Gonzalo Aravena",
  firstName: "Gonzalo",
  tagline: "Full Stack Developer",
  description:
    "Portafolio de desarrollador.",
  locale: "es",
  url: "https://gonzaloaravena.com",
  avatar: "/images/profile-circle-4.webp",
  ogImage: "/images/og.webp",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  email: "aravenagonzalo1@gmail.com",
  linkedin: "https://www.linkedin.com/in/gonzalo-aravena-023a23210",
  instagram: "https://www.instagram.com/gonaravena/",
} as const

const heroHighlight = "Desarrollo software end-to-end"

export const hero = {
  greeting: "Hola, soy",
  highlight: heroHighlight,
  description: `+5 años de experiencia. ${heroHighlight}, con foco tanto en la lógica de producto como en la solidez técnica. Construyo interfaces, arquitecturas backend y bases de datos, despliego en infraestructura cloud, y entreno modelos de visión por computadora para sistemas de análisis inteligente. Disfruto tanto de pensar el problema de negocio como de resolverlo en código.`,
  skillsLabel: "Principales habilidades",
  skills: ["TypeScript", "Python", "PostgreSQL", "Firebase", "GCP", "Vue", "React", "Node"	],
} as const

export const contacts = [
  {
    label: "Contáctame",
    href: `mailto:${site.email}`,
    iconClass: "icon-[tabler--mail-forward]",
    external: false,
    variant: "default",
    labelClass: "text-white",
    monochrome: true,
  },
  {
    label: "LinkedIn",
    href: site.linkedin,
    iconClass: "icon-[logos--linkedin-icon]",
    external: true,
    variant: "secondary",
    labelClass: "text-foreground",
    monochrome: false,
  },
] as const

export const navigation = [
  { id: "experiencia", href: "/#experiencia", label: "Experiencia" },
  { id: "proyectos", href: "/#proyectos", label: "Proyectos" },
  { id: "sobre-mi", href: "/#sobre-mi", label: "Sobre mí" },
  { id: "contacto", href: "/#contacto", label: "Contacto" },
] as const

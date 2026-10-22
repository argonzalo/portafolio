export const site = {
  name: "Gonzalo Aravena",
  firstName: "Gonzalo",
  tagline: "Ideas ambiciosas, productos funcionales",
  description:
    "Diseño y construyo productos digitales, automatizaciones y soluciones de inteligencia artificial para negocios que estén listos para un siguiente paso.",
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

const tags = [
  "Software",
  "Inteligencia artificial aplicada",
  "Automatización",
  "Software customizado",
  "Productos conectados",
] as const

export const hero = {
  title: "Tu próxima gran idea hecha realidad",
  description: site.description,
  bridge: "Desde ideas ambiciosas a productos funcionales",
  tags,
  // Compatibilidad con el hero anterior, aún compilado por Astro.
  greeting: "Hola, soy",
  highlight: "productos digitales",
  skillsLabel: "Qué construyo",
  skills: tags,
} as const

export const manifesto = {
  title: "Desde ideas ambiciosas a productos funcionales",
  phrases: ["Pienso productos", "Diseño experiencias", "Construyo tecnología"],
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

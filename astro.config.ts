import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { site } from "./src/lib/site"

export default defineConfig({
  site: site.url,
  integrations: [react(), mdx()],
  // Rutas de la estructura anterior (organización > subproyectos) hacia la lista plana actual.
  redirects: {
    "/projects/banner-director": "/projects/banner-2",
    "/projects/banner-director/banner-2": "/projects/banner-2",
    "/projects/banner-director/app-etiquetas": "/projects/app-etiquetas",
    "/projects/banner-director/web-landing": "/projects/web-landing",
    "/projects/banner-director/teams": "/projects/teams",
    "/projects/vibo/padel-video-analisis": "/projects/vibo",
    "/projects/vibo/web-demo": "/projects/vibo",
    "/projects/naturalis/natuadmin": "/projects/naturalis",
    "/projects/naturalis/web-app": "/projects/naturalis",
    "/projects/starbene/app-mobile": "/projects/starbene",
    "/projects/starbene/web-landing": "/projects/starbene",
    "/projects/varios": "/projects",
    "/projects/varios/venta-duplex": "/projects/venta-duplex",
    "/projects/varios/agro-ia-tesis": "/projects/agro-ia-tesis",
    "/projects/varios/arcor-demo": "/projects/arcor-demo",
    "/projects/varios/cielo-y-mar": "/projects/cielo-y-mar",
    "/projects/varios/analisis-rep-politica": "/projects/analisis-rep-politica",
    "/projects/varios/forme": "/projects/forme",
  },
  vite: {
    plugins: [tailwindcss()],
  },
})

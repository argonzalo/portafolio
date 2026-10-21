import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import vercel from "@astrojs/vercel"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"
import { site } from "./src/lib/site"

export default defineConfig({
  site: site.url,
  adapter: vercel(),
  // Estático por defecto (ADR-004); las rutas API optan out con `prerender = false`.
  integrations: [react(), mdx()],
  env: {
    schema: {
      OPEN_AI_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      OPEN_AI_MODEL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "gpt-6-luna",
      }),
      OPEN_AI_MODEL_FALLBACK: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "gpt-5.4-mini",
      }),
      UPSTASH_REDIS_REST_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      UPSTASH_REDIS_REST_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      GUIDE_ENABLED: envField.boolean({
        context: "server",
        access: "secret",
        optional: true,
        default: false,
      }),
      GUIDE_DAILY_BUDGET_USD: envField.number({
        context: "server",
        access: "secret",
        optional: true,
        default: 5,
      }),
      GUIDE_SESSION_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
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
    "/projects/varios/analisis-rep-politica": "/projects/pirp",
    "/projects/analisis-rep-politica": "/projects/pirp",
    "/projects/varios/forme": "/projects/forme",
  },
  vite: {
    plugins: [tailwindcss()],
  },
})

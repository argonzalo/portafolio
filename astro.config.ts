import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { site } from "./src/lib/site"

export default defineConfig({
  site: site.url,
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
})

/**
 * Sirve el estático del build de Vercel (`.vercel/output/static`).
 * El adaptador @astrojs/vercel no soporta `astro preview`.
 *
 * Uso: node scripts/serve-preview.mjs [--port 4173]
 */
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = path.resolve(".vercel/output/static")
const portFlag = process.argv.indexOf("--port")
const port = Number(
  (portFlag >= 0 && process.argv[portFlag + 1]) || process.env.PORT || 4173,
)
const host = "127.0.0.1"

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
}

if (!fs.existsSync(root)) {
  console.error(
    `No existe ${root}. Corré \`npm run build\` antes de servir el preview.`,
  )
  process.exit(1)
}

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/")
  let rel = decoded === "/" ? "/index.html" : decoded
  if (rel.endsWith("/")) rel += "index.html"

  const candidate = path.normalize(path.join(root, rel))
  if (!candidate.startsWith(root)) return null

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate
  }

  const asDir = path.join(candidate, "index.html")
  if (fs.existsSync(asDir)) return asDir

  const withHtml = `${candidate}.html`
  if (fs.existsSync(withHtml)) return withHtml

  return null
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/")
  if (!file) {
    const fallback = path.join(root, "404.html")
    if (fs.existsSync(fallback)) {
      res.writeHead(404, { "Content-Type": MIME[".html"] })
      fs.createReadStream(fallback).pipe(res)
      return
    }
    res.writeHead(404).end("Not found")
    return
  }

  const ext = path.extname(file).toLowerCase()
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" })
  fs.createReadStream(file).pipe(res)
})

server.listen(port, host, () => {
  // Patrón que espera Lighthouse CI / Playwright
  console.log(`Local http://${host}:${port}/`)
})

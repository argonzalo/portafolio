// Scoped asset pipeline: no other scene's sources are touched.
import { spawnSync } from "node:child_process"
import { mkdir, writeFile, readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import sharp from "sharp"
const source = "assets-src/naturalis"
await mkdir("public/models/naturalis", { recursive: true })
await mkdir("public/textures/naturalis", { recursive: true })
for (const [tier, size, ratio] of process.argv.includes("--screens-only")
  ? []
  : [
      ["high", 1024, 1],
      ["medium", 1024, 0.7],
      ["low", 1024, 0.45],
    ]) {
  const args = [
    "node_modules/@gltf-transform/cli/bin/cli.js",
    "optimize",
    `${source}/sala.glb`,
    `public/models/naturalis/sala.${tier}.glb`,
    "--compress",
    "meshopt",
    "--join",
    "false",
    "--texture-compress",
    "webp",
    "--texture-size",
    String(size),
    "--simplify",
    String(ratio < 1),
    "--simplify-ratio",
    String(ratio),
    "--simplify-error",
    ".001",
  ]
  const result = spawnSync(process.execPath, args, { stdio: "inherit" })
  if (result.status !== 0) throw new Error(`Asset pipeline failed: ${tier}`)
  await sharp(`${source}/textures/room-night.png`)
    .resize(size)
    .webp({ quality: 82 })
    .toFile(`public/textures/naturalis/night.${tier}.webp`)
}
// Exact captures requested in the human review of T-A24.
await sharp("public/images/proyects/naturalis/app-web/2.webp")
  .resize(470)
  .webp({ quality: 83 })
  .toFile("public/textures/naturalis/client.webp")
// Keep the requested appointments capture, masking personal data as required
// by the approved content. Original files are preserved.
const masks = [
  [800, 450, 720, 108],
  [800, 625, 620, 135],
  [800, 840, 620, 130],
  [370, 340, 82, 790],
  ...[402, 540, 680, 820, 960, 1085].map((y) => [455, y, 280, 34]),
]
const redactions = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200">${masks.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#e5eeeb"/>`).join("")}<g font-family="sans-serif" fill="#56857d" font-size="20"><text x="830" y="493">Notas privadas ocultas</text><text x="830" y="678">Datos de contacto ocultos</text><text x="830" y="895">Datos personales ocultos</text></g></svg>`
const adminMasked = await sharp(
  "public/images/proyects/naturalis/natuadmin/2.webp"
)
  .composite([{ input: Buffer.from(redactions) }])
  .toBuffer()
await sharp(adminMasked)
  .resize(1280)
  .webp({ quality: 82 })
  .toFile("public/textures/naturalis/admin.webp")
// Original fictional paper agenda; no personal information.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"><rect width="512" height="640" fill="#f7f4e8"/><g fill="#3d6154" font-family="sans-serif"><text x="44" y="64" font-size="32">Agenda del día</text><text x="44" y="104" font-size="16">Cambios por confirmar</text></g><g stroke="#b7c0ab">${Array.from({ length: 9 }, (_, i) => `<path d="M40 ${145 + i * 49} H472"/>`).join("")}</g><g fill="#686d60" font-family="sans-serif" font-size="20"><text x="46" y="179">10:00 · Facial</text><text x="46" y="228">11:00 · Masaje</text><text x="46" y="277">Cambiar horario</text><text x="46" y="375">Confirmar por mensaje</text><text x="46" y="473">Cancelación pendiente</text></g><g stroke="#a76a55" stroke-width="4" fill="none"><path d="M40 218 L324 231 M70 261 L341 285 M46 468 L390 481"/><path d="M384 318 q80 24 10 64"/></g></svg>`
await sharp(Buffer.from(svg))
  .webp({ quality: 85 })
  .toFile("public/textures/naturalis/agenda.webp")
await writeFile(
  `${source}/pipeline-note.txt`,
  "Meshopt geometry + WebP atlases. KTX2 unavailable locally; supported pipeline fallback.\n"
)
if (!process.argv.includes("--screens-only")) {
  const version = createHash("sha256")
    .update(await readFile(`${source}/sala.glb`))
    .update("shared-lightmaps-1024-v1")
    .digest("hex")
    .slice(0, 12)
  await writeFile(
    "src/scenes/naturalis/assets.json",
    JSON.stringify({ version }) + "\n"
  )
}

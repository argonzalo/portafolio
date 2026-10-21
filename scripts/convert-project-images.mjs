import { readdir, stat, unlink } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/images/proyects"
)
const SOURCE_EXT = new Set([".png", ".jpg", ".jpeg"])
const QUALITY = 82
const keepOriginals = process.argv.includes("--keep")

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(full)))
      continue
    }
    files.push(full)
  }

  return files
}

function destPath(file) {
  const ext = path.extname(file)
  return `${file.slice(0, -ext.length)}.webp`
}

async function convertFile(file) {
  const ext = path.extname(file).toLowerCase()
  if (!SOURCE_EXT.has(ext)) {
    return null
  }

  const dest = destPath(file)
  const input = await stat(file)

  await sharp(file)
    .rotate()
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(dest)

  const output = await stat(dest)

  if (!keepOriginals) {
    await unlink(file)
  }

  return {
    from: path.relative(ROOT, file),
    to: path.relative(ROOT, dest),
    before: input.size,
    after: output.size,
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

const files = await walk(ROOT)
const converted = []
const failed = []

for (const file of files) {
  try {
    const result = await convertFile(file)
    if (result) {
      converted.push(result)
    }
  } catch (error) {
    failed.push({
      file: path.relative(ROOT, file),
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

const before = converted.reduce((total, item) => total + item.before, 0)
const after = converted.reduce((total, item) => total + item.after, 0)
const saved = before - after

console.log(`Carpeta: ${ROOT}`)
console.log(`Convertidas: ${converted.length}`)
console.log(
  `Peso: ${formatBytes(before)} → ${formatBytes(after)} (${formatBytes(saved)} menos)`
)

if (keepOriginals) {
  console.log("Originales conservados (--keep)")
}

if (converted.length > 0) {
  console.log("\nArchivos:")
  for (const item of converted) {
    console.log(`  ${item.from} → ${item.to}`)
  }
}

if (failed.length > 0) {
  console.error("\nErrores:")
  for (const item of failed) {
    console.error(`  ${item.file}: ${item.error}`)
  }
  process.exitCode = 1
}

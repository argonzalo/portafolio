// Ejecutar desde la raíz: node src/scenes/pirp/build-atlas.mjs
// Tipografía local y dataset aprobado; no requiere servicios externos.
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const data = JSON.parse(await readFile('src/scenes/pirp/dataset.json', 'utf8'))
const font = await readFile('node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2')
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage()
  const png = await page.evaluate(async ({ data, font }) => {
    const face = new FontFace('Poppins', `url(data:font/woff2;base64,${font})`)
    document.fonts.add(await face.load())
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    const c = canvas.getContext('2d')
    const colors = { positive: '#6F9C88', negative: '#A8434F', neutral: '#B98F6A' }
    const labels = { positive: 'Positivo', negative: 'Negativo', neutral: 'Neutral' }
    data.headlines.forEach((item, i) => {
      const x = (i % 2) * 512, y = Math.floor(i / 2) * (1024 / 3)
      c.fillStyle = i % 3 === 0 ? '#EFE9DD' : '#242425'
      c.fillRect(x, y, 512, 1024 / 3)
      c.fillStyle = colors[item.sentiment]
      c.fillRect(x + 24, y + 24, 5, 26)
      c.font = '600 18px Poppins'
      c.fillText(item.source, x + 44, y + 44)
      c.fillStyle = i % 3 === 0 ? '#17181A' : '#EFE9DD'
      c.font = '600 25px Poppins'
      let line = '', row = 0
      for (const word of item.headline.split(' ')) {
        if (c.measureText(line + word).width > 442 && line) {
          c.fillText(line.trim(), x + 28, y + 100 + row++ * 36)
          line = ''
        }
        line += word + ' '
      }
      c.fillText(line.trim(), x + 28, y + 100 + row * 36)
      c.fillStyle = colors[item.sentiment]
      c.font = '600 17px Poppins'
      c.fillText(labels[item.sentiment], x + 28, y + 286)
      c.fillStyle = i % 3 === 0 ? '#55514C' : '#C0B9B2'
      c.fillText(item.time, x + 325, y + 286)
      c.font = '600 12px Poppins'
      c.fillText('Demo ficticia', x + 28, y + 320)
    })
    return canvas.toDataURL('image/png').split(',')[1]
  }, { data, font: font.toString('base64') })
  await writeFile('public/textures/pirp/headlines.webp', await sharp(Buffer.from(png, 'base64')).webp({ quality: 88 }).toBuffer())
  await sharp('public/images/proyects/varios/pirp/1.webp').resize({ height: 1024 }).webp({ quality: 82 }).toFile('public/textures/pirp/screen.webp')
  const dimensions = []
  for (const file of ['screen.webp']) {
    const { width, height } = await sharp(`public/textures/pirp/${file}`).metadata()
    dimensions.push({ width, height })
  }
  await writeFile('src/scenes/pirp/capture-dimensions.json', JSON.stringify(dimensions, null, 2))
} finally {
  await browser.close()
}

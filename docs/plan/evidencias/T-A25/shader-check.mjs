import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'

const browser=await chromium.launch({channel:'msedge',headless:true})
const report=[]
for(const view of [{width:1440,height:900,quality:'high'},{width:390,height:844,quality:'low'}]){
  const page=await browser.newPage({viewport:{width:view.width,height:view.height}})
  const errors=[],warnings=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text())})
  await page.goto(`http://127.0.0.1:4191/?chapter=banner-2&progress=0.5&quality=${view.quality}`)
  await page.waitForSelector('[data-banner-caption]')
  await page.waitForTimeout(3000)
  assert.deepEqual(errors,[])
  assert.ok(!warnings.some(w=>w.includes('X4000')||w.includes('f_photo')))
  report.push({view,errors,warnings})
  await page.close()
}
await browser.close()
await writeFile('docs/plan/evidencias/T-A25/shader-check.json',JSON.stringify(report,null,2))
console.log('Shaders desktop/mobile sin avisos nuevos OK')

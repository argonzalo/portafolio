import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],samples:[]}
try{for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile})
for(const progress of mobile ? [.52,.67,.715,.75,.78,.85] : [.52,.72,.85]){
await page.goto(`http://127.0.0.1:3010/?chapter=pirp&progress=${progress}&quality=high&debug`,{waitUntil:'networkidle'})
await page.waitForTimeout(1800)
await page.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
assert.equal(await page.locator('.pirp-phone-controls,[data-pirp-dialog]').count(),0)
await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-${progress}.webp`})
report.samples.push({mobile,progress,opacity:await page.locator('.pirp-dashboard').evaluate(el=>Number(el.style.opacity)),...await page.evaluate(async()=>(await import('/src/experience/gpuStats.ts')).getGpuStats())})
if(progress===.52){const clip=mobile?{x:24,y:340,width:340,height:300}:{x:350,y:290,width:750,height:300};const a=await page.screenshot({clip});await page.waitForTimeout(600);const b=await page.screenshot({clip});assert.ok(a.equals(b),'El agrupamiento debe permanecer estable entre frames');report.checks.push(`${mobile?'mobile':'desktop'}: dos frames idénticos del agrupamiento`)}
if(mobile&&progress===.75){const css=await page.locator('.pirp-dashboard').evaluate(el=>({blur:getComputedStyle(el).backdropFilter,width:el.getBoundingClientRect().width}));assert.match(css.blur,/blur/);assert.ok(css.width>300);report.checks.push('mobile: tarjeta amplia con backdrop-filter activo')}
}
report.checks.push(`${mobile?'mobile':'desktop'}: sin botonera ni galería; capturas en el detalle del proyecto`)
await page.close()
}}finally{await writeFile('docs/plan/evidencias/T-A23/revision.json',JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2))

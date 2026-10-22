import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={checks:[],samples:[]}
try{for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile})
await page.goto('http://127.0.0.1:3010/?chapter=pirp&progress=0.52&quality=high&debug',{waitUntil:'networkidle'})
await page.waitForTimeout(2000)
await page.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-0.52.webp`})
report.samples.push({mobile,beat:'agrupamiento',...await page.evaluate(async()=>(await import('/src/experience/gpuStats.ts')).getGpuStats())})
await page.evaluate(async()=>{const {experienceStore:s}=await import('/src/experience/store.ts');const e=document.querySelector('[data-chapter="pirp"]');scrollTo({top:e.offsetTop-innerHeight/2+.85*e.offsetHeight,behavior:'instant'});window.dispatchEvent(new Event('experience:seek'));s.setProgress('pirp',.85)})
await page.waitForTimeout(1800)
await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-0.85.webp`})
const pager=page.getByRole('navigation',{name:'Capturas del teléfono',exact:true})
await pager.getByRole('button',{name:'Mostrar captura 2',exact:true}).click()
assert.equal(await pager.getByRole('button',{name:'Mostrar captura 2',exact:true}).getAttribute('aria-pressed'),'true')
await page.waitForTimeout(800)
await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-screen-2.webp`})
await page.getByRole('button',{name:'Ampliar captura actual'}).click()
assert.match(await page.locator('[data-pirp-dialog] img').getAttribute('src'),/2.webp$/)
await page.keyboard.press('Escape')
assert.equal(await page.getByRole('button',{name:'Ampliar captura actual'}).evaluate(el=>el===document.activeElement),true)
report.checks.push(`${mobile?'mobile':'desktop'}: paginación bajo teléfono, captura 2, ampliación actual y retorno de foco`)
await page.close()
}}finally{await writeFile('docs/plan/evidencias/T-A23/revision.json',JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2))

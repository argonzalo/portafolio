import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={errors:[],warnings:[],checks:[]}
try{
for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile})
page.on('pageerror',e=>report.errors.push(String(e)))
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})
for(const p of [.12,.32,.52,.72,.85]){
await page.goto(`http://127.0.0.1:4173/?chapter=pirp&progress=${p}&quality=high&debug`,{waitUntil:'networkidle'})
await page.locator('.pirp-heading').waitFor()
await page.waitForTimeout(1300)
await page.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-${p}.webp`})
if(p===.32){for(let i=0;i<6;i++){await page.locator('.pirp-news-buttons button').nth(i).click();await page.locator('.pirp-classified').waitFor()}}
if(p===.85){await page.getByRole('button',{name:'Mostrar captura 2',exact:true}).click();await page.getByRole('button',{name:'Ampliar captura actual'}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Siguiente',exact:true}).click();await page.screenshot({path:`docs/plan/evidencias/T-A23/${mobile?'mobile':'desktop'}-gallery.webp`});await page.keyboard.press('Escape')}
}
report.checks.push(`${mobile?'mobile':'desktop'}: build, cinco beats, seis tarjetas, galería y Escape`)
await page.close()
}
}finally{await writeFile('docs/plan/evidencias/T-A23/production.json',JSON.stringify(report,null,2));await browser.close()}
console.log(JSON.stringify(report,null,2))

// Verificación reproducible contra npm run dev (puerto 3010).
import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir='docs/plan/evidencias/T-A23'
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={samples:[],errors:[],checks:[]}
try {
  for(const mobile of [false,true]) {
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile})
    page.on('pageerror',e=>report.errors.push(String(e)))
    page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')report.errors.push(m.text())})
    const cdp=await page.context().newCDPSession(page)
    if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
    await page.goto('http://127.0.0.1:3010/?chapter=pirp&progress=0.12&quality=high&debug',{waitUntil:'networkidle'})
    await page.waitForTimeout(3000)
    await page.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
    const seek=async(chapter,p,quality)=>{
      await page.evaluate(async({chapter,p,quality})=>{
        const {experienceStore:s}=await import('/src/experience/store.ts')
        const {forceQuality}=await import('/src/experience/quality.ts')
        forceQuality(quality)
        const section=document.querySelector(`[data-chapter="${chapter}"]`)
        window.scrollTo({top:section.offsetTop-innerHeight/2+p*section.offsetHeight,behavior:'instant'})
        window.dispatchEvent(new Event('experience:seek'))
        s.setChapter(chapter);s.setProgress(chapter,p)
      },{chapter,p,quality})
      await page.waitForTimeout(1300)
    }
    const sample=()=>page.evaluate(async()=>({gpu:(await import('/src/experience/gpuStats.ts')).getGpuStats(),quality:(await import('/src/experience/quality.ts')).getQualityStats()}))
    await seek('hero',0.4,'high');await page.waitForTimeout(2500)
    const baseline=await sample()
    for(const quality of ['high','medium','low'])for(const p of [0.12,0.32,0.52,0.72,0.85]){
      await seek('pirp',p,quality)
      await page.waitForTimeout(800)
      report.samples.push({mobile,quality,p,...await sample()})
      if(quality==='high'){
        await page.locator('[data-debug-overlay]').evaluate(el=>el.style.visibility='hidden')
        await page.screenshot({path:`${dir}/${mobile?'mobile':'desktop'}-${p}.webp`})

      }
    }
    await seek('pirp',0.32,'high')
    for(let i=0;i<6;i++){
      await page.locator('.pirp-news-buttons button').nth(i).click()
      await page.getByRole('status').filter({hasText:['Relaciones Exteriores','Costo de Vida y Tarifas','Debate con Prensa','Gabinete y Bloque Legislativo','Costo de Vida y Tarifas','Relaciones Exteriores'][i]}).waitFor()
    }
    report.checks.push(`${mobile?'mobile':'desktop'}: seis clasificaciones correctas`)
    await seek('pirp',0.85,'high')
    await page.getByRole('button',{name:'Mostrar captura 2',exact:true}).click()
    assert.equal(await page.getByRole('button',{name:'Mostrar captura 2',exact:true}).getAttribute('aria-pressed'),'true')
    await page.getByRole('button',{name:'Ampliar captura actual'}).click()
    await page.getByRole('dialog').waitFor()
    await page.getByRole('button',{name:'Siguiente',exact:true}).click()
    assert.match(await page.locator('[data-pirp-dialog] img').getAttribute('src'),/1.webp$/)
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('dialog').count(),0)
    assert.equal(await page.getByRole('button',{name:'Ampliar captura actual'}).evaluate(el=>el===document.activeElement),true)
    report.checks.push(`${mobile?'mobile':'desktop'}: galería, navegación, Escape y foco correctos`)
    // El scroll inverso recompone el mismo texto y permite volver a interactuar.
    await seek('pirp',0.52,'high');assert.match(await page.locator('.pirp-heading').innerText(),/Cada señal/)
    await seek('pirp',0.32,'high');await page.locator('.pirp-news-buttons button').first().click()
    await seek('naturalis',0.08,'high');await seek('pirp',0.92,'high')
    await seek('hero',0.4,'high');await page.waitForTimeout(3500)
    report.checks.push({mobile,baseline,afterExit:await sample()})
    await page.evaluate(async()=>(await import('/src/experience/quality.ts')).forceQuality(null))
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.goto('http://127.0.0.1:3010/?chapter=pirp&progress=0.72&debug',{waitUntil:'networkidle'})
    await page.waitForTimeout(2000)
    assert.equal(await page.locator('[data-experience-stage] canvas').count(),0)
    report.checks.push(`${mobile?'mobile':'desktop'}: reduced-motion sin canvas`)
    await page.close()
  }
} finally {
  await writeFile(`${dir}/metrics.json`,JSON.stringify(report,null,2))
  await browser.close()
}
console.log(JSON.stringify(report,null,2))

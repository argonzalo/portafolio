// Run with the isolated preview server (serve-preview.mjs) on port 3012.
import { chromium } from '@playwright/test'
import { mkdir, writeFile, stat, copyFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import sharp from 'sharp'
const output='docs/plan/evidencias/T-A24'
await mkdir(output,{recursive:true});await mkdir('public/posters/naturalis',{recursive:true})
const report={samples:[],errors:[],warnings:[],checks:[],assets:{}}
const browser=await chromium.launch({channel:'chrome',headless:true})
const beats=[['mundo',.12],['problema',.3],['razonamiento',.5],['solucion',.7],['resultado',.835]]
try {
  for(const mobile of [false,true]) {
    const view=mobile?'mobile':'desktop'
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile})
    page.setDefaultTimeout(15000)
    page.setDefaultNavigationTimeout(60000)
    const url='http://127.0.0.1:3012/?chapter=naturalis&progress=0.5&quality=high&debug'
    // Warm Astro's lazy optimizer before the measured run.
    await page.goto(url,{waitUntil:'networkidle',timeout:60000});await page.waitForTimeout(3500)
    await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1500)
    page.on('pageerror',e=>report.errors.push({view,message:String(e)}))
    page.on('console',m=>{if(m.type()==='error')report.errors.push({view,message:m.text()});if(m.type()==='warning')report.warnings.push({view,message:m.text()})})
    const audioRequests=[];page.on('request',r=>{if(r.url().includes('/audio/'))audioRequests.push(r.url())})
    const cdp=await page.context().newCDPSession(page)
    if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
    await page.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
    const seek=async(chapter,p,tier='high',settle=1800)=>{
      await page.evaluate(async({chapter,p,tier})=>{
        const {experienceStore:s}=await import('/src/experience/store.ts')
        ;(await import('/src/experience/quality.ts')).forceQuality(tier)
        const section=document.querySelector(`[data-chapter="${chapter}"]`)
        window.scrollTo({top:section.getBoundingClientRect().top+scrollY-innerHeight/2+p*section.offsetHeight,behavior:'instant'})
        window.dispatchEvent(new Event('experience:seek'));s.setChapter(chapter);s.setProgress(chapter,p)
      },{chapter,p,tier})
      await page.waitForTimeout(settle)
    }
    const sample=()=>page.evaluate(async()=>({gpu:(await import('/src/experience/gpuStats.ts')).getGpuStats(),quality:(await import('/src/experience/quality.ts')).getQualityStats()}))
    // Baseline after the same scenes have been preloaded and released once.
    await seek('hero',.35);await page.waitForTimeout(2500)
    const baseline=await sample()
    for(const tier of ['high','medium','low'])for(const [beat,p] of beats) {
      await seek('naturalis',p,tier)
      const metrics=await sample()
      console.log(view,tier,beat)
      report.samples.push({view,tier,beat,p,url:`/?chapter=naturalis&progress=${p}&quality=${tier}&debug`,...metrics})
      assert.ok(metrics.gpu.calls<=100,`${view}/${tier}/${beat}: calls`)
      assert.ok(metrics.gpu.triangles<=32000,`${view}/${tier}/${beat}: triangles`)
      if(tier==='high')await page.screenshot({path:`${output}/${view}-${beat}.webp`})
    }
    await seek('naturalis',.5)
    const firstHeading=await page.locator('.naturalis-copy h2').innerText()
    assert.equal(await page.locator('.naturalis-overlay').evaluate(el=>Number(el.style.getPropertyValue('--nat-reading'))),1,'reading gradient must already cover the two-app beat')
    assert.equal(await page.locator('.naturalis-overlay button,.naturalis-overlay dialog').count(),0)
    await seek('naturalis',.7);await seek('naturalis',.5)
    assert.equal(await page.locator('.naturalis-copy h2').innerText(),firstHeading)
    report.checks.push(`${view}: no product buttons; reverse scroll passed`)
    await seek('naturalis',.35)
    await page.screenshot({path:`${output}/${view}-table-agenda.webp`})
    await seek('naturalis',.405)
    await page.screenshot({path:`${output}/${view}-table-agenda-held.webp`})
    for (const p of [.18,.24]) { await seek('naturalis',p); await page.screenshot({path:`${output}/${view}-foliage-${p}.webp`}) }
    for (const p of [.04,.08,.12]) { await seek('naturalis',p); await page.screenshot({path:`${output}/${view}-entry-${p}.webp`}) }
    for (const p of [.526,.565,.64]) { await seek('naturalis',p); await page.screenshot({path:`${output}/${view}-arrival-${p}.webp`}) }
    const pulse=await page.evaluate(async()=>{
      const {arrivalPulse}=await import('/src/scenes/naturalis/timing.ts')
      return {before:arrivalPulse(.526),arrivals:Array.from({length:6},(_,i)=>arrivalPulse(.54+i*.012)),after:arrivalPulse(.64)}
    })
    assert.equal(pulse.before,0);assert.equal(pulse.after,0)
    assert.ok(pulse.arrivals.every(v=>v>0))
    await seek('naturalis',.565)
    await page.screenshot({path:`${output}/${view}-arrival-reverse.webp`})
    report.checks.push({view,arrivalPulse:pulse,entryAndExitMaterials:'screenshots for visual review'})
    if(!mobile) {
      const color=async()=>{
        const s=await sharp(await page.locator('[data-experience-stage] canvas').screenshot()).extract({left:1190,top:360,width:24,height:24}).stats()
        return s.channels.slice(0,3).map(c=>c.mean)
      }
      await seek('naturalis',.3,'high');const baseColor=await color();const colors=[]
      for(const tier of ['medium','low','high']) { await seek('naturalis',.3,tier);const rgb=await color();colors.push({tier,rgb});assert.ok(Math.max(...rgb.map((v,i)=>Math.abs(v-baseColor[i])))<8,'daylight must match across LODs') }
      const frames=[]
      for(let step=55;step<=85;step++) {const p=step/100;await seek('naturalis',p,'high',55);frames.push({p,rgb:await color()})}
      const maxDelta=Math.max(...frames.slice(1).map((v,i)=>Math.max(...v.rgb.map((n,c)=>Math.abs(n-frames[i].rgb[c])))))
      assert.ok(maxDelta<45,'day/night transition must not jump between adjacent samples')
      report.checks.push({daylightAcrossLODs:colors,dayNightFrames:frames,maxAdjacentColorDelta:maxDelta})
    }
    assert.equal(audioRequests.length,0,'audio must require a gesture')
    await page.locator('[data-audio-control]').click();await page.waitForTimeout(900)
    assert.equal(await page.locator('[data-audio-control]').getAttribute('aria-pressed'),'true')
    assert.ok(audioRequests.length>0,'audio was requested by the gesture')
    await page.locator('[data-audio-control]').click()
    report.checks.push(`${view}: audio opt-in passed`)
    await seek('naturalis',.835)
    const posterMask=await page.addStyleTag({content:'body *{visibility:hidden!important}[data-experience-stage],[data-experience-stage] *{visibility:visible!important}'})
    // Windows can reject truncation/rename of a served image; copyFile works.
    const poster=`public/posters/naturalis/${view}.webp`
    const capturedPoster=`${output}/${view}-poster.webp`
    await page.screenshot({path:capturedPoster})
    await copyFile(capturedPoster,poster)
    await posterMask.evaluate(el=>el.remove())
    for(const p of [.87,.92,.97,.999]) {
      await seek('naturalis',p)
      await page.screenshot({path:`${output}/${view}-handoff-${p}.webp`})
    }
    await seek('banner-2',.02);await seek('naturalis',.92)
    for(let i=0;i<3;i++){await seek('hero',.35);await seek('naturalis',.5)}
    await seek('hero',.35);await page.waitForTimeout(3000)
    const after=await sample()
    assert.ok(after.gpu.geometries<=baseline.gpu.geometries,`${view}: geometries released`)
    assert.ok(after.gpu.textures<=baseline.gpu.textures,`${view}: textures released`)
    report.checks.push({view,baseline,afterExit:after})
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.goto('http://127.0.0.1:3012/?chapter=naturalis&progress=0.5&debug',{waitUntil:'networkidle'})
    await page.waitForTimeout(2000)
    assert.equal(await page.locator('[data-experience-stage] canvas').count(),0)
    assert.ok(await page.locator('[data-chapter="naturalis"] picture img').evaluate(el=>el.complete&&el.naturalWidth>0))
    report.checks.push(`${view}: reduced motion uses the generated poster`)
    await page.close()
  }
  const shared=await Promise.all(['client.webp','admin.webp','agenda.webp'].map(async n=>(await stat(`public/textures/naturalis/${n}`)).size))
  for(const tier of ['high','medium','low'])report.assets[tier]={bytes:(await stat(`public/models/naturalis/sala.${tier}.glb`)).size+(await stat(`public/textures/naturalis/night.${tier}.webp`)).size+shared.reduce((a,b)=>a+b,0)}
  report.assets.audioOptInBytes=(await stat('public/audio/naturalis.mp3')).size
  assert.equal(report.errors.length,0,JSON.stringify(report.errors))
  console.log(JSON.stringify({samples:report.samples.length,checks:report.checks,errors:report.errors,warnings:report.warnings,assets:report.assets},null,2))
} finally {
  await writeFile(`${output}/metrics.json`,JSON.stringify(report,null,2));await browser.close()
}

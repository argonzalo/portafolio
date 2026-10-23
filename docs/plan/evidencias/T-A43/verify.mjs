import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({headless:true,channel:"chrome"})
const results=[]
for (const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
 const context=await browser.newContext({viewport:{width,height},isMobile:name==='mobile',hasTouch:name==='mobile'})
 const page=await context.newPage()
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://127.0.0.1:3010/',{waitUntil:'networkidle'})
 await page.locator('[data-portrait-ready]').waitFor()
 await page.waitForTimeout(2200)
 await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-hero.png`})
 const centeredPortrait=name!=='mobile'||await page.locator('[data-hero-portrait]').evaluate(el=>Math.abs(el.getBoundingClientRect().left+el.getBoundingClientRect().width/2-window.innerWidth/2)<2)
 const initial=await page.locator('[data-hero-portrait] canvas').evaluate(c=>c.toDataURL())
 const box=await page.locator('[data-hero-portrait]').boundingBox()
 if(name==='desktop') {await page.mouse.move(box.x+box.width*.62,box.y+box.height*.4);await page.waitForTimeout(600)}
 const magnetic=await page.locator('[data-hero-portrait] canvas').evaluate(c=>c.toDataURL())
 await page.evaluate(()=>window.scrollTo(0,240))
 await page.waitForTimeout(800)
 const scrolled=await page.locator('[data-hero-portrait] canvas').evaluate(c=>c.toDataURL())
 await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-fragments.png`})
 for(let i=0;i<3;i++) {
  await page.locator('#manifesto').evaluate((el,i)=>window.scrollTo(0,(el.getBoundingClientRect().top+window.scrollY)-window.innerHeight*.65+window.innerHeight*.55*((i+1)/3)),i)
  await page.waitForTimeout(700)
  await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-phrase-${i+1}.png`})
 }
 await page.locator('#vibo').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.4))
 await page.waitForTimeout(600)
 const manifestoClearedBeforeVibo=await page.locator('.manifesto-copy').evaluate(el=>Number(getComputedStyle(el).opacity)<.01)
 await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-handoff.png`})
 const canvasSpansViewport=await page.locator('[data-hero-portrait] canvas').evaluate(el=>Math.abs(el.getBoundingClientRect().left)<2&&Math.abs(el.getBoundingClientRect().width-document.documentElement.clientWidth)<2)
 const session=await context.newCDPSession(page)
 if(name==='mobile') await session.send('Emulation.setCPUThrottlingRate',{rate:4})
 const frameTimes=await page.evaluate(async()=>{
   window.scrollTo(0,0)
   return await new Promise(resolve=>{
     const times=[];let previous=0
     function frame(t){if(previous)times.push(t-previous);previous=t;window.scrollTo(0,times.length*2);if(times.length<90)requestAnimationFrame(frame);else resolve(times)}
     requestAnimationFrame(frame)
   })
 })
 await session.send('Emulation.setCPUThrottlingRate',{rate:1})
 frameTimes.sort((a,b)=>a-b)
 const frameTiming={cpuRate:name==='mobile'?4:1,medianMs:Math.round(frameTimes[45]*100)/100,p95Ms:Math.round(frameTimes[85]*100)/100}
 const transparentReading=await page.locator('.hero-copy, .manifesto-copy').evaluateAll(elements=>elements.every(el=>getComputedStyle(el).backgroundColor==='rgba(0, 0, 0, 0)'&&getComputedStyle(el).boxShadow==='none'))
 const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.evaluate(()=>window.scrollTo(0,0))
 await page.waitForTimeout(500)
 const reduced=await page.locator('[data-hero-portrait]').evaluate(el=>!el.hasAttribute('data-portrait-ready')&&getComputedStyle(el.querySelector('img')).opacity==='1')
 const unsplit=await page.locator('[data-manifesto-phrase]').first().evaluate(el=>el.children.length===0)
 await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-reduced.png`})
 await page.emulateMedia({reducedMotion:'no-preference'})
 await page.locator('[data-portrait-ready]').waitFor()
 await page.getByRole('link',{name:'Ver todos los proyectos',exact:true}).click()
 await page.waitForURL('**/projects')
 await page.goBack()
 await page.locator('[data-portrait-ready]').waitFor()
 results.push({name,centeredPortrait,frameTiming,canvasSpansViewport,manifestoClearedBeforeVibo,transparentReading,noOverflow,magnetism:name==='desktop'?initial!==magnetic:'touch uses scroll',scrollChangesPortrait:scrolled!==initial,reduced,unsplit,navigationRemount:true,removedViboLink:await page.getByText('Así toma forma en Vibo').count()===0,errors})
 await context.close()
}
await writeFile('docs/plan/evidencias/T-A43/checks.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
await browser.close()


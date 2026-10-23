import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const browser=await chromium.launch({headless:true,channel:'chrome'})
const results=[]
for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:name==='mobile',hasTouch:name==='mobile'})
 const page=await context.newPage();const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://127.0.0.1:3010/',{waitUntil:'networkidle'})
 const sceneHeight=await page.locator('#manifesto').evaluate(el=>el.offsetHeight)
 const samples=[]
 for(const [index,p] of [0,.15,.42,.69,1].entries()){
  await page.locator('#manifesto').evaluate((el,p)=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.65+window.innerHeight*.65*p),p)
  await page.waitForTimeout(900)
  samples.push(await page.locator('[data-manifesto-phrase]').evaluateAll(els=>els.map(el=>Number(getComputedStyle(el).opacity))))
  await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-manifesto-reveal-${index}.png`})
 }
 await page.locator('#manifesto').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.7))
 await page.waitForTimeout(900)
 const reverseHidden=await page.locator('[data-manifesto-phrase]').evaluateAll(els=>els.every(el=>Number(getComputedStyle(el).opacity)<.001))
 const heightUnchanged=await page.locator('#manifesto').evaluate((el,before)=>el.offsetHeight===before,sceneHeight)
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.waitForTimeout(300)
 const reducedVisible=await page.locator('[data-manifesto-phrase]').evaluateAll(els=>els.every(el=>getComputedStyle(el).opacity==='1'&&el.children.length===0))
 const correctStaging=samples[0].every(v=>v<.001)&&samples[1][1]<.001&&samples[1][2]<.001&&samples[2][2]<.001&&samples[4].every(v=>v>.99)
 results.push({name,sceneHeight,heightUnchanged,samples,correctStaging,reverseHidden,reducedVisible,errors})
 await context.close()
}
await browser.close()
await writeFile('docs/plan/evidencias/T-A43/manifesto-reveal.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
if(results.some(r=>!r.correctStaging||!r.heightUnchanged||!r.reverseHidden||!r.reducedVisible||r.errors.length))process.exitCode=1

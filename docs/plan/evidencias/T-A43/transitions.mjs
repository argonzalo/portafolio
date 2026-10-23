import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true})
const results=[]
for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
 const context=await browser.newContext({viewport:{width,height},isMobile:name==='mobile',hasTouch:name==='mobile'})
 const page=await context.newPage();const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://127.0.0.1:3010/',{waitUntil:'networkidle'})
 const spacing=await page.locator('#manifesto').evaluate(root=>{
  const inner=root.firstElementChild;const title=root.querySelector('h2')
  const after=title.getBoundingClientRect().top+window.scrollY
  root.style.justifyContent='center';inner.style.paddingTop=window.innerWidth>=640?'96px':'64px'
  const before=title.getBoundingClientRect().top+window.scrollY
  root.style.removeProperty('justify-content');inner.style.removeProperty('padding-top')
  return {beforeTitleY:before,afterTitleY:after,earlierPx:before-after}
 })
 const timing=await page.evaluate(async()=>{
  const {handoff,handoffStart}=await import('/src/experience/choreography.ts')
  return {start:handoffStart('manifesto'),previousStart:handoffStart('vibo'),scrollRatio:(1-handoffStart('manifesto'))/(1-handoffStart('vibo')),startValue:handoff(.7,'manifesto'),endValue:handoff(1,'manifesto')}
 })
 const samples=[]
 for(const [index,p] of [.7,.775,.85,.925,1].entries()) {
  await page.locator('#manifesto').evaluate((el,p)=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.5+el.offsetHeight*p),p)
  await page.waitForTimeout(700)
  const data=await page.locator('.manifesto-copy').evaluate(el=>({textOpacity:Number(getComputedStyle(el).opacity),background:document.documentElement.style.getPropertyValue('--journey-background')}))
  samples.push({progress:p,...data})
  await page.screenshot({path:`docs/plan/evidencias/T-A43/${name}-vibo-entry-${index}.png`})
 }
 await page.locator('#manifesto').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-window.innerHeight*.5+el.offsetHeight*.85))
 await page.waitForTimeout(700)
 const reverse=await page.evaluate(()=>document.documentElement.style.getPropertyValue('--journey-background'))
 results.push({name,spacing,timing,samples,reverseMatchesMiddle:reverse===samples[2].background,errors})
 await context.close()
}
await browser.close()
await writeFile('docs/plan/evidencias/T-A43/transitions.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
if(results.some(r=>r.errors.length||r.spacing.earlierPx<=0||r.timing.scrollRatio<1.5||!r.reverseMatchesMiddle||r.samples.some(s=>s.textOpacity>.01)))process.exitCode=1

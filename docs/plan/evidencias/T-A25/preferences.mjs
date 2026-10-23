import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage({viewport:{width:390,height:844}})
const results=[]
await page.goto('http://127.0.0.1:3011/?chapter=banner-2&progress=0.5&quality=medium&debug')
await page.waitForSelector('[data-banner-caption]');await page.waitForTimeout(2200)
results.push({mode:'medium',debug:await page.locator('[data-debug-overlay]').textContent()})
await page.emulateMedia({reducedMotion:'reduce'})
await page.goto('http://127.0.0.1:3011/?chapter=banner-2&progress=0.12&quality=low')
await page.waitForSelector('[data-banner-caption]');await page.waitForTimeout(2200)
await page.evaluate(async()=>{const {_roots}=await import('/node_modules/.vite-a25/deps/@react-three_fiber.js');window.a25roots=_roots})
const sample=()=>page.evaluate(()=>{
  const root=[...window.a25roots.values()][0].store.getState()
  return {camera:root.camera.position.toArray(),slide:root.scene.getObjectByName('banner-interface-slides').material.uniforms.uSlide.value,mixes:[0,1].map(i=>root.scene.getObjectByName(`banner-video-${i}`).material.uniforms.uMix.value)}
})
const a=await sample()
await page.evaluate(()=>{const s=document.querySelector('#banner-2');scrollTo({top:s.getBoundingClientRect().top+scrollY-innerHeight/2+.85*s.offsetHeight,behavior:'instant'})})
await page.waitForTimeout(1400)
const b=await sample()
assert.deepEqual(a,b);assert.equal(a.slide,0);assert.deepEqual(a.mixes,[0,0])
results.push({mode:'reduced-motion-forced-low',a,b})
await browser.close();await writeFile('docs/plan/evidencias/T-A25/preferences.json',JSON.stringify(results,null,2));console.log('Medium y reduced motion sin zoom/slides/fades OK')

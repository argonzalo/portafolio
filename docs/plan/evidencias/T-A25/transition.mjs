import {chromium} from '@playwright/test'
import sharp from 'sharp'
import {writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'msedge',headless:true})
const samples=[]
for(const [view,width,height,quality] of [['desktop',1440,900,'high'],['mobile',390,844,'low']]){
  const page=await browser.newPage({viewport:{width,height}})
  await page.goto(`http://127.0.0.1:3011/?chapter=naturalis&progress=0.86&quality=${quality}`)
  await page.waitForSelector('[data-banner-caption]',{state:'attached'});await page.waitForTimeout(3500)
  await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'})
  await page.evaluate(async()=>{const {_roots}=await import('/node_modules/.vite-a25/deps/@react-three_fiber.js');window.a25roots=_roots})
  for(const p of [.86,.90,.92,.93,.94,.95,.97,.999]){
    await page.evaluate(p=>{const s=document.querySelector('#naturalis');scrollTo({top:s.getBoundingClientRect().top+scrollY-innerHeight/2+p*s.offsetHeight,behavior:'instant'})},p)
    await page.waitForTimeout(900)
    const sample=await page.evaluate(()=>{
      const state=[...window.a25roots.values()][0].store.getState()
      return {layers:state.scene.children.filter(c=>c.userData.reveal!==undefined).map(c=>({alpha:c.userData.reveal,visible:c.visible})),background:state.scene.background.getHexString(),camera:state.camera.position.toArray()}
    })
    samples.push({view,p,...sample})
    assert.ok(sample.layers.filter(l=>l.alpha>.001&&l.visible).length<=1,'No superponer los dos mundos sólidos')
    await sharp(await page.screenshot()).webp({quality:82}).toFile(`docs/plan/evidencias/T-A25/${view}-entrada-${p}.webp`)
  }
  await page.close()
}
await browser.close();await writeFile('docs/plan/evidencias/T-A25/transition.json',JSON.stringify(samples,null,2));console.log('16 posiciones de transición sin solapamiento de mundos OK')

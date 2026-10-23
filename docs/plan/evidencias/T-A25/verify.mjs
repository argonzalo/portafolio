import {chromium} from '@playwright/test'
import {writeFile,stat} from 'node:fs/promises'
import assert from 'node:assert/strict'
import sharp from 'sharp'

const posterOnly=process.env.A25_POSTERS==='1'
const base=posterOnly?'http://127.0.0.1:3011':'http://127.0.0.1:4191'
const out='docs/plan/evidencias/T-A25'
const browser=await chromium.launch({channel:'msedge',headless:true})
const report={samples:[],errors:[],warnings:[],lifecycle:[],fallback:[]}
for(const view of [{name:'desktop',width:1440,height:900,quality:'high',count:8,slots:4},{name:'mobile',width:390,height:844,quality:'low',count:4,slots:2}]){
  const page=await browser.newPage({viewport:{width:view.width,height:view.height}})
  await page.addInitScript(()=>{
    window.bannerVideos=[]
    const create=document.createElement
    document.createElement=function(tag,...args){const el=create.call(this,tag,...args);if(tag==='video')window.bannerVideos.push(el);return el}
  })
  if(!posterOnly){
    page.on('pageerror',e=>report.errors.push(e.message))
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})
    if(view.name==='mobile')await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate:4})
  }
  await page.goto(`${base}/?chapter=banner-2&progress=0.5&quality=${view.quality}&debug`)
  await page.waitForSelector('[data-banner-caption]')
  await page.waitForTimeout(3500)
  const seek=async(id,p)=>{
    await page.evaluate(({id,p})=>{const s=document.querySelector(`[data-chapter="${id}"]`);scrollTo({top:s.getBoundingClientRect().top+scrollY-innerHeight/2+p*s.offsetHeight,behavior:'instant'})},{id,p})
    await page.waitForTimeout(1400)
  }
  const videos=()=>page.evaluate(()=>window.bannerVideos.filter(v=>v.hasAttribute('src')).map(v=>({src:v.src.split('/').pop(),paused:v.paused,time:v.currentTime})))
  const span=await page.locator('#banner-2').evaluate(e=>e.offsetHeight/innerHeight)
  assert.ok(Math.abs(span-1)<.01,`La sección debe durar 100svh: ${span}`)
  await page.addStyleTag({content:'astro-dev-toolbar,[data-debug-overlay]{display:none!important}'})
  const positions=posterOnly?[.12,.30,.43,.56,.69,.85]:[.12,.30,.43,.56,.69,.85]
  for(const p of positions){
    await seek('banner-2',p)
    const frames=posterOnly?null:await page.evaluate(()=>new Promise(resolve=>{
      const values=[];let previous=performance.now()
      function tick(now){values.push(now-previous);previous=now;if(values.length===90){values.sort((a,b)=>a-b);resolve({fps:1000/(values.reduce((a,b)=>a+b,0)/values.length),p95:values[Math.floor(values.length*.95)]})}else requestAnimationFrame(tick)}requestAnimationFrame(tick)
    }))
    const a=await videos();await page.waitForTimeout(350);const b=await videos()
    assert.equal(b.length,view.count)
    const playing=b.filter(v=>!v.paused)
    assert.ok(playing.length>=view.slots && playing.length<=view.slots*2)
    assert.ok(b.every((v,i)=>v.paused||v.time!==a[i].time))
    const caption=await page.locator('[data-banner-caption]').textContent()
    assert.ok(caption.includes('Controlá lo que se ve. En todas partes.'))
    report.samples.push({view:view.name,p,sectionVh:span*100,frames,videos:b,caption})
    await sharp(await page.screenshot()).webp({quality:85}).toFile(`${out}/${view.name}-${p}.webp`)
    if(p===.12)await sharp(await page.locator('canvas').first().screenshot()).webp({quality:86}).toFile(`public/posters/banner-2${view.name==='mobile'?'-mobile':''}.webp`)
  }
  if(posterOnly){await page.close();continue}
  // The drawing counters keep polling while the debug panel is hidden.
  report.samples.push({view:view.name,gpuText:await page.locator('[data-debug-overlay]').textContent()})
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))})
  assert.ok((await videos()).every(v=>v.paused))
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))})
  for(const p of [.92,.97,.999,.5]){
    await seek('banner-2',p)
    await sharp(await page.screenshot()).webp({quality:80}).toFile(`${out}/${view.name}-handoff-${p}.webp`)
  }
  for(let i=0;i<2;i++){
    await seek('starbene',.5);await page.waitForTimeout(3500)
    assert.equal((await videos()).length,0)
    report.lifecycle.push({view:view.name,cycle:i,videos:await videos(),gpuText:await page.locator('[data-debug-overlay]').textContent()})
    if(i===0)await seek('banner-2',.5)
  }
  await page.goto(`${base}/?chapter=banner-2&progress=0.5&quality=static`)
  const img=page.locator('#banner-2 picture img')
  await img.waitFor();await page.waitForFunction(()=>document.querySelector('#banner-2 picture img')?.complete)
  assert.ok(await img.evaluate(e=>e.naturalWidth>0))
  report.fallback.push({view:view.name,mode:'static',src:await img.evaluate(e=>e.currentSrc)})
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto(`${base}/?chapter=banner-2&progress=0.5`)
  await page.waitForTimeout(1200)
  assert.equal(await page.locator('canvas').count(),0)
  report.fallback.push({view:view.name,mode:'reduced-motion',canvas:0})
  await page.close()
  console.log(view.name,'OK')
}
await browser.close()
if(!posterOnly){
  const clips=['bebidas-cafe-sirviendo-taza','comida-hamburguesa-cebolla','comida-pizza-caja','cosmetica-crema-skincare','deportes-futbol-playa','deportes-surfistas-playa','promo-black-friday-grafica','perfumeria-perfume-spray']
  for(const [view,indices] of [['desktop',[0,1,2,3,4,5,6,7]],['mobile',[0,1,4,5]]]){
    const suffix=view==='mobile'?'-mobile':''
    const files=[...[1,3,5,6].map(n=>`public/textures/banner/interface${n===1?'':`-${n}`}${suffix}.webp`),...indices.flatMap(i=>[`public/videos/banner/${clips[i]}.mp4`,`public/textures/banner/${clips[i]}.webp`])]
    const bytes=(await Promise.all(files.map(async f=>(await stat(f)).size))).reduce((a,b)=>a+b,0)
    report.samples.push({view,assetBytes:bytes,kib:Math.round(bytes/1024)})
    assert.ok(bytes/1024<(view==='desktop'?1200:600))
  }
  await writeFile(`${out}/metrics.json`,JSON.stringify(report,null,2))
  assert.deepEqual(report.errors,[])
  console.log('Un beat, 100svh, videos, handoffs y preferencias OK')
}

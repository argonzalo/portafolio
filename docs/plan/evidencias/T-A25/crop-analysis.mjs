import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage();await page.goto('http://127.0.0.1:3011/')
const clips=['bebidas-cafe-sirviendo-taza','comida-hamburguesa-cebolla','comida-pizza-caja','cosmetica-crema-skincare','deportes-futbol-playa','deportes-surfistas-playa','promo-black-friday-grafica','perfumeria-perfume-spray']
const results=[]
for(const clip of clips){
  const result=await page.evaluate(async clip=>{
    const v=document.createElement('video');v.muted=true;v.src=`/videos/banner/${clip}.mp4`
    await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject})
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight
    const ctx=c.getContext('2d'),rows=[]
    for(const time of [.3,1.5,3,4.5]){
      v.currentTime=time;await new Promise(resolve=>{v.onseeked=resolve});ctx.drawImage(v,0,0)
      const {data}=ctx.getImageData(0,0,c.width,c.height)
      const row=[]
      for(let y=0;y<c.height;y++){let sum=0,above=0;for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;const l=(data[i]+data[i+1]+data[i+2])/3;sum+=l;if(l>18)above++}row.push({mean:sum/c.width,above:above/c.width})}
      let top=0,bottom=c.height-1
      while(top<c.height*.3&&row[top].mean<12&&row[top].above<.02)top++
      while(bottom>c.height*.7&&row[bottom].mean<12&&row[bottom].above<.02)bottom--
      rows.push({time,top,bottom:bottom+1})
    }
    const result={clip,width:c.width,height:c.height,rows}
    v.removeAttribute('src');v.load();return result
  },clip)
  results.push(result)
}
await browser.close();await writeFile('docs/plan/evidencias/T-A25/crop-analysis.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results))

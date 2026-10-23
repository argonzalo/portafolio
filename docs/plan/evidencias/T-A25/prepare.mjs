import {chromium} from '@playwright/test'
import sharp from 'sharp'
const clips=['bebidas-cafe-sirviendo-taza','comida-hamburguesa-cebolla','comida-pizza-caja','cosmetica-crema-skincare','deportes-futbol-playa','deportes-surfistas-playa','promo-black-friday-grafica','perfumeria-perfume-spray']
for(const n of [1,3,5,6])for(const [width,height,suffix] of [[1536,864,''],[1024,576,'-mobile']]){
  await sharp(`public/images/proyects/banner-director/banner-2/${n}.webp`).resize(width,height,{fit:'cover',position:'top'}).webp({quality:85}).toFile(`public/textures/banner/interface${n===1?'':`-${n}`}${suffix}.webp`)
}
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage()
await page.goto('http://127.0.0.1:3011/')
for(const clip of clips){
  const frame=await page.evaluate(async clip=>{
    const v=document.createElement('video');v.muted=true;v.src=`/videos/banner/${clip}.mp4`
    await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject})
    v.currentTime=.3;await new Promise(resolve=>{v.onseeked=resolve})
    const c=document.createElement('canvas');c.width=320;c.height=180
    const cropTop=clip==='comida-hamburguesa-cebolla'?27:0,cropBottom=clip==='comida-hamburguesa-cebolla'?26:0
    const sourceHeight=v.videoHeight-cropTop-cropBottom
    const ratio=Math.max(320/v.videoWidth,180/sourceHeight),w=v.videoWidth*ratio,h=sourceHeight*ratio
    c.getContext('2d').drawImage(v,0,cropTop,v.videoWidth,sourceHeight,(320-w)/2,(180-h)/2,w,h)
    const result=c.toDataURL();v.removeAttribute('src');v.load();return result
  },clip)
  await sharp(Buffer.from(frame.split(',')[1],'base64')).webp({quality:80}).toFile(`public/textures/banner/${clip}.webp`)
}
await browser.close()

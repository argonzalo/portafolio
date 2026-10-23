import {chromium} from '@playwright/test'
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
for(const mobile of [false,true]){
const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900}})
await page.goto('http://127.0.0.1:4173/?chapter=pirp&progress=0.52&quality=high&debug',{waitUntil:'networkidle'})
await page.waitForTimeout(1500)
await page.addStyleTag({content:'[data-app-bar-root],[data-scene-caption],[data-debug-overlay]{display:none!important}'})
await page.locator('[data-audio-control]').evaluate(el=>el.style.display='none')
await page.screenshot({path:`public/posters/pirp/${mobile?'mobile':'desktop'}.webp`})
await page.close()
}
}finally{await browser.close()}

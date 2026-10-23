import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'chrome',headless:true})
const report={errors:[],warnings:[],responses:[],checks:[]}
try {
  for(const mobile of [false,true]) {
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile})
    page.on('pageerror',e=>report.errors.push(String(e)))
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})
    page.on('response',r=>{if(r.status()>=400)report.responses.push({url:r.url(),status:r.status()})})
    const cdp=await page.context().newCDPSession(page)
    if(mobile)await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
    for(const p of [.12,.3,.5,.7,.835]) {
      await page.goto(`http://127.0.0.1:4175/?chapter=naturalis&progress=${p}&quality=high&debug`,{waitUntil:'networkidle'})
      await page.waitForTimeout(1500)
      assert.equal(await page.locator('[data-experience-stage] canvas').count(),1)
      assert.equal(await page.locator('.naturalis-overlay button,.naturalis-overlay dialog').count(),0)
      assert.ok(await page.locator('.naturalis-copy').isVisible())
      report.checks.push({mobile,p,heading:await page.locator('.naturalis-copy h2').innerText()})
    }
    await page.close()
  }
  assert.equal(report.errors.length,0,JSON.stringify(report.errors))
  assert.equal(report.responses.length,0,JSON.stringify(report.responses))
  console.log('Production verification passed: 10 deep links, no errors or failed requests')
}finally{await writeFile('docs/plan/evidencias/T-A24/production.json',JSON.stringify(report,null,2));await browser.close()}

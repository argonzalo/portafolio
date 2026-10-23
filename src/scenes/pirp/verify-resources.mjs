import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:390,height:844}})
await p.goto('http://127.0.0.1:3010/?chapter=hero&progress=0.4&quality=high&debug',{waitUntil:'networkidle'})
const seek=async(chapter,progress)=>{await p.evaluate(async({chapter,progress})=>{const {experienceStore:s}=await import('/src/experience/store.ts');const el=document.querySelector(`[data-chapter="${chapter}"]`);scrollTo({top:el.getBoundingClientRect().top+window.scrollY-innerHeight/2+progress*el.offsetHeight,behavior:'instant'});window.dispatchEvent(new Event('experience:seek'));s.setChapter(chapter);s.setProgress(chapter,progress)},{chapter,progress});await p.waitForTimeout(4000)}
await p.locator('[data-debug-overlay]').evaluate(el=>el.style.display='none')
const r=[]
for(let i=0;i<3;i++){await seek('pirp',.85);await seek('hero',.4);r.push(await p.evaluate(async()=>(await import('/src/experience/gpuStats.ts')).getGpuStats()))}
console.log(JSON.stringify(r));await writeFile('docs/plan/evidencias/T-A23/resources.json',JSON.stringify(r,null,2));await b.close()

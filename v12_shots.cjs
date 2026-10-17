const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/'; const errs=[]; let fail=0;
for(const vp of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844}]){
const p=await b.newPage({viewport:vp,deviceScaleFactor:vp.width===1280?1:2}); p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>10,null,{timeout:120000});
for(const mode of ['all','LK']){ if(mode==='LK') await p.evaluate(()=>{const a=document.querySelector('#tl-all'); if(a.checked) a.click(); setPeriod('LK');}); await p.waitForTimeout(500);
const r=await p.evaluate(()=>[...document.querySelectorAll('.tl-seg')].map(s=>{const n=s.querySelector('.tl-n'),y=s.querySelector('.tl-y'),cs=getComputedStyle(n),ys=getComputedStyle(y),sr=s.getBoundingClientRect();
 const vis=e=>{const r=e.getBoundingClientRect(); return r.right<=sr.right+0.5&&r.left>=sr.left-0.5&&r.bottom<=sr.bottom+0.5&&r.top>=sr.top-0.5};
 return {t:n.textContent+' '+y.textContent,c:[cs.color,ys.color],w:[cs.fontWeight,ys.fontWeight],op:getComputedStyle(s).opacity,on:s.classList.contains('on'),fits:vis(n)&&vis(y)}}));
const bad=r.filter(x=>x.c.some(c=>c!=='rgb(255, 255, 255)')||x.w.some(w=>+w<700)||x.op!=='1'||!x.fits); if(bad.length) fail++;
console.log(vp.width,mode,bad.length?'FAIL '+JSON.stringify(bad):'OK', r.map(x=>x.t+(x.on?'*':'')).join(' | '));
if(vp.width===1440&&mode==='LK'){ const bx=await p.evaluate(()=>{const r=document.querySelector('.timeline-card').getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height}}); await p.screenshot({path:'screens/v12_periods.png',clip:bx}); }
if(vp.width===390&&mode==='LK'){ const bx=await p.evaluate(()=>{const r=document.querySelector('.timeline-card').getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height}}); await p.screenshot({path:'screens/v12_periods_mobile.png',clip:bx}); } }
await p.close(); }
console.log('FAILS',fail,'ERRORS',errs.length,errs.join('|')); await b.close();})();

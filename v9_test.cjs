const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/', pre=process.argv[3]||'v9'; let fail=0; const errs=[];
for(const vp of [{width:1440,height:900},{width:1280,height:720}]){
const p=await b.newPage({viewport:vp}); p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20&&__thumbs()>=85,null,{timeout:120000});
await p.evaluate(()=>document.querySelector('#tl-all').click());
const main=vp.width===1440;
if(main){ await p.waitForTimeout(2200); await p.screenshot({path:`screens/${pre}_home.png`}); }
await p.evaluate(()=>__zoomTo(36,112,5.2)); await p.waitForTimeout(2500);
if(main) await p.screenshot({path:`screens/${pre}_asia.png`});
const size=await p.evaluate(()=>{const s=[...document.querySelectorAll('.mk')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().width);return {n:s.length,max:Math.max(...s),min:Math.min(...s)}});
// pick up to 4 cards with most neighbours (dense China cluster)
const picks=await p.evaluate(()=>{const els=[...document.querySelectorAll('.mk')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.id,x:r.left+r.width/2,y:r.top+r.height/2}});
 return els.map(a=>({...a,nb:els.filter(b=>Math.hypot(a.x-b.x,a.y-b.y)<130).length})).sort((a,b)=>b.nb-a.nb).slice(0,4)});
for(const [i,pk] of picks.entries()){ await p.mouse.move(pk.x-30,pk.y-30); await p.mouse.move(pk.x,pk.y,{steps:4}); await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const t=document.getElementById('globe-tip'); const b=t.getBoundingClientRect(); if(getComputedStyle(t).display==='none') return {err:'hidden'};
  t.style.pointerEvents='auto'; let bad=[]; for(let gx=0;gx<=8;gx++)for(let gy=0;gy<=4;gy++){const x=b.left+5+gx*(b.width-10)/8,y=b.top+5+gy*(b.height-10)/4; const e=document.elementFromPoint(x,y); if(!e||!t.contains(e)) bad.push(e?(e.className||e.tagName):'null');} t.style.pointerEvents='none';
  const panels=['#drawer:not(.closed)','#preview.open','.timeline-card','.topbar'].map(q=>document.querySelector(q)).filter(Boolean).map(e=>e.getBoundingClientRect()).filter(q=>q.width&&!(b.right<=q.left||b.left>=q.right||b.bottom<=q.top||b.top>=q.bottom)).length;
  return {box:[b.left,b.top,b.width,b.height].map(Math.round),covered:bad.length,by:[...new Set(bad)].slice(0,3),inView:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,panels,parentIsBody:t.parentNode===document.body,z:getComputedStyle(t).zIndex}});
 const ok=!r.err&&r.covered===0&&r.inView&&r.panels===0; if(!ok) fail++;
 console.log(vp.width,'hover',pk.id,'neighbours',pk.nb,ok?'OK':'FAIL',JSON.stringify(r));
 if(main&&i===0) await p.screenshot({path:`screens/${pre}_hover.png`}); }
console.log(vp.width,'card px',JSON.stringify(size)); await p.close(); }
console.log('HOVER FAILS',fail,'ERRORS',errs.length,errs.join('|')); await b.close();})();

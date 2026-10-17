const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/', pre=process.argv[3]||'v13'; let fail=0; const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20&&__thumbs()>=document.querySelectorAll('.mk img').length,null,{timeout:120000});
const check=async(name,shot)=>{ await p.waitForTimeout(2500); await p.evaluate(()=>window.__snap&&__snap(true)); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{ const g=__geo(); const ov=[]; for(let i=0;i<g.rects.length;i++)for(let j=i+1;j<g.rects.length;j++){const a=g.rects[i],c=g.rects[j]; if(a.x<c.x+c.w&&c.x<a.x+a.w&&a.y<c.y+c.h&&c.y<a.y+a.h) ov.push(a.t+'/'+c.t);}
   const pe=[...document.querySelectorAll('#geo-layer,#geo-layer .geo')].filter(e=>getComputedStyle(e).pointerEvents!=='none').length;
   const mks=[...document.querySelectorAll('.mk,.mk-badge')].filter(e=>getComputedStyle(e).display!=='none'); let blocked=[]; let underLabel=0;
   for(const m of mks){ const r=m.getBoundingClientRect(); const x=r.left+r.width/2,y=r.top+r.height/2; const e=document.elementFromPoint(x,y); if(!e||!(m.contains(e))){ if(e&&e.closest('#geo-layer')) blocked.push(m.dataset.id||'badge'); }
     if(g.rects.some(l=>x>l.x&&x<l.x+l.w&&y>l.y&&y<l.y+l.h)) underLabel++; }
   const cont=g.rects.filter(x=>x.c.includes('geo-c')).map(x=>x.t), cn=g.rects.filter(x=>/geo-n/.test(x.c)).map(x=>x.t), oc=g.rects.filter(x=>x.c.includes('geo-o')).map(x=>x.t);
   return {cont,countries:cn,oceans:oc,labelOverlaps:ov,interactiveLabels:pe,markers:mks.length,blockedByLabel:blocked,markersUnderLabel:underLabel}; });
  const ok=!r.labelOverlaps.length&&!r.interactiveLabels&&!r.blockedByLabel.length; if(!ok) fail++;
  console.log(name,ok?'OK':'FAIL',JSON.stringify(r)); if(shot) await p.screenshot({path:`screens/${pre}_${shot}.png`}); await p.evaluate(()=>window.__snap&&__snap(false)); return r; };
await check('default','home');
await p.evaluate(()=>__zoomTo(42,108,4.3)); await check('asia','asia');
// hover + click a marker that sits on/near a country label
const tgt=await p.evaluate(()=>{const g=__geo().rects; const mks=[...document.querySelectorAll('.mk')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.id,x:r.left+r.width/2,y:r.top+r.height/2,r}});
  let best=null,bd=1e9; for(const m of mks) for(const l of g){ const d=Math.hypot(m.x-(l.x+l.w/2),m.y-(l.y+l.h/2)); if(d<bd){bd=d;best={...m,label:l.t,d:Math.round(d)};} } return best;});
await p.mouse.move(tgt.x-40,tgt.y-40); await p.mouse.move(tgt.x,tgt.y,{steps:5}); await p.waitForTimeout(300);
const tip=await p.evaluate(()=>{const t=document.getElementById('globe-tip'); return getComputedStyle(t).display!=='none'?t.querySelector('b')?.textContent:null});
await p.mouse.click(tgt.x,tgt.y); await p.waitForTimeout(1200);
const pv=await p.evaluate(()=>document.querySelector('#preview').classList.contains('open')?document.querySelector('#preview h2').textContent:null);
const hv=!!tip&&!!pv; if(!hv) fail++; console.log('hover/click near label',tgt.label,'dist',tgt.d,'tip',tip,'preview',pv,hv?'OK':'FAIL');
await p.evaluate(()=>document.querySelector('#pv-x')?.click()); await p.waitForTimeout(600);
await p.evaluate(()=>__zoomTo(28,15,6.2)); await check('europe_africa','europe_africa');
await p.evaluate(()=>__zoomTo(-25,-60,4.6)); await check('south_america');
await p.evaluate(()=>__zoomTo(0,0,15)); await check('far');
const perf=await p.evaluate(()=>{const t=performance.now(); for(let i=0;i<100;i++) __geoLayoutOnce(); return ((performance.now()-t)/100).toFixed(3)}); console.log('geoLayout ms',perf);
const m=await b.newPage({viewport:{width:390,height:844}}); m.on('pageerror',e=>errs.push(e.message)); await m.goto(U); await m.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000}); await m.waitForTimeout(2500);
const mr=await m.evaluate(()=>{const g=__geo(); let ov=0; for(let i=0;i<g.rects.length;i++)for(let j=i+1;j<g.rects.length;j++){const a=g.rects[i],c=g.rects[j]; if(a.x<c.x+c.w&&c.x<a.x+a.w&&a.y<c.y+c.h&&c.y<a.y+a.h) ov++;} return {n:g.rects.length,ov}}); console.log('mobile',JSON.stringify(mr)); if(mr.ov) fail++;
console.log('FAILS',fail,'ERRORS',errs.length,errs.join('|')); await b.close();})();

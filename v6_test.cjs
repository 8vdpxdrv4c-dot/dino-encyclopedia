const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errs=[]; let fail=0;
for (const vp of [[1280,720],[1366,768],[1440,900],[1920,1080],[390,844],[360,640]]){
 const p=await b.newPage({viewport:{width:vp[0],height:vp[1]}}); p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto('http://localhost:4178/#/'); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>10,null,{timeout:120000});
 const ids=await p.evaluate(()=>{ const D=[...document.querySelectorAll('.dr-item')].map(e=>e.dataset.id); return null; });
 const list=['spinosaurus','mamenchisaurus','tsintaosaurus','psittacosaurus','argentinosaurus','pinacosaurus','deinocheirus','leaellynasaura'];
 const brand=await p.evaluate(()=>{const r=document.querySelector('.brand').getBoundingClientRect(); return Math.round(r.left+r.width/2-innerWidth/2)});
 const res=[];
 for(const id of list){ await p.evaluate(id=>openPreview(id),id); await p.waitForTimeout(700);
   const r=await p.evaluate(()=>{const pv=document.querySelector('#preview'), pr=pv.getBoundingClientRect(), go=pv.querySelector('.go').getBoundingClientRect(), tl=document.querySelector('.timeline-card').getBoundingClientRect(), tb=document.querySelector('.topbar .brand').getBoundingClientRect();
     const mob=innerWidth<900; return {sh:pv.scrollHeight,ch:pv.clientHeight,goIn:go.bottom<=pr.bottom+0.5&&go.top>=pr.top, top:Math.round(pr.top), clearTl: mob||pr.bottom<=tl.top, inView: pr.bottom<=innerHeight+0.5}});
   const ok=r.sh<=r.ch&&r.goIn&&r.clearTl&&r.inView; if(!ok) fail++; res.push(id+(ok?' ok':' FAIL '+JSON.stringify(r)));
   if(id==='spinosaurus'){ await p.waitForTimeout(1500); await p.screenshot({path:`screens/v6_${vp[0]}x${vp[1]}_spinosaurus.png`}); 
     const ov=await p.evaluate(()=>{const pr=document.querySelector('#preview').getBoundingClientRect(); return [...document.querySelectorAll('.mk,.mk-badge')].filter(e=>getComputedStyle(e).display!=='none').filter(e=>{const b=e.getBoundingClientRect(); return b.left<pr.right&&pr.left<b.right&&b.top<pr.bottom&&pr.top<b.bottom}).length}); res.push('cards under panel: '+ov); if(ov) fail++; } }
 console.log(vp.join('x'),'brandOffsetFromCenter',brand,'\n  '+res.join('\n  '));
 await p.close(); }
console.log('FAIL',fail,'ERRORS',errs.length,errs.join('\n')); await b.close();})();

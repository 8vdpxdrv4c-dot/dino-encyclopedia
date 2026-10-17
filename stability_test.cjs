const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/'; const errs=[]; const R={};
const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',e=>errs.push(e.message));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000});
const diff=(a,b)=>{ let moved=0,merge=0,split=0,jump=0; for(let i=0;i<a.length;i++){ const x=a[i],y=b[i]; if(!x.inView||!y.inView) continue;
  if(x.mode==='card'&&y.mode==='merged') merge++; else if(x.mode==='merged'&&y.mode==='card') split++; else if(x.mode==='card'&&y.mode==='card'&&Math.hypot(x.ox-y.ox,x.oy-y.oy)>3){ moved++; if(Math.hypot(x.ox-y.ox,x.oy-y.oy)>12) jump++; } } return {moved,merge,split,jump}; };
async function run(name,setup,step,n,wait){ await p.evaluate(setup); await p.waitForTimeout(1500); let prev=await p.evaluate(()=>__slotState()); const per=[]; let T={moved:0,jump:0,merge:0,split:0};
  for(let i=0;i<n;i++){ await p.evaluate(step); await p.waitForTimeout(wait); const cur=await p.evaluate(()=>__slotState()); const d=diff(prev,cur); per.push(d.moved+d.merge+d.split); for(const k in T) T[k]+=d[k]; prev=cur; }
  const cards=prev.filter(x=>x.mode==='card').length; const steps0=per.filter(x=>x===0).length;
  R[name]={...T,total:T.moved+T.merge+T.split,perStepMax:Math.max(...per),stepsWithZeroChanges:`${steps0}/${n}`,cardsAtEnd:cards}; console.log(name,JSON.stringify(R[name])); }
// 40 steps x 2.5 deg, short wait (globe still "moving") and long wait (settled after each step)
await run('americas_drag_150ms',()=>__zoomTo(30,-95,5.7),()=>__rotateBy(2.5),40,150);
await run('americas_step_settle',()=>__zoomTo(30,-95,5.7),()=>__rotateBy(2.5),40,700);
await run('china_drag_150ms',()=>__zoomTo(36,108,4.6),()=>__rotateBy(2.5),40,150);
await run('china_step_settle',()=>__zoomTo(36,108,4.6),()=>__rotateBy(2.5),40,700);
await run('europe_africa_drag_150ms',()=>__zoomTo(25,15,6.2),()=>__rotateBy(-2.5),40,150);
await run('china_small_10x2.5_settle',()=>__zoomTo(36,108,4.6),()=>__rotateBy(2.5),10,700);
await run('americas_small_10x2.5_settle',()=>__zoomTo(30,-95,5.7),()=>__rotateBy(-2.5),10,700);
await run('autorotate_20s',()=>{__zoomTo(20,100,5.7); __autoRotate(true);},()=>0,40,500);
const tot=Object.values(R).reduce((t,r)=>t+r.total,0); console.log('TOTAL changes',tot,'ERRORS',errs.length); await b.close();})();

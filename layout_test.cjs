const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errs=[]; const U='http://localhost:4178/'; let fail=0; const ALL=[], CL=[];
const check=async(p,name)=>{ await p.waitForTimeout(1200); await p.evaluate(()=>__snap(true)); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{ const els=[...document.querySelectorAll('.mk,.mk-badge')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const b=e.getBoundingClientRect();return {id:e.dataset.id||'badge',x:b.left,y:b.top,w:b.width,h:b.height}});
    let ov=[]; for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){const a=els[i],c=els[j]; const ix=Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x), iy=Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y); if(ix>0&&iy>0) ov.push(a.id+'/'+c.id+' '+ix.toFixed(1)+'x'+iy.toFixed(1));}
    const L=[...document.querySelectorAll('#mk-lines line')].filter(l=>l.style.display!=='none'); const vis=[...document.querySelectorAll('.mk')].filter(e=>getComputedStyle(e).display!=='none').length; window.__cardsVis=vis; const lines=L.length; const MK=[...document.querySelectorAll('.mk')], LN=[...document.querySelectorAll('#mk-lines line')]; const cardLens=LN.map((l,i)=>[l,MK[i]]).filter(([l,e])=>l.style.display!=='none'&&e.style.display!=='none').map(([l])=>Math.hypot(l.x2.baseVal.value-l.x1.baseVal.value,l.y2.baseVal.value-l.y1.baseVal.value)); window.__clens=(window.__clens||[]).concat(cardLens); const lens=L.map(l=>Math.hypot(l.x2.baseVal.value-l.x1.baseVal.value,l.y2.baseVal.value-l.y1.baseVal.value)); window.__lens=(window.__lens||[]).concat(lens);
    return {avg:lens.length?(lens.reduce((a,b)=>a+b,0)/lens.length).toFixed(1):0,max:lens.length?Math.max(...lens).toFixed(1):0,cards:els.filter(e=>e.id!=='badge').length,badges:els.filter(e=>e.id==='badge').length,lines,ov}; });
  if(r.ov.length) fail++; ALL.push(...(await p.evaluate(()=>{const v=window.__lens||[]; window.__lens=[]; return v;}))); CL.push(...(await p.evaluate(()=>{const v=window.__clens||[]; window.__clens=[]; return v;}))); console.log(name, JSON.stringify({avg:r.avg,max:r.max,cards:r.cards,badges:r.badges,lines:r.lines,overlaps:r.ov.length, sample:r.ov.slice(0,3)}));
  await p.screenshot({path:`screens/layout_${name}.png`}); await p.evaluate(()=>__snap(false)); };
async function page(vp){const p=await b.newPage({viewport:vp}); p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 await p.goto(U+'#/'); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20&&__thumbs()>=document.querySelectorAll('.mk img').length,null,{timeout:120000}); await p.evaluate(()=>(e=>{if(!e.checked)e.click()})(document.querySelector('#tl-all'))); return p;}
let p=await page({width:1440,height:900});
await check(p,'desktop_default');
for (const [n,lat,lon,d] of [['china_far',35,110,7.5],['china_mid',36,112,5.2],['china_near',40,118,3.6],['liaoning_close',41.6,120.6,3.2],['europe',48,8,4.5],['northamerica',45,-108,4.2],['oblique',10,60,6]]){ await p.evaluate(([a,o,dd])=>__zoomTo(a,o,dd),[lat,lon,d]); await check(p,n); }
// while rotating (mid-motion, targets)
await p.evaluate(()=>{__zoomTo(30,100,5); const g=document; window.__rot=true;}); await p.evaluate(()=>{ const c=window; }); 
// badge click expands
const hasBadge=await p.evaluate(()=>{__zoomTo(38,112,9); return true}); await p.waitForTimeout(500);
const bb=await p.evaluate(()=>{const e=[...document.querySelectorAll('.mk-badge')].find(e=>getComputedStyle(e).display!=='none'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}});
console.log('badge at far zoom', JSON.stringify(bb)); await check(p,'far_badge');
if(bb){ await p.mouse.click(bb.x,bb.y); await p.waitForTimeout(3500); await check(p,'badge_expanded'); }
// panel + click real card
await p.keyboard.press('Escape'); await p.evaluate(()=>__zoomTo(38,112,4.5)); await p.waitForTimeout(600); const pt=await p.evaluate(()=>{ let r=__markerScreen('microraptor'); if(r.vis) return {...r,id:'microraptor'}; const c=__layoutRects().find(x=>!String(x.id).startsWith('badge')); return c?{x:c.x+c.w/2,y:c.y+c.h/2,vis:true,id:c.id}:{vis:false}; }); console.log('click card',pt.id); if(pt.vis){ await p.mouse.click(pt.x,pt.y);} await p.waitForTimeout(2500);
console.log('preview', await p.evaluate(()=>document.querySelector('#preview').classList.contains('open'))); await check(p,'panel');
console.log('layout ms', await p.evaluate(()=>{const t=performance.now(); for(let i=0;i<20;i++) window.__layoutOnce(); return ((performance.now()-t)/20).toFixed(2)})); await p.close(); let m=await page({width:390,height:844}); await check(m,'mobile_default');
for (const [n,lat,lon,d] of [['mobile_china',36,112,8],['mobile_liaoning',41,120,5]]){ await m.evaluate(([a,o,dd])=>__zoomTo(a,o,dd),[lat,lon,d]); await check(m,n); }
console.log('LINES overall avg',(ALL.reduce((a,b)=>a+b,0)/ALL.length).toFixed(1),'max',Math.max(...ALL).toFixed(1),'n',ALL.length); console.log('CARD LINES avg',(CL.reduce((a,b)=>a+b,0)/CL.length).toFixed(1),'max',Math.max(...CL).toFixed(1),'n',CL.length); console.log('FAILED VIEWS',fail,'ERRORS',errs.length,errs.join('\n')); await b.close();})();

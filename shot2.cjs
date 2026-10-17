const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const errs=[]; const U='http://localhost:4178/';
async function page(vp){const p=await b.newPage({viewport:vp}); p.on('console',m=>m.type()==='error'&&errs.push(m.text())); p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('requestfailed',r=>errs.push('REQFAIL '+r.url()));
 await p.goto(U+'#/'); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000}); await p.waitForTimeout(1200); return p;}
let p=await page({width:1440,height:900});
console.log('scroll', await p.evaluate(()=>[document.documentElement.scrollHeight,innerHeight, document.querySelector('#globe canvas').clientWidth]));
await p.waitForFunction(()=>window.__thumbs()>=document.querySelectorAll('.mk img').length,null,{timeout:60000}); await p.evaluate(()=>{(e=>{if(!e.checked)e.click()})(document.querySelector('#tl-all'));}); await p.waitForTimeout(1500); await p.screenshot({path:'screens/home_imgmarkers.png'});
 await p.evaluate(()=>{window.__zoomTo(35,110,3.6)}); await p.waitForTimeout(4000); await p.screenshot({path:'screens/home_imgmarkers_zoom.png'});
// click a visible marker via projection
await p.evaluate(()=>window.setPeriod('LJ'));
const pt = await p.evaluate(()=>window.__markerScreen('mamenchisaurus'));
console.log('marker pt',JSON.stringify(pt));
await p.waitForTimeout(300);
const pt2 = await p.evaluate(()=>window.__markerScreen('mamenchisaurus'));
if(pt2&&pt2.vis){ await p.mouse.move(pt2.x,pt2.y); await p.mouse.down(); await p.mouse.up(); } else await p.evaluate(()=>openPreview('mamenchisaurus'));
await p.waitForTimeout(5000); await p.click('#pv-x'); await p.waitForTimeout(800); const pt3=await p.evaluate(()=>window.__markerScreen('mamenchisaurus')); console.log('real click',JSON.stringify(pt3)); await p.mouse.move(pt3.x,pt3.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(2500); console.log('preview open', await p.evaluate(()=>document.querySelector('#preview').classList.contains('open')));
await p.screenshot({path:'screens/home_imgmarkers_panel.png'});
await p.click('#preview .go'); await p.waitForFunction(()=>location.hash.includes('dino')); await p.waitForTimeout(800); console.log('detail ok', await p.evaluate(()=>document.body.classList.contains('home-mode')));
let m=await page({width:390,height:844}); await m.screenshot({path:'screens/home_imgmarkers_mobile.png'});
await m.click('#drawer-btn'); await m.waitForTimeout(800); await m.screenshot({path:'screens/home_imgmarkers_mobile_drawer.png'});
console.log('ERRORS',errs.length,errs.join('\n')); await b.close();})();

const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}}); const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
const U=process.argv[2]||'http://localhost:4178/'; const pre=process.argv[3]||'v8';
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20&&__thumbs()>=document.querySelectorAll('.mk img').length,null,{timeout:120000});
await p.evaluate(()=>(e=>{if(!e.checked)e.click()})(document.querySelector('#tl-all')));
for(const [n,v] of [['home',null],['asia',[36,112,5.2]],['northamerica',[47,-108,4.2]]]){ if(v) await p.evaluate(v=>__zoomTo(...v),v); await p.waitForTimeout(2200); await p.screenshot({path:`screens/${pre}_${n}.png`}); }
console.log('ERRORS',errs.length,errs.join('|')); await b.close();})();

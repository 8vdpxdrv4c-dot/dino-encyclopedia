const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:{width:1440,height:900}});
 const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
 p.on('requestfailed',r=>errs.push('REQFAIL '+r.url()));
 const U='http://localhost:4178/';
 await p.goto(U+'#/'); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000});
 await p.waitForTimeout(1500); await p.screenshot({path:'screens/home.png'});
 await p.evaluate(()=>window.setPeriod('LJ')); await p.locator('#globe-wrap').scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
 await p.locator('#view-home').screenshot({path:'screens/globe.png'});
 console.log('globe', JSON.stringify(await p.evaluate(()=>__state())));
 // check WebGL pixels non-empty
 const lit = await p.evaluate(()=>{const c=document.querySelector('#globe canvas');const t=document.createElement('canvas');t.width=c.width;t.height=c.height;const x=t.getContext('2d');x.drawImage(c,0,0);const d=x.getImageData(0,0,t.width,t.height).data;let n=0;for(let i=3;i<d.length;i+=4*50)if(d[i]>0)n++;return n;});
 console.log('globe nonempty samples',lit);
 await p.goto(U+'#/dino/tyrannosaurus'); await p.waitForFunction(()=>__state().viewer&&__state().viewer.loaded&&__state().viewer.frames>20,null,{timeout:120000});
 await p.waitForTimeout(1000); await p.screenshot({path:'screens/detail.png'});
 await p.goto(U+'#/dino/mamenchisaurus'); await p.waitForTimeout(1500); await p.screenshot({path:'screens/detail_image.png'});
 await p.goto(U+'#/browse'); await p.waitForTimeout(1500); await p.screenshot({path:'screens/browse.png'});
 await p.setViewportSize({width:390,height:844}); await p.goto(U+'#/'); await p.waitForTimeout(2500); await p.screenshot({path:'screens/mobile.png'});
 console.log('ERRORS',errs.length, errs.join('\n')); await b.close();
})();

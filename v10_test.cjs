const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/'; let fail=0; const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000});
const def=await p.evaluate(()=>({all:document.querySelector('#tl-all').checked,note:document.querySelector('#globe-note').textContent}));
console.log('default',JSON.stringify(def)); if(!def.all) fail++;
// set a restrictive period first to prove search overrides it
await p.evaluate(()=>setPeriod('LK'));
for(const [q,id] of [['小盗龙','microraptor'],['钉状龙','kentrosaurus'],['始祖鸟','archaeopteryx'],['Archaeopteryx','archaeopteryx'],['霸王龙','tyrannosaurus'],['风神翼龙','quetzalcoatlus']]){
 await p.fill('#dq',q); await p.press('#dq','Enter'); await p.waitForTimeout(2500);
 const r=await p.evaluate(id=>{const pv=document.querySelector('#preview'); const mk=document.querySelector(`.mk[data-id="${id}"]`); return {open:pv.classList.contains('open'),title:pv.querySelector('h2')?.textContent,sel:window.globe?.sel, mk: !!mk && getComputedStyle(mk).display!=='none', list:document.querySelectorAll('#tl-list .dr-item').length}},id);
 const ok=r.open&&r.title; if(!ok) fail++; console.log('search',q,ok?'OK':'FAIL',JSON.stringify(r)); }
await p.fill('#dq',''); await p.dispatchEvent('#dq','input'); await p.evaluate(()=>{document.querySelector('#pv-x')?.click()});
// badge popover
await p.evaluate(()=>__zoomTo(38,112,9)); await p.waitForTimeout(2500);
const bb=await p.evaluate(()=>{const e=[...document.querySelectorAll('.mk-badge')].find(e=>getComputedStyle(e).display!=='none'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,n:e.querySelector('b').textContent}});
if(bb){ await p.mouse.click(bb.x,bb.y); await p.waitForTimeout(600); const pop=await p.evaluate(()=>{const q=document.querySelector('#badge-pop'); return q?{n:q.querySelectorAll('.bp-i').length}:null});
 console.log('badge',bb.n,'popover',JSON.stringify(pop)); if(!pop||String(pop.n)!==bb.n) fail++;
 await p.screenshot({path:'screens/v10_badgepop.png'});
 await p.click('#badge-pop .bp-i'); await p.waitForTimeout(1500); console.log('popover click opens preview',await p.evaluate(()=>document.querySelector('#preview').classList.contains('open'))); } else console.log('no badge at far zoom');
await p.goto(U+'#/groups'); await p.waitForTimeout(800); console.log('groups ptero',await p.evaluate(()=>document.body.innerText.includes('翼龙目 Pterosauria')));
await p.goto(U+'#/dino/tapejara'); await p.waitForTimeout(800); console.log('detail tag',await p.evaluate(()=>!!document.querySelector('.ptero-tag')));
await p.goto(U+'#/'); await p.waitForTimeout(3000); await p.screenshot({path:'screens/v10_home.png'});
console.log('FAILS',fail,'ERRORS',errs.length,errs.join('|')); await b.close();})();

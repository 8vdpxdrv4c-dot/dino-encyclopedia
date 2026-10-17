const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const U=process.argv[2]||'http://localhost:4178/'; let fail=0; const errs=[];
const p=await b.newPage({viewport:{width:1440,height:900}}); p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(U); await p.waitForFunction(()=>window.__state&&__state().texReady&&__state().globeFrames>20,null,{timeout:120000});
const def=await p.evaluate(()=>({all:document.querySelector('#tl-all').checked,note:document.querySelector('#globe-note').textContent}));
console.log('default',JSON.stringify(def)); if(!def.all) fail++;
// set a restrictive period first to prove search overrides it
await p.evaluate(()=>setPeriod('LK'));
for(const [q,id] of [['小盗龙','microraptor'],['钉状龙','kentrosaurus'],['始祖鸟','archaeopteryx'],['Archaeopteryx','archaeopteryx'],['霸王龙','tyrannosaurus'],['风神翼龙','quetzalcoatlus'],['十足鸟','archaeopteryx'],['无齿翼龙','pteranodon'],['准噶尔翼龙','dsungaripterus'],['Rhamphorhynchus','rhamphorhynchus'],['奇翼龙','yi'],['古神翼龙','tapejara']]){
 await p.fill('#dq',q); await p.press('#dq','Enter'); await p.waitForTimeout(2500);
 const r=await p.evaluate(id=>{const pv=document.querySelector('#preview'); const mk=document.querySelector(`.mk[data-id="${id}"]`); return {open:pv.classList.contains('open'),title:pv.querySelector('h2')?.textContent,sel:window.globe?.sel, mk: !!mk && getComputedStyle(mk).display!=='none', list:document.querySelectorAll('#tl-list .dr-item').length}},id);
 const want=await p.evaluate(id=>window.__zh?.(id),id); const ok=r.open&&r.title===want&&r.mk; if(!ok) fail++; console.log('search',q,ok?'OK':'FAIL',JSON.stringify(r)); }
await p.fill('#dq',''); await p.dispatchEvent('#dq','input'); await p.evaluate(()=>{document.querySelector('#pv-x')?.click()});
// badge popover
await p.evaluate(()=>__zoomTo(38,112,9)); await p.waitForTimeout(2500);
const bb=await p.evaluate(()=>{const e=[...document.querySelectorAll('.mk-badge')].find(e=>getComputedStyle(e).display!=='none'); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,n:e.querySelector('b').textContent}});
if(bb){ await p.mouse.click(bb.x,bb.y); await p.waitForTimeout(600); const pop=await p.evaluate(()=>{const q=document.querySelector('#badge-pop'); return q?{n:q.querySelectorAll('.bp-i').length}:null});
 console.log('badge',bb.n,'popover',JSON.stringify(pop)); if(!pop||String(pop.n)!==bb.n) fail++;
 await p.screenshot({path:'screens/v11_badgepop.png'});
 await p.click('#badge-pop .bp-i'); await p.waitForTimeout(1500); console.log('popover click opens preview',await p.evaluate(()=>document.querySelector('#preview').classList.contains('open'))); } else console.log('no badge at far zoom');
await p.goto(U+'#/groups'); await p.waitForTimeout(800); const gp=await p.evaluate(()=>{const h=[...document.querySelectorAll('.group-block h3')].find(e=>e.textContent.includes('翼龙类')); return {section:document.body.innerText.includes('翼龙目 Pterosauria'), n:h?h.closest('.group-block').querySelectorAll('.chip').length:0}}); console.log('groups ptero',JSON.stringify(gp)); if(!gp.section||gp.n!==16) fail++;
await p.goto(U+'#/browse'); await p.waitForTimeout(800); const fo=await p.evaluate(()=>[...document.querySelectorAll('#f-group option')].some(o=>o.value==='pterosauria')); await p.selectOption('#f-group','pterosauria'); await p.waitForTimeout(800); const nc=await p.evaluate(()=>document.querySelectorAll('#grid .card, .card').length); console.log('filter option',fo,'pterosaur cards',nc); if(!fo||nc!==16) fail++;
await p.selectOption('#f-group',''); await p.fill('#q','翼龙'); await p.dispatchEvent('#q','input'); await p.waitForTimeout(1200); console.log('browse search 翼龙 count',await p.evaluate(()=>document.querySelector('#count').textContent)); await p.screenshot({path:'screens/v11_search.png'});
const aic=await p.evaluate(()=>window.__aiCount?.()); console.log('AI images',aic); if(aic!==136) fail++;
await p.goto(U+'#/dino/quetzalcoatlus'); await p.waitForTimeout(2000); await p.screenshot({path:'screens/v11_ptero.png'});
const aiok=await p.evaluate(()=>{const i=document.querySelector('.hero-ai img'); return i&&i.complete&&i.naturalWidth===800&&i.src.includes('/ai/quetzalcoatlus.webp')}); console.log('ptero AI hero',aiok); if(!aiok) fail++;
for(const id of ['yi','tapejara']){ await p.goto(U+'#/dino/'+id); await p.waitForTimeout(1200); const ok=await p.evaluate(()=>{const i=document.querySelector('.hero-ai img'); return !!(i&&i.naturalWidth===800)&&!document.querySelector('.pimg-ph,.ph-none')}); console.log('AI hero',id,ok); if(!ok) fail++; }
console.log('detail tag',await p.evaluate(()=>!!document.querySelector('.ptero-tag')));
await p.goto(U+'#/'); await p.waitForTimeout(3000); await p.screenshot({path:'screens/v11_home.png'});
console.log('FAILS',fail,'ERRORS',errs.length,errs.join('|')); await b.close();})();

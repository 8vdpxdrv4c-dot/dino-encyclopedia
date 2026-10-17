import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PERIODS, GROUPS, REGIONS, DIETS, DINOS } from './data.js';
import IMAGES from './images.json';
import AI_LIST from './ai.json';
const AI = new Set(AI_LIST);
import { MODELS, TEXTURES } from './credits.js';

const $ = s => document.querySelector(s);
const BASE = import.meta.env.BASE_URL;
const P = Object.fromEntries(PERIODS.map(p => [p.key, p]));
const byId = Object.fromEntries(DINOS.map(d => [d.id, d]));
const imgUrl = d => IMAGES[d.id] ? BASE + IMAGES[d.id].file : null;
const aiUrl = d => AI.has(d.id) ? BASE+'ai/'+d.id+'.webp' : imgUrl(d);
const thumbUrl = d => BASE+'thumb/'+d.id+'.webp';

/* ---------- fireflies ---------- */
(function fireflies(){
  const c = $('#fireflies'), x = c.getContext('2d'); let W,H; const N = innerWidth < 700 ? 35 : 70;
  const fs = Array.from({length:N}, () => ({x:Math.random(),y:Math.random(),r:Math.random()*1.8+0.6,p:Math.random()*6.28,s:Math.random()*0.0006+0.0002,a:Math.random()*6.28}));
  const rs = () => { W = c.width = innerWidth*devicePixelRatio; H = c.height = innerHeight*devicePixelRatio; }; rs(); addEventListener('resize', rs);
  (function f(t){ x.clearRect(0,0,W,H);
    for (const q of fs){ q.a += (Math.random()-.5)*0.2; q.x += Math.cos(q.a)*q.s; q.y += Math.sin(q.a)*q.s; q.x=(q.x+1)%1; q.y=(q.y+1)%1;
      const al = 0.35+0.65*Math.max(0,Math.sin(t*0.0015+q.p)); const R=q.r*devicePixelRatio;
      const g = x.createRadialGradient(q.x*W,q.y*H,0,q.x*W,q.y*H,R*7); g.addColorStop(0,`rgba(255,214,120,${al})`); g.addColorStop(.25,`rgba(242,180,72,${al*.35})`); g.addColorStop(1,'rgba(242,180,72,0)');
      x.fillStyle=g; x.beginPath(); x.arc(q.x*W,q.y*H,R*7,0,6.29); x.fill(); }
    requestAnimationFrame(f); })(0);
})();

/* ---------- globe ---------- */
const globe = {};
function initGlobe(){
  const el = $('#globe');
  const r = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
  r.setPixelRatio(Math.min(devicePixelRatio,2)); el.appendChild(r.domElement);
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(40,1,0.1,100); cam.position.set(0,1.2,5.6);
  const ctl = new OrbitControls(cam, r.domElement); ctl.enableDamping = true; ctl.minDistance = 3.2; ctl.maxDistance = 15; ctl.enablePan = false; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.35;
  scene.add(new THREE.AmbientLight(0x6f8f6a, 1.1)); const sun = new THREE.DirectionalLight(0xffe2b0, 2.2); sun.position.set(3,2.5,1); cam.add(sun); scene.add(cam);
  const tex = new THREE.TextureLoader().load(BASE+'tex/earth.jpg', () => { globe.texReady = true; }); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({map:tex, roughness:0.95, metalness:0, color:0x9fb88f});
  const earth = new THREE.Mesh(new THREE.SphereGeometry(2,96,64), mat); scene.add(earth);
  // graticule
  const gl = []; for (let lat=-60; lat<=60; lat+=30) for (let lo=0; lo<360; lo+=4){ gl.push(ll(lat,lo,2.005), ll(lat,lo+4,2.005)); }
  for (let lo=0; lo<360; lo+=30) for (let lat=-88; lat<88; lat+=4){ gl.push(ll(lat,lo,2.005), ll(lat+4,lo,2.005)); }
  earth.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gl), new THREE.LineBasicMaterial({color:0x8fb27a, transparent:true, opacity:0.12})));
  // atmosphere
  const atm = new THREE.Mesh(new THREE.SphereGeometry(2.25,64,48), new THREE.ShaderMaterial({transparent:true, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false,
    uniforms:{c:{value:new THREE.Color(0x9bd47a)}},
    vertexShader:'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 c;varying vec3 n;void main(){float i=pow(0.72-dot(n,vec3(0,0,1.)),3.);gl_FragColor=vec4(c,1.)*i;}'}));
  scene.add(atm);
  // stars/spores
  const sp = new Float32Array(1500*3); for (let i=0;i<sp.length;i++) sp[i]=(Math.random()-.5)*40;
  const spg = new THREE.BufferGeometry(); spg.setAttribute('position', new THREE.BufferAttribute(sp,3));
  scene.add(new THREE.Points(spg, new THREE.PointsMaterial({color:0xcfe0a0, size:0.04, transparent:true, opacity:0.5})));
  // markers: 3D pins at true sites + DOM cards laid out in screen space (collision-free)
  const markers = [];
  for (const d of DINOS){
    const nrm = ll(d.lat,d.lon,1).normalize(); const col = new THREE.Color(P[d.period].color);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.014,10,8), new THREE.MeshBasicMaterial({color:col}));
    m.position.copy(nrm.clone().multiplyScalar(2.004)); m.userData.d=d; m.userData.n=nrm; earth.add(m); markers.push(m);
  }
  const layer = document.createElement('div'); layer.id='mk-layer'; layer.innerHTML='<svg id="mk-lines"></svg>'; $('#globe-wrap').appendChild(layer);
  const svg = layer.querySelector('svg'); const pOrder = Object.fromEntries(PERIODS.map((p,i)=>[p.key,i]));
  const sorted = [...markers].sort((a,b)=>pOrder[a.userData.d.period]-pOrder[b.userData.d.period] || a.userData.d.latin.localeCompare(b.userData.d.latin));
  sorted.forEach((m,i)=>{ const d=m.userData.d; m.userData.ord=i;
    const c=document.createElement('div'); c.className='mk'; c.style.setProperty('--c',P[d.period].color); c.dataset.id=d.id;
    c.innerHTML = (AI.has(d.id)||IMAGES[d.id]) ? `<img src="${BASE}thumb/${d.id}.webp" alt="${d.zh}" draggable="false">` : `<span class="ph">◈<b>${d.zh}</b></span>`;
    const img=c.querySelector('img'); if(img){ img.onload=()=>globe.thumbsLoaded=(globe.thumbsLoaded||0)+1; }
    c.onclick=()=>{ $('#globe-tip').style.display='none'; openPreview(d.id); };
    c.onmouseenter=e=>{ const tip=$('#globe-tip'); if(tip.parentNode!==document.body||tip.nextSibling) document.body.appendChild(tip); c.classList.add('hov'); tip.style.display='block'; tip.innerHTML=`<b>${d.zh}</b> <i>${d.latin}</i><br><small>${P[d.period].zh} · ${d.place}</small>`; };
    c.onmousemove=e=>placeTip(e.clientX,e.clientY);
    c.addEventListener('mouseenter',e=>placeTip(e.clientX,e.clientY));
    c.onmouseleave=()=>{ c.classList.remove('hov'); $('#globe-tip').style.display='none'; };
    layer.appendChild(c); m.userData.el=c; m.userData.cur=null;
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('stroke',P[d.period].color); svg.appendChild(ln); m.userData.ln=ln;
  });
  const badges=[]; const getBadge=i=>{ if(!badges[i]){ const b=document.createElement('div'); b.className='mk-badge'; layer.appendChild(b); b.onclick=()=>{ const cl=b._cl; if(!cl) return; const v=new THREE.Vector3(); cl.items.forEach(it=>v.add(it.m.userData.n)); globe.focus=v.normalize(); globe.zoomTo=Math.max(globe.ctl.minDistance, globe.cam.position.length()*0.62); globe.ctl.autoRotate=false; }; badges[i]=b; } return badges[i]; };
  Object.assign(globe,{r,scene,cam,ctl,earth,markers,mat,atm});
  const v3=new THREE.Vector3();
  function layout(){
    const W=el.clientWidth, H=el.clientHeight, dist=cam.position.length(), cd=cam.position.clone().normalize(), mob=W<700;
    const s=Math.round(Math.max(mob?25:29, Math.min(mob?38:52, (mob?44:60)*Math.pow(5.6/dist,0.55)*(mob?1.6:1)*0.72))), g=5, cell=s+g, pad=4, MAXN=mob?10:20;
    const items=[];
    for (const m of sorted){ const f=m.userData.n.dot(cd); m.userData.f=f;
      if(!m.visible || f<0.15){ continue; }
      v3.copy(m.position).applyMatrix4(earth.matrixWorld).project(cam); items.push({m,x:(v3.x+1)/2*W,y:(1-v3.y)/2*H}); }
    // obstacles: overlay UI panels
    if(!globe.obs||globe.frames%20===0){ const wr=el.getBoundingClientRect(); globe.obs=['.topbar','.hero-mini','#drawer:not(.closed)','.timeline-card','#preview.open','#drawer-btn.show'].map(q=>document.querySelector(q)).filter(Boolean).map(e=>{const r=e.getBoundingClientRect(); return {x0:r.left-wr.left,y0:r.top-wr.top,w:r.width,h:r.height};}).filter(r=>r.w>0); }
    const placed=[...globe.obs];
    const hit=(x,y,w,h)=>x<2||y<2||x+w>W-2||y+h>H-2||placed.some(o=>x<o.x0+o.w+pad && o.x0<x+w+pad && y<o.y0+o.h+pad && o.y0<y+h+pad);
    const under=it=>it.x<4||it.y<4||it.x>W-4||it.y>H-4||globe.obs.some(o=>it.x>o.x0&&it.x<o.x0+o.w&&it.y>o.y0&&it.y<o.y0+o.h); for(let i=items.length-1;i>=0;i--) if(under(items[i])) items.splice(i,1);
    const gap=6, LMAX=Math.round(Math.max(40,Math.min(56,s*1.3)));
    // 1) very dense clusters (anchors nearly coincident, more than MAXN) -> count badge
    const par=items.map((_,i)=>i), find=i=>par[i]===i?i:(par[i]=find(par[i]));
    for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){ const a=items[i],b=items[j]; if(Math.abs(a.x-b.x)<s*0.9&&Math.abs(a.y-b.y)<s*0.9) par[find(i)]=find(j); }
    const groups={}; items.forEach((it,i)=>(groups[find(i)]=groups[find(i)]||[]).push(it));
    const badgeCls=[], cardItems=[];
    for(const gm of Object.values(groups)){ if(gm.length>MAXN) badgeCls.push({items:gm}); else cardItems.push(...gm); }
    const placeBadge=(cl,cap=Math.max(W,H))=>{ const n=cl.items.length; cl.cx=cl.items.reduce((t,i)=>t+i.x,0)/n; cl.cy=cl.items.reduce((t,i)=>t+i.y,0)/n; cl.w=cl.h=s;
      for(let rr=0; rr<=cap; rr+=4){ const steps=rr===0?1:Math.max(8,Math.round(rr/8));
        for(let k=0;k<steps;k++){ const an=-Math.PI/2+(k%2?1:-1)*Math.ceil(k/2)*(2*Math.PI/steps); const x=cl.cx-s/2+Math.cos(an)*rr, y=cl.cy-s/2+Math.sin(an)*rr;
          if(!hit(x,y,s,s)){ cl.x0=x; cl.y0=y; placed.push(cl); return true; } } } return false; };
    // 2) cards: each as close as possible to its own dot, rings spiralling out, capped leader length; shrink before giving up
    const DIRS=24, dirs=[]; for(let k=0;k<DIRS;k++){ const an=-Math.PI/2+(k%2?1:-1)*Math.ceil(k/2)*(2*Math.PI/DIRS); dirs.push([Math.cos(an),Math.sin(an)]); }
    const tryPlace=(it,z,cap=LMAX)=>{ for(let r=0;r<=cap-gap;r+=4){ for(const [dx,dy] of dirs){
        // place card so its nearest edge is (gap+r) away from the anchor along direction
        const ex=Math.abs(dx)<1e-6?0:dx, ey=dy; const t=(gap+r)+z/2/Math.max(Math.abs(ex),Math.abs(ey),1e-6)*Math.min(1,Math.max(Math.abs(ex),Math.abs(ey)));
        const cx=it.x+ex*(z/2/Math.max(Math.abs(ex),Math.abs(ey))+gap+r), cy=it.y+ey*(z/2/Math.max(Math.abs(ex),Math.abs(ey))+gap+r);
        const x=cx-z/2, y=cy-z/2; if(!hit(x,y,z,z)) return [x,y]; } } return null; };
    const overflow=[]; const cardPos=new Map();
    for(const cl of badgeCls) placeBadge(cl,LMAX)||placeBadge(cl);
    const order=[...cardItems].sort((a,b)=>a.m.userData.ord-b.m.userData.ord);
    for(const it of order){ let p=null,z=s; for(const f of [1,0.84,0.7,0.58]){ z=Math.round(s*f); p=tryPlace(it,z); if(p) break; }
      if(!p){ z=Math.round(s*0.58); p=tryPlace(it,z,LMAX); }
      if(p){ cardPos.set(it.m,[p[0],p[1],z]); placed.push({x0:p[0],y0:p[1],w:z,h:z}); } else overflow.push(it); }
    // 3) leftovers merge into a nearby count badge instead of being pushed far away
    if(overflow.length){ const op=overflow.map((_,i)=>i), f2=i=>op[i]===i?i:(op[i]=f2(op[i]));
      for(let i=0;i<overflow.length;i++) for(let j=i+1;j<overflow.length;j++){ const a=overflow[i],b=overflow[j]; if(Math.hypot(a.x-b.x,a.y-b.y)<s*2.5) op[f2(i)]=f2(j); }
      const og={}; overflow.forEach((it,i)=>(og[f2(i)]=og[f2(i)]||[]).push(it));
      for(const gm of Object.values(og)){ const cx=gm.reduce((t,i)=>t+i.x,0)/gm.length, cy=gm.reduce((t,i)=>t+i.y,0)/gm.length;
        const join=badgeCls.find(b=>b.x0!==undefined && Math.hypot(b.x0+b.w/2-cx,b.y0+b.h/2-cy)<LMAX+s*0.8);
        if(join){ join.items.push(...gm); continue; }
        const cl={items:gm}; if(placeBadge(cl,LMAX)) { badgeCls.push(cl); continue; }
        const nb=badgeCls.filter(b=>b.x0!==undefined).sort((a,b)=>Math.hypot(a.x0-cx,a.y0-cy)-Math.hypot(b.x0-cx,b.y0-cy))[0];
        if(nb && Math.hypot(nb.x0-cx,nb.y0-cy)<s*4){ nb.items.push(...gm); continue; }
        if(placeBadge(cl)) badgeCls.push(cl); } }
    const shown=new Set(), rects=[]; let bi=0;
    for(const cl of badgeCls){ if(cl.x0===undefined) continue; const b=getBadge(bi++); b._cl=cl; b.style.display='flex'; b.style.width=b.style.height=cl.w+'px'; b.style.transform=`translate(${cl.x0}px,${cl.y0}px)`;
      b.innerHTML=`<b>${cl.items.length}</b><small>处化石</small>`; rects.push({id:'badge'+bi,x:cl.x0,y:cl.y0,w:cl.w,h:cl.h});
      const near=cl.items.reduce((p,q)=>Math.hypot(q.x-cl.cx,q.y-cl.cy)<Math.hypot(p.x-cl.cx,p.y-cl.cy)?q:p);
      for(const it of cl.items){ it.m.userData.target=null; it.m.userData.badgeAt=it===near?[cl.x0,cl.y0,cl.w,it.x,it.y]:null; shown.add(it.m); } }
    for(let i=bi;i<badges.length;i++){ badges[i].style.display='none'; badges[i]._cl=null; }
    for(const [m,[x,y,z]] of cardPos){ const it=items.find(i=>i.m===m); m.userData.target=[x,y]; m.userData.sz=z; m.userData.badgeAt=null; m.userData.anchor=[it.x,it.y]; shown.add(m); rects.push({id:m.userData.d.id,x,y,w:z,h:z}); }
    const seg=(ln,ax,ay,x,y,w,h)=>{ const nx=Math.min(Math.max(ax,x),x+w), ny=Math.min(Math.max(ay,y),y+h); if(Math.hypot(nx-ax,ny-ay)<1){ ln.style.display='none'; return; } ln.setAttribute('x1',ax);ln.setAttribute('y1',ay);ln.setAttribute('x2',nx);ln.setAttribute('y2',ny); ln.style.display=''; };
    for(const m of sorted){ const u=m.userData, e=u.el, ln=u.ln;
      if(!shown.has(m)||!u.target){ e.style.display='none'; u.cur=null; u.off=null;
        if(shown.has(m)&&u.badgeAt){ const [bx,by,bw,ax,ay]=u.badgeAt; seg(ln,ax,ay,bx,by,bw,bw); } else ln.style.display='none'; continue; }
      const z=u.sz||s, [tx,ty]=u.target, [ax0,ay0]=u.anchor, ox=tx-ax0, oy=ty-ay0; if(!u.off||globe.snap||!u.cur) u.off=[ox,oy]; else { const kf=1-Math.exp(-(globe.dt||0.016)*12); u.off[0]+=(ox-u.off[0])*kf; u.off[1]+=(oy-u.off[1])*kf; if(Math.abs(ox-u.off[0])<0.3&&Math.abs(oy-u.off[1])<0.3) u.off=[ox,oy]; } u.cur=[ax0+u.off[0],ay0+u.off[1]];
      e.style.display='block'; e.style.width=e.style.height=z+'px'; e.style.transform=`translate(${u.cur[0].toFixed(1)}px,${u.cur[1].toFixed(1)}px)`;
      e.style.opacity=Math.min(1,(u.f-0.15)/0.12).toFixed(2); e.classList.toggle('sel',u.d.id===globe.sel);
      seg(ln,ax0,ay0,u.cur[0],u.cur[1],z,z); }
    globe.rects=rects; globe.cardSize=s;
  }
  globe.layout=layout;
  const resize = () => { const w=el.clientWidth, h=el.clientHeight; if(!w||!h) return; r.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); svg.setAttribute('width',w); svg.setAttribute('height',h); cam.position.setLength(w/h<0.6?12.5:w/h<0.8?10:w/h<1.3?7:5.6); };
  new ResizeObserver(resize).observe(el); resize();
  const clock = new THREE.Clock();
  (function loop(){ requestAnimationFrame(loop); if (!$('#view-home').classList.contains('on')) return;
    const dt=Math.min(clock.getDelta(),0.1); globe.dt=dt;
    if (globe.focus){ const dist=cam.position.length(); cam.position.lerp(globe.focus.clone().multiplyScalar(dist),1-Math.exp(-dt*4)); cam.position.setLength(dist); if(cam.position.angleTo(globe.focus)<0.01) globe.focus=null; }
    if (globe.zoomTo){ const d=cam.position.length(); const nd=d+(globe.zoomTo-d)*(1-Math.exp(-dt*4)); cam.position.setLength(nd); if(Math.abs(nd-globe.zoomTo)<0.02) globe.zoomTo=null; }
    ctl.update(); r.render(scene,cam); layout(); globe.frames=(globe.frames||0)+1; })();
}
function ll(lat, lon, rad){ const a=THREE.MathUtils.degToRad(lat), o=THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(a)*Math.cos(o)*rad, Math.sin(a)*rad, -Math.cos(a)*Math.sin(o)*rad); }
const TINT = {LT:0xc8b08a, EJ:0x9fc49a, MJ:0x92bba0, LJ:0x8fb8b0, EK:0xa9c48a, LK:0xc6bf86, ALL:0x9fb88f};
function updateGlobe(periodKey){
  if (!globe.markers) return;
  const ok = new Set(currentList().map(d=>d.id)); for (const m of globe.markers) m.visible = ok.has(m.userData.d.id);
  globe.mat.color.set(TINT[periodKey]); globe.atm.material.uniforms.c.value.set(periodKey==='ALL'?0x9bd47a:P[periodKey].color);
}

/* ---------- timeline ---------- */
const TMAX=237, TMIN=66;
function initTimeline(){
  const track=$('#tl-track'); track.innerHTML = PERIODS.map(p=>`<div class="tl-seg" data-k="${p.key}" style="flex:${p.start-p.end};background:${p.color}">${p.zh} ${p.start}–${p.end}</div>`).join('');
  const range=$('#tl-range'); range.max = TMAX-TMIN;
  track.onclick = e => { const k=e.target.dataset.k; if(!k) return; $('#tl-all').checked=false; range.value = TMAX-(P[k].start+P[k].end)/2; apply(); };
  range.oninput = () => { $('#tl-all').checked=false; apply(); }; $('#tl-all').onchange = apply;
  function apply(){ const ma = TMAX - (+range.value); const all=$('#tl-all').checked;
    const per = PERIODS.find(p => ma<=p.start && ma>=p.end) || PERIODS[5]; const key = all?'ALL':per.key;
    $('#tl-ma').textContent = all ? '全部时代 · 2.37亿–6600万年前' : `${ma.toFixed(1)} 百万年前 · ${per.zh}（${per.start}–${per.end} Ma）`;
    track.querySelectorAll('.tl-seg').forEach(s=>s.classList.toggle('on', all || s.dataset.k===per.key));
    curPeriod = key; const list = currentList(); renderDrawer(list);
    $('#globe-note').innerHTML = `当前显示 <b style="color:var(--amber)">${list.length}</b> 个化石产地 · 大陆为现代位置示意（非古地理复原）`;
    updateGlobe(key); }
  apply(); window.setPeriod = k => { range.value = TMAX-(P[k].start+P[k].end)/2; apply(); };
}

/* ---------- home drawer + preview ---------- */
let curPeriod = 'ALL';
function currentList(){
  const q=($('#dq')?.value||'').trim().toLowerCase(), g=$('#d-group')?.value, di=$('#d-diet')?.value, re=$('#d-region')?.value;
  return DINOS.filter(d => (curPeriod==='ALL'||d.period===curPeriod) && (!q||(d.zh+d.latin+d.place).toLowerCase().includes(q)) && (!g||d.group===g) && (!di||d.diet===di) && (!re||d.region===re));
}
function renderDrawer(list){
  $('#d-count').textContent = `${curPeriod==='ALL'?'全部时代':P[curPeriod].zh} · ${list.length} 种`;
  $('#tl-list').innerHTML = list.map(d=>`<div class="dr-item" data-id="${d.id}"><img loading="lazy" src="${thumbUrl(d)}" alt=""><div><b>${d.zh}</b><small>${d.latin} · ${GROUPS[d.group].zh}</small></div><span class="dot" style="color:${P[d.period].color};background:${P[d.period].color}"></span></div>`).join('') || '<span class="count">此条件下暂无收录</span>';
}
function initDrawer(){
  opts('#d-group','类群',Object.entries(GROUPS).map(([k,g])=>[k,g.zh])); opts('#d-diet','食性',DIETS.map(x=>[x,x])); opts('#d-region','地区',REGIONS.map(x=>[x,x]));
  const upd=()=>{ const l=currentList(); renderDrawer(l); updateGlobe(curPeriod); $('#globe-note').innerHTML=`当前显示 <b style="color:var(--amber)">${l.length}</b> 个化石产地 · 大陆为现代位置示意（非古地理复原）`; };
  ['#dq','#d-group','#d-diet','#d-region'].forEach(x=>$(x).addEventListener('input',upd));
  $('#tl-list').onclick = e => { const it=e.target.closest('.dr-item'); if(it){ openPreview(it.dataset.id); if(innerWidth<900) setDrawer(false); } };
  const setDrawer = o => { globe.obs=null; $('#drawer').classList.toggle('closed',!o); $('#drawer-btn').classList.toggle('show',!o); };
  $('#drawer-x').onclick=()=>setDrawer(false); $('#drawer-btn').onclick=()=>{ setDrawer(true); closePreview(); };
  if (innerWidth<900) setDrawer(false);
}
function openPreview(id){
  const d=byId[id]; if(!d) return; const per=P[d.period], im=aiUrl(d), info=IMAGES[d.id];
  const fact=(k,v,st='')=>`<div title="${v}"><span>${k}</span><b${st}>${v}</b></div>`;
  $('#preview').innerHTML = `<button class="x" id="pv-x" aria-label="关闭">×</button>
   <div class="pimg" style="background-image:url('${im}')"><span class="ai-tag">AI 复原图</span>${info?`<img class="pimg-photo" src="${imgUrl(d)}" alt="化石/标本照片" title="化石/标本照片：${info.artist||''} · ${info.license}">`:''}</div>
   <div class="pb"><div class="eyebrow">${GROUPS[d.group].clade} · ${GROUPS[d.group].zh}</div><div class="pt"><h2>${d.zh}</h2><span class="latin">${d.latin}</span></div>
   <div class="facts pf">${fact('年代',per.zh,` style="color:${per.color}"`)}${fact('食性',d.diet)}${fact('命名',d.year+' 年')}${fact('体长',d.length)}${fact('体重',d.weight||'数据不详')}${fact('发现地',d.place)}</div>
   <p class="pdesc">${d.desc}</p><div class="fun pfun">✦ ${d.facts[0]}</div>
   <div class="pfoot"><a class="go" href="#/dino/${d.id}">查看完整档案${d.model?' · 3D 模型':''} →</a>
   <div class="pcredit">主图：AI 复原图（仅供参考）${info?` · 小图：${info.artist||'见来源'} · ${info.license} · Wikimedia Commons`:''}</div></div></div>`;
  $('#preview').classList.add('open'); globe.obs=null; $('#pv-x').onclick=closePreview;
  document.querySelectorAll('.dr-item').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
  globe.sel=id; const m = globe.markers.find(m=>m.userData.d.id===id); if (m){ globe.focus = m.userData.n.clone(); globe.ctl.autoRotate=false; }
  if (innerWidth<900) $('#drawer').classList.add('closed'), $('#drawer-btn').classList.add('show');
}
function closePreview(){ globe.obs=null; globe.sel=null; $('#preview').classList.remove('open'); globe.ctl.autoRotate=true; document.querySelectorAll('.dr-item.on').forEach(x=>x.classList.remove('on')); }
window.openPreview = openPreview;

/* ---------- browse ---------- */
function opts(sel, label, arr){ $(sel).innerHTML = `<option value="">${label}</option>`+arr.map(([v,t])=>`<option value="${v}">${t}</option>`).join(''); }
function card(d){ const im = aiUrl(d);
  return `<a class="card" href="#/dino/${d.id}"><div class="ph" style="${im?`background-image:url('${im}')`:''}">${d.model?'<span class="badge">3D</span>':''}</div>
  <div class="bd"><h3>${d.zh}</h3><i>${d.latin}</i><div class="meta">${P[d.period].zh} · ${GROUPS[d.group].zh} · ${d.diet} · ${d.region}</div></div></a>`; }
function initBrowse(){
  opts('#f-period','全部时代',PERIODS.map(p=>[p.key,p.zh])); opts('#f-group','全部类群',Object.entries(GROUPS).map(([k,g])=>[k,g.zh]));
  opts('#f-diet','全部食性',DIETS.map(x=>[x,x])); opts('#f-region','全部地区',REGIONS.map(x=>[x,x]));
  const run = () => { const q=$('#q').value.trim().toLowerCase(), pe=$('#f-period').value, gr=$('#f-group').value, di=$('#f-diet').value, re=$('#f-region').value;
    const list = DINOS.filter(d => (!q || (d.zh+d.latin+d.place+GROUPS[d.group].zh).toLowerCase().includes(q)) && (!pe||d.period===pe) && (!gr||d.group===gr) && (!di||d.diet===di) && (!re||d.region===re))
      .sort((a,b)=>PERIODS.findIndex(p=>p.key===a.period)-PERIODS.findIndex(p=>p.key===b.period));
    $('#count').textContent = `共 ${list.length} 种`; $('#grid').innerHTML = list.map(card).join(''); };
  ['#q','#f-period','#f-group','#f-diet','#f-region'].forEach(s=>$(s).addEventListener('input',run)); run();
  window.browseFilter = (k,v) => { $('#f-'+k).value=v; run(); };
}
function initGroups(){
  const order = [['蜥臀目 Saurischia',['theropoda','sauropodomorpha']],['鸟臀目 Ornithischia',['ornithischia_basal','stegosauria','ankylosauria','ornithopoda','pachycephalosauria','ceratopsia']]];
  $('#groups').innerHTML = order.map(([t,ks])=>`<h3 style="color:var(--amber2);letter-spacing:.2em">${t}</h3>`+ks.map(k=>{ const g=GROUPS[k], l=DINOS.filter(d=>d.group===k);
    return `<div class="panel group-block"><h3>${g.zh}<small>${g.en}</small> <span class="count">· ${l.length} 种</span></h3><p>${g.note}</p>${l.map(d=>`<a class="chip" href="#/dino/${d.id}">${d.zh}</a>`).join(' ')}</div>`; }).join('')).join('');
}
function initCredits(){
  const imgs = DINOS.filter(d=>IMAGES[d.id]).map(d=>{ const i=IMAGES[d.id]; return `<tr><td>${d.zh}</td><td><a href="${i.page}" target="_blank" rel="noopener">${i.title}</a></td><td>${i.artist||'—'}</td><td>${i.licenseUrl?`<a href="${i.licenseUrl}" target="_blank" rel="noopener">${i.license}</a>`:i.license}</td></tr>`; }).join('');
  $('#credits').innerHTML = `<div class="panel group-block"><h3>三维模型</h3><table><tr><th>模型</th><th>作者</th><th>来源</th><th>许可</th></tr>${MODELS.map(m=>`<tr><td>${m.name}</td><td>${m.author}</td><td><a href="${m.url}" target="_blank" rel="noopener">${m.url}</a></td><td>${m.license}</td></tr>`).join('')}</table></div>
  <div class="panel group-block"><h3>纹理与字体</h3><table>${TEXTURES.map(t=>`<tr><td>${t.name}</td><td>${t.author}</td><td><a href="${t.url}" target="_blank" rel="noopener">${t.url}</a></td><td>${t.license}</td></tr>`).join('')}</table></div>
  <div class="panel group-block"><h3>AI 复原图</h3><p>站内各恐龙的主图（标注“AI 复原图”）及地球上的缩略图由本站使用 AI 图像生成工具制作，依据公开的物种描述绘制，仅供参考与欣赏，可能与科学事实存在出入（如体色、羽毛分布、比例等），不代表学术复原结论。</p></div>
  <div class="panel group-block"><h3>图片（维基共享资源 Wikimedia Commons）</h3><p>以下图片均按原许可使用，未作内容修改（仅缩放）。点击文件名查看原始页面与完整署名。</p><table><tr><th>恐龙</th><th>文件</th><th>作者</th><th>许可</th></tr>${imgs}</table></div>
  <div class="panel group-block"><h3>数据说明</h3><p>物种数据（年代、体长、体重、产地、命名年份）整理自维基百科及其引用的学术文献，数值为常见估计，不同研究间可能存在差异；“命名年份”为该属正式命名的年份。地球上的大陆为现代位置示意，不代表中生代古地理。</p></div>`;
}

/* ---------- detail + model viewer ---------- */
let viewer = null;
function disposeViewer(){ if (!viewer) return; cancelAnimationFrame(viewer.raf); viewer.ro.disconnect(); viewer.scene.traverse(o=>{ o.geometry?.dispose(); [].concat(o.material||[]).forEach(m=>m.dispose()); }); viewer.r.dispose(); viewer.r.domElement.remove(); viewer=null; }
function showDetail(id){
  const d = byId[id]; if (!d){ location.hash='#/browse'; return; }
  const per = P[d.period], g = GROUPS[d.group], im = IMAGES[d.id];
  const idx = DINOS.indexOf(d), prev = DINOS[(idx-1+DINOS.length)%DINOS.length], next = DINOS[(idx+1)%DINOS.length];
  $('#detail').innerHTML = `<a class="back chip" href="#/browse">← 返回图鉴</a>
  <div class="detail"><div>
    <figure class="hero-ai"><img src="${aiUrl(d)}" alt="${d.zh} AI 复原图"><figcaption><span class="ai-tag">AI 复原图</span> 由本站使用 AI 生成，仅供参考，未必完全符合科学事实</figcaption></figure>
    ${d.model?`<div class="viewer" id="viewer" style="margin-top:14px"><div class="vlabel">三维模型：${MODELS.find(m=>m.key===d.model).name}（${MODELS.find(m=>m.key===d.model).author}，${MODELS.find(m=>m.key===d.model).license}）· 拖动旋转，滚轮缩放 · 低多边形艺术造型，非科学复原</div></div>`:''}
    ${im?`<figure class="panel photo2"><img src="${imgUrl(d)}" alt="${d.zh} 化石或标本照片" loading="lazy"><figcaption>化石 / 标本照片：${im.artist||'见来源'} · <a href="${im.page}" target="_blank" rel="noopener">${im.license} · Wikimedia Commons</a></figcaption></figure>`:''}</div>
  <div class="dt"><div class="eyebrow">${g.clade} · ${g.zh} ${g.en}</div><h1>${d.zh}</h1><div class="latin">${d.latin}</div>
    <div class="facts"><div><span>地质年代</span><b style="color:${per.color}">${per.zh}</b><br><small>${d.ma}</small></div><div><span>食性</span><b>${d.diet}</b></div>
    <div><span>体长</span><b>${d.length}</b></div><div><span>体重</span><b>${d.weight||'数据不详'}</b></div>
    <div><span>发现地</span><b>${d.place}</b></div><div><span>命名年份</span><b>${d.year} 年</b></div></div>
    <p>${d.desc}</p><h3 style="color:var(--amber2)">✦ 趣闻</h3>${d.facts.map(f=>`<div class="fun">${f}</div>`).join('')}
    <div style="margin-top:20px;display:flex;justify-content:space-between"><a class="chip" href="#/dino/${prev.id}">← ${prev.zh}</a><a class="chip" href="#/dino/${next.id}">${next.zh} →</a></div></div></div>`;
  if (d.model) buildViewer(d.model);
}
function buildViewer(key){
  const el = $('#viewer'); const r = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true}); r.setPixelRatio(Math.min(devicePixelRatio,2)); el.prepend(r.domElement);
  r.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%';
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0b1610, 6, 16); const cam = new THREE.PerspectiveCamera(40,1,0.01,100); cam.position.set(3.2,1.6,3.6);
  const ctl = new OrbitControls(cam, r.domElement); ctl.enableDamping=true; ctl.autoRotate=true; ctl.autoRotateSpeed=1.2; ctl.target.set(0,0.6,0);
  scene.add(new THREE.HemisphereLight(0xcfe8c0, 0x1a2a14, 1.6)); const k = new THREE.DirectionalLight(0xffd59a, 2.4); k.position.set(3,5,2); scene.add(k);
  const rim = new THREE.PointLight(0xf2b448, 6, 10); rim.position.set(-2,1.5,-2); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(3,48), new THREE.MeshStandardMaterial({color:0x1c3020, roughness:1})); ground.rotation.x=-Math.PI/2; scene.add(ground);
  const sp=new Float32Array(300*3); for(let i=0;i<300;i++){ sp[i*3]=(Math.random()-.5)*6; sp[i*3+1]=Math.random()*3; sp[i*3+2]=(Math.random()-.5)*6; }
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(sp,3)); const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffcf73,size:0.03,transparent:true,opacity:.8})); scene.add(pts);
  viewer = {r,scene}; let mixer=null;
  new GLTFLoader().load(BASE+'models/'+key+'.glb', gltf => { const o=gltf.scene; const b=new THREE.Box3().setFromObject(o), s=b.getSize(new THREE.Vector3()); const sc=2.6/Math.max(s.x,s.y,s.z); o.scale.setScalar(sc);
    const b2=new THREE.Box3().setFromObject(o), c=b2.getCenter(new THREE.Vector3()); o.position.x-=c.x; o.position.z-=c.z; o.position.y-=b2.min.y; scene.add(o);
    ctl.target.set(0,(b2.max.y-b2.min.y)/2,0);
    if (gltf.animations.length){ mixer=new THREE.AnimationMixer(o); const cl=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0]; mixer.clipAction(cl).play(); }
    viewer.loaded=true; }, undefined, e => console.warn('model load failed', e));
  const rs=()=>{ const w=el.clientWidth,h=el.clientHeight; r.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); };
  viewer.ro=new ResizeObserver(rs); viewer.ro.observe(el); rs(); const clock=new THREE.Clock();
  const loop=()=>{ viewer.raf=requestAnimationFrame(loop); const dt=clock.getDelta(); mixer&&mixer.update(dt); pts.rotation.y+=dt*0.05; ctl.update(); r.render(scene,cam); viewer.frames=(viewer.frames||0)+1; }; loop();
}

/* ---------- router ---------- */
function route(){
  const h = location.hash.replace(/^#\/?/,''); const [v,arg] = h.split('/'); const view = v||'home';
  disposeViewer(); document.body.classList.toggle('home-mode', view==='home' || !['browse','groups','credits','dino'].includes(view));
  document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on', s.id==='view-'+(view==='dino'?'dino':view)));
  if (!document.querySelector('.view.on')) $('#view-home').classList.add('on');
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on', a.dataset.nav===view));
  if (view==='dino') showDetail(arg);
  scrollTo(0,0);
}
$('#stats').innerHTML = `<div><b>${DINOS.length}</b>收录物种</div><div><b>${DINOS.filter(d=>d.region==='中国').length}</b>中国发现</div><div><b>${DINOS.filter(d=>d.model).length}</b>三维模型</div><div><b>${PERIODS.length}</b>地质时段</div>`;
initGlobe(); initDrawer(); initTimeline(); initBrowse(); initGroups(); initCredits();
addEventListener('hashchange', route); route();
window.__state = () => ({globeFrames:globe.frames||0, texReady:!!globe.texReady, viewer: viewer?{frames:viewer.frames||0, loaded:!!viewer.loaded}:null});
window.__markerScreen = id => { const m=globe.markers.find(m=>m.userData.d.id===id); const r=(globe.rects||[]).find(r=>r.id===id); if(!m||!r) return {vis:false}; return {x:r.x+r.w/2,y:r.y+r.h/2,vis:true}; };
window.__layoutRects = () => globe.rects||[];
window.__thumbs = () => globe.thumbsLoaded||0;
window.__zoomTo = (lat,lon,dist) => { globe.ctl.autoRotate=false; globe.focus=null; globe.zoomTo=null; globe.cam.position.copy(ll(lat,lon,dist)); globe.ctl.update(); };
window.__snap = v => { globe.snap=v; };
window.__layoutOnce = () => globe.layout();
{ const tl=document.querySelector('.timeline-card'); const upd=()=>{ const r=tl.getBoundingClientRect(); document.documentElement.style.setProperty('--tlh',(innerHeight-r.top+10)+'px'); globe.obs=null; }; new ResizeObserver(upd).observe(tl); addEventListener('resize',upd); upd(); }

// hover tooltip: top-level fixed overlay, kept inside viewport and off side panels
function placeTip(mx,my){ const tip=document.getElementById('globe-tip'); if(!tip||tip.style.display==='none') return;
  const w=tip.offsetWidth, h=tip.offsetHeight, M=8;
  const obs=['.topbar','#drawer:not(.closed)','#preview.open','.timeline-card','.hero-mini'].map(q=>document.querySelector(q)).filter(Boolean).map(e=>e.getBoundingClientRect()).filter(r=>r.width>0);
  const cands=[[mx+16,my-h/2],[mx-16-w,my-h/2],[mx-w/2,my-18-h],[mx-w/2,my+20],[mx+16,my+16],[mx-16-w,my-16-h]];
  const clamp=([x,y])=>[Math.max(M,Math.min(innerWidth-w-M,x)),Math.max(M,Math.min(innerHeight-h-M,y))];
  const bad=([x,y])=>obs.reduce((a,r)=>a+Math.max(0,Math.min(x+w,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+h,r.bottom)-Math.max(y,r.top)),0);
  let best=null,bs=1e18; for(const c of cands){ const q=clamp(c); const cover=(mx>=q[0]&&mx<=q[0]+w&&my>=q[1]&&my<=q[1]+h)?1e7:0; const sc=bad(q)+cover; if(sc<bs){bs=sc;best=q;} if(sc===0) break; }
  tip.style.left=best[0]+'px'; tip.style.top=best[1]+'px'; }

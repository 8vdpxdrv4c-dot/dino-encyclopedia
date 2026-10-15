import {DINOS} from './src/data.js'; import fs from 'fs';
const UA={'User-Agent':'DinoEncyclopediaBuilder/1.0 (offline educational project)'};
const out=fs.existsSync('src/images.json')?JSON.parse(fs.readFileSync('src/images.json')):{};
for(const d of DINOS){ if(out[d.id]) continue;
 for(let a=0;a<3;a++){ try{
    const r=await (await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=name&redirects=1&titles=${encodeURIComponent(d.wiki)}`,{headers:UA})).json();
    const p=Object.values(r.query.pages)[0]; const name=p.pageimage; if(!name){console.log('noimg',d.id);break;}
    const ii=await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&titles=File:${encodeURIComponent(name)}`,{headers:UA})).json();
    const pg=Object.values(ii.query.pages)[0]; const info=pg.imageinfo&&pg.imageinfo[0]; if(!info){console.log('notcommons',d.id,name);break;}
    const m=info.extmetadata; const lic=m.LicenseShortName?.value||''; 
    if(!/CC|Public domain|PD|CC0/i.test(lic)){console.log('badlic',d.id,lic);break;}
    const url=info.thumburl||info.url; const ext=(url.match(/\.(jpe?g|png|webp)/i)||['.jpg'])[0].toLowerCase();
    const buf=Buffer.from(await (await fetch(url,{headers:UA})).arrayBuffer()); const fn=`img/${d.id}${ext}`; fs.writeFileSync('public/'+fn,buf);
    const strip=s=>(s||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().slice(0,160);
    out[d.id]={file:fn,title:name,page:info.descriptionurl,license:lic,licenseUrl:m.LicenseUrl?.value||'',artist:strip(m.Artist?.value)};
    console.log('ok',d.id,lic,buf.length); fs.writeFileSync('src/images.json',JSON.stringify(out,null,1)); break;
  }catch(e){console.log('err',d.id,e.message); await new Promise(r=>setTimeout(r,30000));} }
  await new Promise(r=>setTimeout(r,3000));
}
fs.writeFileSync('src/images.json',JSON.stringify(out,null,1));

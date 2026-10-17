import json,os,sys,numpy as np
ONLY=set(sys.argv[1:])  # optional: process only these ids
from PIL import Image,ImageOps,ImageFilter,ImageEnhance,ImageDraw,ImageFont
P=[p for p in json.load(open('gen/prompts.json')) if os.path.exists(f"gen/raw/{p['id']}.jpg") or os.path.exists(f"gen/raw/{p['id']}.png")]; os.makedirs('public/ai',exist_ok=True)
OV=json.load(open('gen/overrides.json')) if os.path.exists('gen/overrides.json') else {}
report={}
def bbox(im):
    g=np.asarray(im.convert('L').resize((512,288)),dtype=np.float32)
    gx=np.abs(np.diff(g,axis=1))[:-1,:]; gy=np.abs(np.diff(g,axis=0))[:,:-1]; e=gx+gy
    e=np.asarray(Image.fromarray(np.clip(e*2,0,255).astype(np.uint8)).filter(ImageFilter.BoxBlur(3)),dtype=np.float32)
    m=e>np.percentile(e,88)
    cols=m.sum(0).astype(float); rows=m.sum(1).astype(float)
    def ext(v,frac=0.006):
        c=np.cumsum(v); t=c[-1]; lo=np.searchsorted(c,t*frac); hi=np.searchsorted(c,t*(1-frac)); return lo,hi
    x0,x1=ext(cols); y0,y1=ext(rows)
    s=1024/512; bbox.m=m; return x0*s,x1*s,y0*s,y1*s
ALLP=P; P=[p for p in P if not ONLY or p['id'] in ONLY]
for p in P:
    i=p['id']; im=Image.open(f'gen/raw/{i}.jpg' if os.path.exists(f'gen/raw/{i}.jpg') else f'gen/raw/{i}.png').convert('RGB'); W,H=im.size
    x0,x1,y0,y1=bbox(im); x0-=40; x1+=40
    if i in OV: x0,x1=OV[i].get('x0',x0),OV[i].get('x1',x1); mode=OV[i].get('mode')
    else: mode=None
    ext=(x1-x0)+200; w=min(W,max(H*4/3,ext)); w = W if w>W*0.9 else w
    if i in OV and 'w' in OV[i]: w=OV[i]['w']
    cx=(x0+x1)/2; L=min(max(0,cx-w/2),W-w)
    reg=im.crop((int(L),0,int(L+w),H)); nh=round(H*800/w); sm=reg.resize((800,nh),Image.LANCZOS)
    if nh>=600: out=sm.crop((0,(nh-600)//2,800,(nh-600)//2+600)); kind='crop'; top=(600-nh)/2
    else:
        bg=reg.resize((800,600)).filter(ImageFilter.GaussianBlur(28)); bg=ImageEnhance.Brightness(bg).enhance(0.6); out=bg
        top=(600-nh)//2; F=min(36,top) if top>0 else 0; mask=Image.new('L',(800,nh),255); d=ImageDraw.Draw(mask)
        for k in range(F): a_=int(255*k/F); d.line([(0,k),(800,k)],fill=a_); d.line([(0,nh-1-k),(800,nh-1-k)],fill=a_)
        out.paste(sm,(0,top),mask); kind='pad'
    sc=800/w; cw=w
    out.save(f'public/ai/{i}.webp','WEBP',quality=80)
    sx=(cx-L)*sc; sy=top+((y0+y1)/2)*sc; side=min(600,max((x1-x0)*sc*0.72,(y1-y0)*sc*1.1,260))
    l=min(max(0,sx-side/2),800-side); t=min(max(0,sy-side/2),600-side)
    out.crop((int(l),int(t),int(l+side),int(t+side))).resize((128,128),Image.LANCZOS).save(f'public/thumb/{i}.webp','WEBP',quality=74)
    report[i]={'mode':kind,'w':int(w),'x0':int(x0),'x1':int(x1)}
json.dump([p['id'] for p in json.load(open('gen/prompts.json')) if os.path.exists(f"public/ai/{p['id']}.webp")],open('src/ai.json','w'))
if ONLY and os.path.exists('gen/report.json'): report={**json.load(open('gen/report.json')),**report}
json.dump(report,open('gen/report.json','w'),indent=0)
print({k:sum(1 for v in report.values() if v['mode']==k) for k in ['crop','pad']}); print('pad:',[k for k,v in report.items() if v['mode']=='pad'])
# contact sheet
tw,th=200,150; cols=10; rows=(len(P)+cols-1)//cols; S=Image.new('RGB',(cols*tw,rows*(th+18)),'#050a07'); D=ImageDraw.Draw(S)
for n,p in enumerate(P):
    t=Image.open(f"public/ai/{p['id']}.webp").resize((tw,th)); x=(n%cols)*tw; y=(n//cols)*(th+18); S.paste(t,(x,y)); D.text((x+3,y+th+3),p['id'],fill='#f2b448')
S.save('screens/ai_contact.png'); print('sheet',S.size)

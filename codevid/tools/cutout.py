"""cutout.py <image> <out.png> [--holes]  — remove a flat studio background; --holes also clears enclosed gaps (arms near head)."""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
f, outp = sys.argv[1], sys.argv[2]; holes = '--holes' in sys.argv
im=Image.open(f).convert('RGB'); a=np.asarray(im).astype(int)
bg=np.median(np.concatenate([a[:20,:20].reshape(-1,3),a[:20,-20:].reshape(-1,3),a[-20:,:20].reshape(-1,3)]),axis=0)
d=np.sqrt(((a-bg)**2).sum(-1)); fg=(d>20)
lab,n=ndimage.label(~fg); bgmask=np.zeros_like(fg)
for i in range(1,n+1):
    reg=lab==i; ys,xs=np.where(reg)
    touches=ys.min()==0 or xs.min()==0 or ys.max()==a.shape[0]-1 or xs.max()==a.shape[1]-1
    if touches or (holes and reg.sum()>600 and a[reg].std(axis=0).mean()<4.5): bgmask|=reg
mask=~bgmask
lab2,n2=ndimage.label(mask); sizes=ndimage.sum(mask,lab2,range(1,n2+1)); mask=lab2==(np.argmax(sizes)+1)
if not holes: mask=ndimage.binary_fill_holes(mask)
ys,xs=np.where(mask); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
alpha=Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
out=im.copy(); out.putalpha(alpha); out=out.crop((x0-4,y0-4,x1+5,y1+5)).resize(((x1-x0+9)*2,(y1-y0+9)*2),Image.LANCZOS)
out.save(outp); print(outp,out.size)

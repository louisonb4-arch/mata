import numpy as np, potrace
from scipy import ndimage
a=np.load('mask.npy'); m=a.copy(); m[1900:]=False; b=a.copy(); b[:1900]=False
def paths(mask,x0,y0):
    bm=potrace.Bitmap(~mask); path=bm.trace(turdsize=20,alphamax=1.0,opticurve=True,opttolerance=0.3)
    out=[]
    for c in path:
        s=c.start_point; d=[f"M{s.x-x0:.0f} {s.y-y0:.0f}"]
        for seg in c.segments:
            if seg.is_corner: d.append(f"L{seg.c.x-x0:.0f} {seg.c.y-y0:.0f}L{seg.end_point.x-x0:.0f} {seg.end_point.y-y0:.0f}")
            else: d.append(f"C{seg.c1.x-x0:.0f} {seg.c1.y-y0:.0f} {seg.c2.x-x0:.0f} {seg.c2.y-y0:.0f} {seg.end_point.x-x0:.0f} {seg.end_point.y-y0:.0f}")
        d.append('Z'); out.append(''.join(d))
    return ''.join(out)
lab,n=ndimage.label(m)
ys,xs=np.where(m); X0,Y0=xs.min(),ys.min(); W=xs.max()-X0+1; H=ys.max()-Y0+1
items=sorted([(np.where(lab==l)[1].mean(),l) for l in range(1,n+1)])
ps=[f'<path class="mata-l" d="{paths(lab==l,X0,Y0)}"/>' for _,l in items]
open('mata-letters.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'+''.join(ps)+'</svg>')
ys,xs=np.where(b); bx0,by0=xs.min(),ys.min(); bw=xs.max()-bx0+1; bh=ys.max()-by0+1
open('boulangerie.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {bw} {bh}"><path d="{paths(b,bx0,by0)}"/></svg>')
print(W,H,bw,bh,bx0-X0,by0-Y0)

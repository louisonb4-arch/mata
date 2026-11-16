# Génère les variantes responsive (AVIF + WebP) depuis les masters
import os, glob, shutil
from PIL import Image
os.chdir(os.path.expanduser('~/Developer/clients/mata-site'))
MASTER = '_source/img-master'
OUT = 'assets/img/r'
os.makedirs(MASTER, exist_ok=True); os.makedirs(OUT, exist_ok=True)
KEEP = {'facade.webp'}  # utilisée dans le JSON-LD
for f in glob.glob('assets/img/*.webp'):
    dst = os.path.join(MASTER, os.path.basename(f))
    if not os.path.exists(dst): shutil.copy2(f, dst)
    if os.path.basename(f) not in KEEP: os.remove(f)
total = 0
for f in sorted(glob.glob(f'{MASTER}/*.webp')):
    name = os.path.basename(f)[:-5]
    im = Image.open(f).convert('RGB')
    done = set()
    for w in (480, 640, 800, 1200):
        ww = min(w, im.width)
        if ww in done: continue
        done.add(ww)
        h = round(im.height * ww / im.width)
        r = im.resize((ww, h), Image.LANCZOS) if ww != im.width else im
        r.save(f'{OUT}/{name}-{ww}.webp', 'WEBP', quality=72, method=6)
        r.save(f'{OUT}/{name}-{ww}.avif', 'AVIF', quality=52, speed=4)
for f in glob.glob(f'{OUT}/*'): total += os.path.getsize(f)
print('variants', len(glob.glob(f'{OUT}/*')), 'total MB', round(total / 1e6, 2))
for n in ('hero-pain', 'miche'):
    print(n, [(os.path.basename(x), os.path.getsize(x) // 1024) for x in sorted(glob.glob(f'{OUT}/{n}-*'))])

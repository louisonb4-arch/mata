# Plan statique du quartier (tuiles © OpenStreetMap) recoloré aux couleurs de Mata
import math, os, io, time, urllib.request
import numpy as np
from PIL import Image, ImageFilter
os.chdir(os.path.expanduser('~/Developer/clients/mata-site'))
LAT, LNG, Z = 47.21109, -1.5452661, 17
W, H = 2400, 1200
CACHE = '_source/map-tiles'; os.makedirs(CACHE, exist_ok=True)

def px(lat, lng, z):
    n = 2 ** z
    x = (lng + 180) / 360 * n * 256
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n * 256
    return x, y

cx, cy = px(LAT, LNG, Z)
x0, y0 = cx - W / 2, cy - H / 2
tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int((x0 + W) // 256), int((y0 + H) // 256)
canvas = Image.new('RGB', ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        f = f'{CACHE}/{Z}_{tx}_{ty}.png'
        if not os.path.exists(f):
            req = urllib.request.Request(f'https://tile.openstreetmap.org/{Z}/{tx}/{ty}.png',
                                         headers={'User-Agent': 'VOKUM site builder - static map for a bakery website (contact@vokumagency.com)'})
            open(f, 'wb').write(urllib.request.urlopen(req, timeout=20).read())
            time.sleep(0.15)
        canvas.paste(Image.open(f).convert('RGB'), ((tx - tx0) * 256, (ty - ty0) * 256))
ox, oy = int(x0 - tx0 * 256), int(y0 - ty0 * 256)
img = canvas.crop((ox, oy, ox + W, oy + H))

# --- recoloration : fond beurre, rues crème, Loire encre, textes encre ---
a = np.asarray(img).astype(np.float32) / 255
r, g, b = a[..., 0], a[..., 1], a[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
ink = np.array([27, 26, 23]) / 255
butter = np.array([255, 237, 153]) / 255
deep = np.array([246, 214, 92]) / 255     # bâtiments / îlots
flour = np.array([255, 251, 239]) / 255
green = np.array([255, 243, 190]) / 255

# palette par luminance (gère l'anticrénelage des textes)
deep = np.array([246, 220, 110]) / 255
stops = [(0.0, ink), (0.55, ink), (0.78, deep), (0.90, np.array([250, 228, 128]) / 255), (0.945, butter), (0.975, flour), (1.0, flour)]
out = np.zeros_like(a)
for (l0, c0), (l1, c1) in zip(stops[:-1], stops[1:]):
    m = (lum >= l0) & (lum <= l1)
    t = ((lum - l0) / max(l1 - l0, 1e-6))[m][:, None]
    out[m] = c0 * (1 - t) + c1 * t

def soft(mask, rad=1.0):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))).astype(np.float32)[..., None] / 255

water = soft(((b - r) > 0.10) & (b > g) & (b > 0.70) & (g > 0.70))            # #aad3df
roads = soft(((r > 0.93) & (g > 0.78) & (b < 0.80) & ((r - b) > 0.15)))          # routes orange / jaunes
park = soft(((g - r) > 0.06) & ((g - b) > 0.0) & (lum > 0.70))                 # parcs, terrains
out = out * (1 - park) + green * park
out = out * (1 - roads) + flour * roads
out = out * (1 - water) + ink * water
res = Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))
res = res.quantize(colors=24, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
res.save('_source/map-full.png')
os.makedirs('assets/img/r', exist_ok=True)
res.save('assets/img/r/plan-2400.avif', 'AVIF', quality=60, speed=4)
res.save('assets/img/r/plan-2400.webp', 'WEBP', quality=80, method=6)
m = res.crop((W // 2 - 600, H // 2 - 400, W // 2 + 600, H // 2 + 400))
m.save('assets/img/r/plan-1200.avif', 'AVIF', quality=60, speed=4)
m.save('assets/img/r/plan-1200.webp', 'WEBP', quality=80, method=6)
for f in sorted(os.listdir('assets/img/r')):
    if f.startswith('plan'): print(f, os.path.getsize('assets/img/r/' + f) // 1024, 'KB')

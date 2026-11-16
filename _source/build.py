# Build : _source/index.src.html → index.html
# - injecte le logo SVG
# - <img data-sizes> → <picture> AVIF/WebP responsive (assets/img/r)
# - CSS minifié et inliné (zéro requête bloquante), JS concaténé + minifié (1 seul fichier, defer)
import os, re, glob, subprocess, hashlib
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')

def esbuild(path, *args):
    return subprocess.run(['npx', '--yes', 'esbuild', path, '--minify', *args], capture_output=True, text=True, check=True).stdout

html = open('_source/index.src.html').read()

# --- logo ---
mata = open('_source/mata-letters.svg').read().replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
boul = open('_source/boulangerie.svg').read().replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
html = html.replace('<!--LOGO-->', mata + '<div class="logo__sub">' + boul + '</div>')

# --- images responsive ---
def variants(name, ext):
    out = []
    for f in sorted(glob.glob(f'assets/img/r/{name}-*.{ext}'), key=lambda x: int(re.search(r'-(\d+)\.', x).group(1))):
        w = int(re.search(r'-(\d+)\.', f).group(1))
        out.append((w, f))
    return out

def picture(m):
    sizes, name, rest = m.group(1), m.group(2), m.group(3)
    av, wb = variants(name, 'avif'), variants(name, 'webp')
    if any(os.path.getsize(fa) > os.path.getsize(fw) for (_, fa), (_, fw) in zip(av, wb)):
        av = []  # l'AVIF n'est pas plus léger pour cette photo : WebP seul
    if not wb:
        raise SystemExit('pas de variantes pour ' + name)
    srcset = lambda v: ', '.join(f'{f} {w}w' for w, f in v)
    fallback = next((f for w, f in wb if w == 800), wb[-1][1])
    if 'loading="lazy"' in rest and 'fetchpriority' not in rest:
        rest = ' fetchpriority="low"' + rest
    src_av = f'<source type="image/avif" srcset="{srcset(av)}" sizes="{sizes}">' if av else ''
    return f'<picture>{src_av}<img src="{fallback}" srcset="{srcset(wb)}" sizes="{sizes}"{rest}></picture>'

def defer_panels(html):
    # dans les cartes du comptoir (hors écran au chargement) : srcset/src → data-* (réveillés par le JS)
    parts = html.split('<article class="panel">')
    for k in range(1, len(parts)):
        seg = parts[k]
        end = seg.index('</article>')
        body = seg[:end]
        body = re.sub(r'<source type="image/avif" srcset=', '<source data-defer type="image/avif" data-srcset=', body)
        body = re.sub(r'<img src="([^"]+)" srcset="([^"]+)"', r'<img data-defer src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="\1" data-srcset="\2"', body)
        parts[k] = body + seg[end:]
    return '<article class="panel">'.join(parts)

def defer_block(html, marker):
    i = html.index(marker); j = html.index('</picture>', i)
    seg = html[i:j]
    seg = seg.replace('<source type="image/avif" srcset=', '<source data-defer type="image/avif" data-srcset=')
    seg = re.sub(r'<img src="([^"]+)" srcset="([^"]+)"', r'<img data-defer src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="\1" data-srcset="\2"', seg)
    return html[:i] + seg + html[j:]

html, n = re.subn(r'<img data-sizes="([^"]+)" src="assets/img/([a-z\-]+)\.webp"([^>]*)>', picture, html)

html = defer_panels(html)
html = defer_block(html, '<div class="hero__mini">')  # mini-photo du hero : après le chargement

# préchargement de l'image LCP desktop (sur mobile, le LCP est le texte du hero)
hero_av = variants('hero-pain', 'avif')
hero_sizes = re.search(r'data-sizes="([^"]+)" src="assets/img/hero-pain', open('_source/index.src.html').read()).group(1)
preload = (f'<link rel="preload" as="image" type="image/avif" fetchpriority="high" '
           f'imagesrcset="{", ".join(f"{f} {w}w" for w, f in hero_av)}" imagesizes="{hero_sizes}">')
html = html.replace('<!--PRELOAD-->', preload)

# --- CSS minifié + inliné ---
css = esbuild('assets/css/style.css')
open('assets/css/style.min.css', 'w').write(css)
html = html.replace('<!--CSS-->', '<style>' + css.replace('url(../fonts/', 'url(assets/fonts/').strip() + '</style>')

# --- JS : vendors + main minifié, un seul fichier ---
main = esbuild('assets/js/main.js', '--target=es2019')
bundle = '\n'.join(open(f'assets/js/vendor/{v}').read().strip() for v in ('gsap.min.js', 'ScrollTrigger.min.js', 'lenis.min.js')) + '\n' + main
open('assets/js/app.min.js', 'w').write(bundle)
html = html.replace('<!--JSV-->', hashlib.md5(bundle.encode()).hexdigest()[:8])

open('index.html', 'w').write(html)
print(f'index.html ok — {n} images, html {len(html)//1024} KiB, css {len(css)//1024} KiB, js {len(bundle)//1024} KiB')

import json, glob, statistics, sys, os
label = sys.argv[1]
base = os.path.expanduser('~/Developer/clients/mata-site/_source/lighthouse')
rows = []
for form in ('mobile', 'desktop'):
    for intro in ('on', 'off'):
        runs = []
        for f in sorted(glob.glob(f'{base}/{label}-{form}-{intro}-*.json')):
            d = json.load(open(f)); a = d['audits']; c = d['categories']
            runs.append(dict(
                perf=c['performance']['score'] * 100, a11y=c['accessibility']['score'] * 100,
                bp=c['best-practices']['score'] * 100, seo=c['seo']['score'] * 100,
                fcp=a['first-contentful-paint']['numericValue'], lcp=a['largest-contentful-paint']['numericValue'],
                tbt=a['total-blocking-time']['numericValue'], cls=a['cumulative-layout-shift']['numericValue'],
                si=a['speed-index']['numericValue'], bytes=a['total-byte-weight']['numericValue'],
                lcpel=(a.get('largest-contentful-paint-element', {}).get('details', {}) or {})))
        if not runs: continue
        runs.sort(key=lambda r: r['perf'])
        m = runs[len(runs) // 2]
        el = ''
        try:
            items = m['lcpel']['items'][0]
            items = items.get('items', [items])
            el = items[0].get('node', {}).get('snippet', '')[:70]
        except Exception: pass
        rows.append((form, intro, m, el))
for form, intro, m, el in rows:
    print(f"{form:7} intro={intro:3} perf {m['perf']:.0f} a11y {m['a11y']:.0f} bp {m['bp']:.0f} seo {m['seo']:.0f} | FCP {m['fcp']/1000:.2f}s LCP {m['lcp']/1000:.2f}s TBT {m['tbt']:.0f}ms CLS {m['cls']:.3f} SI {m['si']/1000:.2f}s | {m['bytes']/1024:.0f} KiB | LCP el: {el}")
if len(sys.argv) > 2:
    # failing audits of one run
    d = json.load(open(sorted(glob.glob(f'{base}/{label}-mobile-off-*.json'))[0]))
    for k, v in d['audits'].items():
        if v.get('score') is not None and v['score'] < 0.9 and v.get('scoreDisplayMode') in ('binary', 'numeric', 'metricSavings'):
            print(' -', k, v['score'], (v.get('displayValue') or '')[:60])

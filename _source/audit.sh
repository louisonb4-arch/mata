#!/bin/zsh
# Audit HTTP de la prod : statuts, headers, fichiers de travail, poids
B=${1:-https://mata-site-steel.vercel.app}
echo "== Statuts"
for p in / /mentions-legales /mentions-legales.html /robots.txt /sitemap.xml /llms.txt /favicon.ico /favicon.svg /apple-touch-icon.png /site.webmanifest /manifest.webmanifest /og.jpg /assets/img/og.jpg /page-inexistante-xyz /_source/build.py /_source/index.src.html /README.md /.git/config /vercel.json /serve.json /.vercelignore /assets/css/style.css /assets/js/main.js; do
  printf "%-32s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}B %{content_type}' "$B$p")"
done
echo "== Headers /"
curl -sI "$B/" | grep -iE 'content-security|strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|cache-control|content-encoding'
echo "== Headers asset"
curl -sI "$B/assets/js/app.min.js" | grep -iE 'cache-control|content-type'
echo "== HTML"
curl -s --compressed "$B/" -o /tmp/mata.html; wc -c /tmp/mata.html; gzip -c /tmp/mata.html | wc -c
grep -oE '<title>[^<]*</title>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:image"[^>]*>|<html[^>]*>|<link rel="icon"[^>]*>|<link rel="apple-touch-icon"[^>]*>|<meta name="theme-color"[^>]*>' /tmp/mata.html
echo "== Liens externes / tel / mailto"
grep -oE 'href="(https?:|tel:|mailto:)[^"]*"' /tmp/mata.html | sort | uniq -c
echo "== Appels tiers (src/href hors domaine)"
grep -oE '(src|srcset|href)="https?://[^"/]+' /tmp/mata.html | sed -E 's/.*"https?:\/\///' | sort | uniq -c
echo "== h1 count"; grep -o '<h1' /tmp/mata.html | wc -l
echo "== imgs sans alt"; grep -oE '<img[^>]*>' /tmp/mata.html | grep -v 'alt=' | head

#!/bin/zsh
# usage: lh.sh <port> <label>
PORT=$1; LABEL=$2; OUT=~/Developer/clients/mata-site/_source/lighthouse
for form in ${=FORMS:-mobile desktop}; do
  for intro in on off; do
    url="http://localhost:$PORT/"; [ $intro = off ] && url="http://localhost:$PORT/?intro=0"
    for i in 1 2 3; do
      extra=""; [ $form = desktop ] && extra="--preset=desktop"
      npx --yes lighthouse "$url" $extra --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="$OUT/$LABEL-$form-$intro-$i.json" --throttling-method=devtools --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1
    done
  done
done
echo done-$LABEL

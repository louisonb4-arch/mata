# Mata Boulangerie — site vitrine

Site statique (HTML/CSS/JS), déployable tel quel sur Vercel.

- `index.html` : généré depuis `_source/index.src.html` → `python3 _source/build.py` (injecte le logo SVG).
- `assets/css/style.css`, `assets/js/main.js` (GSAP + ScrollTrigger + Lenis en local dans `assets/js/vendor`).
- Logo : vectorisé depuis le visuel Instagram officiel (`_source/mata-letters.svg`, 4 lettres séparées pour l'animation).
- Photos : Instagram @boulangeriemata (`_source/ig` = originaux, `assets/img` = webp optimisés).
- Typo : Anton (titres, proche du lettrage MATA) + Jost (proche du Futura de « BOULANGERIE »).
- Couleurs : beurre #FFED99 (logo), jaune vitrine #FFD23A, encre #1B1A17, croûte #B5541C.

## À valider avec le client
- Horaires : Google = lun–ven 6h30–19h45, sam 7h–19h ; bio Insta = 7h30–19h30. Le site suit Google.
- Code postal : 44000 (registre SIRENE) vs 44200 (Google).
- Prix sandwichs : article La Toque (juil. 2026) + étiquettes vitrine — à confirmer.
- Section « Sur commande » : formulations à valider (galettes, plateaux).
- Mentions légales : forme juridique, directeur de publication.
- Domaine + og:image en URL absolue une fois le domaine connu.

## Performance (nov. 2026)
- Build : `python3 _source/build.py` (logo inline, images <picture> AVIF/WebP, CSS minifié inliné, JS en un seul bundle chargé après l'affichage).
- Nouvelles photos : déposer le master dans `_source/img-master/` puis `python3 _source/make_images.py`.
- Mesures Lighthouse : `_source/lh.sh <port> <label>` puis `python3 _source/lh_report.py <label>` (rapports dans `_source/lighthouse`).
- `vercel.json` : cache long sur `/assets`.

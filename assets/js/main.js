/* MATA BOULANGERIE — interactions & animations
   L'intro et l'entrée du hero sont en CSS pur (aucune attente du JS → LCP rapide).
   GSAP + ScrollTrigger gèrent les animations au scroll, Lenis le défilement doux (souris uniquement). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* petit aléatoire déterministe : les lettres "dansent" toujours pareil */
  let seed = 7;
  const rand = (min, max) => { seed = (seed * 16807) % 2147483647; return min + ((seed - 1) / 2147483646) * (max - min); };

  /* ---------- Intro (CSS) : on verrouille le scroll le temps qu'elle se termine ---------- */
  const INTRO_END = 3250; // ms depuis le début de la navigation (cf. animations CSS)
  const intro = $('#intro');
  let lenis = null;
  const introLeft = intro && !root.classList.contains('no-intro') ? Math.max(0, INTRO_END - performance.now()) : 0;
  const endIntro = () => {
    if (intro && intro.isConnected) intro.remove();
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
    try { sessionStorage.setItem('mata-intro', '1'); } catch (e) {}
  };
  if (introLeft > 0) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.body.classList.add('is-locked');
    setTimeout(endIntro, introLeft);
  } else endIntro();

  /* ---------- Année ---------- */
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------- Horaires & statut (heure de Paris) ---------- */
  const HOURS = { 0: null, 1: [390, 1185], 2: [390, 1185], 3: [390, 1185], 4: [390, 1185], 5: [390, 1185], 6: [420, 1140] };
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const fmt = m => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  const parisNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  };
  const nextOpening = (day, min) => {
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7, h = HOURS[d];
      if (!h || (i === 0 && min >= h[0])) continue;
      if (i === 0) return `ouvre à ${fmt(h[0])}`;
      if (i === 1) return `ouvre demain ${fmt(h[0])}`;
      return `ouvre ${DAYS[d]} ${fmt(h[0])}`;
    }
    return '';
  };
  const updateStatus = () => {
    const { day, min } = parisNow();
    const h = HOURS[day];
    const open = h && min >= h[0] && min < h[1];
    const txt = open ? (h[1] - min <= 30 ? `Ferme bientôt · ${fmt(h[1])}` : `Ouvert · jusqu'à ${fmt(h[1])}`) : `Fermé · ${nextOpening(day, min)}`;
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', !!open);
      el.classList.toggle('is-closed', !open);
      el.querySelector('b').textContent = txt;
    });
    $$('[data-hours] li').forEach(li => li.classList.toggle('is-today', (li.dataset.days || li.dataset.day).split(',').map(Number).includes(day)));
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Titres : lettres qui dansent (comme le logo) ---------- */
  $$('[data-dance]').forEach(el => {
    const text = el.textContent;
    const frag = document.createDocumentFragment();
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    frag.append(sr);
    [...text].forEach(c => {
      if (c === ' ') { frag.append(' '); return; }
      const ch = document.createElement('span');
      ch.className = 'ch';
      ch.setAttribute('aria-hidden', 'true');
      ch.style.setProperty('--r', `${rand(-4.5, 4.5).toFixed(2)}deg`);
      ch.style.setProperty('--y', `${rand(-0.035, 0.035).toFixed(3)}em`);
      const inner = document.createElement('span');
      inner.className = 'chi';
      inner.textContent = c;
      ch.append(inner);
      frag.append(ch);
    });
    el.textContent = '';
    el.append(frag);
  });

  /* ---------- Manifeste : découpe en mots ---------- */
  $$('[data-words]').forEach(el => {
    const out = [];
    el.childNodes.forEach(n => {
      const hl = n.nodeName === 'EM';
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        out.push(/^\s+$/.test(w) ? ' ' : `<span class="w${hl ? ' hl' : ''}">${w}</span>`);
      });
    });
    el.innerHTML = out.join('');
  });

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = open => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.toggleAttribute('inert', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.classList.toggle('is-locked', open);
  };
  if (!root.classList.contains('menu-open')) menu.setAttribute('inert', '');
  burger.addEventListener('click', () => { if (window.__mataReady) setMenu(!root.classList.contains('menu-open')); });
  $$('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });

  window.__mataReady = true;

  /* ---------- Barre d'action mobile : visible après le hero, cachée sur le footer ---------- */
  const mbar = $('[data-mbar]');
  if (mbar && 'IntersectionObserver' in window) {
    let pastHero = false, atFooter = false;
    const sync = () => mbar.classList.toggle('is-on', pastHero && !atFooter);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }, { rootMargin: '-40% 0px 0px 0px' }).observe($('.hero'));
    new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; sync(); }).observe($('.ft'));
  }

  /* ---------- Carrousel du comptoir (mobile/tablette) ---------- */
  const pin = $('.counter__pin');
  const idx = $('[data-counter-idx]'), bar = $('[data-counter-bar]');
  if (pin && idx) {
    const panels = $$('.panel', pin);
    let raf = 0;
    pin.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const step = panels[1].offsetLeft - panels[0].offsetLeft;
        const max = pin.scrollWidth - pin.clientWidth;
        const i = pin.scrollLeft >= max - 4 ? panels.length - 1 : Math.round(pin.scrollLeft / step);
        idx.textContent = String(i + 1).padStart(2, '0');
        bar.style.transform = `scaleX(${(i + 1) / panels.length})`;
      });
    }, { passive: true });
  }

  /* ---------- Images différées (cartes 2→4 du comptoir) : chargées à l'approche ---------- */
  const deferred = $$('[data-defer]');
  if (deferred.length) {
    const wake = (list = deferred) => list.forEach(el => {
      if (el.dataset.srcset) { el.srcset = el.dataset.srcset; el.removeAttribute('data-srcset'); }
      if (el.dataset.src) { el.src = el.dataset.src; el.removeAttribute('data-src'); }
    });
    wake(deferred.filter(el => !el.closest('.counter')));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { wake(); io.disconnect(); } }, { rootMargin: '700px 0px' });
      io.observe($('.counter'));
    } else wake();
  }

  /* ---------- Pile de photos du midi ---------- */
  const deck = $('[data-deck]');
  if (deck) {
    let cards = $$('.deck__card', deck);
    const pose = i => ({ zIndex: cards.length - i, rotation: [-3, 5, -7, 8][i % 4], x: i * (innerWidth < 680 ? 6 : 10), y: i * 6, scale: 1 - i * 0.03 });
    const layout = animate => cards.forEach((c, i) => {
      const p = pose(i);
      if (hasGsap) animate ? gsap.to(c, { ...p, duration: 0.7, ease: 'expo.out' }) : gsap.set(c, p);
      else { c.style.zIndex = p.zIndex; c.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`; }
    });
    layout(false);
    let busy = false;
    const next = () => {
      if (busy) return;
      busy = true;
      const top = cards[0];
      const done = () => { cards.push(cards.shift()); layout(true); busy = false; };
      if (hasGsap && !reduce) {
        gsap.timeline({ onComplete: done })
          .to(top, { x: Math.min(360, innerWidth * 0.7), y: -40, rotation: 24, duration: 0.42, ease: 'power2.in' })
          .set(top, { zIndex: 0, x: 0, y: 0, rotation: 0 });
      } else done();
    };
    deck.addEventListener('click', next);
    deck.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
  }

  /* ==========================================================================
     Sans GSAP / mouvement réduit : tout reste affiché, on s'arrête là
     ========================================================================== */
  if (!hasGsap || reduce) {
    $$('.manif__text .w').forEach(w => (w.style.opacity = 1));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Défilement doux : uniquement souris/trackpad (le tactile reste natif) ---------- */
  if (finePointer && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    if (document.body.classList.contains('is-locked')) lenis.stop();
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
  }));

  /* ---------- Header : se cache en descendant, revient en remontant ---------- */
  const hd = $('#hd');
  let solid = false, hidden = false;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      const s = y > 40, h = !root.classList.contains('menu-open') && self.direction === 1 && y > innerHeight * 0.7;
      if (s !== solid) hd.classList.toggle('is-solid', (solid = s));
      if (h !== hidden) hd.classList.toggle('is-hidden', (hidden = h));
    }
  });
  const hdLogo = $('.hd__logo');
  if (finePointer) hdLogo.addEventListener('mouseenter', () => {
    gsap.fromTo($$('.mata-l', hdLogo), { y: 0 }, { keyframes: [{ y: -180, duration: 0.18, ease: 'power2.out' }, { y: 0, duration: 0.5, ease: 'bounce.out' }], stagger: 0.06 });
  });

  /* ---------- Parallaxe (via la propriété CSS translate → ne casse pas les rotations) ---------- */
  $$('[data-depth]').forEach(el => {
    gsap.fromTo(el, { '--py': '0px' }, { '--py': () => parseFloat(el.dataset.depth) * -window.innerHeight * 0.6 + 'px', ease: 'none',
      scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  });
  $$('[data-parallax]').forEach(el => {
    gsap.fromTo(el, { yPercent: 0 }, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- Titres dansants : apparition lettre par lettre ---------- */
  $$('[data-dance]').forEach(el => {
    gsap.from($$('.chi', el), { yPercent: 115, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.022,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  /* ---------- Manifeste : les mots s'allument au scroll ---------- */
  $$('[data-words]').forEach(el => {
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  });
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suffix = el.dataset.suffix || '';
    const o = { v: end > 1000 ? end - 40 : 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v) + suffix),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  gsap.from('.facts li', { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 90%', once: true } });

  /* ---------- Révélation des images ---------- */
  $$('.reveal-img').forEach(el => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      .to(el, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.out' })
      .to(el.querySelector('img'), { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });

  /* ---------- Desktop / mobile ---------- */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1081px)', () => {
    /* Comptoir : défilement horizontal épinglé */
    const track = $('.counter__track');
    const dist = () => track.scrollWidth - window.innerWidth;
    const h = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.counter__pin', start: 'center center', end: () => '+=' + dist() * 0.75, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$('.panel').forEach(p => {
      gsap.fromTo($('.panel__pop', p), { rotation: -6, yPercent: 20 }, { rotation: 7, yPercent: -10, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo($('.panel__media img', p), { scale: 1.18 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: h, start: 'left right', end: 'center center', scrub: true } });
    });

    /* Vitrine : les photos se posent sur la table */
    const phs = $$('.ph');
    const finalRot = [-6, 4, -3, 7, 5, -5, 3, -7];
    gsap.set(phs, { willChange: 'transform' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.vitrine__stage', start: 'top top', end: '+=110%', pin: true, scrub: 1 } });
    tl.from('.vitrine__title > span', { scale: 0.7, opacity: 0.6, duration: 1, ease: 'none' }, 0);
    phs.forEach((p, i) => {
      const fromX = (i % 4 < 2 ? -1 : 1) * (40 + rand(0, 30)) + 'vw';
      const fromY = (i < 4 ? -1 : 1) * (60 + rand(0, 40)) + 'vh';
      tl.fromTo(p, { x: fromX, y: fromY, rotation: rand(-50, 50), scale: 1.25 },
        { x: 0, y: 0, rotation: finalRot[i], scale: 1, duration: 1, ease: 'power2.out' }, i * 0.08);
    });
  });

  mm.add('(max-width: 1080px)', () => {
    gsap.from('.counter__track', { x: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.counter__pin', start: 'top 85%', once: true } });
  });

  mm.add('(min-width: 681px) and (max-width: 1080px)', () => {
    gsap.from('.ph', { y: 50, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.vitrine__stage', start: 'top 70%', once: true } });
  });

  /* ---------- Vitrine sur téléphone : le titre tombe lettre par lettre,
     puis les photos sont « distribuées » depuis une pile, au rythme du scroll.
     Un tap sur une photo la soulève (re-tap ou tap ailleurs pour la reposer). ---------- */
  mm.add('(max-width: 680px)', () => {
    const stage = $('.vitrine__stage');
    const title = $('.vitrine__title > span');
    const phs = $$('.ph').filter(p => getComputedStyle(p).display !== 'none');

    // 1) titre : lettres découpées (une seule fois), chute + rebond comme le logo
    if (!title.querySelector('.vl')) {
      [...title.childNodes].forEach(n => {
        if (n.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (ch === ' ') { frag.append(' '); return; }
          const s = document.createElement('span');
          s.className = 'vl'; s.textContent = ch;
          frag.append(s);
        });
        n.replaceWith(frag);
      });
    }
    const letters = $$('.vl', title);
    gsap.fromTo(letters,
      { yPercent: -160, rotation: () => rand(-35, 35), opacity: 0 },
      { yPercent: 0, rotation: () => rand(-4, 4), opacity: 1, duration: 0.9, ease: 'back.out(2.2)', stagger: 0.05,
        scrollTrigger: { trigger: title, start: 'top 82%', once: true } });

    // 2) photos : toutes empilées au centre, puis distribuées sur la table
    const pileOffset = (p, axis) => {
      const s = stage.getBoundingClientRect(), r = p.getBoundingClientRect();
      const gx = gsap.getProperty(p, 'x'), gy = gsap.getProperty(p, 'y');
      const firstTop = phs[0].getBoundingClientRect().top - gsap.getProperty(phs[0], 'y');
      return axis === 'x'
        ? (s.left + s.width / 2) - (r.left - gx + r.width / 2)
        : (firstTop + r.height * 0.9) - (r.top - gy + r.height / 2);
    };
    const tilt = [-3, 3, 2, -3, -2, 3];
    const lift = [0, 14, 0, 14, 0, 14];
    phs.forEach((p, i) => gsap.set(p, { zIndex: phs.length - i }));
    const deal = gsap.timeline({ scrollTrigger: { trigger: phs[0], start: 'top 68%', end: 'top 8%', scrub: 0.6, invalidateOnRefresh: true } });
    phs.forEach((p, i) => {
      deal.fromTo(p,
        { x: () => pileOffset(p, 'x'), y: () => pileOffset(p, 'y'), rotation: () => rand(-14, 14), scale: 0.92 },
        { x: 0, y: lift[i], rotation: tilt[i], scale: 1, duration: 1, ease: 'power3.out' }, i * 0.16);
    });

    // 3) tap : on soulève la photo (re-tap, tap ailleurs ou scroll pour la reposer)
    let lifted = null;
    const drop = () => {
      if (!lifted) return;
      const i = phs.indexOf(lifted);
      lifted.classList.remove('is-lifted');
      gsap.to(lifted, { x: 0, y: lift[i], rotation: tilt[i], scale: 1, zIndex: phs.length - i, duration: 0.55, ease: 'expo.out', overwrite: 'auto' });
      lifted = null;
    };
    const onTap = e => {
      const p = e.currentTarget, was = p === lifted;
      drop();
      if (was) return;
      e.stopPropagation();
      if (deal.scrollTrigger.progress < 0.98) return;
      const r = p.getBoundingClientRect();
      lifted = p;
      p.classList.add('is-lifted');
      gsap.to(p, { x: (innerWidth / 2 - (r.left + r.width / 2)) * 0.55, rotation: 0, scale: 1.34, zIndex: 30, duration: 0.6, ease: 'back.out(1.6)', overwrite: 'auto' });
    };
    const onDoc = () => drop();
    phs.forEach(p => p.addEventListener('click', onTap));
    document.addEventListener('click', onDoc);
    addEventListener('scroll', onDoc, { passive: true });
    return () => { phs.forEach(p => p.removeEventListener('click', onTap)); document.removeEventListener('click', onDoc); removeEventListener('scroll', onDoc); drop(); };
  });

  /* ---------- Midi, infos ---------- */
  gsap.from('.card, .info__map', { y: 50, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.info__grid', start: 'top 82%', once: true } });
  gsap.from('.deck', { rotation: -12, y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.deck', start: 'top 88%', once: true } });
  gsap.from('.carte li', { x: -30, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.carte', start: 'top 88%', once: true } });

  /* ---------- Footer : le logo géant suit la souris ---------- */
  const ftLogo = $('[data-wobble]');
  if (ftLogo) {
    const ls = $$('.mata-l', ftLogo);
    gsap.from(ls, { yPercent: 110, rotation: i => [-20, 16, -12, 22][i], duration: 1.2, ease: 'back.out(1.6)', stagger: 0.08,
      scrollTrigger: { trigger: ftLogo, start: 'top 94%', once: true } });
    gsap.from($('.logo__sub', ftLogo), { opacity: 0, y: 20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: ftLogo, start: 'top 85%', once: true } });
    if (finePointer) {
      const ft = $('.ft');
      const qs = ls.map(l => ({ r: gsap.quickTo(l, 'rotation', { duration: 0.8, ease: 'expo.out' }), y: gsap.quickTo(l, 'y', { duration: 0.8, ease: 'expo.out' }) }));
      let boxes = [];
      ft.addEventListener('mouseenter', () => { boxes = ls.map(l => l.getBoundingClientRect()); });
      ft.addEventListener('mousemove', e => {
        if (!boxes.length) boxes = ls.map(l => l.getBoundingClientRect());
        qs.forEach((q, i) => {
          const b = boxes[i];
          q.r(((e.clientX - (b.left + b.width / 2)) / innerWidth) * 16);
          q.y(Math.max(-40, ((e.clientY - (b.top + b.height / 2)) / innerHeight) * 60));
        });
      }, { passive: true });
      ft.addEventListener('mouseleave', () => { boxes = []; qs.forEach(q => { q.r(0); q.y(0); }); });
    }
  }

  if (document.readyState === 'complete') ScrollTrigger.refresh();
  else addEventListener('load', () => ScrollTrigger.refresh());
})();

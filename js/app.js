/* ==========================================================================
   ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης
   No framework, no build step. Everything degrades if JS dies.
   ========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Motion media is an upgrade, never a requirement — the page is complete
   without it. The hero sequence is 0.7 MB (phone) / 1.6 MB (desktop), fetched
   lazily and shown only once fully decoded, so the bar is low: bail only on
   reduced motion, explicit data-saver, and true 2G.
   (Embedded browsers routinely under-report effectiveType as "3g".) */
const VIDEO_OK = (() => {
  const c = navigator.connection || {};
  return !REDUCED
    && !c.saveData
    && !/2g/.test(c.effectiveType || '');
})();

/* HERO FRAME SEQUENCE
   Scrubbing a <video> by writing currentTime forces a seek + decoder flush on
   every scroll frame — that is what made it stutter. Instead we ship the same
   Higgsfield clip as 24 pre-decoded WebP stills and blit the right one to a
   canvas: no seeking, no decode spikes, and it tracks the scroll exactly.  */
const HERO_FRAMES = 24;
const heroFrameDir = () =>
  (innerWidth * (devicePixelRatio || 1) > 1000) ? 'assets/frames/w1100' : 'assets/frames/w640';
const heroFrameUrl = (dir, i) =>
  `${dir}/f${String(i + 1).padStart(2, '0')}.webp`;

/* ---------------------------------------------------------------- grain */
/* Procedural film grain — cheaper than shipping a PNG and never tiles visibly */
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/></filter>
    <rect width="180" height="180" filter="url(#n)" opacity=".55"/></svg>`;
  document.documentElement.style.setProperty('--grain',
    `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`);
}

/* ---------------------------------------------------------------- header */
{
  const header = $('#header');
  const bar    = $('#actionbar');
  const hero   = $('#hero');

  /* The header stays transparent (light type over the dark hero gradient) for
     the WHOLE shade animation, and only turns solid once the hero has finished
     and released — a white bar sitting over the cinematic hero kills it.
     Falls back to a simple offset if the hero is ever absent. */
  const stickPoint = () => hero
    ? Math.max(80, hero.offsetHeight - innerHeight - 8)
    : 80;

  let point = stickPoint();
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-stuck', y >= point);
    if (bar) bar.classList.toggle('is-visible', y > 420);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { point = stickPoint(); onScroll(); });
  onScroll();
}

/* ------------------------------------------------------------ mobile nav */
{
  const btn  = $('#navToggle');
  const menu = $('#mobileNav');
  if (btn && menu) {
    let lastY = 0;

    const close = ({ restoreFocus = false } = {}) => {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
      // release the scroll lock and put the page back exactly where it was
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      scrollTo(0, lastY);
      if (restoreFocus) btn.focus();
    };

    const open = () => {
      lastY = scrollY;
      document.body.classList.add('nav-open');
      btn.setAttribute('aria-expanded', 'true');
      // lock the page behind the drawer instead of letting it scroll underneath
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lastY}px`;
      document.body.style.width = '100%';
      menu.querySelector('a')?.focus({ preventScroll: true });
    };

    btn.addEventListener('click', () =>
      document.body.classList.contains('nav-open') ? close({ restoreFocus: true }) : open());

    $$('#mobileNav a').forEach(a => a.addEventListener('click', () => close()));
    addEventListener('keydown', e => e.key === 'Escape' && close({ restoreFocus: true }));

    // keep tab focus inside the drawer while it is open
    menu.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const items = $$('a, button', menu).filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // if the drawer is open and the viewport grows past the breakpoint, clean up
    matchMedia('(min-width: 941px)').addEventListener('change', e => e.matches && close());
  }
}

/* ==========================================================================
   HERO — «Η σκιά πέφτει»
   Scroll drives three things at once:
     --shade  0→1  glare fades out, cool shade fades in
     --sweep  0→130%  the hard shadow edge crosses the frame
     the shade photo crossfades over the noon photo (and the video scrubs,
     if a video is present — but the effect stands up completely without it)
   ========================================================================== */
{
  const hero  = $('#hero');
  const shadeImg = $('#heroShade');
  let video = null;

  if (hero) {
    let target = 0, ticking = false, videoReady = false;

    /* The two-photo crossfade is the guaranteed floor (~67 KB at phone size).
       The Seedance frame sequence layers on top and only becomes visible once
       every frame has decoded — so the hero is never blank and never janky. */
    if (VIDEO_OK) {
      const dir = heroFrameDir();
      const imgs = new Array(HERO_FRAMES);
      let loaded = 0, lastDrawn = -1;

      video = document.createElement('canvas');   // same slot in the layer stack
      video.id = 'heroFrames';
      video.setAttribute('aria-hidden', 'true');
      const ctx = video.getContext('2d', { alpha: false });
      $('.hero__media').appendChild(video);

      const sizeCanvas = () => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = video.clientWidth, h = video.clientHeight;
        if (!w || !h) return;
        if (video.width !== Math.round(w * dpr) || video.height !== Math.round(h * dpr)) {
          video.width = Math.round(w * dpr);
          video.height = Math.round(h * dpr);
          lastDrawn = -1;                        // force a repaint at the new size
        }
      };

      // cover-fit blit, mirroring object-fit: cover on the sibling <img>s
      const draw = idx => {
        const im = imgs[idx];
        if (!im || !im.complete || !im.naturalWidth) return;
        if (idx === lastDrawn) return;
        sizeCanvas();
        const cw = video.width, ch = video.height;
        if (!cw || !ch) return;
        const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
        const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
        ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
        lastDrawn = idx;
      };

      for (let i = 0; i < HERO_FRAMES; i++) {
        const im = new Image();
        im.decoding = 'async';
        im.src = heroFrameUrl(dir, i);
        imgs[i] = im;
        im.onload = () => {
          if (++loaded === 1) { sizeCanvas(); draw(0); }
          // only take over from the photo crossfade once every frame is decoded,
          // otherwise scrubbing would hit gaps
          if (loaded === HERO_FRAMES) {
            videoReady = true;
            video.classList.add('is-live');
            measure();
          }
        };
        im.onerror = () => { videoReady = false; };
      }

      video.__draw = draw;
      addEventListener('resize', () => { sizeCanvas(); draw(lastDrawn < 0 ? 0 : lastDrawn); });
    }

    /* Scroll position IS the input — no easing/lerp toward it. Any smoothing
       here reads as lag, because the picture trails the finger. We just batch
       into one rAF per scroll burst and paint the exact scroll state. */
    const measure = () => {
      const rect = hero.getBoundingClientRect();
      const travel = hero.offsetHeight - innerHeight;
      target = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    };

    const render = () => {
      ticking = false;
      // ease-out so the shade lands early and the copy gets breathing room
      const e = 1 - Math.pow(1 - target, 2.1);

      hero.style.setProperty('--shade', e.toFixed(4));
      hero.style.setProperty('--sweep', (e * 132).toFixed(2) + '%');
      if (shadeImg) shadeImg.style.opacity = e.toFixed(4);

      if (videoReady && video && video.__draw) {
        video.__draw(clamp(Math.round(e * (HERO_FRAMES - 1)), 0, HERO_FRAMES - 1));
      }
    };

    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    measure();
  }
}

/* ------------------------------------------------------------ reveals */
{
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  const watch = el => io.observe(el);
  $$('[data-reveal]').forEach(watch);
  // anything injected later
  document.addEventListener('reveal:scan', () => $$('[data-reveal]:not(.is-in)').forEach(watch));
}

/* ==========================================================================
   ΚΑΤΑΣΚΕΥΕΣ — the seven real services
   ========================================================================== */
const PRODUCTS = [
  {
    t: 'Τέντες με βραχίονες',
    d: 'Η κλασική τέντα μπαλκονιού. Ανοιχτός μηχανισμός, καλύπτει μεγάλα ανοίγματα, χειροκίνητη με μανιβέλα ή ηλεκτρική με τηλεχειριστήριο.',
    img: 'assets/img/p-vraxiones',
    alt: 'Τέντα με βραχίονες ανοιγμένη πάνω από μπαλκόνι διαμερίσματος.'
  },
  {
    t: 'Κασετίνες',
    d: 'Το πανί μαζεύεται ολόκληρο μέσα σε κλειστή κασέτα αλουμινίου. Όταν είναι κλειστή, δεν τη βρίσκει ούτε σκόνη ούτε βροχή — γι’ αυτό κρατάει περισσότερο.',
    img: 'assets/img/p-kasetina',
    alt: 'Τέντα κασετίνα από αλουμίνιο, κλειστή, τοποθετημένη πάνω από πόρτα μπαλκονιού.'
  },
  {
    t: 'Πέργκολες',
    d: 'Σταθερή κατασκευή για βεράντα, κήπο ή κατάστημα. Όταν θέλεις μόνιμη σκίαση σε χώρο που χρησιμοποιείς κάθε μέρα, όχι κάτι που ανοιγοκλείνει.',
    img: 'assets/img/p-pergola',
    alt: 'Πέργκολα με τεντόπανο πάνω από βεράντα με τραπέζι και καρέκλες.'
  },
  {
    t: 'Ρολοκουρτίνες',
    d: 'Κάθετη σκίαση με οδηγό. Κόβει τον πλάγιο ήλιο του απογεύματος και τον αέρα, εκεί που μια οριζόντια τέντα δεν φτάνει.',
    img: 'assets/img/p-rolokourtina',
    alt: 'Κάθετη ρολοκουρτίνα με οδηγό, μισοκατεβασμένη στο πλάι μπαλκονιού.'
  },
  {
    t: 'Επισκευές τεντών',
    d: 'Βραχίονες, μηχανισμοί, μοτέρ και αυτοματισμοί. Σε τέντα δική μας ή οποιουδήποτε άλλου — δεν ρωτάμε ποιος την έβαλε.',
    img: 'assets/img/p-episkeui',
    alt: 'Λεπτομέρεια μηχανισμού και βραχίονα τέντας κατά την επισκευή.'
  },
  {
    t: 'Αλλαγή τεντόπανου',
    d: 'Ο σκελετός συνήθως είναι μια χαρά· το πανί είναι που ξεθωριάζει και σκίζεται. Νέο ύφασμα στην υπάρχουσα κατασκευή, στο κλάσμα του κόστους.',
    img: 'assets/img/p-pani',
    alt: 'Νέο τεντόπανο τοποθετημένο σε υπάρχοντα σκελετό τέντας.'
  },
  {
    t: 'Ειδικές κατασκευές',
    d: 'Ό,τι δεν βρίσκεται έτοιμο: ασυνήθιστο άνοιγμα, δύσκολος τοίχος, γωνία, φωταγωγός, βιτρίνα με σχήμα. Το φτιάχνουμε στο εργαστήριο.',
    img: 'assets/img/p-eidikes',
    alt: 'Ειδική κατασκευή σκίασης προσαρμοσμένη σε ασυνήθιστο άνοιγμα.'
  }
];

{
  const host = $('#products');
  if (host) {
    host.innerHTML = PRODUCTS.map((p, i) => `
      <a class="product" href="#prosfora" data-reveal style="--d:${i * 60}ms" data-product="${p.t}">
        <span class="product__media">
          <picture>
            <source srcset="${p.img}.webp" type="image/webp">
            <img src="${p.img}.jpg" alt="${p.alt}" loading="lazy" decoding="async" width="1000" height="750">
          </picture>
          <span class="product__idx">0${i + 1}</span>
        </span>
        <span class="product__body">
          <span class="product__title">${p.t}</span>
          <span class="product__text">${p.d}</span>
          <span class="product__cta">Ζήτησε προσφορά
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </span>
      </a>`).join('');
    document.dispatchEvent(new Event('reveal:scan'));

    /* 7 cards never divide evenly into 4/3/2 columns, so the grid always ends
       with a dead cell. Stretch the last card ("Ειδικές κατασκευές" — fittingly
       the catch-all) across whatever tracks are left over. */
    const cards = [...host.children];
    const fillTail = () => {
      cards.forEach(c => c.style.gridColumn = '');
      const cols = getComputedStyle(host).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (cols < 2) return;
      const rem = cards.length % cols;
      if (rem) cards[cards.length - 1].style.gridColumn = `span ${cols - rem + 1}`;
    };
    fillTail();
    addEventListener('resize', fillTail);

    /* clicking a card pre-selects it in the wizard — one less thing to answer */
    host.addEventListener('click', e => {
      const card = e.target.closest('[data-product]');
      if (!card) return;
      const name = card.dataset.product;
      const map = {
        'Τέντες με βραχίονες': 'Τέντα με βραχίονες',
        'Κασετίνες': 'Τέντα κασετίνα',
        'Πέργκολες': 'Πέργκολα',
        'Ρολοκουρτίνες': 'Ρολοκουρτίνα',
        'Επισκευές τεντών': 'Επισκευή / αλλαγή πανιού',
        'Αλλαγή τεντόπανου': 'Επισκευή / αλλαγή πανιού',
        'Ειδικές κατασκευές': 'Ειδική κατασκευή / δεν ξέρω'
      };
      const val = map[name];
      const input = val && $(`#wizard input[name="type"][value="${CSS.escape(val)}"]`);
      if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }
}

/* ==========================================================================
   «ΤΟ ΦΩΣ ΣΤΙΣ 3» — drag the sun across the sky, the whole scene re-lights
   ========================================================================== */
{
  const root  = $('#sunSlider');
  const stage = $('#sunStage');
  if (root && stage) {
    const morn = $('.sun__layer--morn', stage);
    const mid  = $('.sun__layer--mid',  stage);
    const eve  = $('.sun__layer--eve',  stage);
    const knob = $('#sunKnob');
    const cap  = $('#sunCaption');
    const ticks = $$('.sun__tick', stage);

    const COPY = [
      { h: 10, txt: '10:00 — Ο ήλιος είναι ακόμη χαμηλά και πλάγιος. Η τέντα μαζεμένη, το μπαλκόνι φωτεινό και δροσερό.' },
      { h: 14, txt: '14:00 — Ο ήλιος κάθετα από πάνω. Εδώ κρίνεται η προεξοχή: αν είναι λίγη, η σκιά δεν φτάνει μέχρι το τραπέζι.' },
      { h: 19, txt: '19:00 — Χαμηλό φως που μπαίνει πλάγια κάτω από την τέντα. Εδώ βοηθάει η ρολοκουρτίνα ή μια μεγαλύτερη κλίση.' }
    ];

    const H_MIN = 10, H_MAX = 19;
    const hourToPos = h => ((h - H_MIN) / (H_MAX - H_MIN)) * 100;
    let pos = hourToPos(14); // open on 14:00 exactly, matching the default caption

    const apply = () => {
      // crossfade morning → midday → evening
      const midOp = pos <= 50 ? pos / 50 : 1;
      const eveOp = pos <= 50 ? 0 : (pos - 50) / 50;
      if (mid) mid.style.opacity = midOp.toFixed(3);
      if (eve) eve.style.opacity = eveOp.toFixed(3);

      // the knob rides an arc, like the sun actually does
      const arc = Math.sin((pos / 100) * Math.PI);      // 0 at edges, 1 at noon
      root.style.setProperty('--pos', pos);
      root.style.setProperty('--knob-y', (78 - arc * 56).toFixed(1) + '%');

      const hour = H_MIN + (pos / 100) * (H_MAX - H_MIN);
      const hh = Math.round(hour);
      if (knob) knob.textContent = String(hh).padStart(2, '0') + ':00';

      const nearest = COPY.reduce((a, b) => Math.abs(b.h - hour) < Math.abs(a.h - hour) ? b : a);
      if (cap) cap.textContent = nearest.txt;
      ticks.forEach(t => t.classList.toggle('is-active', +t.dataset.h === nearest.h));

      stage.setAttribute('aria-valuenow', String(hh));
      stage.setAttribute('aria-valuetext', `${String(hh).padStart(2, '0')}:00`);
    };

    const setFromX = clientX => {
      const r = stage.getBoundingClientRect();
      pos = clamp(((clientX - r.left) / r.width) * 100, 0, 100);
      apply();
    };

    let dragging = false;
    const down = e => { dragging = true; stage.setPointerCapture?.(e.pointerId); setFromX(e.clientX); };
    const move = e => { if (dragging) { e.preventDefault(); setFromX(e.clientX); } };
    const up   = () => { dragging = false; };

    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);

    stage.addEventListener('keydown', e => {
      const step = e.shiftKey ? 12 : 4;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { pos = clamp(pos + step, 0, 100); apply(); e.preventDefault(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown') { pos = clamp(pos - step, 0, 100); apply(); e.preventDefault(); }
      if (e.key === 'Home') { pos = 0;   apply(); e.preventDefault(); }
      if (e.key === 'End')  { pos = 100; apply(); e.preventDefault(); }
    });

    ticks.forEach(t => t.addEventListener('click', () => {
      pos = hourToPos(+t.dataset.h); apply();
    }));

    apply();

    /* first time it scrolls into view, sweep once so people see it is draggable */
    if (!REDUCED) {
      const demo = new IntersectionObserver(([en], obs) => {
        if (!en.isIntersecting) return;
        obs.disconnect();
        const from = pos, to = 88, t0 = performance.now(), dur = 1500;
        const step = now => {
          if (dragging) return;
          const k = clamp((now - t0) / dur, 0, 1);
          const e2 = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          pos = lerp(from, to, e2 <= .5 ? e2 * 2 : (1 - e2) * 2);
          apply();
          if (k < 1) requestAnimationFrame(step);
        };
        setTimeout(() => requestAnimationFrame(step), 450);
      }, { threshold: .45 });
      demo.observe(stage);
    }
  }
}

/* ==========================================================================
   ΥΦΑΣΜΑΤΑ — indicative colour families, drawn in CSS (clearly illustrative)
   ========================================================================== */
{
  const host = $('#swatches');
  if (host) {
    const stripe = (a, b) => `repeating-linear-gradient(90deg, ${a} 0 14px, ${b} 14px 28px)`;
    const SW = [
      { n: 'Κρεμ',        bg: 'linear-gradient(160deg,#EFE6D2,#DCCFB2)' },
      { n: 'Άμμος ριγέ',  bg: stripe('#E8DCC4', '#CDBB99') },
      { n: 'Τερακότα',    bg: 'linear-gradient(160deg,#C2553A,#9B3E26)' },
      { n: 'Μπορντό ριγέ',bg: stripe('#8E2B2B', '#E8DCC4') },
      { n: 'Κυπαρίσσι',   bg: 'linear-gradient(160deg,#57694A,#3C4B33)' },
      { n: 'Πράσινο ριγέ',bg: stripe('#4A5D3F', '#E4DAC4') },
      { n: 'Μπλε μαρίν',  bg: 'linear-gradient(160deg,#33465E,#22303F)' },
      { n: 'Ανθρακί',     bg: 'linear-gradient(160deg,#4E4E4B,#33332F)' }
    ];
    host.innerHTML = SW.map((s, i) => `
      <button type="button" class="swatch${i === 0 ? ' is-active' : ''}" style="background:${s.bg}"
              aria-label="Απόχρωση ${s.n}"><span class="swatch__label">${s.n}</span></button>`).join('');
    host.addEventListener('click', e => {
      const b = e.target.closest('.swatch');
      if (!b) return;
      $$('.swatch', host).forEach(x => x.classList.toggle('is-active', x === b));
    });
  }
}

/* ------------------------------------------- fabric video: play only in view */
{
  const v = $('#fabricVideo');
  if (v && VIDEO_OK) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        v.preload = 'auto';
        v.play?.().then(() => v.classList.add('is-live')).catch(() => {});
      } else v.pause?.();
    }, { threshold: .18 }).observe(v);
  } else if (v) {
    // reduced motion / data-saver: the poster still carries the section
    v.remove();
  }
}

/* ==========================================================================
   FAQ — mirrors the FAQPage JSON-LD exactly
   ========================================================================== */
const FAQ = [
  ['Πόσο κοστίζει μια τέντα μπαλκονιού;',
   'Δεν υπάρχει ενιαία τιμή, και όποιος σου δώσει τιμή στο τηλέφωνο χωρίς να δει τον χώρο μαντεύει. Το κόστος εξαρτάται από τις διαστάσεις, τον τύπο μηχανισμού (χειροκίνητος ή ηλεκτρικός), το ύφασμα και τη δυσκολία της τοποθέτησης. Γι’ αυτό ερχόμαστε, μετράμε και δίνουμε γραπτή προσφορά.'],
  ['Επισκευάζετε τέντα που έχει τοποθετήσει άλλος;',
   'Ναι. Αναλαμβάνουμε επισκευές σε μηχανισμούς, βραχίονες και μοτέρ, καθώς και αλλαγή τεντόπανου σε υπάρχοντα σκελετό, ανεξάρτητα από το ποιος έκανε την αρχική κατασκευή.'],
  ['Χρειάζεται άδεια για τέντα σε πολυκατοικία;',
   'Για μπαλκόνι σε πολυκατοικία συνήθως παίζει ρόλο ο κανονισμός της πολυκατοικίας ως προς το χρώμα και τον τύπο, ώστε η όψη να μείνει ενιαία. Για κατάστημα που βγαίνει πάνω από πεζοδρόμιο ή κοινόχρηστο χώρο εμπλέκεται και ο δήμος. Θα σου πούμε τι ισχύει στη δική σου περίπτωση όταν δούμε τον χώρο.'],
  ['Ποιες περιοχές καλύπτετε;',
   'Έδρα μας είναι η Ζωγράφου, Γαλήνης 45. Εξυπηρετούμε Ζωγράφου, Ιλίσια, Γουδή, Καισαριανή, Βύρωνα, Παγκράτι, Αμπελόκηπους, Χολαργό, Παπάγου και ευρύτερα την Αττική.'],
  ['Αντέχει η τέντα στον αέρα;',
   'Καμία ανοιχτή τέντα δεν είναι φτιαγμένη να μένει ανοιχτή σε δυνατό αέρα — ούτε η ακριβότερη. Αυτό που κάνει πραγματικά τη διαφορά στη διάρκεια ζωής της είναι η σωστή στήριξη στον φέροντα τοίχο και ένας αισθητήρας ανέμου που τη μαζεύει μόνος του όταν δεν είσαι σπίτι.'],
  ['Πόσο χρόνο θέλει η κατασκευή και η τοποθέτηση;',
   'Μετά τη μέτρηση και την έγκριση της προσφοράς, ο χρόνος εξαρτάται από τον τύπο κατασκευής και τη διαθεσιμότητα του υφάσματος. Θα πάρεις συγκεκριμένο χρονοδιάγραμμα μαζί με την προσφορά — όχι αόριστες υποσχέσεις.']
];

{
  const host = $('#faq');
  if (host) {
    host.innerHTML = FAQ.map(([q, a], i) => `
      <div class="faq__item" data-reveal style="--d:${i * 45}ms">
        <h3 style="margin:0">
          <button class="faq__q" type="button" aria-expanded="false" aria-controls="faq-a-${i}">${q}</button>
        </h3>
        <div class="faq__a" id="faq-a-${i}" role="region"><div><p>${a}</p></div></div>
      </div>`).join('');
    document.dispatchEvent(new Event('reveal:scan'));

    host.addEventListener('click', e => {
      const btn = e.target.closest('.faq__q');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }
}

/* ==========================================================================
   QUOTE WIZARD — 4 taps, then a real mailto with everything filled in
   ========================================================================== */
{
  const form = $('#wizard');
  if (form) {
    const panels = $$('.wizard__panel', form);
    const segs   = $$('.wizard__seg', form);
    const done   = $('#wizardDone');
    let step = 0;

    const show = n => {
      step = clamp(n, 0, panels.length - 1);
      panels.forEach((p, i) => p.classList.toggle('is-active', i === step));
      segs.forEach((s, i) => s.classList.toggle('is-done', i <= step));
      const focusable = panels[step].querySelector('input, textarea, .opt');
      if (focusable && step > 0) setTimeout(() => focusable.focus?.({ preventScroll: true }), 60);
    };

    /* option cards */
    form.addEventListener('change', e => {
      const input = e.target.closest('.opt input');
      if (!input) return;
      $$(`.opt input[name="${input.name}"]`, form)
        .forEach(i => i.closest('.opt').classList.toggle('is-selected', i.checked));
      // choosing an answer advances automatically — fewer taps, higher completion
      if (!REDUCED && input.checked) {
        const idx = panels.findIndex(p => p.contains(input));
        if (idx === step && step < panels.length - 1) setTimeout(() => show(step + 1), 260);
      }
    });

    const validate = () => {
      const panel = panels[step];
      const radios = $$('input[type="radio"]', panel);
      if (radios.length && !radios.some(r => r.checked)) {
        panel.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
           { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }],
          { duration: 300, easing: 'ease-in-out' });
        return false;
      }
      return true;
    };

    form.addEventListener('click', e => {
      if (e.target.closest('[data-next]')) { if (validate()) show(step + 1); }
      if (e.target.closest('[data-back]')) show(step - 1);
    });

    /* dimension sliders + live SVG */
    const wR = $('#widthRange'), pR = $('#projRange');
    const wO = $('#widthOut'),   pO = $('#projOut');
    const awning = $('#dimAwning'), shade = $('#dimShade'), arm = $('#dimArm'), wLbl = $('#dimWLabel');
    const fmt = v => Number(v).toFixed(1).replace('.', ',') + ' μ.';

    const drawDim = () => {
      if (!wR || !pR) return;
      const w = +wR.value, p = +pR.value;
      if (wO) wO.textContent = fmt(w);
      if (pO) pO.textContent = fmt(p);
      // map projection 1–5 m onto 40–210 px of horizontal reach
      const reach = 24 + ((p - 1) / 4) * 186;
      // map width 1.5–10 m onto how far the awning drops (visual weight)
      const drop  = 22 + ((w - 1.5) / 8.5) * 26;
      if (awning) awning.setAttribute('d', `M24 22 L${reach} 22 L${reach} ${22 + drop} L24 ${22 + drop * .5} Z`);
      if (shade)  shade.setAttribute('d',  `M24 ${22 + drop * .5} L${reach} ${22 + drop} L${reach} 124 L24 124 Z`);
      if (arm)  { arm.setAttribute('x2', reach); arm.setAttribute('y2', 22 + drop * .85); }
      if (wLbl) { wLbl.setAttribute('x', (24 + reach) / 2); wLbl.textContent = fmt(w); }
    };
    wR?.addEventListener('input', drawDim);
    pR?.addEventListener('input', drawDim);
    drawDim();

    /* submit → mailto (no backend yet — see README) */
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name  = $('#qName').value.trim();
      const phone = $('#qPhone').value.trim();
      if (!name || !phone) {
        (!name ? $('#qName') : $('#qPhone')).focus();
        return;
      }
      const d  = new FormData(form);
      const body = [
        'Αίτημα για δωρεάν μέτρηση & προσφορά',
        '────────────────────────────',
        `Τύπος:      ${d.get('type')  || '—'}`,
        `Χώρος:      ${d.get('place') || '—'}`,
        `Πλάτος:     ${fmt(d.get('width'))}`,
        `Προεξοχή:   ${fmt(d.get('projection'))}`,
        '',
        `Όνομα:      ${name}`,
        `Τηλέφωνο:   ${phone}`,
        `Περιοχή:    ${d.get('area') || '—'}`,
        '',
        `Σημειώσεις: ${d.get('notes') || '—'}`,
        '',
        'Στάλθηκε από το tentes-kentayros.gr'
      ].join('\n');

      location.href = 'mailto:tenteskentayros@hotmail.gr'
        + '?subject=' + encodeURIComponent(`Προσφορά: ${d.get('type') || 'τέντα'} — ${name}`)
        + '&body='    + encodeURIComponent(body);

      panels.forEach(p => p.classList.remove('is-active'));
      segs.forEach(s => s.classList.add('is-done'));
      done?.classList.add('is-active');
    });

    show(0);
  }
}

/* ---------------------------------------------------------------- misc */
$('#year') && ($('#year').textContent = new Date().getFullYear());

})();

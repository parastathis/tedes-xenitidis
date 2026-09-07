/* ==========================================================================
   ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης
   No framework, no build step. Everything degrades if JS dies.
   ========================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Motion media is an upgrade, never a requirement — every section is complete
   without it. We honour the two signals the user actually chose (reduced
   motion, data-saver) and deliberately ignore `effectiveType`: it is a guess,
   it is frequently wrong on first paint, and reading it ONCE at load meant a
   single pessimistic sample silently stripped the hero sequence and both
   loops for the whole session. Evaluated lazily, never cached. */
const motionOK = () => !REDUCED && !(navigator.connection || {}).saveData;

/* HERO FRAME SEQUENCE
   Scrubbing a <video> by writing currentTime forces a seek + decoder flush on
   every scroll frame — that is what made it stutter. Instead we ship the same
   clip as 24 pre-decoded WebP stills and blit the right one to a canvas: no
   seeking, no decode spikes, and it tracks the scroll exactly. */
const HERO_FRAMES = 24;
const heroFrameDir = () =>
  (innerWidth * (devicePixelRatio || 1) > 1000) ? 'assets/frames/w1100' : 'assets/frames/w640';
const heroFrameUrl = (dir, i) => `${dir}/f${String(i + 1).padStart(2, '0')}.webp`;

/* ---------------------------------------------------------------- grain */
/* Procedural film grain — cheaper than shipping a PNG and never tiles visibly */
{
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/>
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
     and released — a pale bar sitting over the cinematic hero kills it.
     Falls back to a simple offset if the hero is ever absent. */
  const sticky = $('.hero__sticky');
  const stickPoint = () => hero
    ? Math.max(80, hero.offsetHeight - (sticky ? sticky.offsetHeight : innerHeight) - 8)
    : 80;

  let point = stickPoint();
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-stuck', y >= point);
    if (bar) bar.classList.toggle('is-visible', y > 420);
  };
  addEventListener('scroll', onScroll, { passive: true });
  // width-only: a height change on mobile is just the URL bar, and recomputing
  // on it makes the header flicker mid-scroll
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    point = stickPoint();
    onScroll();
  });
  onScroll();
}

/* ------------------------------------------------------------ mobile nav */
{
  const btn  = $('#navToggle');
  const menu = $('#mobileNav');
  if (btn && menu) {
    let lastY = 0;

    const releaseLock = () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      /* MUST be instant. `html { scroll-behavior: smooth }` makes a bare
         scrollTo() animate, so this restore was still running when the anchor
         scroll started; the two cancelled each other and dumped you at the
         top of the page. */
      scrollTo({ top: lastY, behavior: 'instant' });
    };

    const close = ({ restoreFocus = false } = {}) => {
      if (!document.body.classList.contains('nav-open')) return;
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
      releaseLock();
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

    /* Anchor links need the scroll lock released BEFORE the jump is computed.
       With body still position:fixed the document is collapsed, so the browser's
       native jump landed at the top of the page instead of the section. We
       release the lock, then drive the scroll ourselves. */
    $$('#mobileNav a').forEach(a => a.addEventListener('click', e => {
      const href = a.getAttribute('href') || '';
      const dest = href.startsWith('#') && href.length > 1 ? $(href) : null;
      if (!dest) { close(); return; }
      e.preventDefault();
      document.body.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
      releaseLock();          // synchronous: body is un-fixed and layout is settled
      dest.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', href);
    }));

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

    // if the drawer is open and the viewport grows past the burger breakpoint,
    // clean up (must match the 1080px breakpoint in the stylesheet)
    matchMedia('(min-width: 1081px)').addEventListener('change', e => e.matches && close());
  }
}

/* ==========================================================================
   HERO — «Η σκιά πέφτει»
   Scroll drives three things at once:
     --shade  0→1  glare fades out, cool shade fades in
     --sweep  0→132%  the hard shadow edge crosses the frame
     the shade photo crossfades over the noon photo, and the 24-frame sequence
     scrubs on top of it once every frame has decoded
   ========================================================================== */
{
  const hero     = $('#hero');
  const shadeImg = $('#heroShade');
  let frames = null;

  if (hero) {
    let target = 0, ticking = false, framesReady = false;

    /* The two-photo crossfade is the guaranteed floor (~67 KB at phone size).
       The frame sequence layers on top and only becomes visible once every
       frame has decoded — so the hero is never blank and never janky. */
    if (motionOK()) {
      const dir = heroFrameDir();
      const imgs = new Array(HERO_FRAMES);
      let loaded = 0, lastDrawn = -1;

      frames = document.createElement('canvas');   // same slot in the layer stack
      frames.id = 'heroFrames';
      frames.setAttribute('aria-hidden', 'true');
      const ctx = frames.getContext('2d', { alpha: false });
      $('.hero__media').appendChild(frames);

      const sizeCanvas = () => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const w = frames.clientWidth, h = frames.clientHeight;
        if (!w || !h) return;
        if (frames.width !== Math.round(w * dpr) || frames.height !== Math.round(h * dpr)) {
          frames.width  = Math.round(w * dpr);
          frames.height = Math.round(h * dpr);
          lastDrawn = -1;                        // force a repaint at the new size
        }
      };

      // cover-fit blit, mirroring object-fit: cover on the sibling <img>s
      const draw = idx => {
        const im = imgs[idx];
        if (!im || !im.complete || !im.naturalWidth) return;
        if (idx === lastDrawn) return;
        sizeCanvas();
        const cw = frames.width, ch = frames.height;
        if (!cw || !ch) return;
        const sc = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
        const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
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
            framesReady = true;
            frames.classList.add('is-live');
            measure();
          }
        };
        im.onerror = () => { framesReady = false; };
      }

      frames.__draw = draw;
      addEventListener('resize', () => { sizeCanvas(); draw(lastDrawn < 0 ? 0 : lastDrawn); });
    }

    /* Travel is measured against the sticky child, NOT innerHeight. Both the
       section and the sticky are sized in svh, so this stays constant while a
       mobile URL bar slides in and out — using innerHeight made the whole
       scrub rescale mid-gesture, which is what made scrolling feel broken. */
    const stickyEl = $('.hero__sticky');

    const render = () => {
      ticking = false;
      // ease-out so the shade lands early and the copy gets breathing room
      const e = 1 - Math.pow(1 - target, 2.1);
      hero.style.setProperty('--shade', e.toFixed(4));
      hero.style.setProperty('--sweep', (e * 132).toFixed(2) + '%');
      if (shadeImg) shadeImg.style.opacity = e.toFixed(4);
      if (framesReady && frames && frames.__draw) {
        frames.__draw(clamp(Math.round(e * (HERO_FRAMES - 1)), 0, HERO_FRAMES - 1));
      }
    };

    /* Scroll position IS the input — no easing toward it. Any smoothing here
       reads as lag, because the picture trails the finger. We just batch into
       one rAF per scroll burst and paint the exact scroll state. */
    const measure = () => {
      const travel = hero.offsetHeight - (stickyEl ? stickyEl.offsetHeight : innerHeight);
      target = travel > 0 ? clamp(-hero.getBoundingClientRect().top / travel, 0, 1) : 0;
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    };

    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    measure();
  }
}

/* ------------------------------------------------- hero headline, per letter
   Split into word wrappers (so wrapping still works) and letter spans, each
   carrying its own index for the stagger. «ΣΚΙΑ» gets a second index of its
   own, so its letters drop into shade in step with the awning crossing them.
   Skipped entirely for reduced motion — the CSS then keeps the line-at-a-time
   rise it falls back to. */
{
  const title = $('#hero-title');
  if (title && motionOK()) {
    let i = 0;
    const split = node => [...node.childNodes].forEach(child => {
      if (child.nodeType === 1) { split(child); return; }
      if (child.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      // keep the real whitespace between words, or the line can never wrap
      child.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (!part.trim()) { frag.append(part); return; }
        const word = document.createElement('span');
        word.className = 'wd';
        for (const ch of part) {
          const letter = document.createElement('span');
          letter.className = 'chr';
          letter.style.setProperty('--i', i++);
          letter.textContent = ch;
          word.append(letter);
        }
        frag.append(word);
      });
      child.replaceWith(frag);
    });

    /* the split leaves ~30 one-character spans behind; name the heading so
       assistive tech reads the sentence, not the alphabet */
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    split(title);
    $$('em .chr', title).forEach((el, j) => el.style.setProperty('--j', j));
    title.classList.add('is-split');
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
   ΚΑΤΑΣΚΕΥΕΣ — the real services, photographed on real jobs
   ========================================================================== */
const PRODUCTS = [
  {
    t: 'Τέντες με βραχίονες',
    d: 'Η κλασική τέντα μπαλκονιού. Αρθρωτοί βραχίονες, τίποτα δεν πατάει στο κάγκελο, καλύπτει μεγάλα ανοίγματα — χειροκίνητη με μανιβέλα ή ηλεκτρική με τηλεχειριστήριο.',
    img: 'assets/img/p-vraxiones',
    alt: 'Τέντα με αρθρωτούς βραχίονες, μισοανοιγμένη πάνω από μπαλκόνι, με τον μηχανισμό ορατό.'
  },
  {
    t: 'Τέντες με αντηρίδες',
    d: 'Ίσιες αντηρίδες που πατούν στο κάγκελο ή στον τοίχο. Πιο στιβαρή λύση σε ανοιχτά, ανεμοδαρμένα μπαλκόνια — και η οικονομικότερη όταν το άνοιγμα είναι μεγάλο.',
    img: 'assets/img/p-antirides',
    alt: 'Τέντα μπαλκονιού στηριγμένη με ίσιες αντηρίδες, με κυματιστό βολάν.'
  },
  {
    t: 'Κασετίνες',
    d: 'Το πανί μαζεύεται ολόκληρο μέσα σε κλειστή κασέτα αλουμινίου. Όταν είναι κλειστή δεν τη βρίσκει ούτε σκόνη ούτε βροχή — γι’ αυτό κρατάει περισσότερο.',
    img: 'assets/img/p-kasetina',
    alt: 'Τέντα κασετίνα από αλουμίνιο τοποθετημένη σε μπαλκόνι πολυκατοικίας.'
  },
  {
    t: 'Πέργκολες',
    d: 'Σταθερή κατασκευή αλουμινίου για βεράντα, κήπο ή κατάστημα. Όταν θέλεις μόνιμη σκίαση σε χώρο που χρησιμοποιείς κάθε μέρα, όχι κάτι που ανοιγοκλείνει.',
    img: 'assets/img/p-pergola',
    alt: 'Πέργκολα αλουμινίου με κάθετο πανί, δίπλα σε πισίνα.'
  },
  {
    t: 'Ρολοκουρτίνες & κάθετα',
    d: 'Κάθετη σκίαση με οδηγό. Κόβει τον πλάγιο ήλιο του απογεύματος και τον αέρα, εκεί που μια οριζόντια τέντα δεν φτάνει.',
    img: 'assets/img/p-rolokourtina',
    alt: 'Κάθετη σκίαση με οδηγούς, κατεβασμένη στο πλάι βεράντας.'
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
    alt: 'Καινούριο τεντόπανο τοποθετημένο σε υπάρχοντα σκελετό τέντας.'
  },
  {
    t: 'Ειδικές κατασκευές',
    d: 'Ό,τι δεν βρίσκεται έτοιμο: καμπύλο μπαλκόνι, δύσκολος τοίχος, γωνία, φωταγωγός, βιτρίνα με σχήμα. Το μετράμε και το φτιάχνουμε στο εργαστήριο.',
    img: 'assets/img/p-eidikes',
    alt: 'Τέντα κομμένη στην καμπύλη ενός στρογγυλού μπαλκονιού με σιδερένιο κάγκελο.'
  }
];

{
  const host = $('#products');
  if (host) {
    host.innerHTML = PRODUCTS.map((p, i) => `
      <a class="product" href="#prosfora" data-reveal style="--d:${i * 55}ms" data-product="${p.t}">
        <span class="product__media">
          <picture>
            <source type="image/webp" sizes="(min-width:1100px) 25vw, (min-width:640px) 50vw, 100vw"
                    srcset="${p.img}-640.webp 640w, ${p.img}-1000.webp 1000w">
            <img src="${p.img}.jpg" alt="${p.alt}" loading="lazy" decoding="async" width="1000" height="750">
          </picture>
          <span class="product__idx">${String(i + 1).padStart(2, '0')}</span>
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

    /* 8 cards do not divide evenly into a 3-column grid, so the last row can
       end with a dead cell. Stretch the final card across whatever tracks are
       left over rather than leaving a hole in the rule grid. */
    const cards = [...host.children];
    let lastCols = 0;
    const fillTail = () => {
      const cols = getComputedStyle(host).gridTemplateColumns.split(' ').filter(Boolean).length;
      if (cols === lastCols) return;
      lastCols = cols;
      cards.forEach(c => c.style.gridColumn = '');
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
      const map = {
        'Τέντες με βραχίονες': 'Τέντα με βραχίονες',
        'Τέντες με αντηρίδες': 'Τέντα με αντηρίδες',
        'Κασετίνες': 'Τέντα κασετίνα',
        'Πέργκολες': 'Πέργκολα',
        'Ρολοκουρτίνες & κάθετα': 'Ρολοκουρτίνα',
        'Επισκευές τεντών': 'Επισκευή / αλλαγή πανιού',
        'Αλλαγή τεντόπανου': 'Επισκευή / αλλαγή πανιού',
        'Ειδικές κατασκευές': 'Ειδική κατασκευή / δεν ξέρω'
      };
      const val = map[card.dataset.product];
      const input = val && $(`#wizard input[name="type"][value="${CSS.escape(val)}"]`);
      if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  }
}

/* ==========================================================================
   «ΤΟ ΦΩΣ ΣΤΙΣ 3»
   The control is a real <input type="range">. Dragging the photograph itself
   fought the browser's native image-drag and its scroll gesture — which is
   exactly what made this section feel broken. A range input gets touch,
   mouse, keyboard and assistive tech right for free.
   ========================================================================== */
{
  const root  = $('#sunSlider');
  const range = $('#sunRange');
  if (root && range) {
    const mid   = $('.sun__layer--mid', root);
    const eve   = $('.sun__layer--eve', root);
    const knob  = $('#sunKnob');
    const cap   = $('#sunCaption');
    const stops = $$('.sun__stop', root);

    const H_MIN = 10, H_MAX = 19;
    const NOON = ((14 - H_MIN) / (H_MAX - H_MIN)) * 100;   // 44.44
    const COPY = [
      { h: 10, txt: '10:00 — Ο ήλιος είναι ακόμη χαμηλά και πλάγιος. Η τέντα μαζεμένη, το μπαλκόνι φωτεινό και δροσερό.' },
      { h: 14, txt: '14:00 — Ο ήλιος κάθετα από πάνω. Εδώ κρίνεται η προεξοχή: αν είναι λίγη, η σκιά δεν φτάνει μέχρι το τραπέζι.' },
      { h: 19, txt: '19:00 — Χαμηλό φως που μπαίνει πλάγια κάτω από την τέντα. Εδώ βοηθάει η ρολοκουρτίνα ή μια μεγαλύτερη κλίση.' }
    ];

    const apply = () => {
      const pos = +range.value;
      // crossfade morning → midday → evening, hinged on the true noon position
      if (mid) mid.style.opacity = clamp(pos / NOON, 0, 1).toFixed(3);
      if (eve) eve.style.opacity = clamp((pos - NOON) / (100 - NOON), 0, 1).toFixed(3);

      // the sun rides an arc, like it actually does
      const arc = Math.sin((pos / 100) * Math.PI);          // 0 at the edges, 1 at noon
      root.style.setProperty('--pos', pos);
      root.style.setProperty('--knob-y', (80 - arc * 58).toFixed(1) + '%');

      const hour = H_MIN + (pos / 100) * (H_MAX - H_MIN);
      const hh = String(Math.round(hour)).padStart(2, '0');
      if (knob) knob.textContent = hh + ':00';

      const near = COPY.reduce((a, b) => Math.abs(b.h - hour) < Math.abs(a.h - hour) ? b : a);
      if (cap) cap.textContent = near.txt;
      stops.forEach(s => s.classList.toggle('is-active', +s.dataset.h === near.h));

      range.setAttribute('aria-valuetext', `${hh}:00`);
    };

    const touched = () => range.classList.add('is-touched');
    range.addEventListener('input', () => { touched(); apply(); });
    range.addEventListener('pointerdown', touched);

    stops.forEach(s => s.addEventListener('click', () => {
      range.value = ((+s.dataset.h - H_MIN) / (H_MAX - H_MIN)) * 100;
      touched(); apply();
    }));

    /* The photographs are the one thing you must NOT be able to drag: a native
       image-drag leaves a ghost stuck to the cursor and swallows the gesture. */
    $$('.sun__layer img', root).forEach(img => {
      img.draggable = false;
      img.addEventListener('dragstart', e => e.preventDefault());
    });

    apply();
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
      { n: 'Κρεμ',         bg: 'linear-gradient(160deg,#F1E8D6,#DDD0B4)' },
      { n: 'Άμμος ριγέ',   bg: stripe('#E8DCC4', '#CDBB99') },
      { n: 'Μπορντό',      bg: 'linear-gradient(160deg,#862729,#5A1119)' },
      { n: 'Μπορντό ριγέ', bg: stripe('#641719', '#E8DCC4') },
      { n: 'Ώχρα',         bg: 'linear-gradient(160deg,#D9A94C,#B07E22)' },
      { n: 'Κυπαρίσσι',    bg: 'linear-gradient(160deg,#57694A,#3C4B33)' },
      { n: 'Πράσινο ριγέ', bg: stripe('#4A5D3F', '#E4DAC4') },
      { n: 'Ανθρακί',      bg: 'linear-gradient(160deg,#4E4A45,#312D29)' }
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

/* ==========================================================================
   ΕΡΓΑ — the workshop's own reel, and a gallery of finished jobs
   ========================================================================== */
const GALLERY = [
  ['assets/img/g01', 'Καταστήματα — μπορντό τέντες σε τρεις ορόφους'],
  ['assets/img/g02', 'Πολυκατοικία — ενιαία όψη σε όλα τα μπαλκόνια'],
  ['assets/img/g03', 'Πέργκολα με θέα, σε βεράντα μονοκατοικίας'],
  ['assets/img/g04', 'Πέργκολα αλουμινίου με κάθετο πανί, δίπλα σε πισίνα'],
  ['assets/img/g05', 'Ιστίο σκίασης πάνω από πισίνα'],
  ['assets/img/g06', 'Πολυκατοικία — τέντες σε κάθε επίπεδο'],
  ['assets/img/g07', 'Ανεμοφράκτες και κάθετα κρύσταλλα σε βεράντα'],
  ['assets/img/g08', 'Εμπριμέ τεντόπανο — λεπτομέρεια']
];

{
  const host = $('#worksSlideshow');
  if (host) {
    host.innerHTML = GALLERY.map(([src, cap], i) => `
      <img src="${src}-900.webp" alt="${cap}" width="900" height="675"
           loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"
           class="${i === 0 ? 'is-active' : ''}">`).join('');

    const imgs = $$('img', host);
    let i = 0, timer = null;
    const advance = () => {
      imgs[i].classList.remove('is-active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('is-active');
    };
    // paced like the works reel's own play/pause: only ticks while on
    // screen, and never for visitors who asked for less motion
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && motionOK()) {
        if (!timer) timer = setInterval(advance, 2000);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }).observe(host);
  }
}

/* ------------------------------------------- ambient loops: play only in view
   `play()` returns a promise that REJECTS if a pause lands before playback
   starts — which is exactly what happens when you scroll past a video and
   back. Hanging the reveal off that promise left the loop paused behind its
   poster forever, so we hang it off the `playing` event instead and re-try
   the play on every re-entry. */
{
  const mountLoop = (v, threshold) => {
    if (!v) return;
    /* Never remove the element: preload="none" means an unplayed loop costs
       nothing, and removing it made the decision irreversible for the session.
       The poster underneath carries the block either way. */
    v.addEventListener('playing', () => v.classList.add('is-live'), { once: true });
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && motionOK()) {
        v.preload = 'auto';
        v.play?.().catch(() => {});          // autoplay refusal is not an error worth surfacing
      } else {
        v.pause?.();
      }
    }, { threshold }).observe(v);
  };

  mountLoop($('#fabricVideo'), .18);
  mountLoop($('#worksVideo'),  .25);
}

/* ==========================================================================
   ΠΕΡΙΟΧΕΣ — a sketched map instead of a row of chips
   The chips in the HTML carry the coordinates and stay the source of truth:
   they are what a screen reader and a JS-less browser get. Here they become a
   hand-drawn map, with a trail of footprints walking out of the workshop to
   every neighbourhood — which is the section's actual claim, that we come to
   you, and the near ones fastest.
   ========================================================================== */
{
  const host = $('#areamap');
  const list = $('#areasList');
  if (host && list) {
    const chips = $$('.areas__chip', list);
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs = {}) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    };
    const narrow = () => matchMedia('(max-width: 720px)').matches;

    const draw = () => {
      const tall = narrow();
      const pts = chips.map(c => ({
        name: c.textContent.trim(),
        x: +(tall ? c.dataset.mx : c.dataset.x),
        y: +(tall ? c.dataset.my : c.dataset.y),
        hub: 'hub' in c.dataset
      }));
      const hub = pts.find(p => p.hub);
      if (!hub || pts.length < 2) return;

      host.textContent = '';
      const svg = el('svg', {
        viewBox: tall ? '-8 -8 116 116' : '-6 -8 112 68',
        class: 'areamap__svg', 'aria-hidden': 'true', focusable: 'false',
        preserveAspectRatio: 'xMidYMid meet'
      });

      /* one shoe print — sole and heel — reused for every step.
         The toe points along local -y, so a step rotates by its heading + 90°. */
      const defs = el('defs');
      const foot = el('g', { id: 'kfoot' });
      foot.append(el('ellipse', { cx: 0, cy: -.18, rx: .5, ry: .8 }));
      foot.append(el('ellipse', { cx: 0, cy: 1.16, rx: .36, ry: .48 }));
      defs.append(foot);
      svg.append(defs);

      const guides = el('g', { class: 'areamap__trails' });
      const steps  = el('g', { class: 'areamap__steps' });
      const pins   = el('g', { class: 'areamap__pins' });
      svg.append(guides, steps, pins);
      host.append(svg);                        // must be live to measure the paths

      /* Labels sit on the far side of their dot, pointing away from the
         workshop. Every route arrives from the hub side, so the name is never
         in the way of its own trail. */
      const addPin = p => {
        const g = el('g', { class: 'areamap__pin' + (p.hub ? ' is-hub' : '') });
        g.append(el('circle', { cx: p.x, cy: p.y, r: p.hub ? 2.2 : 1.35 }));
        if (p.hub) g.append(el('circle', { class: 'areamap__halo', cx: p.x, cy: p.y, r: 4.2 }));

        let ux = 0, uy = 1;                       // the hub's own name goes below
        if (!p.hub) {
          const dx = p.x - hub.x, dy = p.y - hub.y;
          const m = Math.hypot(dx, dy) || 1;
          ux = dx / m; uy = dy / m;
        }
        /* Side-set labels need horizontal room, which a phone hasn't got — the
           westmost name ran off the edge. In the portrait layout every name
           goes above or below its dot instead, where the space actually is. */
        const sideways = !tall && Math.abs(ux) > .55;
        const label = el('text', {
          class: 'areamap__label',
          x: (p.x + ux * (sideways ? 2.8 : 1.4)).toFixed(2),
          y: (p.y + uy * 3.4 + (sideways ? 1.1 : uy > 0 ? 3.4 : -2.2)).toFixed(2),
          'text-anchor': sideways ? (ux > 0 ? 'start' : 'end') : 'middle'
        });
        label.textContent = p.name;
        g.append(label);
        if (p.hub) {
          const sub = el('text', { class: 'areamap__sub', x: p.x, y: p.y + 10.4, 'text-anchor': 'middle' });
          sub.textContent = 'το εργαστήριο';
          g.append(sub);
        }
        pins.append(g);
      };

      /* Pins go down first, so their labels can be measured — the prints have
         to route around real text boxes, not guesses at where the text is. */
      pts.forEach(addPin);

      /* Only the dots are hard obstacles. Names no longer need cutting a route
         in half: they sit on the far side of their own dot, and they carry a
         knock-out halo, so a trail that does pass one reads as going behind it. */
      const dots = pts.map(p => ({ x: p.x, y: p.y, r: (p.hub ? 2.8 : 1.9) }));
      const blocked = (x, y) => dots.some(d => Math.hypot(x - d.x, y - d.y) < d.r);

      /* Routes, drawn the way a flight map draws them: a curve out of the hub
         to each destination, walked print by print. */
      const CLEAR_HUB = 5.2, CLEAR_END = 5.6, GAP = 3.1;
      pts.filter(p => !p.hub).forEach((p, k) => {
        const dx = p.x - hub.x, dy = p.y - hub.y;
        const len = Math.hypot(dx, dy) || 1;
        const bend = (k % 2 ? 1 : -1) * len * 0.15;
        const cx = (hub.x + p.x) / 2 + (-dy / len) * bend;
        const cy = (hub.y + p.y) / 2 + (dx / len) * bend;
        const path = el('path', { d: `M${hub.x} ${hub.y} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${p.x} ${p.y}` });
        guides.append(path);

        const total = path.getTotalLength();
        let n = 0;
        for (let d = CLEAR_HUB; d < total - CLEAR_END; d += GAP, n++) {
          const a = path.getPointAtLength(d);
          const b = path.getPointAtLength(Math.min(d + 1, total));
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          const side = (n % 2 ? 1 : -1) * .9;    // left foot, right foot
          const fx = a.x + Math.cos(ang + Math.PI / 2) * side;
          const fy = a.y + Math.sin(ang + Math.PI / 2) * side;
          if (blocked(fx, fy)) continue;         // step over a name, not on it
          const mark = el('use', {
            class: 'areamap__step', href: '#kfoot',
            transform: `translate(${fx.toFixed(2)} ${fy.toFixed(2)}) `
                     + `rotate(${(ang * 180 / Math.PI + 90).toFixed(1)})`
          });
          // stagger by distance walked, so every route leaves the shop at once
          mark.style.setProperty('--d', (n * 60) + 'ms');
          steps.append(mark);
        }
      });
    };

    draw();
    list.classList.add('is-mapped');            // stays for AT, leaves the layout

    /* redraw only when we actually cross the layout breakpoint */
    let wasNarrow = narrow();
    addEventListener('resize', () => {
      if (narrow() === wasNarrow) return;
      wasNarrow = narrow();
      draw();
    });

    /* The walk runs on a loop — someone is always on their way out to a job.
       It only ticks while the diagram is on screen, same as the video loops:
       an animation nobody is looking at is just spent battery. */
    new IntersectionObserver(([en]) => {
      host.classList.toggle('is-walking', en.isIntersecting && motionOK());
    }, { threshold: .08 }).observe(host);
  }
}

/* ==========================================================================
   FAQ — mirrors the FAQPage JSON-LD exactly
   ========================================================================== */
const FAQ = [
  ['Πόσο κοστίζει μια τέντα μπαλκονιού;',
   'Δεν υπάρχει ενιαία τιμή, και όποιος σου δώσει τιμή στο τηλέφωνο χωρίς να δει τον χώρο μαντεύει. Το κόστος εξαρτάται από τις διαστάσεις, τον τύπο κατασκευής (βραχίονες, αντηρίδες, κασετίνα, χειροκίνητο ή ηλεκτρικό), το ύφασμα και τη δυσκολία της τοποθέτησης. Γι’ αυτό ερχόμαστε, μετράμε και δίνουμε γραπτή προσφορά.'],
  ['Βραχίονες ή αντηρίδες;',
   'Οι βραχίονες είναι αρθρωτοί: η τέντα ανοίγει και κλείνει ελεύθερα και τίποτα δεν πατάει στο κάγκελο. Οι αντηρίδες είναι ίσια στηρίγματα που πατούν στο κάγκελο ή στον τοίχο — πιο στιβαρές σε ανοιχτά, ανεμοδαρμένα μπαλκόνια και πιο οικονομικές όταν το άνοιγμα είναι μεγάλο. Θα σου πούμε ποιο συμφέρει όταν δούμε τον χώρο.'],
  ['Επισκευάζετε τέντα που έχει τοποθετήσει άλλος;',
   'Ναι. Αναλαμβάνουμε επισκευές σε μηχανισμούς, βραχίονες και μοτέρ, καθώς και αλλαγή τεντόπανου σε υπάρχοντα σκελετό, ανεξάρτητα από το ποιος έκανε την αρχική κατασκευή.'],
  ['Χρειάζεται άδεια για τέντα σε πολυκατοικία;',
   'Για μπαλκόνι σε πολυκατοικία συνήθως παίζει ρόλο ο κανονισμός της πολυκατοικίας ως προς το χρώμα και τον τύπο, ώστε η όψη να μείνει ενιαία. Για κατάστημα που βγαίνει πάνω από πεζοδρόμιο ή κοινόχρηστο χώρο εμπλέκεται και ο δήμος. Θα σου πούμε τι ισχύει στη δική σου περίπτωση όταν δούμε τον χώρο.'],
  ['Ποιες περιοχές καλύπτετε;',
   'Έδρα μας είναι η Ζωγράφου, Μαικήνα 82. Εξυπηρετούμε Ζωγράφου, Ιλίσια, Γουδή, Καισαριανή, Βύρωνα, Παγκράτι, Αμπελόκηπους, Χολαργό, Παπάγου και ευρύτερα την Αττική.'],
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
          <button class="faq__q" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">${q}</button>
        </h3>
        <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}"><div><p>${a}</p></div></div>
      </div>`).join('');
    document.dispatchEvent(new Event('reveal:scan'));

    host.addEventListener('click', e => {
      const btn = e.target.closest('.faq__q');
      if (!btn) return;
      const item = btn.closest('.faq__item');
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      // a collapsed answer must leave the tab order, not merely lose its height
      $('.faq__a', item).inert = !open;
    });
    $$('.faq__a', host).forEach(a => { a.inert = true; });
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
      panels.forEach((p, i) => {
        const on = i === step;
        p.classList.toggle('is-active', on);
        p.inert = !on;                       // keep hidden steps out of the tab order
      });
      segs.forEach((s, i) => s.classList.toggle('is-done', i <= step));
      const focusable = panels[step].querySelector('input:not([type=radio]), textarea');
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
      // map projection 1–5 m onto 24–210 px of horizontal reach
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
      const d = new FormData(form);
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

      panels.forEach(p => { p.classList.remove('is-active'); p.inert = true; });
      segs.forEach(s => s.classList.add('is-done'));
      done?.classList.add('is-active');
    });

    show(0);
  }
}

/* ==========================================================================
   ΕΠΙΚΟΙΝΩΝΙΑ — the shop's own pin, on a dark-styled map instead of a
   default-chrome Google iframe. Google still handles turn-by-turn: the
   "Οδηγίες στον χάρτη" button next to it links straight to Maps.
   ========================================================================== */
{
  const el = $('#map');
  const LAT = 37.9756093, LNG = 23.7676785; // Μαικήνα 82, Ζωγράφου — geocoded off Google's own place resolution

  /* If Leaflet is missing or the map throws, never leave a dead grey box —
     an empty panel reads as a broken map (or a missing API key). Fall back to
     the address itself, which is what the map was there to tell you. */
  const fallback = () => {
    if (!el || el.dataset.fallback) return;
    el.dataset.fallback = '1';
    el.classList.add('contact__map--flat');
    el.innerHTML = '<a class="contact__mapfall" target="_blank" rel="noopener"'
      + ' href="https://www.google.com/maps/search/?api=1&query=%CE%9C%CE%B1%CE%B9%CE%BA%CE%AE%CE%BD%CE%B1+82+%CE%96%CF%89%CE%B3%CF%81%CE%AC%CF%86%CE%BF%CF%85">'
      + '<strong>Μαικήνα 82</strong><span>Ζωγράφου 15771</span><span>Άνοιξε στους χάρτες →</span></a>';
  };

  if (el && window.L) {
    const boot = () => {
      const map = L.map(el, {
        center: [LAT, LNG], zoom: 16, scrollWheelZoom: false,
        attributionControl: false, zoomControl: false
      });
      // Leaflet's own "Leaflet" prefix is a courtesy, not a licence term (BSD-2),
      // so it goes; the OSM credit below is the part that must stay.
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      /* Plain OSM tiles. CARTO's dark basemap was serving a 200 OK PNG with
         "API KEY REQUIRED" stamped across the image itself — it looked like a
         working map to every status check and like a broken one to every human.
         OSM needs no key; the dark treatment is done in CSS on the tile pane. */
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const pin = L.divIcon({
        className: 'map-pin',
        html: '<span class="map-pin__dot"></span><span class="map-pin__ring"></span>',
        iconSize: [26, 26], iconAnchor: [13, 13]
      });
      L.marker([LAT, LNG], { icon: pin, keyboard: false })
        .addTo(map)
        .bindPopup('<strong>ΚΕΝΤΑΥΡΟΣ</strong><br>Μαικήνα 82, Ζωγράφου 15771')
        .openPopup();

      // a plain click re-enables the scroll-zoom the map booted without,
      // so the page keeps scrolling normally until you actually mean to zoom
      el.addEventListener('click', () => map.scrollWheelZoom.enable(), { once: true });
    };
    // Leaflet needs the container laid out before it measures tiles — wait
    // until the map is actually on screen, same gate as the ambient loops.
    new IntersectionObserver(([en], obs) => {
      if (!en.isIntersecting) return;
      obs.disconnect();
      try { boot(); } catch { fallback(); }
    }).observe(el);
  } else {
    fallback();                                // Leaflet blocked or never arrived
  }
}

/* ---------------------------------------------------------------- misc */
$('#year') && ($('#year').textContent = new Date().getFullYear());

})();

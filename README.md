# ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης, Ζωγράφου

Static site (plain HTML/CSS/JS, no build step, no dependencies).
Preview: `preview_start` with launch config **`tentes`** → http://localhost:8909

```
index.html          all markup + JSON-LD
css/style.css       design system + every component
js/app.js           hero scrub, sun slider, fabric picker, call picker,
                    coverage map, wizard, FAQ
assets/img/         shipped, optimised (webp + jpg fallback, responsive variants)
assets/video/       hero scrub + fabric loop (desktop-only, see below)
assets/_source/     2K PNG masters — gitignored, NOT shipped
```

---

## ⚠️ READ THIS FIRST — the Facebook page is a different business

The brief supplied `facebook.com/TentesXenitidis`. **That page is not this business.**
It serves Κιλκίς / Θεσσαλονίκη / Χαλκιδική / Σέρρες, posts from Metallikó Kilkis,
and lists mobile **697 366 7936** / `ksenitidisx@gmail.com`.

This site is built for the **Ζωγράφου** business — «ΚΕΝΤΑΥΡΟΣ», Στέλιος (Στυλιανός Π.)
Ξενιτίδης. Same surname, different company, ~500 km apart. **Do not merge the two
NAP records** — that is the fastest way to wreck local rankings and get a Google
Business Profile suspended. None of the Kilkis page's 10 photos are used here.

---

## Verified data (from Greek directories, cross-checked)

| Field | Value | Source |
|---|---|---|
| Brand | ΚΕΝΤΑΥΡΟΣ / Τέντες Ξενιτίδης | vrisko, xo.gr, e-attica |
| Owner | Στυλιανός Π. Ξενιτίδης | vrisko |
| Address | **Μαικήνα 82, Ζωγράφου 15771** | owner, Sep 2026 — the online directories still list the old Γαλήνης 45 |
| Landline | **210 7751368** — confirmed in service, Sep 2026. An earlier note here said otherwise; it was wrong. This is the primary number and stays the primary CTA. | owner |
| Mobile | 6936 743560 | i-need.gr, epagelmatias |
| ~~Mobile~~ | ~~6970 417549~~ — **removed from the site on the owner’s instruction, Sep 2026.** Do not put it back. | — |
| Email | tenteskentayros@hotmail.gr | i-need.gr |
| Services | τέντες με βραχίονες, **τέντες με αντηρίδες**, κασετίνες, πέργκολες, ρολοκουρτίνες, επισκευές, αλλαγή πανιών, ειδικές κατασκευές | i-need.gr + owner |
| Service area | **Όλη η Ελλάδα** — workshop in Ζωγράφου, installs nationwide | owner, Sep 2026 |
| Google reviews | ~15 | search result |
| Descriptor | «βιοτεχνία τεντών» (own workshop, not a reseller) | search result |

---

## ❗ Needs confirmation from Στέλιος before launch

1. ~~**Postcode**~~ — **resolved, Sep 2026. The shipped value is correct; do not
   "fix" it to 15772 again.** Μαικήνα is split across two codes at the 67/74
   boundary, which is why the directories disagree:

   | Segment | ΤΚ |
   |---|---|
   | Μαικήνα 1–65 και 2–72 | 157 72 |
   | Μαικήνα 67–ΤΕΛΟΣ και 74–ΤΕΛΟΣ | **157 71** |

   No. 82 is even and ≥ 74, so it sits in the second segment: **15771**, which is
   what `index.html` (×2) and `js/app.js` (×2) already ship. Source:
   [taxidromikoskodikas.gr — ΖΩΓΡΑΦΟΣ](https://www.taxidromikoskodikas.gr/nomos/ATTIKIS/perioxi/ZOGRAFOS).
2. **Opening hours** — published nowhere. **Deliberately omitted** rather than
   invented. Add `openingHoursSpecification` to the JSON-LD once known; there is
   no hours row on the page to correct.
3. **Star rating** — 15 reviews is verified, the *average* is not. The trust strip
   shows the count only and there is **no `aggregateRating` in the schema**. Do not
   add one without the real figure — fake rating markup is a manual-action risk.
4. **«Χωρίς χρέωση» (free measurement)** — industry-standard and used in the trust
   strip and the wizard, but not verified for this specific shop. Confirm.
5. **Real project photos** — see below.
6. **Domain**: `tentes-kentayros.gr` is referenced by epagelmatias.gr but is
   **NXDOMAIN with zero Wayback snapshots** — it appears unregistered. All canonical
   URLs, OG tags, sitemap and robots point there. Grab it, or global-replace.

## Photography

Mixed provenance, and the distinction matters:

* **Real — the shop’s own.** The «Έργα» gallery (`g01`–`g07`), the repair card
  (`p-episkeui`, a stained floral canopy and its articulated arm), the curved-balcony
  shot on «Ειδικές κατασκευές» (`p-eidikes`), and all fifteen fabric swatches.
* **Atmospheric / illustrative.** The hero, the sun slider and the remaining product
  cards. None of these claims to be a Ξενιτίδης installation, and none should be
  captioned as one.

Swap illustrative shots for real ones in the `PRODUCTS` array in `js/app.js` as
Στέλιος sends them.

## The fabric picker — «Διάλεξε το πανί σου»

Fifteen real cloths, cropped out of photographs of the sample book on the workshop
bench and carrying the manufacturer’s **real design codes** — so a visitor can ring
up and say «to 8054» and be understood. Codes were read off the page margins:
2307, 8060, 8028, 8038, 8048, 8059, 2271, 3208, 8054, 8023, 8029, 8047, 8049, 8056, 8058.

The shots are handheld, under mixed daylight, so each crop gets a **white-patch**
colour correction (92nd-percentile per channel, gain clamped to 0.90–1.12) rather
than a grey-world one — grey-world fits the *average*, which on a magenta-flowered
swatch drags the cream ground green. The clamp is what keeps the correction honest;
the section also says outright that no screen renders a cloth exactly, which is true
and is the reason the sample book travels to the measuring appointment.

The choice is written to `chosenFabric` and read back by the wizard, so it lands on
the email that actually leaves the page. Source photos live outside the repo
(`~/Downloads/tedes variations`); regenerate with the crop table in the git history
of this pass.

## Coverage — «Σε όλη την Ελλάδα»

The section that used to sit here walked a van between nine Attica suburbs. That
said the opposite of the truth and is gone. In its place: Greece as a 46×46 dot
matrix — mainland, Chalkidiki’s three fingers, Peloponnese, Euboea, Crete, and the
Aegean and Ionian islands — rasterised from coastline polygons, with Ζωγράφου as the
one red mark.

Dots are grouped into seven rings by distance from the workshop and **each ring is a
single `<path>`**, so the map is seven nodes rather than 576, and the rings can light
up outward on a stagger. The dots are **painted by default** and the observer only
adds the animation — see the harness note at the bottom before "fixing" that.

**Nine routes out.** Quadratic arcs from the hub to nine headings right around the
compass, all bowed to the same side so the fan reads as one system. They are
deliberately unlabelled: the point is *everywhere*, not *these nine towns*. Each
head is drawn by hand rather than with an SVG `<marker>` — a marker is painted at
its vertex regardless of the dash offset, so it would sit at the destination before
its own line had been drawn. The tangent at t=1 on a quadratic is just
`end - control`, which is the whole of the maths.

**The region buttons light the map.** `GREECE_REGIONS` gives each of the fifteen a
centre and a radius in grid units; pressing one re-authors a single overlay `<path>`
with the dots inside that disc and knocks the rest of the country back to 16%. A disc
is a coarse fit for a prefecture and the code says so — it lights *roughly here*,
not a boundary, and overlapping neighbours on the mainland is geographically honest.
Highlighting a subset of a ring is impossible (a ring **is** one path) and 576
addressable dots would be 576 nodes, hence the overlay. The buttons wear the page's
own hard-edge/offset-shadow treatment and press down onto their shadow, same as every
other button on the site; `aria-pressed` carries the state and a second press clears.

## Forms

The quote wizard has **no backend**. It builds a formatted Greek email and hands it
to `mailto:tenteskentayros@hotmail.gr`. This works everywhere but silently fails for
users with no mail client configured — which is why every step of the funnel also
offers the phone number. Swap in Formspree/Netlify Forms/a PHP endpoint at the
`form.addEventListener('submit', …)` handler in `js/app.js` when hosting is chosen.

---

## Notable implementation details

**Hero — «Η σκιά πέφτει».** Scroll drives four things at once: the glare overlay
fades out, a cool shade overlay fades in, a hard shadow edge sweeps across the frame
(`--sweep` on a gradient stop), and the shade photo crossfades over the noon photo.

The Higgsfield clip plays back as a **24-frame WebP sequence blitted to a canvas**,
not as a `<video>`. This is deliberate: scrubbing a video by writing `currentTime`
forces a seek + decoder flush on every scroll frame, which stutters badly. Frames are
pre-decoded, so `drawImage` is effectively free. Two sets are built at encode time —
`assets/frames/w1100` (1.6 MB) and `assets/frames/w640` (0.7 MB) — and the sequence
only fades in once **every** frame has decoded, over a two-photo crossfade (~67 KB)
that carries the hero on its own if it never does.

**There is no easing on the scroll value.** Scroll position *is* the input; any lerp
toward it reads as the picture trailing your finger. Verified: every painted sample
matches the expected curve with 0.0000 error.

Regenerate the frames (needs `pip install imageio-ffmpeg`):

```bash
ffmpeg -i assets/_source/hero-shade.mp4 -vf "fps=24/6.04,scale=1100:-2" -vsync 0 -f image2 -c:v libwebp -quality 70 assets/frames/w1100/f%02d.webp
```

**Leaflet loads on approach, not on arrival.** 161 KB (147 KB JS + a render-blocking
14 KB stylesheet) for one map in the final section is the single largest avoidable
cost on the page, so neither file is in `index.html` any more. `app.js` injects both
when the contact block comes within 400px, and the stylesheet is inserted **before**
`css/style.css` — appended to the end of `<head>` it would outrank the site's own
Leaflet overrides and hand back the default grey chrome. If the fetch fails, the
address panel takes over exactly as it did when Leaflet was blocked.

**Preview server.** `serve.py` replaces the PowerShell one because it supports HTTP
byte ranges (needed by the fabric `<video>`) and correct UTF-8 Greek content types.
It must be *threading* — a single-threaded `HTTPServer` with HTTP/1.1 keep-alive
blocks every request after the first.

**Sun slider.** The handle is the sun: it rides a sine arc (highest at midday) and
the tick labels are positioned at their *true* value percentage, not spaced evenly,
so the label always sits under the sun. Full keyboard support (arrows / shift+arrows
/ Home / End) with live `aria-valuetext`.

**Wizard.** Picking an option auto-advances (fewer taps → higher completion), but
`Συνέχεια` still validates and shakes on an empty step. Clicking any product card
pre-selects the matching type, so arriving from a card is a 3-question form.

**Fonts.** Sofia Sans Extra Condensed + Commissioner — both verified to ship real
**Greek** subsets from Google Fonts (many popular display faces, incl. Playfair
Display, Oswald and Archivo, do not). Verify with
`curl -A "<Chrome UA>" "https://fonts.googleapis.com/css2?family=X" | grep greek`
before ever swapping a face.

**Accessibility.** Skip link, semantic landmarks, one H1, visible focus rings,
`prefers-reduced-motion` collapses the sticky hero to a static section and disables
auto-advance, all tap targets ≥44 px on mobile.

## Bugs found and fixed in the polish pass

| Bug | Cause |
|---|---|
| Hero washed out, headline barely legible | Glare hotspot sat at `62% 18%` — directly on the copy (x3–67%, y21–50%) — while the scrim only started at 68%. Moved the hotspot to `84% 4%` and rebuilt the scrim on two axes. |
| Nav item "Το φως" sat 11px above its siblings | It wrapped to two lines at the space. Added `white-space: nowrap` and raised the burger breakpoint 940→1080px, where the six Greek labels actually fit. |
| Header phone never hid on mobile, wrapped to 3 lines over the wordmark | `a[href^="tel:"]{display:inline-flex}` (0,1,1) outranked `.header-phone{display:none}` (0,1,0). Fixed with `.header-phone[href^="tel:"]`. |
| Hero content overflowed the phone viewport | Measured **853px inside 812px**. Tightened the mobile type ramp, stacked CTAs full-width, reserved header space. |
| Wizard showed the question above "Βήμα 1 από 4" | A `<legend>` is painted at the top of its fieldset regardless of DOM order and ignores `order`. Now an sr-only legend + visible `<p>` + `aria-labelledby`. |
| Grey dead cell in the product grid | 7 cards never divide into 4/3/2 columns. Hairlines moved from a grid background to per-card borders, and JS spans the last card across leftover tracks. |
| Eyebrow rule invisible on the repair section | Hard-coded `var(--terra)` on a terracotta background. Now `currentColor`. |
| Every nav jump buried the section heading | All anchor targets had `scroll-margin-top: 0` under a 71px fixed header. |
| Sun knob collided with the caption | The knob rides an arc through the upper half; the caption was overlaid top-left. Caption moved below the stage. |
| Wordmark frame invisible over the hero | SVG `stroke="currentColor"` resolved to ink and never became bone on the dark header. |
| Fieldsets wouldn't shrink in the grid | UA `min-width: min-content` — the classic fieldset trap. |
| Preview server hung after one request | Single-threaded `HTTPServer` + HTTP/1.1 keep-alive. Now `ThreadingHTTPServer`. |

## Bugs found and fixed in the nationwide/fabric pass

| Bug | Cause |
|---|---|
| **Path traversal in `serve.py`** | The guard was `full.startswith(ROOT)`. On a path *string* that also accepts any sibling directory whose name merely begins with the project’s — `…/tedes-xenitidis-backup` walked straight out of the tree. Now tests `full == ROOT or full.startswith(ROOT + os.sep)`. |
| No security headers at all | `serve.py` now sends CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and the two COOP/CORP headers on every response, and `index.html` carries a `<meta>` CSP for static hosts that send none. `frame-ancestors` and `X-Frame-Options` can only come from a real header — mirror the list in the production host’s config. |
| «Ειδικές κατασκευές» photo was upside down | No EXIF orientation tag to explain it — the file itself was rotated. Fixed at 180° in the shipped derivatives; the balcony floor tiles are the giveaway that it now reads correctly. |
| Call panel clipped off the left of a phone screen | A 20rem panel anchored `right: 0` to a *compact* trigger starts at x≈−25 on a 375px screen, and `overflow-x: clip` on `<body>` eats it silently instead of scrolling. Below 620px `.callpick` drops out of the positioned chain so the panel spans the header’s own gutters. |
| Coverage map rendered blank under test | **Not a site bug — read this before "fixing" it again.** The browser pane reports `document.hidden` and `innerHeight === 0` while Claude's window is hidden, so no IntersectionObserver ever fires and every observer-gated element reads as un-triggered. Hardened anyway, because the cost is one line each and the failure mode is invisible: the coverage dots are **painted in CSS** and the observer only adds the stagger, and both observers also measure `getBoundingClientRect()` once at registration. |
| FAQ rich result paraphrased the page | The `FAQPage` JSON-LD and the visible `FAQ` array in `js/app.js` had drifted apart. Google requires them to match. The JSON-LD is now generated from the array — **regenerate it whenever the FAQ copy changes.** |
| `g08` sat in the «Έργα» gallery captioned «Εμπριμέ τεντόπανο» | It is a *damaged* awning — rust-stained cloth, exposed arm — shown in a reel of finished work. It is the repair card’s photo now, where it belongs. |

**Harness note.** The browser pane reports `document.hidden` with `innerHeight: 0`
whenever Claude's window is not in the foreground. In that state screenshots time
out, `requestAnimationFrame` and CSS transitions do not run, and **IntersectionObserver
never fires** — so anything lazy-gated (the ambient video loops, the coverage stagger,
the Leaflet fetch) reads as broken when it is not. Verify those by driving the DOM
directly, or bring the window forward first.

**Tooling note.** The 21st.dev connector *is* reachable in the current environment,
but nothing was pulled from it: the registry ships React/Tailwind components and this
is a no-build, vanilla, bespoke design system (neobrutalist offset edges, Sofia Sans
Extra Condensed, wine/brass/bone). Adapting a registry component would have cost more
than drawing one and would have imported a second visual language. Every component
here is bespoke. Browser-pane screenshots also fail (frozen compositor), so
this build was verified programmatically: `requestAnimationFrame` and CSS transitions
do not run while the pane reports `document.hidden`, which makes some computed styles
read as their start value. That is a harness artifact, not a defect.

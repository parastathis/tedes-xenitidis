# ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης, Ζωγράφου

Static site (plain HTML/CSS/JS, no build step, no dependencies).
Preview: `preview_start` with launch config **`tedes-xenitidis`** → http://localhost:8909

```
index.html          all markup + JSON-LD
css/style.css       design system + every component
js/app.js           hero scrub, sun slider, fabric picker, call picker,
                    coverage map, wizard, FAQ
assets/img/         shipped, optimised (webp + jpg fallback, responsive variants)
assets/fonts/       self-hosted woff2 subsets — see «Webfonts»
assets/video/       hero scrub + fabric loop (desktop-only, see below)
assets/_source/     2K PNG masters — gitignored, NOT shipped
vercel.json         production headers + cache policy (mirrors serve.py)
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
   **NXDOMAIN with zero Wayback snapshots** — it appears unregistered.

   **Global-replaced, Sep 2026.** Every absolute URL now points at
   `https://tedes-xenitidis-lbrh.vercel.app`, the address the site actually
   answers on. It had to be: a canonical pointing at a host that does not
   resolve tells Google the real copy of this page is somewhere it cannot
   reach, so the live site was effectively unindexable, and every share preview
   on Facebook, WhatsApp and Viber came up blank because `og:image` was on the
   dead host too.

   **To migrate when the domain is bought:** search `index.html`, `robots.txt`
   and `sitemap.xml` for `tedes-xenitidis-lbrh.vercel.app` and replace it. That
   is the whole job — 13 in `index.html`, one each in the other two, and no
   other file mentions a host. Vercel
   308-redirects the `.vercel.app` alias to a custom production domain once one
   is attached, so the two addresses will not compete for indexing.

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

## Webfonts

Both families are **self-hosted** from `assets/fonts/`, not pulled from
`fonts.googleapis.com`. The Google stylesheet was the single worst thing on the
page: a render-blocking request on a third origin, with the woff2 files queued
*behind* it, so nothing painted until DNS + TLS + CSS + font had all come back —
4.3 s of it on a throttled phone, and a 4.8 s LCP render delay.

Four files, the unmodified greek and latin subsets Google serves (OFL 1.1, see
`assets/fonts/OFL.txt`). They are variable, so one file per script covers
Commissioner 400–700 and Sofia Sans Extra Condensed 800–900. Rebuilding them as
one tighter greek+latin subset from the upstream variable TTFs was tried and is
*worse* — 69 KB against Google's 52 KB for the same 212 glyphs, because the
upstream font carries far more variation data than Google's pipeline output.
Use Google's files.

**The fallback is metric-matched** (`Sofia XC fallback` in `style.css`). Nothing
on a stock device is anywhere near as condensed as Sofia Sans Extra Condensed:
the hero title set in Arial Narrow runs to five lines instead of three, 216 px
instead of 129 px, so the instant the real font arrived everything below it
jumped 87 px. `size-adjust` and the ascent/descent overrides are measured off
the real font, one face per likely local fallback, narrowest declared last
because CSS uses the last face in a family whose `src` resolves. All three
measure 129 px — the same as the real font — so the swap moves nothing.
Re-measure if the display face ever changes. Commissioner needs none of this;
it is within 0.2 % of system-ui.

**All four are preloaded, including latin.** That is not belt-and-braces. The
hero title needs latin glyphs — the comma and the full stop in «ΤΟ ΜΠΑΛΚΟΝΙ ΣΟΥ,
ΠΙΣΩ ΣΤΗ ΣΚΙΑ.», the digits in «210 775 1368», the «82» in the address — so left
to discovery the latin files only went on the wire after first layout. The
display face fell back to Arial Narrow in the gap and the title reflowed when the
real one landed: **CLS 0.23, on the largest text on the page.** With all four
preloaded, CLS is 0. Do not "optimise" the latin preloads away.

## Production headers — `vercel.json`

`serve.py` has always sent the security header list; the production host never
had it, so the live site shipped with no `X-Content-Type-Options`, no
`X-Frame-Options` and no real CSP (Mozilla HTTP Observatory: **B, 75/100**).
`vercel.json` now mirrors `SECURITY_HEADERS` in `serve.py` exactly — **keep the
two in step.**

It also sets the cache policy Vercel does not: everything under `/assets/` is
content-stamped or a font that will never change under its own name, so it gets
`max-age=31536000, immutable`; `css/` and `js/` are not fingerprinted, so they
get a day plus a week of `stale-while-revalidate`. `index.html`, `robots.txt` and
`sitemap.xml` keep Vercel's revalidating default so a deploy is live at once.

`.woff2` was missing from `serve.py`'s `TYPES` map. With `nosniff` in the header
list that would have served the fonts as `application/octet-stream` and the
browser would have refused them — local only, but it would have looked exactly
like a broken font file.

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

## Bugs found and fixed in the audit pass (Observatory / PageSpeed / Seobility)

| Bug | Cause |
|---|---|
| **Site was effectively unindexable** | `canonical`, `og:url`, `og:image`, `twitter:image`, every JSON-LD `@id`/`url`/`logo`/`image`, `sitemap.xml` and the `Sitemap:` line in `robots.txt` all pointed at `tentes-kentayros.gr`, which is NXDOMAIN. A canonical to a host that does not resolve tells Google the real copy of the page is unreachable. Share previews were blank for the same reason. All repointed at the live origin — see the migration note above. |
| No security headers in production | `serve.py` sent them, the host had no config at all. `vercel.json` added; Observatory **B 75/100 → A+ expected** (`X-Frame-Options` was −20, `X-Content-Type-Options` −5). |
| Google Fonts on the critical path | 4.3 s of render-blocking third-party chain in front of first paint. Self-hosted — see «Webfonts». |
| Hero title reflowed on font swap | The latin subsets were not preloaded but the hero needs them. CLS 0.23 → **0**. |
| 24 hero frames raced first paint | The sequence is an *upgrade* to the two-photo crossfade, but all 24 stills (0.8 MB phone / 1.7 MB desktop) went on the wire during load and fought the LCP image for bandwidth. Now kicked off on `load` + `requestIdleCallback` — still ready long before anyone has scrolled that far. |
| 158 KB logo for a 34 px mark | `logo-kentauros.png` is 512×512 and was used in all four slots. Now `logo-kentauros-256.webp` (21 KB) for the header, mobile nav and footer, and `logo-kentauros-512.webp` for the repair-band watermark, which really is drawn up to 460 px wide. The PNG stays on disk for the JSON-LD `logo`. |
| Fabric poster downloaded twice | The `<picture>` behind the loop fetched `fabric-poster.webp` and the `<video poster>` fetched `fabric-poster.jpg` — 233 KB for the same frame. The poster now points at the webp, so both share one cached file. The works reel already did this correctly; the fabric block had drifted. |
| Wordmark failed WCAG 2.5.3 Label in Name | `aria-label="ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης, αρχική"` put an em dash inside what the reader can see, so the accessible name did not contain the visible text and a speech-recognition user saying what was on screen could not hit the link. Also `href="#"`, now `#hero`. |
| Title and description were being truncated | 77 and 185 characters; Google cuts at roughly 60 and 160. The phone number fell off the end of the description, which on a local business snippet is the most useful thing in it. Both rewritten to fit. |
| `.woff2` missing from `serve.py`'s MIME map | See «Production headers». |

**Deliberately not done.** Two PageSpeed items were left alone on purpose:

* **Minifying `css/style.css` and `js/app.js`** — roughly 7 KB and 9 KB after
  brotli. The JS is `defer`red so its size does not block anything, and 7 KB of
  CSS is worth well under a tenth of what the fonts were costing. Both files are
  the documented source of truth for a project with no build step; splitting
  them into source and shipped copies with nothing to keep the two in sync buys
  a rounding error and costs the thing that makes this codebase readable.
* **Recompressing the fabric swatches** — PageSpeed wants ~100 KB off
  `f-2307-700.webp`. Re-encoding measured badly: lossy-to-lossy only bought 6 %
  at a visually clean quality, and reaching the suggested saving means q72,
  which visibly mushes the weave. The weave is the product. They are lazy,
  below the fold, one at a time, and off the critical path — leave them.

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

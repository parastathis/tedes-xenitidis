# ΚΕΝΤΑΥΡΟΣ — Τέντες Ξενιτίδης, Ζωγράφου

Static site (plain HTML/CSS/JS, no build step, no dependencies).
Preview: `preview_start` with launch config **`tentes`** → http://localhost:8909

```
index.html          all markup + JSON-LD
css/style.css       design system + every component
js/app.js           hero scrub, sun slider, wizard, FAQ, swatches
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
| Address | Γαλήνης 45, Ζωγράφου | all sources agree |
| Landline | 210 7751368 | all sources agree |
| Mobiles | 6970 417549 · 6936 743560 | i-need.gr, epagelmatias |
| Email | tenteskentayros@hotmail.gr | i-need.gr |
| Services | τέντες με βραχίονες, πέργκολες, κασετίνες, ρολοκουρτίνες, επισκευές, αλλαγή πανιών, ειδικές κατασκευές | i-need.gr (verbatim) |
| Google reviews | ~15 | search result |
| Descriptor | «βιοτεχνία τεντών» (own workshop, not a reseller) | search result |

---

## ❗ Needs confirmation from Στέλιος before launch

1. **Postcode** — listed as both **15772** and **15773**. Currently `15772` in the
   JSON-LD and the contact block. Confirm and fix in `index.html` (2 places).
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

There is **no portfolio / «Τα έργα μας» gallery**, on purpose. No genuine photo of
this shop's work exists in any public source, and captioning generated imagery as
completed jobs would be misrepresentation customers do notice.

Every image here is **atmospheric or illustrative** — a generic Athens balcony and
generic product-type shots. None claims to be a Ξενιτίδης installation. When Στέλιος
sends real photos, add a gallery section and swap the seven product-card images in
the `PRODUCTS` array in `js/app.js`.

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

**Tooling note.** The **21st.dev connector is not available** in this environment
(absent from the MCP registry), so every component here is bespoke — same situation
as the `mpogris` build. Browser-pane screenshots also fail (frozen compositor), so
this build was verified programmatically: `requestAnimationFrame` and CSS transitions
do not run while the pane reports `document.hidden`, which makes some computed styles
read as their start value. That is a harness artifact, not a defect.

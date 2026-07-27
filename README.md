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
The whole effect runs on **two images (~67 KB at mobile size)** — the 5.7 MB Seedance
scrub video is layered on top only when `HEAVY_MEDIA_OK` passes (≥900px, no
data-saver, not 2G/3G, ≥4 GB RAM, motion allowed). Phones get the light version,
because phones are where the calls come from.

Video scrubbing needs **HTTP byte-range support** to seek. The local PowerShell
preview server doesn't do ranges, so the video is skipped locally and the image
crossfade runs instead — that is expected, not a bug. Most real hosts support ranges.

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

**Tooling note.** The **21st.dev connector is not available** in this environment
(absent from the MCP registry), so every component here is bespoke — same situation
as the `mpogris` build. Browser-pane screenshots also fail (frozen compositor), so
this build was verified programmatically: `requestAnimationFrame` and CSS transitions
do not run while the pane reports `document.hidden`, which makes some computed styles
read as their start value. That is a harness artifact, not a defect.

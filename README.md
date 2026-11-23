# Džanis Brkan — Portfolio (v5)

Personal portfolio site for Džanis Brkan, frontend developer based in Mostar.

v5 combines the **v1** colour palette and text layout (white and light-grey sections, deep teal accent, two-column "label | content" sections) with the **v4** page structure and animations (interactive hall-plan hero, scroll-driven timeline, tilt cards and more).

Built with plain **HTML, CSS and vanilla JavaScript**: no framework, no build step, no dependencies.

---

## Features

| Feature | Where |
| --- | --- |
| **Interactive hall-plan hero.** An exhibition floor plan draws itself on load. Booths glow near the cursor, random booths pulse, and "visitors" walk the aisles. | `<canvas class="hero__plan">`, `script.js` → section 1 |
| **Typing headline.** Cycles through "React apps.", "hall plans.", "Angular apps.", "clean designs." | `.typer`, `script.js` → section 2 |
| **Self-drawing timeline.** The experience line fills as you scroll and each job lights up when the line reaches it. | `.timeline`, `script.js` → section 3 |
| **Count-up stats.** Numbers animate when they scroll into view. | `[data-count]`, `script.js` → section 4 |
| **3D tilt cards.** Experience and skill cards tilt toward the cursor, with a light sheen. | `.tilt`, `script.js` → section 6 |
| **Scroll progress bar, cursor glow, magnetic buttons, background tone shifts between sections** | `.progress`, `.cursor-glow`, `.magnetic`, `[data-tone]` |
| Reveal-on-scroll, active nav link, sticky blurred nav, mobile menu | `script.js` |

### Accessibility and performance

- **Reduced motion.** Everything respects `prefers-reduced-motion`. Animations are disabled and content is shown in its final state.
- **Touch screens.** Cursor-only effects (glow, tilt, magnetic buttons) are off on touch devices.
- **Battery and CPU.** The hall-plan canvas only runs while the hero is on screen and the tab is visible.
- **Semantics.** The page has a skip link, semantic landmarks, real links and buttons, and screen-reader text for the typing headline.

---

## Project structure

```
v5/
├── index.html      # all content and markup
├── styles.css      # theme tokens (:root) + layout + animations
├── script.js       # interactions (no dependencies)
├── assets/
│   └── photo.jpg   # portrait used in the About section
└── README.md
```

---

## Run locally

Open `index.html` in a browser. That's it.

If you prefer a local server (for example to test on your phone over Wi-Fi):

```bash
# from the v5 folder
npx serve .
# or
python3 -m http.server 8000
```

---


## Deploy

The site is hosted on *GitHub Pages*, deployed straight from the main branch of this repository (Settings → Pages → Deploy from a branch → main / root).

There is no build step: every push to main updates the live site automatically within a minute or two.

git add .
git commit -m "Update portfolio"
git push

Live at: <https://dzanisbrkan.github.io>

---

## Customising

### Content

All text lives in `index.html`. Sections in order: hero → stats → about → experience → skills → design → contact.

- **Stats:** change the number in `data-count="6"`; the label sits next to it.
- **Typing words:** edit the `words` array near the top of `script.js` (section 2), and update the matching `.sr-only` sentence in the hero for screen readers.
- **New job:** copy one `<li class="job">…</li>` block inside `.timeline`.

### Colours

Every colour comes from the CSS custom properties in `:root` at the top of `styles.css`:

| Token | Used for |
| --- | --- |
| `--a` / `--a-text` / `--a-soft` | primary accent (teal): buttons, tags, links |
| `--b` / `--b-soft` | secondary accent: timeline dots, caret, visitors |
| `--grad` | gradient for the primary button, typed text and stat numbers |
| `--tone-1` … `--tone-4` | page background per section (`data-tone` on each `<section>`) |
| `--plan-a`, `--plan-b`, `--plan-ink` | hall-plan canvas colours, as `R, G, B` triplets |
| `--fade-rgb` | page background as an `R, G, B` triplet (used for the hero fade and nav) |

v3 and v4 use the same code with different tokens, so you can swap a palette by replacing the `:root` block.

### Hall plan

Tune it in `script.js`, section 1:

- `PATTERNS` / `WEIGHTS`: booth layouts per block and how often each appears.
- `160` in `1 - d / 160`: cursor glow radius.
- `650` in `now - lastPulse > 650`: how often a random booth pulses (ms).

---

## Browser support

Current Chrome, Edge, Firefox and Safari (2022+). The site uses the CSS individual `translate` property, `text-wrap`, `IntersectionObserver` and `<canvas>`.

---

## Versions

| Version | Idea |
| --- | --- |
| v1 | Clean, light, teal. Static portfolio. |
| v2 | Midnight & electric (dark violet / coral), hall-plan hero, typing text, timeline, stats, skills ticker. |
| v3 | Cobalt & tangerine (light), v2 effects plus tilt cards and cursor effects, no ticker. |
| v4 | Ink & lime (dark), same features as v3. |
| **v5** | **v1 palette and text layout + v4 page layout and animations.** |

---

© Džanis Brkan · [GitHub](https://github.com/DzanisBrkan) · [LinkedIn](https://www.linkedin.com/in/džanis-brkan-162b18176)

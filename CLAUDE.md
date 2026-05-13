# georgeplendl.me

Personal portfolio site for George Plendl, Senior Product Designer.

## Stack

Static site — plain HTML, CSS, and vanilla JavaScript. **No build step, no bundler, no package.json.** Edits ship exactly as authored.

External dependencies are loaded via CDN script tags:
- GSAP 3.12.5 + ScrollTrigger (intro and scroll-triggered animations)
- Google Fonts: Schibsted Grotesk (body), Geist (list/code-like accents)

## Local dev

Several effects use canvas `getImageData` on local image assets, which browsers block on `file://` origins. **Always serve over HTTP for local preview:**

```
python3 -m http.server 8000
# then open http://localhost:8000/about.html
```

Symptom of forgetting this: blank canvas with `SecurityError: ... canvas has been tainted by cross-origin data` in the console.

## Layout

```
index.html         — home page
about.html         — CV / about page
css/style.css      — all styles; CSS variables in :root
images/            — static assets (logos/ subfolder for brand logos)
js/
  transitions.js       — page-transition fade orchestrator
  animations.js        — GSAP intro timelines + ScrollTrigger setup
  dither.js            — WebGL dither background (homepage)
  dither-interactive.js — WebGL dither bg with mouse-driven distortion + click blobs
  portrait-particles.js — Interactive dithered portrait on about.html
```

## Conventions

- **New JS modules:** wrap in an IIFE, put tunable constants at the top with one-line comments, hook into the page via a `<script>` tag at the bottom of the relevant HTML file.
- **Animations:** extend `js/animations.js`. The intro timeline branches on `document.body.classList.contains('page-about')`; scroll-driven entries go through `setupScrollAnimations()`.
- **Styles:** add to `css/style.css`. Theme tokens (`--bg`, `--text`, `--muted`, `--divider`, `--font`, `--font-list`) live in the `:root` block at the top.
- **Canvas / WebGL effects:** follow the patterns in `dither.js` and `portrait-particles.js` — IIFE, tunable constants at top, single `requestAnimationFrame` loop, listen for mouse on `window` (for full-page effects) or on the canvas element (for scoped effects).
- **Pixel art aesthetic:** the dither background renders 4-CSS-pixel blocks. New pixel-grid effects should match this size where appropriate.


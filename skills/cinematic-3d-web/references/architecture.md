# Engine architecture: Settings, App boot, Page/Route/Scroll managers

## The `Settings` pattern

Centralize every tunable the engine needs — asset path prefixes, feature flags, debug
toggles, performance caps — in one static module that is read once at boot. The pattern
that makes this genuinely useful (not just "a config file") is **URL-query overrides**:
any flag can be flipped for a single session by appending a query parameter, with zero
rebuild and zero code changes.

Why this matters in practice: a flagship interactive site is expensive to review (full
intro animation, preloader, onboarding) every single time. Query overrides let a
designer/QA/PM jump straight past all of that.

```js
// settings.js
const DEFAULTS = {
  isDev: false,
  log: false,
  skipAnimation: false,
  skipPreloader: false,
  skipOnboarding: false,
  hideUI: false,
  lookDevMode: false,
  usePixelLimit: true,
  maxPixelCount: 2_000_000, // width * height budget, not just DPR
  maxDPR: 1.5,              // cap retina displays — post FX cost scales ~quadratically
  jumpSection: null,        // e.g. "?section=gallery" to skip straight to a section
  qualityTier: null,        // force "low" | "medium" | "high", overriding auto-detect
};

function parseQuery(search = window.location.search) {
  const params = new URLSearchParams(search);
  const out = {};
  for (const [key, value] of params.entries()) {
    if (value === "" || value === "true") out[key] = true;
    else if (value === "false") out[key] = false;
    else if (!Number.isNaN(Number(value))) out[key] = Number(value);
    else out[key] = value;
  }
  return out;
}

export const Settings = { ...DEFAULTS, ...parseQuery() };
```

Usage anywhere in the codebase: `if (Settings.skipAnimation) { ... }`. Nothing else needs
to know *how* a flag was set — env default, build-time constant, or this-session-only
query override are all the same code path by the time consuming code reads it.

## App boot sequence

A predictable boot order avoids the classic WebGL-site bug where the renderer starts
before assets are ready, or the first rendered frame stutters because shaders haven't
compiled yet:

1. Create renderer + camera + scene container (cheap, synchronous).
2. Start the preloader UI immediately (so there's something on screen within the first
   paint).
3. Kick off **critical-path** asset loading only (hero scene geometry/textures, first
   page's shaders) — do not block on everything the whole site will ever need.
4. Once critical assets are in GPU memory, force one warm-up render (render the first
   frame off-screen, or to a 1×1 viewport) so shader compilation happens *before* the
   preloader is dismissed, not visibly after.
5. Reveal the experience, start the real render loop, then continue loading deferred
   assets (below-the-fold sections, secondary pages) in the background.

## Page / Route manager

Model every distinct "place" in the experience (a route, or a major scroll section if the
site is a single long page) as an object with an explicit lifecycle, rather than branching
on current-state flags inside one giant update function:

```js
class Page {
  async load() {}      // fetch/prepare this page's assets (idempotent, cached)
  enter(fromPage) {}   // add objects to the scene, start this page's animations
  update(dt, t) {}     // called every frame while active
  exit(toPage) {}      // tear down listeners, optionally play an exit animation
  dispose() {}         // free GPU resources if this page won't be revisited soon
}

class RouteManager {
  constructor(routes) {
    this.routes = routes;          // path -> Page instance
    this.current = null;
  }
  async navigate(path) {
    const next = this.routes[path];
    await next.load();
    if (this.current) this.current.exit(next);
    await playTransition();        // shared transition effect, not per-page bespoke
    this.current?.dispose();
    this.current = next;
    this.current.enter();
    history.pushState({}, "", path);
  }
}
```

The win is that transitions become *one* shared piece of code (a transition shader/overlay
that every route uses), and each page only has to reason about its own enter/update/exit —
it never needs to know what page came before or after.

## Scroll manager and `ScrollDomRange`

Two separate problems get conflated if you read `window.scrollY` directly in your render
loop: (1) raw scroll input is jittery/instant, and (2) you usually want a *normalized
progress* (0–1) over a specific DOM range to drive a 3D parameter, not an absolute pixel
value.

**Smoothing**: keep a "target" scroll value (set instantly from the scroll/wheel event)
and a separate "rendered" value that eases toward it every frame (a simple lerp is fine
here — this is not the same as the spring-damper motion in `motion-dynamics.md`, because
scroll smoothing wants critically-damped catch-up, not bounce/overshoot).

**`ScrollDomRange`**: given a DOM element (or a start/end pair of elements), compute how
far the smoothed scroll position is through that element's vertical span, clamped to
[0, 1]. This progress value is what actually drives 3D scene parameters — camera Z
position, a material uniform, an opacity — so the 3D scene and the DOM layout stay
naturally in sync without hand-tuned scroll-pixel thresholds scattered through the code.

```js
class ScrollDomRange {
  constructor(el) { this.el = el; }
  // smoothedScrollY: the eased scroll value from ScrollManager, not raw window.scrollY
  progress(smoothedScrollY, viewportHeight) {
    const rect = this.el.getBoundingClientRect();
    const top = rect.top + smoothedScrollY;
    const start = top - viewportHeight;
    const end = top + rect.height;
    return clamp((smoothedScrollY - start) / (end - start), 0, 1);
  }
}
```

## Performance / quality tiering

Decide the device's capability **once**, at boot, and feed that decision into every other
system instead of letting each shader independently guess:

- **DPR cap**: never render at the full device pixel ratio on retina/4K displays — cap
  around 1.5. Post-processing cost scales with pixel count, so going from 2.0 to 1.5 DPR
  is roughly a 44% pixel-count (and cost) reduction for a visually small sharpness loss.
- **Pixel budget over DPR alone**: also cap the absolute `width * height` the 3D canvas
  renders at, independent of DPR — this protects against ultra-wide/4K monitors at DPR 1
  still being too many pixels for the GPU.
- **Quality tier → feature set**: detect tier from a cheap heuristic (GPU renderer string,
  device memory, `navigator.hardwareConcurrency`, or simply screen size as a proxy for
  mobile) and map it to a feature table:

  | Tier | DPR cap | Bloom | DoF | SMAA | Particle count |
  |---|---|---|---|---|---|
  | low | 1.0 | off | off | off | reduced |
  | medium | 1.25 | on, cheap | off | on | medium |
  | high | 1.5 | on | on | on | full |

  Keep this table as data, not as scattered `if (isMobile)` checks throughout the
  renderer — it's the same idea as `PostProfile` in `postprocessing.md`: behavior should
  be driven by a small named config object, not by control flow.

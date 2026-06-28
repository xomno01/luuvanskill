---
name: cinematic-3d-web
description: >-
  Architectural and motion-design patterns for building high-end, "awwwards-style"
  interactive 3D/WebGL websites: custom page/route/scroll managers, branded
  post-processing pipelines (bloom, depth of field, SMAA, upscaling), spring-damper
  motion smoothing, idle Brownian drift, GPU-simulated particle fields, MSDF 3D text,
  cursor-driven screen distortion, and DOM-synced 3D data exploration. Use whenever the
  user wants to build a cinematic Three.js/WebGL hero site, scroll-driven 3D narrative,
  physically-smooth motion/hover effects, or asks to recreate the feel of studio-grade
  interactive sites (the kind built by studios like Lusion — e.g. oryzo.ai, lusion.co,
  oftheoak.co.uk). Distilled from studying the architecture of several such sites; all
  explanations and code here are original, not copied from any site's source.
---

# Cinematic 3D Web — engine architecture & technique guide

## Provenance and ground rules

This skill was written after studying the **public, compiled** output (HTML structure,
bundle file names, minified class names, network requests) of a handful of commercial
sites that share one underlying proprietary "engine" — most visibly oryzo.ai, lusion.co,
and oftheoak.co.uk, which appear to be built on the same internal toolkit by the design
studio Lusion. That research was for technique learning only.

**Everything in this skill is original**: explanations written from scratch, and example
code written from scratch to illustrate the *pattern*, not transcriptions of anyone's
shaders, minified bundles, 3D models, textures, audio, or video. Do not paste proprietary
site source into a project. Do reuse the architectural ideas below — they are general
WebGL/Three.js engineering patterns, most of which predate and extend beyond any single
site (e.g. second-order dynamics, FBM noise, MSDF text, GPU ping-pong simulation are all
publicly documented techniques in the broader graphics community).

## When to use this skill

- Building a portfolio/product/agency site that needs a 3D hero scene with cinematic
  camera work, scroll-driven storytelling, or a "alive even when idle" feel.
- Adding physically-smoothed motion (cursor followers, hover states, floating elements)
  that should feel like it has mass/inertia instead of linear/robotic easing.
- Building a data-rich 3D exploration UI (e.g. an interactive map/diagram/catalog in 3D)
  that still needs accessible, SEO-friendly DOM content layered on top.
- Wiring narrated audio/video to synced visuals (particles, subtitles, intensity-reactive
  effects).
- Tuning WebGL performance across device tiers without hand-maintaining two codepaths.

## The shared architecture, at a glance

```
Settings (static config + URL-query debug overrides)
  -> App (boot: renderer/camera setup, preloader, kick off PageManager)
       -> PageManager / RouteManager   (maps URL <-> Page lifecycle: enter/update/exit)
            -> ScrollManager / ScrollDomRange  (smoothed scroll position -> scene params)
                 -> per-page Three.js scene graph
                      -> motion layer (SecondOrderDynamics, BrownianMotion, Ease)
                      -> Postprocessing composer (PostProfile per page/mood)
                           -> render target -> canvas
```

The core insight worth copying is **not** any single effect — it's that every piece above
is a small, named, swappable unit driven by data (a `Settings`/`PostProfile`-style object),
so a flagship interactive site stays maintainable instead of becoming one giant
`requestAnimationFrame` callback.

## Reference files

| File | Covers |
|---|---|
| [`references/architecture.md`](references/architecture.md) | `Settings` config/debug-override pattern, App boot sequence, Page/Route/Scroll manager lifecycle, performance/quality tiering |
| [`references/postprocessing.md`](references/postprocessing.md) | Branded composer pipeline: bloom, bokeh depth of field, SMAA, upscaling, vignette/tint/grain, per-page `PostProfile` |
| [`references/motion-dynamics.md`](references/motion-dynamics.md) | Second-order dynamics (spring-damper smoothing), Brownian/FBM idle drift, shared easing library, data-driven physics props |
| [`references/particles-text-geometry.md`](references/particles-text-geometry.md) | GPU ping-pong particle simulation, point-cloud/billboard rendering off the main thread, MSDF 3D text, angular-alpha sprite trick, custom binary geometry trade-offs |
| [`references/screen-distortion-and-content-sync.md`](references/screen-distortion-and-content-sync.md) | Cursor-trail screen distortion, DOM-marker-over-3D-scene sync, audio/video narrative sync, preloader UX, QA debug overrides |

## Core principles to carry into any implementation

1. **Nothing moves linearly.** Every transform that responds to input (scroll, pointer,
   hover, route change) should pass through a spring/easing filter, not a raw lerp with a
   fixed factor — see `references/motion-dynamics.md`.
2. **Idle is not static.** If an element can be the only thing on screen for several
   seconds, give it a noise-driven idle motion so the frame never looks frozen.
3. **Post-processing is brand identity, not a finishing touch.** Decide the color
   grade/bloom/DoF "look" early and drive it from data (`PostProfile`) so every page/scene
   shares it automatically.
4. **Scale to the device, don't assume the device.** Cap DPR, budget total pixels, and
   pick which post effects run based on a detected quality tier — see
   `references/architecture.md`.
5. **Keep one source of truth for content.** When a 3D scene needs labeled, accessible,
   localizable content, drive both the 3D scene and the DOM overlay from the same data
   (HTML `data-*` attributes or a shared JSON), not from two hand-synced copies.
6. **Make QA fast.** Support URL-query overrides to skip intros/preloaders and jump to a
   section — a heavy interactive site is unreviewable if every check requires sitting
   through the full entrance animation.

## Quick-start checklist for a new project

- [ ] Define a single `Settings`/config module with asset paths + feature flags +
      URL-query override parsing.
- [ ] Stand up Page/Route/Scroll managers before writing any per-page visuals.
- [ ] Pick a postprocessing stack (start with three.js's own `EffectComposer` + bloom +
      a custom color-grade pass) and define one `PostProfile` per mood/page.
- [ ] Add a `SecondOrderDynamics` (or simple spring) helper and use it for every
      pointer-driven or route-driven motion.
- [ ] Add an FBM/noise idle-drift helper for anything that needs to feel alive at rest.
- [ ] Build a real-progress preloader before adding any heavy assets.
- [ ] Decide your device-tier strategy (DPR cap, pixel budget, which effects to disable)
      before optimizing individual shaders.

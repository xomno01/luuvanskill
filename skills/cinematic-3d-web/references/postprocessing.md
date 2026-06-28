# Branded post-processing pipeline

## Why a bespoke pipeline, not just "render the scene"

A raw `renderer.render(scene, camera)` looks like a tech demo. The visual signature of a
high-end interactive site comes almost entirely from a *consistent* chain of full-screen
passes applied after the 3D render — the same way a film's "look" comes from color
grading applied uniformly across every shot, not from how any one shot was lit. Treat the
post-processing stack as part of the brand, decided early, not bolted on at the end.

## Observed pipeline order (general pattern, not site-specific)

```
3D scene render (to an offscreen float/half-float render target, not the canvas)
  -> [optional] depth pass (for DoF + velocity buffers)
  -> [optional] TAA / velocity-based motion blur accumulation
  -> Bokeh depth of field   (blur strength driven by scene depth vs. focus distance)
  -> Bloom                  (threshold extract bright areas -> mip-chain blur -> additive composite)
  -> SMAA                   (3-pass: edge detection -> blend-weight lookup -> final blend)
  -> Color grade / vignette / tint / grain (cheap final shader, brand-defined)
  -> [optional] upscale     (if internal render resolution < output resolution)
  -> present to canvas
```

Order matters: anti-aliasing should generally run *after* bloom/DoF (those passes can
introduce their own soft edges that benefit from SMAA cleanup), and any resolution
upscaling should be the very last step so every prior pass works at the cheaper internal
resolution.

## Why SMAA instead of MSAA

Hardware MSAA only works on the primary render target before you read it as a texture in
a later pass. The moment your bloom/DoF/etc. passes need to *sample* the rendered scene
as an input texture (which they do — they're full-screen shader passes operating on the
previous pass's output), you've left the multisampled target behind, so MSAA can't help
with the edges in the final composite. SMAA (Subpixel Morphological/Enhanced
Anti-Aliasing) solves this as a **post pass**: detect edges in the rendered image, look up
blend weights from a precomputed area/search texture, then blend neighboring pixels
accordingly. It's the practical anti-aliasing choice for any pipeline built around
full-screen effect passes.

## Why resolution upscaling (e.g. AMD FSR-style spatial upscaling)

Every pass above costs GPU time proportional to pixel count. Rendering the entire chain
at, say, 70% linear resolution and upscaling only the *final* composite with a
sharpness-aware spatial upscaler recovers most of the perceived detail at a fraction of
the cost — this is the same idea consoles use to hit 4K output without a 4K-capable GPU.
Worth adding once bloom + DoF + SMAA are already in the budget and you're still
pixel-bound on mid-tier hardware; not worth the integration complexity for a lighter
scene that's already fast.

## `PostProfile`: making the look data-driven per page/mood

Instead of hardcoding bloom intensity, DoF aperture, vignette darkness, and grain amount
into pass constructors, define one small data object per page/scene and apply it
uniformly:

```js
const heroProfile = {
  bloom: { threshold: 0.6, intensity: 0.9, radius: 0.4 },
  dof:   { focusDistance: 8, aperture: 0.015, maxBlur: 0.01 },
  vignette: 0.35,
  tint: [1.0, 0.97, 0.92],
  grain: 0.04,
};

const galleryProfile = {
  bloom: { threshold: 0.8, intensity: 0.4, radius: 0.2 },
  dof:   { focusDistance: 4, aperture: 0.008, maxBlur: 0.004 },
  vignette: 0.15,
  tint: [1.0, 1.0, 1.0],
  grain: 0.02,
};

function applyProfile(composer, profile) {
  composer.passes.bloom.threshold = profile.bloom.threshold;
  composer.passes.bloom.strength = profile.bloom.intensity;
  composer.passes.bloom.radius = profile.bloom.radius;
  composer.passes.dof.uniforms.focusDistance.value = profile.dof.focusDistance;
  composer.passes.grade.uniforms.vignette.value = profile.vignette;
  composer.passes.grade.uniforms.tint.value = profile.tint;
  composer.passes.grade.uniforms.grain.value = profile.grain;
}
```

Page transitions can then crossfade between two `PostProfile`s instead of snapping,
reinforcing that the post stack is "scene mood," not a fixed global filter.

## Practical implementation in three.js

You don't need to write bloom/SMAA/upscaling shaders from scratch — three.js ships
working passes for most of this:

```js
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { GradeGrainShader } from "./shaders/grade-grain.js"; // your own small shader

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new BokehPass(scene, camera, { focus: 8, aperture: 0.015, maxblur: 0.01 }));
composer.addPass(new UnrealBloomPass(resolution, 0.9, 0.4, 0.6));
composer.addPass(new SMAAPass(width * pixelRatio, height * pixelRatio));
composer.addPass(new ShaderPass(GradeGrainShader)); // vignette + tint + grain, ~15 lines of GLSL
```

The brand-defining piece is almost always that last custom shader pass (vignette + tint +
grain combined into one cheap pass) — write that one yourself, it's small and it's where
the site's specific "feel" actually lives.

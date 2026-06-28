# Screen-space cursor distortion, DOM/3D content sync, and audio-visual narration

## Cursor-trail screen distortion

A visible, smeary "paint trail" that follows the cursor and subtly distorts the screen
behind it (refraction, chromatic split, or pixel displacement) is built from an
accumulation buffer, not a single static decal:

1. Maintain an offscreen render target the same size as the screen (or a downscaled
   version — this effect is forgiving of lower resolution).
2. Each frame, multiply the *entire* existing trail target by a decay factor slightly
   below 1 (e.g. `0.94`) — this is what makes the trail fade out smoothly over time
   instead of needing an explicit "erase."
3. Stamp a soft circular/brush sprite at the current pointer position into that same
   target, additively. Stretch and rotate the stamp along the pointer's recent velocity
   vector so fast movements read as a streak, not a series of disconnected dots.
4. In the final composite shader, sample this trail texture and use its intensity to
   offset the UV coordinates used to sample the main scene (a cheap refraction look), or
   to drive a chromatic-aberration-style channel split.

```js
// every frame, before the main scene render:
trailMaterial.uniforms.decay.value = 0.94;
trailMaterial.uniforms.pointer.value.copy(pointerNDC);
trailMaterial.uniforms.pointerVelocity.value.copy(pointerVelocity);
renderer.setRenderTarget(trailTargetB);
renderer.render(trailScene, trailCamera); // fullscreen quad: decay(trailTargetA) + new stamp
swap(trailTargetA, trailTargetB);

// in the main composite pass:
compositeMaterial.uniforms.trailTex.value = trailTargetA.texture;
```

```glsl
// fragment shader sketch for the composite pass
vec2 distortion = texture2D(trailTex, vUv).rg * distortionStrength;
vec3 color = texture2D(sceneTex, vUv + distortion).rgb;
```

Why decay-based accumulation beats drawing a fixed-radius circle directly: the trail's
length and intensity naturally scale with pointer speed (fast movement = a long faint
streak before it decays; a pause = a tight spot that fades in place) with no extra
velocity-to-radius logic needed — the decay process does that for free.

## DOM markers synced to a 3D scene (data-exploration UIs)

When a 3D scene needs to carry labeled, structured content — an interactive
map/diagram/catalog where each point of interest has a name, category, description — keep
that content as ordinary, accessible HTML rather than duplicating it inside JS/shader
data:

1. Author each point of interest as an HTML element with `data-*` attributes carrying its
   3D position and metadata: `data-x`, `data-y`, `data-z`, `data-category`, plus whatever
   else the content model needs.
2. At boot, query all such elements once and use their `data-*` attributes both to (a)
   place a corresponding object/marker in the Three.js scene, and (b) build whatever
   filter/navigation UI groups them by category — **one read of the DOM is the single
   source of truth** for both the 3D scene and the 2D UI.
3. Every frame, project each item's 3D world position into 2D screen space and position
   its (absolutely positioned) DOM label there:

```js
function project(object3D, camera, viewportWidth, viewportHeight) {
  const ndc = object3D.position.clone().project(camera);
  return {
    x: (ndc.x * 0.5 + 0.5) * viewportWidth,
    y: (-ndc.y * 0.5 + 0.5) * viewportHeight,
    visible: ndc.z < 1, // behind-camera/clipped check
  };
}

function updateLabels() {
  for (const item of items) {
    const { x, y, visible } = project(item.object3D, camera, width, height);
    item.label.style.transform = `translate(${x}px, ${y}px)`;
    item.label.style.opacity = visible ? 1 : 0;
  }
}
```

Why this is worth the discipline: the content (including any text that needs translation,
or needs to be readable by screen readers/search engines) stays normal HTML, while the
visualization layer is purely derived from it — there's no second hand-maintained list of
"item name + position" living only in a JS data structure that the content team can't
edit without a deploy.

## Audio/video narration synced to visuals

For narrated audio or video paired with on-screen subtitles and reactive visuals (e.g.
particles that pulse in time with narration), the pieces compose as:

- A **cue list**: timestamped text segments (the same shape as subtitle/caption formats
  like SRT/VTT — parse an existing subtitle file rather than hand-rolling cue timing).
- A **single playback clock** — read `audioElement.currentTime` (or the video element's)
  every frame, find the active cue by binary/linear search over the timestamp list, and
  swap subtitle text only when the active cue changes (not every frame) to avoid
  unnecessary DOM churn.
- Optionally, an **`AnalyserNode`** (Web Audio API) attached to the same audio source for
  realtime amplitude/frequency data, used to modulate a visual parameter (particle speed,
  bloom intensity, a subtle camera shake) so the visuals feel reactive to the actual sound
  rather than to fixed keyframes:

```js
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audioElement);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
source.connect(analyser).connect(audioCtx.destination);

const freqData = new Uint8Array(analyser.frequencyBinCount);
function update() {
  analyser.getByteFrequencyData(freqData);
  const amplitude = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
  particleMaterial.uniforms.energy.value = amplitude;
}
```

Keep the cue list and the audio-reactive driver independent — cues drive *what text shows
when*, the analyser drives *how intense the visuals look right now* — so either can be
swapped or disabled (e.g. captions-off, or reduced-motion mode) without touching the
other.

## Preloader UX

A preloader is a UX problem before it's a visual one. Two requirements matter more than
the loading animation itself:

- **Track real progress.** Sum actual bytes loaded / total bytes (or asset count loaded /
  total count) across everything queued — never fake a timer that just counts up
  regardless of actual load state. A fake progress bar that completes before assets are
  actually ready (or stalls visibly after "100%") reads as broken.
- **Don't reveal until the GPU is actually ready.** Loading a texture/geometry into JS
  memory is not the same as it being uploaded and shader-compiled on the GPU. Force one
  warm-up render pass (see `architecture.md`'s boot sequence) before hiding the
  preloader — otherwise users see a frame-drop stutter the instant the "loaded" experience
  appears, which feels worse than a slightly longer preloader.
- **Prioritize the critical path.** Block the preloader only on what the first visible
  frame needs; defer everything else (later sections, secondary pages) to load silently
  in the background after first interaction.

## QA / debug overrides

Pair this with the `Settings` URL-query pattern in `architecture.md`: support flags to
skip the preloader/intro animation, jump directly to a named section, force a specific
quality tier, and optionally show a development grid/stats overlay. On a site whose full
experience takes 10–20 seconds to reach the "interesting" part, this is the difference
between a reviewable site and one nobody on the team actually re-checks after small
changes.

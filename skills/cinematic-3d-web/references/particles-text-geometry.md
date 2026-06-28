# Particles, point clouds, 3D text, and asset format trade-offs

## GPU ping-pong particle simulation

To animate tens or hundreds of thousands of particles smoothly, simulating each one on
the CPU and re-uploading positions every frame is the wrong approach — the upload itself
becomes the bottleneck. The standard technique is to run the simulation **on the GPU**
using render-to-texture "ping-pong" buffers:

1. Store particle state (position, velocity) as pixel data in a floating-point texture —
   particle index *i* maps to pixel `(i % width, floor(i / width))`.
2. Each frame, run a fragment shader over that texture: read the previous state texture,
   apply forces/integration, write the new state to a *second* render target.
3. Swap which texture is "current" vs. "previous" (ping-pong) so you're never reading and
   writing the same texture in one pass.
4. The particle mesh's vertex shader doesn't store positions in its own buffer at all —
   it samples the current state texture by particle index to find where to draw each
   point/instance this frame.

This means the only CPU→GPU traffic per frame is small uniforms (pointer position, time,
force strength) — the simulation itself never leaves the GPU.

```js
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";

const WIDTH = 256, HEIGHT = 256; // 65,536 particles
const gpuCompute = new GPUComputationRenderer(WIDTH, HEIGHT, renderer);

const positionTexture = gpuCompute.createTexture(); // fill with initial positions
const positionVariable = gpuCompute.addVariable("texturePosition", positionFragmentShader, positionTexture);
gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);
positionVariable.material.uniforms.pointer = { value: new THREE.Vector2() };
positionVariable.material.uniforms.delta = { value: 0 };
gpuCompute.init();

function update(dt) {
  positionVariable.material.uniforms.delta.value = dt;
  positionVariable.material.uniforms.pointer.value.copy(pointerNDC);
  gpuCompute.compute();
  particleMaterial.uniforms.texturePosition.value =
    gpuCompute.getCurrentRenderTarget(positionVariable).texture;
}
```

`three.js`'s `GPUComputationRenderer` (an official example utility) implements the
ping-pong bookkeeping for you — write your own simulation logic only inside the fragment
shader string passed to `addVariable`.

## Point-cloud / billboard rendering

For rendering a large point dataset (a product photographed/scanned as a point cloud, a
generative particle field, scientific/spatial data), the generic technique — distinct
from "Gaussian Splatting" specifically, which is a published technique with its own file
formats and renderers (e.g. `.ply`/`.splat`) — is:

- Render each point as a camera-facing billboard (`THREE.Points` with a custom
  `ShaderMaterial`, or an instanced quad for more control over shape).
- Attenuate point size by distance to camera so near points are larger (standard
  perspective-correct point sizing in the vertex shader: `gl_PointSize = size * (1.0 /
  -viewPosition.z)`).
- Shade with a soft circular/gaussian falloff in the fragment shader instead of a hard
  square, and use additive or alpha blending depending on whether points represent
  light/energy (additive) or solid matter (alpha, with depth-sorting care).
- If the dataset needs custom decoding (a packed/compressed format, depth-sorting tens of
  thousands of points for correct alpha blending, or any non-trivial per-point
  preprocessing), do that work in a **Web Worker**, not the main thread — large point
  datasets are exactly the case where decode/sort time can visibly stall scroll/input if
  done inline. Pass the decoded `Float32Array` buffers back via `postMessage` (using
  transferable objects to avoid a copy) and hand them straight to a `BufferGeometry`.

```js
// main thread
const worker = new Worker(new URL("./points-decode-worker.js", import.meta.url));
worker.postMessage({ url: pointDataUrl });
worker.onmessage = (e) => {
  const { positions, colors } = e.data; // Float32Arrays, transferred not copied
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
};
```

This pattern (decode/sort off-thread, hand raw typed arrays to the main thread) is broadly
useful any time a 3D scene needs to load or process a large binary dataset without
janking scroll or input handling during that work.

## MSDF text geometry — crisp 3D text at any scale/angle

Rendering text in 3D via a canvas-baked texture blurs as soon as the text moves toward
camera, recedes into depth, or is viewed at an angle — the texture is a fixed-resolution
bitmap. **Multi-channel Signed Distance Field (MSDF)** text avoids this:

1. Pre-generate an MSDF atlas for your font (tools like `msdf-bmfont-xml` produce a
   texture atlas + a JSON layout file — this is a build-time step, not runtime).
2. At runtime, build one quad per character, UV-mapped into the atlas, positioned using
   the layout JSON's per-glyph advance/kerning data (libraries like `three-bmfont-text`
   handle this layout step).
3. Shade with an MSDF fragment shader: it reconstructs a smooth, anti-aliased edge from
   the distance-field encoding regardless of how much the quad is scaled, rotated, or
   viewed in perspective — because the "edge" is computed analytically from the distance
   field at every pixel, not sampled from a fixed-resolution bitmap.

Use MSDF text whenever 3D text needs to travel through depth or stay legible at
dramatically different scales (a hero title the camera flies toward, floating labels at
varying distance) — it costs a build step but eliminates the blur/aliasing that canvas
textures can't avoid.

## Angular-alpha sprite trick (wide alpha texture packing)

For 2D sprite-like props placed in a 3D scene that need a *correct* soft alpha edge at
many rotation angles (e.g. hand-painted/illustrated props that get physically rotated by
pointer interaction — see `motion-dynamics.md`'s floating-prop pattern), naively rotating
a single alpha mask in the shader doesn't look right: a soft edge painted for one
orientation reads as wrong (too sharp/too soft on the wrong side) once mathematically
rotated, especially for non-radially-symmetric shapes.

The fix: pre-render the alpha mask at several fixed rotation angles, pack them side by
side into one wider texture (e.g. 4 angle-slices → a texture 4× the base width), and in
the fragment shader pick the correct horizontal slice based on the object's current
world-rotation angle (optionally cross-fading between the two nearest slices for
smoothness):

```glsl
// alphaTex is N slices wide, packed horizontally; angle in [0, 1) maps to slice index
float slice = floor(angle * NUM_SLICES);
vec2 sliceUv = vec2((vUv.x + slice) / NUM_SLICES, vUv.y);
float alpha = texture2D(alphaTex, sliceUv).r;
```

This trades texture memory (N× the width for N angle samples) for correctness, and avoids
any runtime cost of regenerating alpha masks — worth it specifically for hand-authored,
non-symmetric alpha shapes; skip it entirely for simple radially-symmetric shapes (a
circle/blob mask looks identical at every rotation, so there's nothing to fix).

## Custom binary geometry formats — when (not) to bother

A minimal custom binary container — a tiny header plus raw `Float32Array`/`Uint16Array`
dumps for positions/normals/uvs/indices — parses faster than glTF/GLB because it skips
JSON parsing and the general-purpose accessor/material-graph machinery glTF supports.
For an engine that only ever loads its *own* pre-baked, pre-optimized meshes (no need for
node hierarchies, skinning, materials defined in the file, or any interchange with other
tools), this is a reasonable trade.

**The trade-off is real**, though: you lose every existing tool's ability to open/inspect
the file (can't drag it into Blender, can't use any existing glTF viewer/validator/CLI),
and you have to write and maintain your own exporter. This is only worth it once you've
*measured* glTF parse time as an actual bottleneck for your specific asset profile (lots
of small geometry loads, e.g.) — for the large majority of projects, `GLTFLoader` (with
Draco/meshopt compression if file size matters) is the right default, and the custom
format is a premature optimization.

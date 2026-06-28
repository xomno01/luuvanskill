# Motion: second-order dynamics, idle Brownian drift, shared easing

## Second-order dynamics (spring-damper smoothing)

The single highest-leverage technique for making any interactive site feel "physical"
instead of "robotic": replace every `current += (target - current) * 0.1`-style lerp with
a proper second-order dynamical system. A plain lerp always approaches its target from one
side and never overshoots — which is exactly what makes it read as artificial. A
second-order filter can be tuned to anticipate, overshoot, and settle the way a real
spring-mass-damper system does, because it *is* one.

This is a publicly documented technique (popularized by the "t3ssel8r" second-order
dynamics video/algorithm) for filtering any time-varying signal — not specific to any one
site or proprietary engine. It's safe and standard to implement generically:

```js
class SecondOrderDynamics {
  // f: response frequency (Hz) — higher = snappier
  // z: damping coefficient — 0 = no damping (oscillates forever), 1 = critically damped, >1 = sluggish
  // r: initial response — 0 = no overshoot, 1 = instant initial reaction, >1 = overshoot/anticipation
  constructor(f, z, r, initialValue) {
    this.xp = initialValue;             // previous input
    this.y = initialValue;              // current output
    this.yd = 0 * initialValue;         // output velocity
    this._updateConstants(f, z, r);
  }

  _updateConstants(f, z, r) {
    const pi = Math.PI;
    this.k1 = z / (pi * f);
    this.k2 = 1 / ((2 * pi * f) * (2 * pi * f));
    this.k3 = (r * z) / (2 * pi * f);
  }

  update(dt, x) {
    const xd = (x - this.xp) / dt; // estimate input velocity
    this.xp = x;
    const k2Stable = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);
    this.y = this.y + dt * this.yd;
    this.yd = this.yd + (dt * (x + this.k3 * xd - this.y - this.k1 * this.yd)) / k2Stable;
    return this.y;
  }
}
```

Usage — smoothing a cursor-follow element:

```js
const sx = new SecondOrderDynamics(2.0, 0.6, 1.6, mouse.x); // f, z, r tuned to taste
const sy = new SecondOrderDynamics(2.0, 0.6, 1.6, mouse.y);

function update(dt) {
  follower.x = sx.update(dt, mouse.x);
  follower.y = sy.update(dt, mouse.y);
}
```

Practical tuning notes:
- `f` (frequency) controls overall speed — start around 1.5–3 for UI elements.
- `z` < 1 gives a bounce/overshoot on direction changes; `z` ≈ 1 gives a clean
  no-overshoot settle (good for camera look-at smoothing); `z` > 1 feels heavy/laggy.
- `r` > 0 makes the system react to the *target's velocity*, not just its position — this
  is what produces "anticipation" (e.g. a floating object that leans into the direction
  the cursor is moving, not just trailing behind its position).
- Apply this independently per-axis, and independently for position vs. rotation vs.
  scale — don't reuse one instance for multiple unrelated signals, since each carries its
  own internal velocity state.

## Idle drift via Brownian / fractal noise motion

A second-order filter only produces motion in response to an input changing. Anything
that should keep moving even when the user is doing nothing (a floating hero prop, ambient
background particles) needs its own continuous driver — sampling smooth noise over time
is the standard approach (an approximation of Brownian motion / fractional Brownian
motion, "FBM").

```js
import { createNoise3D } from "simplex-noise"; // any 3D simplex/Perlin implementation works

class BrownianMotion {
  constructor(seed = Math.random() * 1000, octaves = 3, persistence = 0.5) {
    this.noise = createNoise3D(() => seed); // seeded so multiple instances don't sync up
    this.octaves = octaves;
    this.persistence = persistence;
    this.seed = seed;
  }

  // returns a value roughly in [-1, 1], smoothly varying with t
  sample(t, axisOffset = 0) {
    let value = 0, amplitude = 1, frequency = 1, max = 0;
    for (let o = 0; o < this.octaves; o++) {
      value += this.noise(t * frequency, this.seed + axisOffset, o) * amplitude;
      max += amplitude;
      amplitude *= this.persistence;
      frequency *= 2;
    }
    return value / max;
  }
}

// Usage: idle drift for a floating object, one BrownianMotion instance per axis
const driftX = new BrownianMotion(11);
const driftY = new BrownianMotion(47);
const driftZ = new BrownianMotion(83);

function update(t) {
  prop.position.x = basePosition.x + driftX.sample(t * 0.15) * 0.3;
  prop.position.y = basePosition.y + driftY.sample(t * 0.15) * 0.3;
  prop.rotation.z = driftZ.sample(t * 0.1) * 0.05;
}
```

Key details that make this read as "alive" rather than "wobbly":
- **Multiple octaves** (sum of noise at increasing frequency, decreasing amplitude) avoid
  the single-sine-wave look of naive `sin(t)` drift.
- **Per-object seed offset** so a group of floating objects don't move in visible
  lock-step — each needs its own seed, not just a phase offset on a shared function.
- **Different time-scale per property** (position drifting slower than rotation, or vice
  versa) reads as more organic than driving everything from the same `t`.
- Keep the amplitude small relative to the object's size — idle drift should be felt, not
  obviously "animated."

## Combining both: physics-driven floating props

The two techniques above compose well as a small per-object data spec, so a whole hero
scene of floating elements can share one generic component instead of bespoke code per
object:

```js
// one entry per floating prop — purely data, reusable component reads it
const propConfigs = [
  {
    id: "card-a", restPosition: [1.2, 0.4, 0],
    damping: 0.6, translationForce: 0.4, rotationForce: 0.2,
    oscillationStiffness: 2.0, oscillationDamping: 0.5,
  },
  {
    id: "card-b", restPosition: [-0.8, -0.3, 0.4],
    damping: 0.8, translationForce: 0.25, rotationForce: 0.35,
    oscillationStiffness: 1.4, oscillationDamping: 0.6,
  },
];
```

Each prop gets: (a) a `SecondOrderDynamics` instance per axis fed by pointer
proximity/velocity (using `translationForce`/`rotationForce`/`damping` to set `f`/`z`),
and (b) a `BrownianMotion` instance for idle drift (using `oscillationStiffness`/
`oscillationDamping` to set frequency/amplitude) — added together each frame on top of
`restPosition`. The result: a single `FloatingProp` class, driven entirely by per-object
config, that handles both "reacts to the user" and "alive at rest" without special-casing
any individual object.

## Shared easing library

Keep one module of named easing curves (beyond the CSS-standard `ease-in-out` set) used
everywhere transitions/hovers/scroll-snaps need a curve — e.g. `easeOutExpo`,
`easeInOutBack`, a custom brand curve or two. The point isn't the specific curve math
(these are standard, publicly documented formulas — e.g. Robert Penner's easing
equations) — it's discipline: one shared `Ease` module that the whole codebase imports,
so the site's motion feel is consistent and changeable in one place, instead of magic
cubic-bezier strings scattered across dozens of CSS/JS call sites.

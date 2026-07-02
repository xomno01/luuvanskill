# NumPy + Pillow — Vectorized Patterns

Tất cả patterns dùng `np.meshgrid` → compute toàn bộ mảng cùng lúc → `Image.fromarray`.
**68x nhanh hơn putpixel loop.** Benchmark: 512×512 trong 3ms.

## Boilerplate

```python
import numpy as np
from PIL import Image

def make(height, width, fn):
    """fn(xx, yy) nhận meshgrid → trả (r, g, b) array uint8."""
    xs = np.arange(width); ys = np.arange(height)
    xx, yy = np.meshgrid(xs, ys)
    r, g, b = fn(xx, yy)
    arr = np.stack([r.astype(np.uint8), g.astype(np.uint8), b.astype(np.uint8)], axis=2)
    return Image.fromarray(arr, "RGB")

def u8(arr):
    """Clip và convert sang uint8."""
    return np.clip(arr, 0, 255).astype(np.uint8)
```

## Patterns cơ bản

```python
W, H = 512, 512

# 1. Linear gradient ngang
def grad_h(xx, yy): t=xx/(W-1); return u8(255*(1-t)), np.zeros((H,W),np.uint8), u8(255*t)
make(H,W,grad_h).save("grad_horizontal.png")

# 2. Radial gradient
def radial(xx, yy):
    cx,cy = W//2,H//2
    t = np.clip(np.sqrt((xx-cx)**2+(yy-cy)**2)/(W//2), 0, 1)
    return u8(255*(1-t)), u8(128*(1-t*t)), u8(255*t)
make(H,W,radial).save("radial.png")

# 3. Checkerboard
def checker(xx, yy, sz=32):
    c = ((xx//sz + yy//sz) % 2 == 0)
    v = np.where(c, 255, 30).astype(np.uint8)
    return v, v, v
make(H,W,checker).save("checker.png")

# 4. Sine wave pattern (plasma-like)
def plasma(xx, yy):
    v = (np.sin(xx/20) + np.sin(yy/20) + np.sin((xx+yy)/28)) / 3
    r = u8(127+127*np.sin(np.pi*v))
    g = u8(127+127*np.sin(np.pi*v + 2*np.pi/3))
    b = u8(127+127*np.sin(np.pi*v + 4*np.pi/3))
    return r, g, b
make(H,W,plasma).save("plasma.png")

# 5. Concentric rings (neon)
def rings(xx, yy):
    cx,cy = W//2,H//2
    d = np.sqrt((xx-cx)**2+(yy-cy)**2)
    v = (np.sin(d/15)+1)/2
    return u8(255*v), u8(100*v), u8(200*(1-v))
make(H,W,rings).save("rings.png")

# 6. Diagonal stripes
def stripes(xx, yy, freq=20):
    v = ((xx+yy) // freq % 2 == 0)
    r = np.where(v, 255, 13).astype(np.uint8)
    g = np.where(v, 100, 17).astype(np.uint8)
    b = np.where(v, 50, 23).astype(np.uint8)
    return r, g, b
make(H,W,stripes).save("stripes.png")

# 7. Twirl / spiral
def spiral(xx, yy):
    cx,cy = W//2,H//2
    angle = np.arctan2(yy-cy, xx-cx)
    dist  = np.sqrt((xx-cx)**2+(yy-cy)**2)
    v = (np.sin(angle*6 + dist/15)+1)/2
    return u8(255*v), u8(128*v), u8(200*(1-v))
make(H,W,spiral).save("spiral.png")

# 8. Mandelbrot set (nhỏ, chậm hơn với pure numpy nhưng vẫn OK)
def mandelbrot(H=256, W=256, max_iter=50):
    x = np.linspace(-2.5, 1.0, W)
    y = np.linspace(-1.25, 1.25, H)
    C = x[np.newaxis,:] + 1j*y[:,np.newaxis]
    Z = np.zeros_like(C)
    iters = np.zeros(C.shape, dtype=int)
    for i in range(max_iter):
        mask = np.abs(Z) <= 2
        Z[mask] = Z[mask]**2 + C[mask]
        iters[mask] += 1
    t = iters / max_iter
    r = u8(9*(1-t)**1 * t**3 * 255 * 4)
    g = u8(15*(1-t)**2 * t**2 * 255 * 4)
    b = u8(8.5*(1-t)**3 * t**1 * 255 * 4)
    return Image.fromarray(np.stack([r,g,b], axis=2), "RGB")

mandelbrot().save("mandelbrot.png")
```

## Value Noise / Procedural Texture

```python
import numpy as np
from PIL import Image
import random

def value_noise(W=512, H=512, scale=64, octaves=4, seed=42):
    """
    Layered value noise (Perlin-like appearance, pure NumPy).
    scale: kích thước ô cơ bản; octaves: số lớp chi tiết.
    """
    random.seed(seed)
    rng = np.random.default_rng(seed)
    total = np.zeros((H, W))
    amp, freq, norm = 1.0, 1, 0.0

    for _ in range(octaves):
        sc = max(1, scale // freq)
        gw = W // sc + 2
        gh = H // sc + 2
        grid = rng.random((gh, gw))

        # Bilinear interpolation (vectorized)
        xi = np.arange(W) / sc
        yi = np.arange(H) / sc
        ix = xi.astype(int); iy = yi.astype(int)
        tx = xi - ix;          ty = yi - iy
        # Smoothstep
        tx = tx*tx*(3-2*tx);   ty = ty*ty*(3-2*ty)

        # Sample 4 corners
        ix_g = np.clip(ix, 0, gw-2); iy_g = np.clip(iy, 0, gh-2)
        xx, yy = np.meshgrid(ix_g, iy_g)
        txm, tym = np.meshgrid(tx, ty)
        v00 = grid[yy,   xx]
        v10 = grid[yy,   xx+1]
        v01 = grid[yy+1, xx]
        v11 = grid[yy+1, xx+1]
        v = v00*(1-txm)*(1-tym) + v10*txm*(1-tym) + v01*(1-txm)*tym + v11*txm*tym

        total += v * amp
        norm  += amp
        amp   *= 0.5; freq *= 2

    total /= norm
    return total  # float [0, 1]

# Grayscale noise
noise = value_noise(512, 512, scale=64, octaves=5)
gray = (noise * 255).astype(np.uint8)
Image.fromarray(np.stack([gray,gray,gray], axis=2), "RGB").save("noise_gray.png")

# Colored noise (terrain-like)
noise = value_noise(512, 512, scale=80, octaves=6)
r = np.where(noise < 0.4, 30, np.where(noise < 0.6, 60, np.where(noise < 0.8, 120, 180))).astype(np.uint8)
g = np.where(noise < 0.4, 80, np.where(noise < 0.6, 130, np.where(noise < 0.8, 100, 200))).astype(np.uint8)
b = np.where(noise < 0.4, 160, np.where(noise < 0.6, 50, np.where(noise < 0.8, 40, 240))).astype(np.uint8)
Image.fromarray(np.stack([r,g,b], axis=2), "RGB").save("terrain.png")
```

## Voronoi / Cell pattern

```python
import numpy as np
from PIL import Image
import random

def voronoi(W=512, H=512, n_cells=30, seed=42):
    random.seed(seed)
    rng = np.random.default_rng(seed)
    seeds_x = rng.integers(0, W, n_cells)
    seeds_y = rng.integers(0, H, n_cells)
    colors  = rng.integers(50, 230, (n_cells, 3))

    xs = np.arange(W); ys = np.arange(H)
    xx, yy = np.meshgrid(xs, ys)  # (H,W)

    # Compute min-distance cell for each pixel (vectorized)
    dist_min = np.full((H,W), np.inf)
    owner    = np.zeros((H,W), dtype=int)

    for i, (sx, sy) in enumerate(zip(seeds_x, seeds_y)):
        d = (xx-sx)**2 + (yy-sy)**2
        mask = d < dist_min
        dist_min[mask] = d[mask]
        owner[mask] = i

    r = colors[owner, 0].astype(np.uint8)
    g = colors[owner, 1].astype(np.uint8)
    b = colors[owner, 2].astype(np.uint8)
    return Image.fromarray(np.stack([r,g,b], axis=2), "RGB")

voronoi().save("voronoi.png")
```

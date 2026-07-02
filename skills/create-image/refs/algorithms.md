# Drawing Algorithms — Pure Python

Các thuật toán vẽ từ pixels, không cần library.
Thường kết hợp với Pillow: dùng `img.putpixel()` hoặc `img.putdata()` làm backend.

## Setup: pixel canvas với Pillow backend

```python
from PIL import Image

class PixelCanvas:
    """Canvas pixel-level với Pillow backend. Dùng cho thuật toán custom."""

    def __init__(self, width, height, bg=(13,17,23)):
        self.w, self.h = width, height
        self.img = Image.new("RGB", (width, height), bg)
        self._pixels = list(self.img.getdata())

    def set(self, x, y, color):
        if 0 <= x < self.w and 0 <= y < self.h:
            self._pixels[y*self.w + x] = color

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self._pixels[y*self.w + x]
        return None

    def flush(self):
        """Đẩy pixel buffer về Image."""
        self.img.putdata(self._pixels)

    def save(self, path):
        self.flush()
        self.img.save(path)
        print(f"Saved: {path} ({self.w}x{self.h})")
```

## Bresenham Line Algorithm

```python
def draw_line(canvas, x0, y0, x1, y1, color):
    """Integer-only line. Không alias (jagged nhưng rất nhanh)."""
    dx, dy = abs(x1-x0), abs(y1-y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        canvas.set(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy: err -= dy; x0 += sx
        if e2 <  dx: err += dx; y0 += sy

# Usage:
# c = PixelCanvas(256, 256)
# draw_line(c, 0, 0, 255, 200, (255, 100, 50))
```

## Midpoint Circle Algorithm

```python
def draw_circle(canvas, cx, cy, r, color, filled=False):
    """8-fold symmetry — O(r). filled=True để tô."""
    def plot8(x, y):
        if filled:
            # Tô hàng ngang giữa 2 điểm đối xứng
            for px in range(cx-x, cx+x+1): canvas.set(px, cy+y, color)
            for px in range(cx-x, cx+x+1): canvas.set(px, cy-y, color)
            for px in range(cx-y, cx+y+1): canvas.set(px, cy+x, color)
            for px in range(cx-y, cx+y+1): canvas.set(px, cy-x, color)
        else:
            for px, py in [(cx+x,cy+y),(cx-x,cy+y),(cx+x,cy-y),(cx-x,cy-y),
                           (cx+y,cy+x),(cx-y,cy+x),(cx+y,cy-x),(cx-y,cy-x)]:
                canvas.set(px, py, color)

    x, y, d = 0, r, 1 - r
    plot8(x, y)
    while x < y:
        x += 1
        d = d + 2*x + 1 if d < 0 else d + 2*(x-y) + 1
        if d >= 0: y -= 1
        plot8(x, y)
```

## Flood Fill (iterative — tránh Python recursion limit)

```python
def flood_fill(canvas, x, y, new_color):
    """
    Fill vùng liên thông từ (x,y) bằng new_color.
    QUAN TRỌNG: dùng iterative stack, KHÔNG dùng recursive
    vì Python default recursion limit là 1000.
    """
    old_color = canvas.get(x, y)
    if old_color is None or old_color == new_color:
        return
    stack = [(x, y)]
    visited = set()
    while stack:
        cx, cy = stack.pop()
        if (cx, cy) in visited: continue
        if canvas.get(cx, cy) != old_color: continue
        canvas.set(cx, cy, new_color)
        visited.add((cx, cy))
        for nx, ny in [(cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)]:
            if (nx,ny) not in visited:
                stack.append((nx, ny))
```

## Floyd-Steinberg Dithering

```python
def dither_floyd_steinberg(canvas, palette=((0,0,0),(255,255,255))):
    """
    Áp dụng Floyd-Steinberg dithering để reduce color depth.
    palette: list of RGB tuples (màu được phép dùng).
    """
    import math

    def nearest(color):
        return min(palette, key=lambda p: sum((a-b)**2 for a,b in zip(p, color)))

    w, h = canvas.w, canvas.h
    # Copy pixel buffer sang float để tích lũy error
    buf = [[list(canvas.get(x, y) or (0,0,0)) for x in range(w)] for y in range(h)]

    for y in range(h):
        for x in range(w):
            old = buf[y][x]
            new = list(nearest(tuple(int(v) for v in old)))
            buf[y][x] = new
            err = [old[c] - new[c] for c in range(3)]
            # Phân phối error sang 4 pixel lân cận
            def add_err(dx, dy, frac):
                nx, ny = x+dx, y+dy
                if 0 <= nx < w and 0 <= ny < h:
                    for c in range(3):
                        buf[ny][nx][c] = max(0, min(255, buf[ny][nx][c] + err[c]*frac))
            add_err(1, 0,  7/16)
            add_err(-1, 1, 3/16)
            add_err(0, 1,  5/16)
            add_err(1, 1,  1/16)

    # Ghi lại vào canvas
    for y in range(h):
        for x in range(w):
            canvas.set(x, y, tuple(int(v) for v in buf[y][x]))
```

## Bezier Curves

```python
def bezier_quad(canvas, p0, p1, p2, color, steps=100):
    """Quadratic Bezier qua 3 điểm control."""
    def lerp(a, b, t): return (a[0]*(1-t)+b[0]*t, a[1]*(1-t)+b[1]*t)
    prev = None
    for i in range(steps+1):
        t = i/steps
        q0 = lerp(p0, p1, t)
        q1 = lerp(p1, p2, t)
        pt = lerp(q0, q1, t)
        ix, iy = int(pt[0]), int(pt[1])
        if prev:
            draw_line(canvas, prev[0], prev[1], ix, iy, color)
        canvas.set(ix, iy, color)
        prev = (ix, iy)

def bezier_cubic(canvas, p0, p1, p2, p3, color, steps=200):
    """Cubic Bezier qua 4 điểm control."""
    def lerp(a, b, t): return (a[0]*(1-t)+b[0]*t, a[1]*(1-t)+b[1]*t)
    prev = None
    for i in range(steps+1):
        t = i/steps
        q0 = lerp(p0, p1, t); q1 = lerp(p1, p2, t); q2 = lerp(p2, p3, t)
        r0 = lerp(q0, q1, t); r1 = lerp(q1, q2, t)
        pt = lerp(r0, r1, t)
        ix, iy = int(pt[0]), int(pt[1])
        if prev:
            draw_line(canvas, prev[0], prev[1], ix, iy, color)
        prev = (ix, iy)
```

## Pixel Art Scale (nearest-neighbor upscale)

```python
def scale_pixel_art(src_img, scale=4):
    """Upscale pixel art không bị blur — nearest-neighbor."""
    from PIL import Image
    w, h = src_img.size
    return src_img.resize((w*scale, h*scale), Image.NEAREST)

# Usage: tạo 32x32 pixel art rồi scale lên 256x256
# img_small = Image.new("RGB", (32,32), (0,0,0))
# ... vẽ pixel art ...
# img_big = scale_pixel_art(img_small, scale=8)
# img_big.save("pixelart.png")
```

## Complete example: Pixel art scene

```python
from PIL import Image

def pixel_art_landscape(output="landscape.png"):
    W, H = 64, 48    # nhỏ — scale lên sau
    img = Image.new("RGB", (W, H), (20, 24, 82))  # đêm xanh đậm

    # Hàm vẽ nhanh
    def rect(x1,y1,x2,y2,c):
        for y in range(y1,y2+1):
            for x in range(x1,x2+1):
                if 0<=x<W and 0<=y<H: img.putpixel((x,y),c)

    # Trăng
    for dy in range(-5,6):
        for dx in range(-5,6):
            if dx*dx+dy*dy<=25: img.putpixel((50+dx,10+dy),(255,250,200))

    # Núi sau
    for x in range(W):
        h_mountain = max(0, 20 - abs(x-32)*0.5 - abs(x-10)*0.3)
        for y in range(H-int(h_mountain), H): img.putpixel((x,y),(30,40,60))

    # Đất
    rect(0, 36, W-1, H-1, (20,80,30))
    rect(0, 40, W-1, H-1, (15,60,20))

    # Cây
    def tree(x, y):
        rect(x,y,x+1,y+6,(80,60,30))     # thân
        for dy in range(-6,1):
            w2 = max(0, 5-abs(dy+2))
            rect(x-w2,y+dy,x+w2+1,y+dy,(30,120,40))

    tree(10,28); tree(25,30); tree(45,27)

    # Stars
    import random; random.seed(42)
    for _ in range(30):
        sx,sy = random.randint(0,W-1), random.randint(0,15)
        img.putpixel((sx,sy),(255,255,200))

    # Scale lên 6x (384x288) nearest-neighbor
    big = img.resize((W*6,H*6), Image.NEAREST)
    big.save(output)
    print(f"Saved: {output} ({W*6}x{H*6})")

pixel_art_landscape()
```

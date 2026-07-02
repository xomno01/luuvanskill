# PPM & BMP — Zero-Dependency Fallback

Dùng khi Pillow **không có** trong môi trường. Chỉ cần Python stdlib.

## PPM P3 (text format — dễ nhất)

```
Header:
  P3              ← magic number (RGB text)
  {width} {height}
  255             ← max value
Body:
  r g b r g b ... (space/newline separated, row by row, top-down)
```

```python
def write_ppm(filename, width, height, pixel_fn):
    """
    pixel_fn(x, y) -> (r, g, b), mỗi giá trị 0-255.
    Format P3: text, human-readable, không nén.
    Mở được bằng: GIMP, IrfanView, Paint.NET, browser cũ.
    """
    lines = [f"P3\n{width} {height}\n255"]
    for y in range(height):
        row_parts = []
        for x in range(width):
            r, g, b = pixel_fn(x, y)
            row_parts.append(f"{r} {g} {b}")
        lines.append(" ".join(row_parts))
    with open(filename, "w") as f:
        f.write("\n".join(lines))
    print(f"Saved: {filename} ({width}x{height})")

# Usage examples:
write_ppm("gradient.ppm", 256, 256, lambda x, y: (x, y, 128))
write_ppm("red_circle.ppm", 200, 200,
    lambda x, y: (200, 50, 50) if (x-100)**2+(y-100)**2 < 80**2 else (20, 20, 30))
```

## PPM P6 (binary — nhanh hơn ~5x, file nhỏ hơn)

```python
def write_ppm_binary(filename, width, height, pixel_fn):
    """P6: binary RGB, smaller và nhanh hơn P3."""
    with open(filename, "wb") as f:
        f.write(f"P6\n{width} {height}\n255\n".encode())
        for y in range(height):
            row = bytearray()
            for x in range(width):
                r, g, b = pixel_fn(x, y)
                row.extend([r & 0xFF, g & 0xFF, b & 0xFF])
            f.write(row)
    print(f"Saved: {filename} (binary P6, {width}x{height})")
```

## BMP binary (struct — mở được trực tiếp bằng Windows)

**Gotchas quan trọng:**
- Pixel order: **BGR** (không phải RGB)
- Row direction: **bottom-up** (row cuối ảnh viết đầu tiên)
- Row padding: **mỗi row phải là bội số 4 bytes** — `(width*3 + 3) & ~3`

```python
import struct

def write_bmp(filename, width, height, pixel_fn):
    """
    pixel_fn(x, y) -> (r, g, b).
    BMP 24-bit không nén — Windows có thể mở ngay.
    """
    row_size    = (width * 3 + 3) & ~3          # pad to multiple of 4
    pixel_data  = row_size * height
    file_size   = 54 + pixel_data

    with open(filename, "wb") as f:
        # --- File Header (14 bytes) ---
        f.write(b"BM")                               # signature
        f.write(struct.pack("<I", file_size))         # file size
        f.write(struct.pack("<HH", 0, 0))             # reserved
        f.write(struct.pack("<I", 54))                # pixel data offset

        # --- DIB Header BITMAPINFOHEADER (40 bytes) ---
        f.write(struct.pack("<I", 40))                # header size
        f.write(struct.pack("<i", width))             # width
        f.write(struct.pack("<i", height))            # height (positive = bottom-up)
        f.write(struct.pack("<H", 1))                 # color planes
        f.write(struct.pack("<H", 24))                # bits per pixel (24-bit RGB)
        f.write(struct.pack("<I", 0))                 # compression (none)
        f.write(struct.pack("<I", pixel_data))        # image data size
        f.write(struct.pack("<ii", 2835, 2835))       # ~72 DPI
        f.write(struct.pack("<II", 0, 0))             # colors in table (0=all)

        # --- Pixel Array ---
        padding = b"\x00" * (row_size - width * 3)
        for y in range(height - 1, -1, -1):           # bottom-up!
            for x in range(width):
                r, g, b = pixel_fn(x, y)
                f.write(struct.pack("BBB", b, g, r))  # BGR order!
            f.write(padding)

    print(f"Saved: {filename} (BMP 24-bit, {width}x{height})")

# Usage:
write_bmp("gradient.bmp", 256, 256, lambda x, y: (x, y, 128))
```

## Precomputed pixel array (nhanh hơn khi có sẵn data)

```python
def write_ppm_from_array(filename, width, height, pixels):
    """
    pixels: list/tuple phẳng length=width*height, mỗi phần tử là (r,g,b).
    Nhanh hơn pixel_fn version vì không có function call overhead.
    """
    lines = [f"P3\n{width} {height}\n255"]
    for i in range(height):
        row = pixels[i*width:(i+1)*width]
        lines.append(" ".join(f"{r} {g} {b}" for r,g,b in row))
    with open(filename, "w") as f:
        f.write("\n".join(lines))

# Tạo gradient array trước rồi write
pixels = [(x % 256, y % 256, 128) for y in range(256) for x in range(256)]
write_ppm_from_array("grad.ppm", 256, 256, pixels)
```

## Đọc PPM (parse lại để verify)

```python
def read_ppm(filename):
    """Đọc file PPM P3, trả về (width, height, pixels list)."""
    with open(filename) as f:
        lines = f.read().split()
    assert lines[0] == "P3", "Chỉ hỗ trợ P3"
    w, h = int(lines[1]), int(lines[2])
    # lines[3] == "255" (max val)
    data = [int(v) for v in lines[4:]]
    pixels = [(data[i], data[i+1], data[i+2]) for i in range(0, len(data), 3)]
    return w, h, pixels
```

## Convert PPM → PNG (khi có Pillow)

```python
# Nếu sau này có Pillow, convert sang PNG nhanh hơn
from PIL import Image
img = Image.open("output.ppm")   # Pillow đọc được PPM
img.save("output.png")
```

# Pillow 10.1.0 — ImageDraw Reference

## Canvas creation

```python
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Tạo canvas mới
img = Image.new("RGB", (width, height), background_color)
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))  # transparent

# Load ảnh có sẵn để edit
img = Image.open("existing.png")
img = img.copy()  # tránh modify original

d = ImageDraw.Draw(img)
```

## Tất cả primitives (Pillow 10.1.0, đã verify)

```python
# Line
d.line([(x1,y1),(x2,y2),(x3,y3)], fill=color, width=2)

# Rectangle
d.rectangle([x1, y1, x2, y2], fill=fill, outline=outline, width=2)
d.rounded_rectangle([x1,y1,x2,y2], radius=16, fill=fill, outline=outline, width=2)

# Ellipse / Circle
d.ellipse([x1, y1, x2, y2], fill=fill, outline=outline, width=2)
# Circle với radius r, center (cx, cy):
d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=fill)

# Arc (phần viền ellipse)
d.arc([x1,y1,x2,y2], start=0, end=270, fill=color, width=3)

# Pie slice (hình quạt)
d.pieslice([x1,y1,x2,y2], start=45, end=270, fill=fill, outline=outline)

# Polygon
d.polygon([(x1,y1),(x2,y2),(x3,y3)], fill=fill, outline=outline)

# Single point
d.point((x, y), fill=color)

# Text (bitmap font, rất nhỏ - chỉ dùng cho debug label)
d.text((x, y), "text", fill=color)

# Text với TTF font (nếu file tồn tại)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 32)
    d.text((x, y), "text", fill=color, font=font)
except (IOError, OSError):
    # Fallback: bitmap font
    d.text((x, y), "text", fill=color)

# Text centered
bbox = d.textbbox((0,0), "text", font=font)
tw = bbox[2]-bbox[0]; th = bbox[3]-bbox[1]
d.text(((W-tw)//2, (H-th)//2), "text", fill=color, font=font)
```

## Pixel manipulation

```python
# Đọc pixel
r, g, b = img.getpixel((x, y))

# Ghi pixel (chậm - chỉ dùng cho ít pixel)
img.putpixel((x, y), (r, g, b))

# Ghi nhiều pixel cùng lúc (nhanh hơn 5x)
pixels = [(r, g, b)] * (width * height)  # flat list, row by row
img.putdata(pixels)
```

## Filters (post-processing)

```python
from PIL import ImageFilter

img = img.filter(ImageFilter.BLUR)
img = img.filter(ImageFilter.GaussianBlur(radius=5))
img = img.filter(ImageFilter.SHARPEN)
img = img.filter(ImageFilter.EDGE_ENHANCE)
img = img.filter(ImageFilter.SMOOTH)
img = img.filter(ImageFilter.CONTOUR)
img = img.filter(ImageFilter.EMBOSS)
```

## Composite / Overlay

```python
from PIL import Image

# Paste ảnh lên canvas (no alpha)
canvas.paste(src_img, (x, y))

# Paste với alpha mask
canvas.paste(src_img, (x, y), mask=src_img)  # src_img phải là RGBA

# Blend 2 ảnh
result = Image.blend(img1, img2, alpha=0.5)  # 0=img1, 1=img2

# Alpha composite (RGBA)
canvas = canvas.convert("RGBA")
layer = layer.convert("RGBA")
canvas = Image.alpha_composite(canvas, layer)
```

## Resize / Transform

```python
img_resized = img.resize((new_w, new_h), Image.LANCZOS)  # high quality
img_thumb = img.copy(); img_thumb.thumbnail((256, 256), Image.LANCZOS)
img_rotated = img.rotate(45, expand=True, fillcolor=(0,0,0))
img_flipped = img.transpose(Image.FLIP_LEFT_RIGHT)
img_cropped = img.crop((x1, y1, x2, y2))
```

## Save formats

```python
img.save("output.png")                     # lossless
img.save("output.jpg", quality=90)        # lossy, 0-95
img.save("output.webp")                   # modern, small
img.save("output.bmp")                    # uncompressed

# Animated GIF
frames[0].save("anim.gif", save_all=True, append_images=frames[1:],
               loop=0, duration=100)  # duration in ms per frame
```

## Complete example: Dark UI diagram

```python
from PIL import Image, ImageDraw
import colorsys

def dark_ui_diagram(output="ui_diagram.png"):
    W, H = 600, 400
    img = Image.new("RGB", (W, H), (13, 17, 23))
    d = ImageDraw.Draw(img)

    # Background panel
    d.rounded_rectangle([20,20,W-20,H-20], radius=12,
                         fill=(22, 27, 34), outline=(48, 54, 61), width=1)

    # Header bar
    d.rectangle([20,20,W-20,60], fill=(33, 38, 45))
    d.ellipse([35,33,55,53], fill=(255,95,87))   # red dot
    d.ellipse([65,33,85,53], fill=(255,189,46))  # yellow dot
    d.ellipse([95,33,115,53], fill=(40,200,64))  # green dot

    # Content cards
    for i, (label, col) in enumerate([
        ("API", "#388bfd"), ("DB", "#56d364"), ("Cache", "#e3b341")
    ]):
        x = 40 + i*185
        d.rounded_rectangle([x, 80, x+160, 200], radius=8,
                             fill=(30, 35, 43), outline=col, width=2)
        r,g,b = tuple(int(col.lstrip('#')[i:i+2],16) for i in (0,2,4))
        d.ellipse([x+60,95,x+100,135], fill=(r,g,b,180))
        d.text((x+70, 150), label, fill="white")

    # Flow arrows
    for i in range(2):
        sx = 200 + i*185; sy = 140
        d.line([(sx,sy),(sx+25,sy)], fill="#8b949e", width=2)
        d.polygon([(sx+25,sy-5),(sx+35,sy),(sx+25,sy+5)], fill="#8b949e")

    # Stats bar
    colors = ["#58a6ff","#56d364","#e3b341","#f85149"]
    total = W-80; x_start = 40
    widths = [int(total*p) for p in [0.45, 0.25, 0.20, 0.10]]
    for i, (cw, c) in enumerate(zip(widths, colors)):
        d.rectangle([x_start, 230, x_start+cw, 258], fill=c)
        x_start += cw

    # Legend
    labels = ["Read (45%)", "Write (25%)", "Cache (20%)", "Error (10%)"]
    for i, (c, lbl) in enumerate(zip(colors, labels)):
        lx = 40 + i*140
        d.rectangle([lx, 275, lx+16, 291], fill=c)
        d.text((lx+20, 275), lbl, fill="#8b949e")

    img.save(output)
    print(f"OK: {output} ({W}x{H})")

dark_ui_diagram()
```

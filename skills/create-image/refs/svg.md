# SVG Generation — Pure Python String

SVG là XML text file — không cần library, mở được trong browser và Inkscape.
Ưu điểm: scalable (không vỡ khi zoom), file nhỏ (552B cho 5 shapes), hỗ trợ animation.

## SVGCanvas class (production-ready)

```python
class SVGCanvas:
    """Zero-deps SVG builder. Output là file text."""

    def __init__(self, width, height, bg=None, viewBox=None):
        self.w, self.h = width, height
        self.vb = viewBox or f"0 0 {width} {height}"
        self._defs = []
        self._shapes = []
        if bg:
            self._shapes.append(f'<rect width="{width}" height="{height}" fill="{bg}"/>')

    # --- Shapes ---
    def rect(self, x, y, w, h, fill="blue", stroke="none", sw=1, rx=0, ry=0, opacity=1, **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{ry}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}" {extra}/>'
        )

    def circle(self, cx, cy, r, fill="red", stroke="none", sw=1, opacity=1, **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" '
                            f'stroke="{stroke}" stroke-width="{sw}" opacity="{opacity}" {extra}/>')

    def ellipse(self, cx, cy, rx, ry, fill="red", stroke="none", sw=1, **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" '
                            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def line(self, x1, y1, x2, y2, stroke="black", sw=1, **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                            f'stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def polyline(self, points, stroke="black", sw=1, fill="none"):
        pts = " ".join(f"{x},{y}" for x,y in points)
        self._shapes.append(f'<polyline points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def polygon(self, points, fill="green", stroke="none", sw=1, opacity=1):
        pts = " ".join(f"{x},{y}" for x,y in points)
        self._shapes.append(f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" '
                            f'stroke-width="{sw}" opacity="{opacity}"/>')

    def path(self, d, fill="none", stroke="black", sw=1, opacity=1, **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" '
                            f'stroke-width="{sw}" opacity="{opacity}" {extra}/>')

    def text(self, x, y, content, fill="black", size=14, anchor="start",
             weight="normal", family="sans-serif", **kw):
        extra = " ".join(f'{k}="{v}"' for k,v in kw.items())
        self._shapes.append(
            f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" font-weight="{weight}" font-family="{family}" {extra}>'
            f'{content}</text>'
        )

    # --- Defs (gradients, filters) ---
    def linear_gradient(self, id, stops, x1="0%", y1="0%", x2="100%", y2="0%"):
        """stops: list of (offset_pct, color, opacity)"""
        stop_tags = "\n    ".join(
            f'<stop offset="{o}%" stop-color="{c}" stop-opacity="{a}"/>'
            for o,c,a in stops
        )
        self._defs.append(
            f'<linearGradient id="{id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">\n'
            f'    {stop_tags}\n  </linearGradient>'
        )
        return f"url(#{id})"

    def radial_gradient(self, id, stops, cx="50%", cy="50%", r="50%"):
        stop_tags = "\n    ".join(
            f'<stop offset="{o}%" stop-color="{c}" stop-opacity="{a}"/>'
            for o,c,a in stops
        )
        self._defs.append(
            f'<radialGradient id="{id}" cx="{cx}" cy="{cy}" r="{r}">\n'
            f'    {stop_tags}\n  </radialGradient>'
        )
        return f"url(#{id})"

    def blur_filter(self, id, std=4):
        self._defs.append(
            f'<filter id="{id}"><feGaussianBlur in="SourceGraphic" stdDeviation="{std}"/></filter>'
        )
        return f"url(#{id})"

    def glow_filter(self, id, color="#58a6ff", std=8):
        self._defs.append(
            f'<filter id="{id}" x="-50%" y="-50%" width="200%" height="200%">'
            f'<feDropShadow dx="0" dy="0" stdDeviation="{std}" flood-color="{color}" flood-opacity="0.8"/>'
            f'</filter>'
        )
        return f"url(#{id})"

    # --- Group ---
    def group(self, fn, transform="", opacity=1):
        """Context manager pattern: fn nhận self và vẽ shapes; chúng được wrap trong <g>."""
        start = len(self._shapes)
        fn(self)
        children = self._shapes[start:]
        self._shapes = self._shapes[:start]
        inner = "\n    ".join(children)
        self._shapes.append(
            f'<g transform="{transform}" opacity="{opacity}">\n    {inner}\n  </g>'
        )

    # --- Save ---
    def save(self, filename):
        defs_block = ""
        if self._defs:
            defs_block = "  <defs>\n    " + "\n    ".join(self._defs) + "\n  </defs>\n"
        body = "\n  ".join(self._shapes)
        content = (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{self.w}" height="{self.h}" viewBox="{self.vb}" '
            f'xmlns="http://www.w3.org/2000/svg">\n'
            f'{defs_block}  {body}\n</svg>'
        )
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Saved: {filename}")
        return filename

    def __str__(self):
        """Trả về SVG string thay vì save."""
        defs_block = ""
        if self._defs:
            defs_block = "  <defs>\n    " + "\n    ".join(self._defs) + "\n  </defs>\n"
        body = "\n  ".join(self._shapes)
        return (
            f'<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg width="{self.w}" height="{self.h}" viewBox="{self.vb}" '
            f'xmlns="http://www.w3.org/2000/svg">\n'
            f'{defs_block}  {body}\n</svg>'
        )
```

## Ví dụ: Dark dashboard card

```python
svg = SVGCanvas(400, 280, bg="#0d1117")

# Glow filter
glow = svg.glow_filter("glow", "#58a6ff", std=10)

# Gradient cho bar chart
grad = svg.linear_gradient("bar_grad", [
    (0, "#388bfd", 1), (100, "#58a6ff", 0.6)
], x1="0%", y1="0%", x2="0%", y2="100%")

# Card background
svg.rect(10, 10, 380, 260, fill="#161b22", rx=12, stroke="#21262d", sw=1)

# Title
svg.text(30, 45, "Performance Dashboard", fill="#c9d1d9", size=18, weight="bold")
svg.text(30, 65, "Real-time metrics", fill="#8b949e", size=12)

# KPI circles
for i, (val, label, color) in enumerate([
    ("98%", "Uptime", "#56d364"),
    ("142ms", "Latency", "#e3b341"),
    ("2.4k", "RPS", "#58a6ff"),
]):
    cx = 60 + i*120
    svg.circle(cx, 130, 35, fill="none", stroke=color, sw=3)
    svg.text(cx, 134, val, fill=color, size=14, anchor="middle", weight="bold")
    svg.text(cx, 180, label, fill="#8b949e", size=11, anchor="middle")

# Bar chart
bars = [60, 85, 45, 90, 70, 55, 95]
for i, h in enumerate(bars):
    x = 30 + i*50; bh = int(h*0.9); y = 245-bh
    svg.rect(x, y, 35, bh, fill=grad, rx=3)
    svg.text(x+17, y-5, f"{h}", fill="#8b949e", size=9, anchor="middle")

svg.save("dashboard.svg")
```

## Ví dụ: Network diagram

```python
import math

def network_diagram(nodes, edges, output="network.svg"):
    """
    nodes: list of {id, label, x, y, color}
    edges: list of (id1, id2, label)
    """
    W, H = 600, 400
    svg = SVGCanvas(W, H, bg="#0d1117")
    node_map = {n["id"]: n for n in nodes}

    # Draw edges
    for (a, b, lbl) in edges:
        na, nb = node_map[a], node_map[b]
        svg.line(na["x"], na["y"], nb["x"], nb["y"], stroke="#30363d", sw=2)
        mx, my = (na["x"]+nb["x"])//2, (na["y"]+nb["y"])//2
        svg.text(mx, my-8, lbl, fill="#8b949e", size=10, anchor="middle")

    # Draw nodes
    for n in nodes:
        svg.circle(n["x"], n["y"], 30, fill=n["color"], stroke="#0d1117", sw=3,
                   filter=svg.glow_filter(f"glow_{n['id']}", n["color"], std=8))
        svg.text(n["x"], n["y"]+5, n["label"], fill="white", size=11,
                 anchor="middle", weight="bold")

    svg.save(output)

network_diagram(
    nodes=[
        {"id":"A","label":"Client","x":80, "y":200,"color":"#388bfd"},
        {"id":"B","label":"API","x":250,"y":120,"color":"#56d364"},
        {"id":"C","label":"DB", "x":450,"y":120,"color":"#e3b341"},
        {"id":"D","label":"Cache","x":250,"y":280,"color":"#f85149"},
        {"id":"E","label":"CDN", "x":450,"y":280,"color":"#d2a8ff"},
    ],
    edges=[
        ("A","B","HTTPS"),("B","C","SQL"),
        ("B","D","Redis"),("A","E","static"),
    ]
)
```

## SVG Path DSL — Cú pháp nhanh

```
M x y   — Move to (bắt đầu path)
L x y   — Line to
H x     — Horizontal line
V y     — Vertical line
C x1 y1 x2 y2 x y  — Cubic Bezier
Q x1 y1 x y        — Quadratic Bezier
A rx ry rot laf swf x y  — Arc
Z       — Close path
```

```python
# Rounded triangle
svg.path("M 100,50 L 200,200 L 0,200 Z",
         fill="#56d364", stroke="white", sw=2)

# Sine wave
import math
pts = [(i, 200 + 80*math.sin(i/30)) for i in range(0, 512, 2)]
d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x,y in pts)
svg.path(d, stroke="#58a6ff", sw=2, fill="none")

# Bezier curves (smooth arrow)
svg.path("M 50,150 C 150,50 250,250 350,150",
         stroke="#e94560", sw=3, fill="none")
```

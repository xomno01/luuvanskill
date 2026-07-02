# Prompt Engineering cho Web Images

Claude đóng vai **Prompt Engineer + Art Director** — chuyển mô tả thô của user thành
professional photography/digital art prompt chuẩn FLUX/SDXL.

## Cấu trúc prompt chuẩn

```
[Subject chi tiết] [Action/State], [Art style / Photography style],
[Lighting], [Camera / Angle], [Background / Setting],
[Color palette / Mood], [Quality tags]
```

**Quy tắc:**
- Viết bằng tiếng Anh
- Dùng dấu phẩy ngăn cách — KHÔNG dùng câu dài
- Đặt subject quan trọng lên đầu (FLUX đọc từ đầu)
- 2-4 quality tags là đủ — stack quá nhiều giảm hiệu quả
- FLUX.1 KHÔNG cần negative prompt (khác SDXL) — mô tả những gì muốn thay vì tránh

---

## Templates theo use case

### Hero Banner (1920×1080)

**Pattern:**
```
[Scene: rộng, hoành tráng], wide angle shot, [Lighting đẹp],
[Color palette phù hợp brand], editorial photography style,
professional, sharp focus, [Unique detail đặc trưng]
```

**Examples:**
```
# Tech/SaaS
modern tech office interior, glass walls, team collaborating with laptops, 
golden hour sunlight streaming through floor-to-ceiling windows, 
wide angle 24mm, soft warm tones, editorial photography, photorealistic

# E-commerce / Fashion
elegant fashion boutique interior with marble floors and curated displays,
soft ambient studio lighting, minimalist luxury aesthetic, wide shot,
white and gold palette, high-end commercial photography

# F&B / Restaurant
vibrant restaurant kitchen with professional chefs cooking during service,
dynamic motion blur on flames, warm tungsten lighting, wide angle,
editorial food photography, rich saturated colors, photorealistic

# Real estate
luxury modern villa exterior at twilight, swimming pool with reflection,
warm interior lights, blue hour sky gradient, wide angle architectural photography,
ultra sharp, commercial grade

# Education / E-learning
bright university library with students studying, natural daylight,
warm wood tones, wide shot, editorial photography, clean and inspiring
```

### OG Image / Social Share (1200×630)

**Pattern:** Clean, bold, mô tả rõ — cần readable khi thu nhỏ
```
[Bold subject centered], clean background [màu], 
[simple composition], commercial photography, no text, high contrast
```

**Examples:**
```
# Generic tech
abstract digital brain made of glowing blue circuits and neural networks,
dark navy background, centered, symmetric, clean composition,
3D render, Blender style, professional

# Product showcase
premium smartphone floating at slight angle, clean white background,
dramatic side lighting, soft drop shadow, product photography,
Apple-style minimalism, ultra sharp

# Finance/Business
golden coins and upward trending graph, dark professional background,
studio lighting, 3D render, clean and trustworthy aesthetic
```

### Card Image / Blog Feature (800×600, 1200×800)

**Pattern:** Subject rõ ràng, không quá nhiều chi tiết, readable when cropped
```
[Specific subject with detail], [flatlay OR portrait OR 3/4 view],
[Lighting clear], [Background simple or complementary],
professional photography, sharp focus
```

**Examples:**
```
# Food/F&B card
steaming specialty coffee latte art in ceramic cup on wooden table,
warm morning sunlight from window, shallow depth of field f/1.8,
cozy cafe atmosphere, food photography, earth tones

# Tech product card
open laptop with code editor on screen, minimalist desk setup,
soft side lighting, shallow depth of field, flat lay,
tech product photography, clean white background

# Health/Wellness card
fresh organic vegetables and fruits arranged as colorful flatlay,
white marble background, top view, bright natural lighting,
food styling, clean minimal aesthetic, Pantone colors
```

### Avatar / Profile Photo (400×400, 512×512)

**Pattern:** Portrait, centered, clean background
```
professional headshot of [description], [expression], 
studio lighting with softbox, clean [color] background,
sharp focus on face, corporate portrait photography
```

**Examples:**
```
# Business professional
professional headshot of confident East Asian woman in her 30s,
wearing navy business blazer, warm genuine smile, 
studio lighting with softbox, neutral gray background,
Sony A7III 85mm portrait, sharp and flattering

# Friendly brand mascot (illustrated style)
cute cartoon character of a friendly robot with round eyes,
clean white background, flat design illustration,
vibrant blue and yellow color scheme, app icon style

# Creative/Tech
young developer at laptop, casual smart attire, genuine smile,
natural window lighting, bokeh background, candid style,
Sony A7III portrait, warm tones
```

### Product Image (800×800, clean background)

**Pattern:** Product centered, background phù hợp, professional
```
[Product name and key features], [angle: front/3quarter/flat lay],
clean [white/light/dark] background, soft drop shadow,
professional product photography, studio lighting, ultra sharp,
commercial grade, [brand aesthetic: minimal/luxury/playful]
```

**Examples:**
```
# Software/App icon (dùng Pillow SVG thay vì AI!)

# Physical product
premium wireless headphones in matte black, 3/4 angle view,
floating on white background, dramatic studio lighting from above,
product photography, Dieter Rams minimalist aesthetic,
crisp shadow, commercial grade

# Food product
artisan sourdough bread loaf on rustic wooden board,
warm ambient lighting, shallow focus, food photography,
earthy tones, bakery lifestyle aesthetic

# Supplement / Beauty product
minimalist skincare serum bottle on smooth marble surface,
clean white background, soft side lighting, editorial beauty photography,
luxury brand aesthetic, ultra sharp detail
```

### Background / Texture (1920×1200)

**Pattern:** Abstract hoặc cảnh không có người, seamless hoặc atmospheric
```
[Abstract or scenic description], [tiling/seamless nếu cần],
[color palette cụ thể], [soft/bold?], no text no watermark
```

**Examples:**
```
# Abstract dark for tech site
abstract flowing dark navy and electric blue liquid waves,
dynamic motion, smooth gradient transitions, 4K wallpaper style,
no text, no people, professional

# Geometric pattern
seamless geometric pattern with hexagons and triangles,
minimal white on light gray, clean lines, subtle depth,
architectural design, vector art style

# Nature atmospheric
misty forest with rays of sunlight filtering through tall trees,
serene green atmosphere, shallow depth, dreamy bokeh,
professional nature photography, calm and inspiring

# Gradient abstract
smooth multi-color gradient from deep purple to coral pink to gold,
fluid art style, subtle texture, luxury brand aesthetic,
4K desktop wallpaper quality
```

---

## Style modifiers hay dùng

### Photography styles
```
editorial photography    — crisp, professional, magazine quality
commercial photography   — clean, product-focused, bright
documentary photography  — candid, authentic, real moment  
fashion photography      — stylized, dramatic lighting, model-centric
food photography         — warm, appetizing, styled
architectural photography — structured, symmetric, wide angle
```

### Camera & Lens
```
Shot on Canon 5D Mark IV, 85mm f/1.4   — portrait, bokeh background
Shot on Sony A7III, 24-70mm f/2.8      — versatile, sharp
Shot on Hasselblad, 80mm               — medium format, ultra detail
Shot on DJI Mavic 3, aerial view       — drone, wide perspective
Macro photography, 100mm               — extreme detail, insects/food
```

### Lighting
```
golden hour lighting                   — warm, dramatic, outdoor
blue hour / twilight                   — moody, architectural
soft natural window lighting           — clean, gentle
studio lighting with softbox           — professional portrait
dramatic side lighting                 — product, high contrast
flat lay with even overhead lighting   — catalog, product
```

### Quality tags (dùng 2-3 là đủ)
```
photorealistic           professional photography    sharp focus
ultra sharp detail       commercial grade            editorial quality
high resolution          8K                          cinematic
```

---

## Tìm thêm reference trên internet khi thiếu

Khi không chắc style/aesthetic phù hợp với yêu cầu → search web:
```python
# Claude nên tự search trước khi generate prompt
# Ví dụ: user muốn "ảnh hero cho fintech app"
# → Search: "fintech website hero image aesthetic 2025"
# → Xem Dribbble/Behance/Awwwards để lấy visual reference
# → Rút ra: dark theme, neon accent, floating card UI elements
# → Viết prompt dựa trên reference đó
```

Nguồn reference:
- `site:dribbble.com [keyword] web design` — UI inspiration
- `site:unsplash.com [keyword]` — real photo reference style
- `site:behance.net [keyword] branding` — brand aesthetic
- Google Images `[keyword] editorial photography` — photography style

---

## Prompts để TRÁNH (với FLUX)

```
# Quá phức tạp — FLUX xử lý kém nhiều người trong cảnh
a group of 8 diverse people in various poses doing different activities...

# Text/chữ trong ảnh — AI tạo text rất xấu
image with the words "WELCOME" written in large letters...

# Yêu cầu exact logo/brand — không được
create the Apple logo exactly as it looks...

# Aspect ratio không phù hợp — người bị méo
portrait of a person [nhưng lại request 1920×400]
```

---

## Prompt enhancement quick template

```python
def enhance_prompt_for_web(raw_prompt: str, use_case: str, search_reference: bool = False) -> str:
    """
    Claude tự gọi hàm này để build prompt đầy đủ từ input thô.
    raw_prompt: mô tả thô của user ("cô gái châu á xinh đẹp")
    use_case: "hero" | "card" | "avatar" | "product" | "background"
    """
    QUALITY_SUFFIX = {
        "hero":       "wide angle, editorial photography, photorealistic, sharp focus",
        "card":       "professional photography, sharp focus, clean composition",
        "avatar":     "portrait photography, studio lighting, sharp focus on face",
        "product":    "product photography, studio lighting, commercial grade, ultra sharp",
        "background": "4K quality, no text, no watermark, seamless",
        "og":         "clean background, centered composition, high contrast, commercial",
    }
    suffix = QUALITY_SUFFIX.get(use_case, "professional photography, sharp focus")
    
    # Claude sẽ tự expand raw_prompt thành chi tiết phù hợp
    # Đây chỉ là skeleton — actual enhancement là công việc của Claude
    return f"{raw_prompt}, {suffix}"
```

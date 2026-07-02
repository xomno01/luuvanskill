---
name: create-image
description: >-
  Tạo ảnh AI chất lượng cao (photorealistic) hoặc programmatic (shapes/diagrams).
  Gọi khi user muốn "tạo ảnh", "generate image", "hero image", "banner", "avatar",
  "illustration". Claude viết prompt tiếng Anh chuẩn → AI API (FLUX) tạo ảnh thật.
  Fallback: SVG/Pillow/NumPy cho diagrams, patterns, pixel art khi cần.
  Output: PNG (default), SVG (vector), JPEG (photo).
---

# create-image — Tạo ảnh AI + Programmatic

## Môi trường

| Dependency | Status | Version |
|---|---|---|
| Python | ✅ Sẵn có | 3.9.13 |
| requests | ✅ stdlib (urllib3) | — |
| Pillow | ✅ Sẵn có | 10.1.0 |
| NumPy | ✅ Sẵn có | 2.0.2 |
| Internet | ⚠️ Cần cho AI backends | — |

---

## Quy trình (3 bước)

### 1. Phân loại yêu cầu

**A. Ảnh thật / photorealistic / người/cảnh vật thật?**  
→ Dùng **AI backend** (FLUX model qua Pollinations/HF/Fal.ai)  
→ Đọc [`refs/ai-backends.md`](refs/ai-backends.md) + [`refs/prompt-engineering.md`](refs/prompt-engineering.md)

**B. Diagram / shapes / pattern / math art / pixel art?**  
→ Dùng **programmatic** (Pillow/NumPy/SVG)  
→ Đọc refs cũ (pillow.md, numpy-patterns.md, svg.md, algorithms.md)

### 2. Nếu chọn AI backend → viết prompt chuyên nghiệp

Claude đóng vai **prompt engineer** — chuyển mô tả Việt thô thành English professional photography prompt:

```
[Subject] [Action/Pose], [Style descriptor], [Lighting], [Camera angle],
[Background], [Color palette], [Mood], [Quality tags]

Negative: [Avoid list]
```

**Example transforms:**

| User input (Việt) | Claude-engineered prompt (Eng) |
|---|---|
| "cô gái châu á xinh đẹp" | "Portrait of an elegant East Asian woman with luminous fair skin, soft natural smile, long flowing black hair, wearing traditional silk kimono, standing in cherry blossom garden, golden hour lighting, shallow depth of field, professional fashion photography, editorial style, Sony A7III 85mm f/1.4" |
| "hero banner cho website bán cà phê" | "Steaming cup of artisan coffee on rustic wooden table, warm morning sunlight streaming through cafe window, shallow focus, food photography, cozy atmosphere, earth tones, high resolution, commercial grade" |
| "icon app quản lý task" | (KHÔNG dùng AI — dùng SVG programmatic thay vì) |

Xem chi tiết tại [`refs/prompt-engineering.md`](refs/prompt-engineering.md).

### 3. Chọn engine cụ thể

| Yêu cầu | Engine | Khi nào dùng |
|---|---|---|
| **Ảnh thật (người/cảnh/vật)** | **Pollinations.ai FLUX** | Free, không cần key, watermark nhỏ, 1024x1024 default |
| **Ảnh thật (cần kiểm soát seed/negative)** | **HF Inference FLUX-schnell** | Cần `HF_TOKEN`, free quota ~50-100 ảnh/tháng |
| **Ảnh thật (best quality, nhiều ảnh)** | **Fal.ai FLUX** | $20 credit = 6.600 ảnh, cần `FAL_KEY` |
| **Diagram/chart/UI mockup** | **Pillow ImageDraw** | ~5ms, đọc [`refs/pillow.md`](refs/pillow.md) |
| **Pattern/gradient/noise** | **NumPy + Pillow** | 3ms, đọc [`refs/numpy-patterns.md`](refs/numpy-patterns.md) |
| **Logo/icon scalable** | **SVG** | 0ms, đọc [`refs/svg.md`](refs/svg.md) |
| **Pixel art custom** | **Algorithms + putpixel** | 186ms, đọc [`refs/algorithms.md`](refs/algorithms.md) |

## Kích thước chuẩn cho website

| Use case | Size (px) | Aspect | File |
|---|---|---|---|
| Hero banner | **1920×1080** | 16:9 | JPG |
| OG/social share | **1200×630** | 1.91:1 | JPG |
| Blog feature | **1200×800** | 3:2 | JPG |
| Card image | **800×600** | 4:3 | JPG |
| Avatar/profile | **400×400** | 1:1 | PNG |
| Thumbnail | **300×200** | 3:2 | JPG |
| App icon | **512×512** | 1:1 | PNG |
| Favicon | **32×32** / **64×64** | 1:1 | PNG (SVG preferred) |
| Product image | **800×800** | 1:1 | PNG (transparent bg) |
| Background texture | **1920×1200** | 16:10 | JPG |

**Pollinations.ai** hỗ trợ tối đa 1920×1080. Không generate ảnh quá lớn một lần — resize sau bằng Pillow nếu cần.

---

## Execute & verify

```bash
# Chạy script tạo ảnh
python "C:/Users/phamn/gen_image.py"

# Verify output
python -c "
from PIL import Image
img = Image.open('output.jpg')
print(f'Size: {img.size}, Mode: {img.mode}, FileSize: {__import__(\"os\").path.getsize(\"output.jpg\")//1024}KB')
"
```

---

## Pitfalls

| Vấn đề | Fix |
|---|---|
| Pollinations 15s wait mỗi request (anonymous) | Normal — do rate limit. Đăng ký free account để giảm xuống 5s |
| AM Proxy tunnel đang chạy làm ảnh hưởng request | Thêm `proxies={"http": None, "https": None}` vào `requests.get()` để bypass |
| Content-type không phải image (API error HTML) | Check `resp.headers["content-type"]` — nếu không phải `image/*` thì print body để debug |
| Ảnh Pollinations có watermark | Đăng ký free account tại enter.pollinations.ai lấy API key |
| `requests` chưa cài | `pip install requests` |
| `huggingface_hub` chưa cài | `pip install huggingface_hub` |

---

## Ref files

**AI backends (MỚI):**
- [`refs/ai-backends.md`](refs/ai-backends.md) — Code tích hợp Pollinations.ai, HF, Fal.ai, auto-detect
- [`refs/prompt-engineering.md`](refs/prompt-engineering.md) — Claude prompt templates cho từng use case web

**Programmatic (cũ, vẫn dùng cho diagrams):**
- [`refs/pillow.md`](refs/pillow.md) — Pillow ImageDraw shapes/text
- [`refs/numpy-patterns.md`](refs/numpy-patterns.md) — Gradients, noise, patterns
- [`refs/svg.md`](refs/svg.md) — Vector SVG
- [`refs/algorithms.md`](refs/algorithms.md) — Pixel art, Bresenham, flood fill
- [`refs/ppm-fallback.md`](refs/ppm-fallback.md) — Zero-dep PPM/BMP

# AI Image Generation Backends

## TL;DR — Thứ tự ưu tiên

```
1. Pollinations.ai  — FREE, sk_ key có sẵn tại C:\Users\phamn\.env  ← Dùng đầu tiên
2. HuggingFace API  — Free quota (~50-100 ảnh/tháng), cần HF_TOKEN
3. Fal.ai           — $20 free credits, best quality, cần FAL_KEY
4. Local ComfyUI    — Free nếu có GPU 8GB+, chạy tại localhost:8188
```

**Load key từ `C:\Users\phamn\.env` (đã setup):**
```python
import os

def load_env(path=r"C:\Users\phamn\.env"):
    """Load key=value từ .env file vào os.environ."""
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())
    except FileNotFoundError:
        pass

load_env()
POLLINATIONS_KEY = os.environ.get("POLLINATIONS_KEY")  # sk_... key (1 req/5s, no watermark)
HF_TOKEN         = os.environ.get("HF_TOKEN")
FAL_KEY          = os.environ.get("FAL_KEY")
```

**Pollinations key đã có** → rate 1 req/5s, no watermark, endpoint `gen.pollinations.ai`.

---

## Backend 1: Pollinations.ai (RECOMMENDED — Zero Setup)

**Đặc điểm:**
- 100% free, không cần API key
- Model: FLUX (default), turbo, sdxl
- Rate limit: 1 req/15s (anonymous) → đăng ký free lấy sk_ key → 1 req/5s
- Watermark: có với anonymous, không có với sk_ key
- KHÔNG hỗ trợ negative_prompt
- Kích thước tối đa: thực tế tốt đến 1920×1080

```python
"""
Pollinations.ai — FLUX image generation
Free, no API key needed for basic use.
Rate limit: anonymous=1req/15s, registered=1req/5s.
"""
import requests
import time
from urllib.parse import quote
from pathlib import Path
import os


def pollinations_generate(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
    model: str = "flux",
    seed: int = 42,
    nologo: bool = True,
    enhance: bool = False,
    timeout: int = 120,
) -> str | None:
    """
    Auto-load POLLINATIONS_KEY từ ~/.env → dùng registered endpoint (1 req/5s, no watermark).
    Fallback anonymous nếu không có key (1 req/15s, có watermark).
    Returns: output_path if success, None if failed.
    """
    load_env()  # load C:\Users\phamn\.env
    api_key = os.environ.get("POLLINATIONS_KEY")

    encoded = quote(prompt)

    if api_key:
        # Registered endpoint: no watermark, 1 req/5s
        url = f"https://gen.pollinations.ai/image/{encoded}"
        headers = {"Authorization": f"Bearer {api_key}"}
    else:
        # Anonymous fallback: watermark, 1 req/15s
        url = f"https://image.pollinations.ai/prompt/{encoded}"
        headers = {}

    params = {
        "model":   model,
        "width":   width,
        "height":  height,
        "nologo":  "true" if nologo else "false",
        "enhance": "true" if enhance else "false",
        "seed":    seed,
    }

    try:
        resp = requests.get(
            url, params=params, headers=headers,
            timeout=timeout,
            proxies={"http": None, "https": None},  # bypass AM Proxy tunnel
        )
        resp.raise_for_status()

        ct = resp.headers.get("content-type", "")
        if not ct.startswith("image/"):
            print(f"[ERROR] Non-image response: {ct}")
            print(f"Body: {resp.text[:300]}")
            return None

        Path(output_path).write_bytes(resp.content)
        mode = "registered" if api_key else "anonymous"
        print(f"[OK/{mode}] {output_path} ({width}x{height}, {len(resp.content)//1024}KB)")
        return output_path

    except requests.Timeout:
        print("[ERROR] Timeout")
        return None
    except requests.RequestException as e:
        print(f"[ERROR] {e}")
        return None


def pollinations_batch(requests_list: list[dict], delay_s: float = 16.0) -> list[str]:
    """
    requests_list: list of kwargs cho pollinations_generate().
    delay_s: 16s cho anonymous (rate limit 1/15s), 6s cho đã đăng ký.
    """
    results = []
    for i, kwargs in enumerate(requests_list):
        print(f"[{i+1}/{len(requests_list)}] Generating...")
        path = pollinations_generate(**kwargs)
        results.append(path)
        if i < len(requests_list) - 1:
            print(f"  Chờ {delay_s}s (rate limit)...")
            time.sleep(delay_s)
    return results


# ── Quick use ──────────────────────────────────────────────────────────────

def generate_for_web(description: str, use_case: str = "card", output_dir: str = ".") -> str | None:
    """
    description: mô tả ngắn, Claude sẽ tự build prompt đầy đủ bên ngoài hàm này.
    use_case: "hero" | "og" | "card" | "avatar" | "thumbnail" | "product" | "background"
    """
    SIZES = {
        "hero":       (1920, 1080),
        "og":         (1200, 630),
        "blog":       (1200, 800),
        "card":       (800, 600),
        "avatar":     (400, 400),
        "thumbnail":  (300, 200),
        "product":    (800, 800),
        "background": (1920, 1200),
        "square":     (1024, 1024),
    }
    w, h = SIZES.get(use_case, (1024, 1024))
    
    # Build output filename
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in description[:30])
    output_path = str(Path(output_dir) / f"{use_case}_{safe_name}.jpg")
    
    return pollinations_generate(description, output_path, width=w, height=h)
```

**Usage example:**
```python
# Single image
result = pollinations_generate(
    prompt="modern minimalist coffee shop interior, warm morning light, empty wooden tables, editorial photography, Canon 5D, 24mm, clean aesthetic",
    output_path="D:/hero_coffeeshop.jpg",
    width=1920, height=1080,
    model="flux", seed=42,
)

# Batch for website
images = pollinations_batch([
    {"prompt": "...", "output_path": "hero.jpg", "width": 1920, "height": 1080},
    {"prompt": "...", "output_path": "card.jpg",  "width": 800,  "height": 600},
    {"prompt": "...", "output_path": "avatar.jpg","width": 400,  "height": 400},
], delay_s=16)
```

---

## Backend 2: Hugging Face Inference (Free quota, cần HF_TOKEN)

**Đặc điểm:**
- Free nhưng hết quota ~50-100 ảnh/tháng (không có số chính thức)
- FLUX.1-schnell: tốt, nhanh, commercial-free
- Có negative_prompt (tốt hơn Pollinations)
- Setup: `pip install huggingface_hub`, lấy token tại huggingface.co/settings/tokens

```python
"""
HuggingFace Inference Providers — FLUX.1-schnell.
Setup: pip install huggingface_hub
Token: https://huggingface.co/settings/tokens (cần Inference permission)
Khi hết quota: HTTP 402 Payment Required.
"""
import os


def hf_generate(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
    model: str = "black-forest-labs/FLUX.1-schnell",
    negative_prompt: str = "blurry, low quality, watermark, text, deformed, artifacts",
    num_steps: int = 4,      # schnell works well at 4 steps
    guidance: float = 0.0,   # schnell is guidance-free (0.0)
    seed: int = 42,
) -> str | None:
    token = os.environ.get("HF_TOKEN")
    if not token:
        print("[SKIP] HF_TOKEN không có — fallback sang Pollinations")
        return None

    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(provider="hf-inference", api_key=token)
        
        image = client.text_to_image(
            prompt=prompt,
            model=model,
            negative_prompt=negative_prompt,
            num_inference_steps=num_steps,
            width=width, height=height,
            guidance_scale=guidance,
            seed=seed,
        )
        image.save(output_path)
        print(f"[HF] Saved: {output_path} ({width}x{height})")
        return output_path

    except ImportError:
        print("[SKIP] huggingface_hub chưa cài: pip install huggingface_hub")
        return None
    except Exception as e:
        if "402" in str(e):
            print(f"[HF] Quota exhausted (402) — fallback sang Pollinations")
        else:
            print(f"[HF] Error: {e} — fallback sang Pollinations")
        return None
```

---

## Backend 3: Fal.ai ($20 free credits)

**Đặc điểm:**
- $20 free credits với business email (6.600 ảnh 1MP)
- FLUX.1-schnell: $0.003/megapixel
- API nhanh nhất (~5s), có negative_prompt
- Setup: `pip install fal-client`, lấy key tại fal.ai

```python
"""
Fal.ai — FLUX.1-schnell.
Setup: pip install fal-client requests
Key: https://fal.ai/dashboard/keys → set FAL_KEY env var
"""
import os
import requests as req_lib
from pathlib import Path


def fal_generate(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
    negative_prompt: str = "blurry, low quality, watermark, text, deformed",
    num_steps: int = 4,
    seed: int = 42,
) -> str | None:
    key = os.environ.get("FAL_KEY")
    if not key:
        print("[SKIP] FAL_KEY không có — fallback sang Pollinations")
        return None

    try:
        import fal_client
        result = fal_client.run(
            "fal-ai/flux/schnell",
            arguments={
                "prompt": prompt,
                "image_size": {"width": width, "height": height},
                "num_inference_steps": num_steps,
                "seed": seed,
                "num_images": 1,
                "enable_safety_checker": True,
            },
        )
        img_url = result["images"][0]["url"]
        resp = req_lib.get(img_url, timeout=60)
        resp.raise_for_status()
        Path(output_path).write_bytes(resp.content)
        print(f"[Fal] Saved: {output_path} ({width}x{height})")
        return output_path

    except ImportError:
        print("[SKIP] fal-client chưa cài: pip install fal-client")
        return None
    except Exception as e:
        print(f"[Fal] Error: {e} — fallback")
        return None
```

---

## Auto-detect & Smart Router

```python
"""
Smart router: thử Fal → HF → Pollinations theo thứ tự ưu tiên.
Dùng hàm này khi muốn best-quality tự động.
"""
import os


def smart_generate(
    prompt: str,
    output_path: str,
    width: int = 1024,
    height: int = 1024,
    seed: int = 42,
    negative_prompt: str = "blurry, low quality, watermark, text, deformed, artifacts",
    prefer: str = "auto",   # "auto" | "pollinations" | "hf" | "fal"
) -> str | None:
    """
    Tự chọn backend tốt nhất dựa trên env vars có sẵn.
    Returns output_path nếu success, None nếu tất cả fail.
    """
    if prefer == "pollinations" or (prefer == "auto" and not os.environ.get("FAL_KEY") and not os.environ.get("HF_TOKEN")):
        return pollinations_generate(prompt, output_path, width, height, seed=seed)
    
    if prefer == "fal" or (prefer == "auto" and os.environ.get("FAL_KEY")):
        result = fal_generate(prompt, output_path, width, height, negative_prompt=negative_prompt, seed=seed)
        if result: return result
    
    if prefer == "hf" or (prefer == "auto" and os.environ.get("HF_TOKEN")):
        result = hf_generate(prompt, output_path, width, height, negative_prompt=negative_prompt, seed=seed)
        if result: return result
    
    # Ultimate fallback
    return pollinations_generate(prompt, output_path, width, height, seed=seed)
```

---

## Optimize & Post-process output

```python
"""
Sau khi download ảnh AI: resize, crop, optimize cho web.
"""
from PIL import Image
import os


def web_optimize(input_path: str, output_path: str = None, target_kb: int = 200) -> str:
    """
    Optimize ảnh AI cho web: resize nếu quá to, compress JPEG.
    target_kb: target file size (KB). Quality tự động điều chỉnh.
    """
    if output_path is None:
        output_path = input_path
    
    img = Image.open(input_path).convert("RGB")
    
    # Resize nếu quá lớn (preserve aspect ratio)
    max_dimension = 1920
    if max(img.size) > max_dimension:
        img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
    
    # Binary search quality để đạt target_kb
    lo, hi = 50, 95
    for _ in range(8):
        q = (lo + hi) // 2
        import io
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        if buf.tell() < target_kb * 1024:
            lo = q
        else:
            hi = q
    
    img.save(output_path, "JPEG", quality=lo, optimize=True, progressive=True)
    size_kb = os.path.getsize(output_path) // 1024
    print(f"[Optimized] {output_path}: {img.size}, quality={lo}, {size_kb}KB")
    return output_path


def crop_to_ratio(input_path: str, output_path: str, target_w: int, target_h: int) -> str:
    """
    Center-crop ảnh về đúng aspect ratio (không stretch).
    """
    img = Image.open(input_path).convert("RGB")
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio    = src_w / src_h
    
    if src_ratio > target_ratio:   # quá rộng → crop ngang
        new_w = int(src_h * target_ratio)
        left  = (src_w - new_w) // 2
        img   = img.crop((left, 0, left + new_w, src_h))
    else:                           # quá cao → crop dọc
        new_h = int(src_w / target_ratio)
        top   = (src_h - new_h) // 2
        img   = img.crop((0, top, src_w, top + new_h))
    
    img = img.resize((target_w, target_h), Image.LANCZOS)
    img.save(output_path, "JPEG", quality=90, optimize=True)
    print(f"[Crop] {output_path}: {target_w}x{target_h}")
    return output_path
```

---

## Complete workflow example

```python
# Tạo đủ ảnh cho 1 landing page — chạy từ đầu đến cuối
import time

BRAND = "TechFlow"
OUTPUT = "D:/website_images"
__import__("os").makedirs(OUTPUT, exist_ok=True)

images = [
    {
        "use": "hero",
        "prompt": "modern tech startup office with large glass windows overlooking city skyline, team of diverse professionals collaborating around holographic displays, golden hour ambient lighting, wide angle, editorial photography, Canon 5D Mark IV 24mm, photorealistic",
        "w": 1920, "h": 1080,
    },
    {
        "use": "og",
        "prompt": "abstract digital network connections on dark navy background, glowing blue nodes, professional corporate branding, 3D render style, clean minimalist",
        "w": 1200, "h": 630,
    },
    {
        "use": "card_team",
        "prompt": "professional headshot of smiling East Asian woman in business attire, soft studio lighting, white background, corporate portrait photography",
        "w": 800, "h": 600,
    },
    {
        "use": "card_product",
        "prompt": "sleek smartphone floating on white background, soft drop shadow, product photography, commercial grade, apple-style minimalism",
        "w": 800, "h": 600,
    },
]

for item in images:
    out = f"{OUTPUT}/{item['use']}.jpg"
    result = pollinations_generate(
        prompt=item["prompt"],
        output_path=out,
        width=item["w"], height=item["h"],
        model="flux", seed=2024,
    )
    if result:
        web_optimize(out, target_kb=150)
    time.sleep(16)  # anonymous rate limit

print("Done! Tất cả ảnh đã sẵn sàng tại:", OUTPUT)
```

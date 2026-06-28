---
name: IMOL2o
description: >-
  Bộ kỹ năng dựng website đỉnh cao, đẹp chuẩn 2026 — tổng hợp từ nghiên cứu đa nguồn về
  thẩm mỹ, stack frontend, 3D/WebGL cinematic, motion và quy trình AI. Gọi khi người dùng
  muốn làm hoặc đánh bóng một website cho "sang", "đẹp", "cao cấp", "đẳng cấp",
  "awwwards-style", "đỉnh cao": landing page, portfolio, trang marketing, hero section,
  dashboard; khi chọn stack frontend hiện đại (Astro / Next.js / SvelteKit, Tailwind v4,
  OKLCH, shadcn); khi áp xu hướng thiết kế 2026 (bento grid, aurora UI, big/kinetic
  typography, dark mode tinted); khi thêm scroll animation, micro-interaction, page
  transition; hoặc khi dùng AI (v0 / Claude Code / shadcn) để ra UI đẹp mà không bị
  "generic / AI slop". Bản chất là checklist quyết định + 5 file tham chiếu chi tiết.
---

# IMOL2o — Dựng website đỉnh cao & đẹp chuẩn 2026

> Bộ skill này chắt lọc từ 5 nhánh nghiên cứu đa nguồn (06/2026): thẩm mỹ thị giác,
> stack frontend, cinematic 3D/WebGL, motion/micro-interaction, và quy trình AI.
> SKILL.md là **checklist quyết định** — đọc nhanh để chọn hướng; chi tiết + URL nguồn
> nằm trong `references/`. Số version package thay đổi nhanh → coi như mốc 06/2026, luôn
> verify lại bằng `npm view <pkg> version` trước khi cam kết.

## Triết lý (đọc trước khi làm)

1. **Đẹp đỉnh = 1 "signature moment" + usability + performance.** KHÔNG nhồi 20 hiệu ứng.
   Site đoạt giải thường **trượt vì usability/performance, không phải thiếu sáng tạo**.
   Tiêu chí Awwwards: Design 40% · **Usability 30%** · Creativity 20% · Content 10%.
2. **Nền tảng đúng từ đầu rẻ hơn sửa sau.** OKLCH + Tailwind v4 + variable fonts +
   native CSS hiện đại là baseline 2026 — dựng đúng ngay, đừng dùng đồ 2023.
3. **Tiết chế = sang.** Motion ít mà đúng physics (easing thật, 150–600ms, chỉ
   `transform`+`opacity`) đánh bại nhiều hiệu ứng lòe loẹt.
4. **AI ra đẹp nhờ grounding, không nhờ tool.** Design tokens cụ thể + reference thật
   mới thoát "AI slop" (Inter + gradient tím + 3 card bo góc).
5. **Accessibility là dấu hiệu tay nghề, không phải tùy chọn:** `prefers-reduced-motion`,
   contrast WCAG, semantic HTML — jury và người dùng thật đều thấy.

## Quy trình chuẩn khi nhận một task "làm web cho đẹp"

1. **Phân loại site** → chọn stack (bảng dưới). Sai stack là sai từ gốc.
2. **Chốt design tokens trước khi code:** color (OKLCH, semantic), type (2 font, KHÔNG
   Inter/Poppins mặc định), spacing scale (4/8px), radius, motion. Ghi vào 1 file
   (`DESIGN.md` / `@theme` của Tailwind v4 / `CLAUDE.md`).
3. **Risk-First:** làm phần khó/chưa chắc khả thi nhất TRƯỚC (thường là hero 3D hoặc 1
   scroll-reveal phức tạp) — spike chạy được rồi mới làm phần dễ.
4. **Dựng layout + states đầy đủ** (loading/empty/error/success) trước khi đánh bóng.
5. **Thêm đúng 1–2 "wow moment"**, phần còn lại motion tinh tế.
6. **Đo:** Core Web Vitals (INP < 200ms, LCP tốt), test `prefers-reduced-motion`,
   contrast, mobile thật. Performance là tiêu chí, không phải bonus.

## Decision framework — chọn stack theo kịch bản

| Kịch bản | Stack đề xuất 2026 | Vì sao |
|---|---|---|
| **Landing / portfolio siêu đẹp, SEO** | **Astro** + Tailwind v4 + View Transitions + scroll-driven CSS | Zero-JS by default → LCP/INP/SEO top; island cho phần cần tương tác |
| **Web app phức tạp (React)** | **Next.js 16** App Router/RSC + shadcn/ui + Biome | Hệ sinh thái lớn nhất, dễ tuyển, Turbopack stable |
| **Web app ưu tiên nhẹ JS** | **SvelteKit 2** (Svelte 5 runes) + Vite + Tailwind v4 | Compiler → ship ít JS hơn Next 30–50% |
| **Solo dev làm nhanh** | SvelteKit / Astro + shadcn + **Biome** + Bun/Vite | Ít boilerplate, không "đốt não" RSC |
| **Cinematic 3D hero / awwwards** | Three.js + R3F + **TSL/WebGPU** + Lenis + GSAP | Xem skill `cinematic-3d-web` + `references/cinematic-3d.md` |
| **Marketing site không cần code** | Framer (đẹp/animation) hoặc Webflow (CMS/AEO sâu) | Khi không cần sở hữu code |

⚠️ **Tránh cho dự án mới:** Tailwind v3, Remix (brand cũ đã chết → React Router 7/8),
Radix UI thuần (team chuyển sang Base UI nhưng Base UI còn RC). Xem `references/frontend-stack-2026.md`.

## Checklist "đẹp đỉnh" (áp cho mọi site)

**Nền tảng — NÊN:**
- [ ] **OKLCH** làm color space; dark mode chỉ shift lightness, giữ hue/chroma.
- [ ] Dark surface = **near-black tinted** (`#09090b`), neutrals zinc/slate — KHÔNG `#000000`/`#808080`.
- [ ] **Variable fonts**, pairing serif display + humanist sans. Tránh "Inter/Poppins fatigue":
      Geist, Hanken Grotesk, Bricolage Grotesque, Manrope / Fraunces, Spectral, Lora.
- [ ] **Bento grid** bằng CSS Grid + Subgrid (thiết kế lại thứ tự ô cho mobile từ đầu).
- [ ] **Big / kinetic typography** cho hero; chữ là nhân vật chính.
- [ ] 1 **aurora glow** nhẹ (1–2 blob blur) sau hero, giới hạn animation.

**Motion — NÊN:**
- [ ] Chỉ animate `transform` + `opacity`; easing custom cubic-bezier/spring (KHÔNG `linear`).
- [ ] Timing: micro 150–300ms, lớn 400–600ms; stagger 30–60ms.
- [ ] `Lenis` cho smooth scroll cao cấp; `GSAP` (giờ 100% free) cho scroll-telling/pin.
- [ ] **View Transitions API** cho chuyển trang/shared-element kiểu app.
- [ ] `prefers-reduced-motion` bắt buộc; scroll-driven CSS phải có fallback (Firefox còn flag).

**TRÁNH:**
- [ ] Glassmorphism toàn trang (fail contrast WCAG, tốn `backdrop-filter`) — chỉ nav/modal/card.
- [ ] Parallax nặng / nhiều 3D trên mobile (jank, hỏng CWV).
- [ ] Brutalism/maximalism cho fintech/healthcare/B2B (mất cảm giác tin cậy).
- [ ] Lorem ipsum, machine translation (jury phát hiện ngay; content = 10% điểm).
- [ ] `box-shadow`/`filter: blur` lớn animate liên tục (paint nặng).

## Khi nào đọc file reference nào

- `references/visual-design-2026.md` — 12 xu hướng thẩm mỹ, palette, font, "đẳng cấp" là gì.
- `references/frontend-stack-2026.md` — chọn framework/CSS/tooling, version, cái gì đang chết.
- `references/cinematic-3d.md` — Three.js/R3F/TSL/WebGPU, hiệu ứng, lộ trình học, bẫy thực chiến.
- `references/motion-interaction.md` — scroll animation, micro-interaction, thư viện, page transition.
- `references/ai-workflow.md` — v0/Claude/shadcn/Framer, chống generic, assets, quy trình solo dev.

## Skill liên quan đã có sẵn trong máy

- `cinematic-3d-web` — engine architecture cho site 3D/WebGL đỉnh (gọi khi làm hero cinematic).
- `baoyu-design` — dựng mockup/prototype/landing HTML self-contained (bước spike nhanh).
- `source-driven` — verify SDK trước khi code (bắt buộc khi đụng Three.js/GSAP/framework SDK).
- `risk-first` — vertical slice, làm phần rủi ro nhất trước.

## Cảnh báo độ tin cậy (đừng trích như fact cứng)

- Số liệu engagement kiểu "+30% time-on-page" là từ blog agency, **chưa có study độc lập**.
- Version package (Next 16.x, Astro 7.x, Tailwind 4.3.x, Vite 8.x...) là mốc 06/2026 —
  **verify lại** `npm view <pkg> version` trước khi cài.
- Browser support (scroll-driven, cross-doc View Transitions) đổi theo tháng → check caniuse.
- Awwwards "Site of the Year 2025" có mâu thuẫn nguồn (Igloo Inc vs Lando Norris) → check trực tiếp.

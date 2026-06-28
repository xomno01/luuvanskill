# Motion / micro-interaction / page transition 2026 — chi tiết

> Stack vàng: **Lenis + GSAP** (scroll-telling cao cấp) + **CSS `animation-timeline`** (hiệu
> ứng nhẹ, compositor, có fallback) + **View Transitions API** (chuyển trang kiểu app).
> "Sang" = easing + timing + tiết chế, KHÔNG phải số lượng hiệu ứng.

## Scroll-driven animation

| Giải pháp | Performance | Support | Khi nào dùng |
|---|---|---|---|
| CSS `animation-timeline: scroll()/view()` | ⭐⭐⭐ compositor | ~82% (no Firefox default) | Reveal/parallax nhẹ + có fallback |
| GSAP ScrollTrigger | ⭐⭐ main thread (tối ưu tốt) | ~99% | Scrub/pin phức tạp, support đồng đều |
| Lenis | lớp bổ trợ | tốt | Quán tính cuộn + đồng bộ WebGL |
| Locomotive Scroll (cũ) | ⭐ CSS transform | vấn đề sticky | **Tránh** — Lenis thay thế |

- **CSS scroll-driven:** chạy compositor thread → mượt kể cả main thread bận, không tốn
  IntersectionObserver. Gotcha: `animation-timeline` reset-only → khai báo SAU `animation:`.
  Firefox còn sau flag → **bắt buộc fallback**.
- **Lenis:** chạy trên native scroll (giữ `position:sticky`, anchor, CMD+F, keyboard, a11y).
  KHÔNG dùng cho site utility/SEO (smooth scroll cưỡng ép gây khó chịu).

## Micro-interactions

| Kỹ thuật | Độ khó | Khi nào |
|---|---|---|
| **Magnetic button** (nút hút theo con trỏ, offset ×0.3–0.4) | Thấp | CTA chính, portfolio |
| **Custom/sticky cursor** (lag mềm, phình to trên element) | TB | Creative/agency, KHÔNG cho e-commerce |
| **State transitions** (idle→hover→pressed→success) | Thấp | Mọi button/input — nơi "cảm giác chất lượng" thật |
| **Haptic-feel** (spring nhẹ, scale 0.97 on press) | Thấp | Tăng cảm giác "bấm thật" |

- Dùng `gsap.quickTo()`/`quickSetter` cho mousemove — **KHÔNG** tạo tween mới mỗi frame
  (thrash). Tham chiếu: Codrops Magnetic Buttons.

## Thư viện motion

- **GSAP** — 100% free từ 05/2025 (Webflow back), gồm tất cả Club plugin (SplitText,
  MorphSVG, DrawSVG, ScrollTrigger, ScrollSmoother, Inertia). v3.13 SplitText giảm 50% size,
  baked-in a11y. Free ≠ open source (cấm decompile/cạnh tranh).
- **Motion** (Framer Motion đã đổi tên `motion`) — declarative, gestures, springs,
  **layout/shared-element transitions** (`layoutId`), 120fps. `import { motion } from "motion/react"`.
  Mạnh hơn GSAP ở declarative + shared-element.
- **Anime.js v4** (04/2025) — ESM-first modular, MIT thật, `createScope` (hợp React),
  SVG `morphTo`/`createDrawable`, v4.3 thêm `createLayout()` + three.js adapter. Nhẹ.
- **Lottie vs Rive:** Lottie cho icon/illustration designer xuất (AE + BodyMovin, kho lớn,
  JSON lớn hơn). **Rive** khi cần state machine tương tác thật (overhead ~200KB WASM, GPU
  render ~60fps vs Lottie ~17fps, có data binding). Lottie cuối 2025 đã thêm State Machine.

## Page / shared-element transitions (View Transitions API)

- **Same-document (SPA):** Baseline 10/2025 (Chrome 111+, Safari 18+, Firefox 144+).
  `document.startViewTransition()` + `view-transition-name`.
- **Cross-document (MPA):** Chrome/Edge 126+, Safari 18.2+, **Firefox chưa**. At-rule
  `@view-transition`. Nếu navigation >~4s Chrome bỏ qua → dùng Speculation Rules prefetch.
- **Shared-element:** cùng `view-transition-name` ở 2 state/trang → browser tự morph.
- Degrade gracefully → an toàn dùng progressive enhancement. Bọc `@supports (view-transition-name: none)`.
- Thay được nhiều use-case page-transition của Framer Motion bằng native, nhẹ hơn.

## Công thức "cảm giác cao cấp" — DO / DON'T

**DO:** easing thật (cubic-bezier/spring, ease-out vào, ease-in ra); timing ngắn (micro
150–300ms, lớn 400–600ms); chỉ animate `transform`+`opacity`; stagger 30–60ms; `will-change`
đúng chỗ (add on hover, remove sau); tiết chế 1–2 "wow" mỗi màn.

**DON'T:** nhiều hiệu ứng cùng lúc, bounce quá đà, duration dài; smooth scroll cưỡng ép site
utility; animate `box-shadow`/`blur` lớn (paint nặng); `setTimeout/setInterval` cho animation;
bỏ qua layout shift (reserve `min-height` + `contain: layout`).

## Accessibility (bắt buộc)

- `prefers-reduced-motion`: reset `*` animation/transition về ~0.01ms. JS:
  `matchMedia('(prefers-reduced-motion: reduce)')`. Đừng "nuke" hết — giữ animation hữu ích
  (transitional), chỉ tắt trang trí.
- WCAG 2.3.3: animation > 5s phải có nút pause. Test: DevTools → Rendering → Emulate.

## Khuyến nghị theo loại site

| Loại | Stack |
|---|---|
| Agency/portfolio "có hồn" | Lenis + GSAP (ScrollTrigger/SplitText) + custom cursor + Rive hero |
| Web app React | Motion (`motion/react`) layout + View Transitions same-doc |
| Marketing/landing nhẹ | CSS `animation-timeline` (fallback) + Lottie icon + micro CSS |
| MPA/blog | View Transitions cross-doc + Speculation Rules (progressive enhancement) |

## Demo / nguồn

- scroll-driven-animations.style (Bramus): https://scroll-driven-animations.style/
- Codrops: https://tympanus.net/codrops/
- motion.dev: https://motion.dev/
- Josh Comeau — Scroll-Driven Animations: https://www.joshwcomeau.com/animation/scroll-driven-animations/
- web.dev — View Transitions baseline: https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available

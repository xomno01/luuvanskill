# Stack frontend 2026 — chi tiết

> Version dưới đây verify từ npm registry 06/2026. Số version trôi nhanh → luôn check lại
> `npm view <pkg> version`. Blog hay mâu thuẫn version, ĐỪNG tin số trong blog.

## Version mốc (npm, 06/2026)

| Package | latest | Ghi chú |
|---|---|---|
| `next` | 16.x | App Router/RSC, Turbopack stable |
| `astro` | 7.x | Cloudflare mua team Astro 01/2026, vẫn MIT |
| `@sveltejs/kit` | 2.x | Svelte 5 runes |
| `react-router` | 8.x | = Remix cũ đã merge; ESM-only, Node 22+ |
| `nuxt` | 4.x | Vue; Nuxt 3 maintained tới hết 07/2026 |
| `@solidjs/start` | 1.3.x | Niche, pool nhỏ nhất |
| `tailwindcss` | 4.x | Engine Oxide (Rust), config CSS-first `@theme` |
| `@biomejs/biome` | 2.x | Lint+format 1 binary (Rust), ~10–25x ESLint |
| `vite` | 8.x | Rolldown (Rust), prod build ~4x nhanh hơn |
| `@base-ui-components/react` | 1.0.0-rc | **CHƯA stable 1.0** |

## Meta-frameworks

- **Next.js 16** — vua React metaframework, hệ sinh thái lớn nhất, dễ tuyển. Nhược: ship
  nhiều JS (React runtime ~80–90KB), RSC tăng tải nhận thức (`"use client"`, caching,
  Server Actions), chi phí Vercel leo thang.
- **Astro 7** — tốt nhất cho content/marketing/blog: ~0 JS, SEO top. **Server Islands** vá
  dynamic content. Cloudflare hậu thuẫn → tích hợp edge sâu. Nhược: không hợp app full-tương-tác.
- **SvelteKit 2** — compiler → DOM trực tiếp, ship ít JS hơn Next 30–50% (15–25KB vs 80–90KB).
  Nhược: hệ sinh thái nhỏ hơn, không có RSC.
- **React Router 8** — Remix đã merge hoàn toàn vào đây ("Framework Mode" = Remix-style).
  Shopify Hydrogen chạy trên RR7. **Remix brand cũ đã chết** → "Remix 3" beta bỏ React hẳn,
  experimental, KHÔNG production.
- **Nuxt 4** (Vue) / **SolidStart 1.3** (niche, fine-grained reactivity) — chọn theo team.

## CSS hiện đại — production-ready?

**Đã Baseline, dùng thẳng:** `:has()`, container size queries, `@layer` (cascade layers),
native nesting, OKLCH, **View Transitions same-document** (Baseline 2025).

**Cần `@supports` / progressive enhancement:**
- **Scroll-driven animations** (`animation-timeline: scroll()/view()`) — ~82–85% caniuse,
  Chromium+Safari ship, **Firefox còn sau flag**. Degrade tốt (browser bỏ qua).
  Gotcha: `animation-timeline` reset-only → khai báo SAU dòng `animation:`.
- **Container STYLE queries** — Firefox về giữa 2026.
- **Relative color** (`oklch(from ...)`) — ~82%.
- **Cross-document View Transitions** — Chrome/Edge + Safari 18.2, Firefox chưa.
- **`animation-trigger`** (Chrome 145) — quá sớm cho production.

**Tailwind v4** — GA 22/01/2025, production-hardened. Cần Node 20+, browser hẹp lại
(Safari 16.4+/Chrome 111+/Firefox 128+). **Đừng dùng v3 cho dự án mới.**

## Component/UI systems

- **shadcn/ui** — copy-paste source vào repo (bạn SỞ HỮU code). Full Tailwind v4 + React 19,
  `data-slot`, hỗ trợ cả Radix lẫn Base UI. CLI v4 (03/2026) + Skills + MCP → agent đọc
  registry sống.
- ⚠️ **Radix UI** — team gốc chuyển hết sang **Base UI**, Radix "isn't being actively
  maintained". Nhưng Base UI mới `1.0.0-rc` → khoảng trống. Mô hình copy-paste của shadcn
  cho phép tự patch.

## Build tooling & hiệu năng

- **Vite 8 + Rolldown** — mặc định dự án mới. **Turbopack** — mặc định trong Next.js (HMR
  leaf tốt) nhưng bundle lớn hơn, ngoài Next gần như không dùng. **Bun** — install/scripts/
  runtime, KHÔNG thay Vite cho frontend HMR.
- **Core Web Vitals / INP** — INP < 200ms (Good) là metric khó nhất (43% site fail). Nguyên
  nhân: third-party scripts + long tasks. (Tin đồn Google siết LCP 2.0s + site-wide 03/2026
  — nguồn mâu thuẫn, verify web.dev.)
- **Ảnh:** AVIF + WebP fallback qua `<picture>`; explicit width/height chống CLS.

## DX & chất lượng

- **TypeScript** mặc định.
- **Biome 2.x** (Rust) — dùng cho dự án MỚI. Nhược: chưa đủ type-aware rules (roadmap cuối
  2026), thiếu plugin framework-specific → dự án cũ heavy-plugin dùng **hybrid** (Biome
  format + lint cơ bản, giữ ESLint cho react-hooks/next).

## Đang chết / hype cần nghi ngờ

- **Chết/biến hình:** Remix brand cũ (→ Remix 3 experimental), Tailwind v3, Webpack thuần.
- **Rủi ro maintenance:** Radix UI (Base UI chưa 1.0).
- **Hype:** Turbopack "5x" (Evan You phản bác, thực tế ~ngang/68% leaf, bundle lớn hơn).
  Mọi con số x-faster trong blog → directional, tự đo trên repo thật.
- **Quá sớm:** `animation-trigger`, cross-doc View Transitions, SolidStart v2 (alpha).

## Nguồn

- Cloudflare — Astro joins Cloudflare: https://blog.cloudflare.com/astro-joins-cloudflare/
- Tailwind v4: https://tailwindcss.com/blog/tailwindcss-v4-alpha
- shadcn changelog: https://ui.shadcn.com/docs/changelog
- MDN scroll-driven: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- CSS-Tricks Interop 2026: https://css-tricks.com/interop-2026/

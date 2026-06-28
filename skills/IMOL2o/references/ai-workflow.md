# Quy trình AI tạo website đẹp 2026 — chi tiết

> UI đẹp "đỉnh" đến từ **quy trình** (design tokens + reference + screenshot-refine loop),
> KHÔNG từ tool. Tool nào không grounding cũng rơi vào "AI slop" (Inter, gradient tím, 3 card
> bo góc). Mọi tool đều mắc "70% problem": đẹp/nhanh nhưng 30% cuối (auth, RLS, bảo mật,
> scale) vẫn phải dev tay.

## Vì sao AI ra "generic" — và cách thoát

Anthropic gọi đây là **distributional convergence**: model lấy điểm trung bình training data.
Đây là "defaults problem", rất steerable nếu prompt đúng. **3 đòn bẩy:**

1. **Design tokens cụ thể** ở cả mức color/type/spacing VÀ mức component (không chỉ "primary
   button" mà tả radius/shadow/bg). Ép hex, scale 1.25, base 4/8px — đừng để AI tự chọn.
2. **Reference-driven:** ground vào app production thật. **Mobbin MCP** (05/2026) nối
   ~621k screen vào Claude Code/Cursor/Lovable.
3. **shadcn Skills + MCP + Preset (CLI v4, 03/2026):** agent đọc registry sống + component
   thật trong repo thay vì hand-roll Button "80% giống shadcn".

## So sánh tool chính

| Tool | Tốt nhất | Stack/khóa | Giá (2026) |
|---|---|---|---|
| **v0** (Vercel) | UI React/shadcn đẹp nhất, deploy nhanh | Next/Vercel, React-only | Free $5 · Premium $20 · Team $30/user |
| **Lovable** | MVP full-stack nhanh cho non-tech | Supabase + React+Vite | Pro $25 |
| **Bolt.new** | Tốc độ, đa framework, screenshot→UI | Bolt Cloud | Pro $20 (10M token) |
| **Replit Agent** | Full-stack/production, agent tự chủ | Replit | leo $70–100/đêm |
| **Framer AI** | Landing/portfolio đẹp, animation, đa ngữ | Framer hosting | Pro $30/mo |
| **Webflow AI** | CMS sâu, HTML sạch, AEO, enterprise | Webflow | đắt (agency $134+) |
| **Claude Code** | Agentic, đa file, context ~1M, code vào repo bạn | Anthropic | Max/API |
| **Cursor** | Sửa UI trực quan, inline diff, tab | đa model/BYO | Pro |

- **v0** cho UI polish tốt nhất nhưng frontend-first, backend non, khóa Next/Vercel.
- **Lovable** dễ nhất cho non-tech; export được nhưng đổi backend tốn 40–80h; regressions
  tích lũy khi project lớn.
- **Bolt** nhanh/đa framework nhưng code "disposable", đốt token.
- **Cursor + Claude Code** — pattern thắng là dùng CẢ HAI (Cursor sửa từng file, Claude Code
  refactor đa file).

## AI assets

- **Ảnh:** Flux 2 Pro = workhorse web (text trong ảnh đọc được, brand-consistent, ~$0.08/ảnh).
  Midjourney v7 = hero/editorial đẹp nhất (text kém). Pipeline lai: MJ base → Flux tinh chỉnh.
- **Vector/icon/logo:** **Recraft** (ra SVG/Lottie editable native).
- **3D web:** **Spline** (3D nhẹ, tương tác, GLTF, browser). Meshy/Rodin/Tripo cho asset
  polygon/nhân vật.
- **Color/typography:** không có tool riêng thắng — chất lượng đến từ **ép tokens** vào prompt.

## Design-to-code — độ chín

- **Figma Make** đọc structured data (component/layout/style) → chính xác hơn screenshot.
  **v0** không đọc Figma native (chỉ screenshot hoặc Figma MCP).
- **Screenshot→code** chỉ tốt với UI đơn giản ("look close, not identical").
- Bước nhảy chất lượng 2026 = **MCP** (live design reference). Yếu tố quyết định nhất là
  **cấu trúc file Figma**, không phải tool. Output nào cũng cần review a11y/semantics.

## Quy trình cho solo dev (đẹp nhanh, giữ kiểm soát code)

**Triết lý:** dùng builder để *nghĩ/spike*, dùng coding agent để *sở hữu code*.

1. **Định hướng:** viết `CLAUDE.md`/`DESIGN.md` chứa design tokens cụ thể (hex semantic, font
   KHÔNG Inter/Roboto, spacing 4/8px, radius theo component, motion) + chọn 2–3 reference thật.
   Đây là bước quyết định "đẹp" vs "slop".
2. **Spike UI rủi ro nhất trước** (Risk-First): v0 hoặc Claude Design phác hero/layout phức
   tạp nhất — KHÔNG dùng làm code cuối.
3. **Trục chính = Claude Code + shadcn** (MCP + Skills + Preset): code vào Git của bạn, theo
   convention bạn, review như code thường.
4. **Vòng lặp screenshot-refine:** chạy → chụp màn hình → dán lại + feedback cụ thể → lặp.
   "Highest-leverage habit, costs nothing."
5. **Sửa vi mô:** Cursor (inline diff) cho tweak từng file; Claude Code cho refactor đa file.
6. **Assets:** hero → MJ v7; ảnh có text/brand → Flux 2 Pro; icon SVG → Recraft; 3D nhẹ → Spline.
7. **Site marketing không cần code:** Framer (landing/portfolio) hoặc Webflow (CMS/AEO/enterprise).
8. **Save Point + Harden:** commit nhỏ trước mỗi lần agent đụng; trước go-live pass tay 30%
   cuối — auth, RLS/secrets, validate input API ngoài, security audit, monitoring.

## Cảnh báo

- **Vendor lock-in:** Lovable (Supabase+React), Bolt (infra), v0 (Next/Vercel). Export ≠ thoát thật.
- **Chất lượng code thấp khi scale**, lỗ hổng bảo mật cần audit tay.
- **Chi phí leo thang:** Replit $70–100/đêm, Bolt/Lovable đốt credit, v0 hosting tính riêng.

## Nguồn

- Anthropic — Improving frontend design through skills: https://claude.com/blog/improving-frontend-design-through-skills
- Claude cookbook frontend aesthetics: https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb
- shadcn Skills: https://ui.shadcn.com/docs/skills
- v0 pricing: https://v0.app/pricing
- Flux vs Midjourney 2026: https://ropewalk.ai/blog/flux-vs-midjourney-2026

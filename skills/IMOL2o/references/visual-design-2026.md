# Thẩm mỹ thị giác web 2026 — chi tiết

Năm 2026 thẩm mỹ web phân nhánh kép: một bên **"human/anti-AI"** (brutalism tactile,
hand-drawn, serif biểu cảm, imperfection — để chứng minh "có người làm"); một bên
**"premium-tech"** (aurora UI, OKLCH, dark mode có chủ đích, WebGL). Bento grid + dark
mode + variable fonts + OKLCH đã thành **baseline**.

## 12 xu hướng (kèm trạng thái)

1. **Bento grid** — baseline, vẫn mạnh. CSS Grid + Subgrid đã full support. Bẫy: sập
   narrative khi collapse cột trên mobile → thiết kế lại thứ tự ô.
2. **Aurora UI / gradient mesh** — đang lên. Blob blur lớn trên nền tối (Stripe, Linear,
   Vercel). Cẩn thận performance: `will-change: transform`, giới hạn phần tử động.
3. **OKLCH làm color space mặc định** — nền tảng mới. Perceptual uniformity → build scale
   màu/gradient không chỉnh tay; dark mode chỉ shift lightness. Support ~93–95% (Chrome
   111+, Safari 15.4+, Firefox 113+). Tailwind v4 dùng OKLCH nội bộ. Lưu ý: gradient OKLCH
   có thể đi vòng hue → nhiều tool nội suy qua **OKLab** cho gradient thẳng.
4. **Dark mode "cao cấp có chủ đích"** — chín muồi. Build token riêng cho surface/border/
   text/interactive. Near-black `#09090b` thay `#000000`; tinted neutrals (zinc/slate),
   KHÔNG pure gray `#808080`. Gradient brand: violet→cyan `#8B5CF6→#06B6D4` (tech),
   emerald→teal `#10B981→#14B8A6` (fintech).
5. **Tactile brutalism / neo-brutalism** — đang lên (anti-AI). "Raw nhưng làm cực chuẩn".
   KHÔNG hợp fintech/healthcare/B2B. Làm đúng khó hơn trông tưởng.
6. **Big type + kinetic typography** — đang thống trị. Type oversized/stacked/rotated; chữ
   thành UI/đồ họa. Variable font cho phép đẩy chữ vào "extreme optical states".
7. **Variable fonts (baseline) + serif revival editorial** — serif quay lại mạnh ở news/
   blog/magazine. Pairing thắng: **serif headline + humanist sans body**.
8. **Anti-grid / asymmetry có kiểm soát + whitespace chức năng** — rời lưới 12 cột cứng
   nhưng vẫn dựng trên grid ngầm. Nhầm asymmetry = ngẫu nhiên → trông rẻ tiền.
9. **Scroll-telling / scrollytelling** — chuẩn ngành. Reveal có timing, sticky markers,
   progress. Bắt buộc `prefers-reduced-motion` + nhẹ trên mobile.
10. **Immersive 3D / WebGL / WebGPU** — chủ lực site đoạt giải (xem `cinematic-3d.md`).
11. **Hand-drawn / anti-AI / grain & imperfection** — đang nổi. Illustration vẽ tay, grain
    texture, doodle. Hợp creative/lifestyle/portfolio.
12. **Maximalism / retro-futurism / Y2K dopamine** — lên ở lifestyle/beauty/entertainment.
    Màu bão hòa, contrast gắt, neon/chrome. Sai hoàn toàn với B2B/finance/health.

## Đã bão hòa / nên hạn chế

- **Glassmorphism toàn trang** — cliché, dễ fail contrast WCAG, tốn `backdrop-filter`.
  Chỉ dùng nav/modal/card nổi (>3 component glass/trang là quá tay).
- **Parallax nặng** — jank, hỏng Core Web Vitals.
- **Pure black `#000000` / pure gray `#808080`** — lỗi thời, dùng tinted.

## Font free chất lượng cao (tránh mặc định)

- **Sans:** Geist, Hanken Grotesk, Bricolage Grotesque, Manrope, Plus Jakarta Sans.
  (Inter đã quá phổ biến; tránh "Poppins fatigue", tránh pair 2 geometric sans.)
- **Serif:** Fraunces, Spectral, Lora, Playfair Display, DM Serif Display.
- **Pairing kinh điển:** Playfair Display + Inter; DM Serif Display + DM Sans;
  Fraunces + Hanken Grotesk.

## "Đẳng cấp" / đoạt giải nghĩa là gì

Tiêu chí Awwwards: **Design 40% · Usability 30% · Creativity 20% · Content 10%.** Đa số
site **trượt vì usability, không phải creativity**. Custom interaction (Three.js/WebGL) là
khác biệt lớn nhất vì lộ ngay site template/AI. "3 tuần polish cuối" tạo khác biệt 6.2 vs 7.5.

## Nguồn

- Figma — Web Design Trends 2026: https://www.figma.com/resource-library/web-design-trends/
- StudioMeyer — 2026 Reality Check: https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check
- 66Colorful — OKLCH Guide: https://66colorful.com/blog/oklch-color/
- Recursion — UI Color Trends 2026: https://www.recursion.agency/blog/ui-color-trends-2026
- DesignMonks — Typography 2026: https://www.designmonks.co/blog/typography-trends-2026
- Awwwards — Evaluation System: https://www.awwwards.com/about-evaluation/

> Caveat: số liệu engagement (+30–40% time-on-page) từ blog agency, chưa có study độc lập.

# Cinematic 3D / WebGL web 2026 — chi tiết

> Đây là mảng phân biệt site đoạt giải vs site template. Khi bắt tay làm, dùng kèm skill
> `cinematic-3d-web` (engine architecture chi tiết hơn) + `source-driven` (verify API).

## Lõi công nghệ nên học

- **Three.js + React Three Fiber (R3F)** — chuẩn de-facto, cộng đồng/việc làm lớn nhất.
  Babylon.js chỉ ưu tiên cho game/XR/enterprise; OGL khi cần bundle nhỏ / học WebGL trần.
- **TSL (Three Shading Language)** — con đường chính thức của Three.js: viết shader bằng JS,
  compile ra cả WGSL (WebGPU) lẫn GLSL (WebGL) — viết một lần chạy cả hai. Type-safe,
  autocomplete, stack trace JS thật. **Học TSL ngay cả khi chưa dùng WebGPU.**
- **WebGPU đã production-ready** (từ Q4/2025, Safari 26 ship 09/2025 → ~95% trình duyệt,
  còn lại auto-fallback WebGL2). Three.js r171+ không cần tweak bundler. Thắng đậm ở:
  draw-call nhiều, compute-heavy (particle/physics), post-processing phức tạp, instanced
  mesh lớn (Segments.ai đạt 100x khi chuyển point cloud WebGL→WebGPU).

## Hiệu ứng đặc trưng site đoạt giải

- **Scroll-driven 3D narrative:** Lenis + GSAP ScrollTrigger + Three.js. R3F dùng
  `ScrollControls`/`useScroll` (Drei) hoặc `@14islands/r3f-scroll-rig`.
- **GPU particles / compute shader:** WebGPU Storage Buffer → update in-place, bỏ ping-pong.
  Bẫy: point size WebGPU cố định 1px → KHÔNG dùng `Points` cho particle có texture, dùng
  Sprite/Instanced Mesh.
- **MSDF text:** msdfgen → 3 distance field (R/G/B) → text sắc nét mọi scale, giữ góc nhọn.
- **Cursor distortion:** "touch texture" (canvas ẩn ghi vết trắng theo chuột) → uniform cho
  shader. "Chất alive" đến từ **spring physics**: lerp/damp cursor trước khi feed uniform.
- **Post-processing (bloom/DOF/SMAA):** WebGPU làm selective bloom qua MRT.

## Bẫy thực chiến (Risk-First — spike trước)

- **R3F + WebGPU + post-processing còn ma sát:** phải dùng class `THREE.PostProcessing`
  native, KHÔNG phải Drei `EffectComposer` (chưa tương thích đầy đủ WebGPU).
- **R3F v9** cần React 19; phải `await renderer.init()` trong `gl` factory (không thì trắng
  màn hình); import từ `three/webgpu` + `three/tsl`, gọi `extend(THREE)`.
- **Theatre.js đang đình trệ public** (docs đóng băng 02/2024, dev sang private repo) →
  đừng phụ thuộc cho production, dùng GSAP timeline.
- Renderer WebGPU vẫn có regression theo từng release r → check release notes + đo perf.

## Hiệu năng giữ 60fps

- **On-demand rendering** (`invalidate()`), **LOD** (Drei `<Detailed>`), **Instances**,
  **progressive/nested loading** (texture thấp trước — tránh canvas trắng khi scroll).
- Canvas config: `powerPreference:"high-performance"`, `alpha:false`, `antialias:false`,
  `stencil:false`, `depth:false`; bật/tắt động post-processing khi tụt fps.
- **Profiling:** `r3f-perf` (overlay), `spector.js` (snapshot draw call).
- **Mobile fallback (kỹ thuật Lusion):** nén vertex animation 32→16bit; pre-render
  normal/AO/thickness vào ảnh + matcap để render translucent rẻ.

## Tooling motion

- **GSAP** — 100% free từ 05/2025 (gồm ScrollTrigger/SplitText/ScrollSmoother). React dùng
  `@gsap/react` + `useGSAP` (tự cleanup).
- **Lenis** — smooth scroll <4kb, chạy trên native scroll (giữ sticky/anchor/a11y). Studio
  Freight nay là darkroom.engineering; package `lenis` (cũ `@studio-freight/lenis`).

## Site tham khảo (reverse-engineer)

1. **Bruno Simon Portfolio 2025** — code MIT trên GitHub kèm file Blender. Học nhiều nhất.
2. **Lando Norris / OFF+BRAND** — Site of the Year 2025, cinematic scroll + helmet 3D.
3. **Messenger** — Developer Site of the Year, WebGL planet load nhanh.
4. **Active Theory V6** — fluid WebGL transitions.
5. **Lusion** — custom asset pipeline (Codrops case study 04/2026).
6. **Cartier Watches & Wonders 2025** (Immersive Garden) — narrative scroll luxury.

## Lộ trình học (đã biết JS)

1. **Three.js Journey** (Bruno Simon) — nền tảng bắt buộc, có chapter shaders + WebGPU/TSL.
2. **The Book of Shaders** — GLSL fundamentals.
3. **Codrops tutorials** — kỹ thuật web-focused, loạt WebGPU+TSL 2026.
4. **Maxime Heckel blog** — TSL/WebGPU field guide.
5. Áp **Lenis + GSAP ScrollTrigger** + profiling → reverse-engineer source Bruno Simon.

## Nguồn

- Three.js Journey: https://threejs-journey.com/
- TSL field guide: https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/
- R3F docs: https://r3f.docs.pmnd.rs/
- Lenis: https://github.com/darkroomengineering/lenis
- Codrops: https://tympanus.net/codrops/

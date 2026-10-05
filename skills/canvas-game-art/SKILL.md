---
name: canvas-game-art
description: >-
  Kỹ thuật dựng đồ họa game HTML5 Canvas 2D mượt mà 60 FPS bằng code thuần (Procedural Pixel Art).
  Tự động kích hoạt khi người dùng muốn: vẽ đồ họa game bằng canvas/code, tạo nhân vật chibi hoạt hình,
  làm animation nhún nhảy 4-frame đi bộ (walking bobbing), tạo viền truyện tranh tự động (cartoon outline post-processing),
  tối ưu bộ đệm LRU OffscreenCanvas cache, làm game phong cách Tiệm Nét Cỏ / tiệm tạp hóa / retro pixel art mà không cần load ảnh nặng.
---

# Canvas Game Art — Kỹ Thuật Đồ Họa & Hoạt Ảnh Game Canvas 2D

Được đúc kết từ kiến trúc game web Canvas 2D (như tựa game **Tiệm Nét Cỏ** và **Tiệm Tạp Hóa Xuyên Không**): Không phụ thuộc vào texture hay sprite sheet PNG nặng nề, toàn bộ nhân vật, vật phẩm và hoạt cảnh đều được sinh động hóa bằng mã nguồn thuần (Procedural Canvas Art).

---

## 1. Các Trụ Cột Kỹ Thuật Cốt Lõi

1. **Pixel Primitives (`px` function):** Dùng `ctx.fillRect()` vẽ từng khối pixel làm tròn số nguyên (`Math.floor`) để giữ độ nét pixel-perfect và chống nhòe sub-pixel.
2. **Chibi Character Generator:** Dựng nhân vật theo cơ chế xếp tầng (Floor Shadow -> Legs -> Torso -> Head -> Face -> Hair -> Accessories).
3. **Cartoon Outline Post-Processing:** Quét alpha của canvas phụ (`OffscreenCanvas`) để tự động phủ một lớp viền mực truyện tranh 1px (`#2a1c1c`) bao quanh nhân vật/đồ vật.
4. **4-Frame Walking & Idle Bobbing:** 
   * Bước đi 4 frame (Neutral -> Left -> Neutral -> Right) kết hợp độ nhún trục Y (`bobY = -2px`) và góc nghiêng thân (`tiltAngle = +-0.05 rad`).
   * Đứng yên thở (Idle breathing) nhấp nhô tuần hoàn theo sóng sin `Math.sin(time * 3) * 1.5px`.
5. **Mirror Flip Tức Thì:** Lật hướng trái/phải bằng `ctx.scale(-1, 1)`, tiết kiệm 50% tài nguyên vẽ.
6. **LRU Offscreen Sprite Caching:** Nướng (Bake) hình ảnh nhân vật ra Canvas bộ nhớ một lần duy nhất theo `cacheKey`, các frame sau chỉ việc sao chép bằng `ctx.drawImage` để duy trì tốc độ 60 FPS mượt mà.

---

## 2. Tài Liệu Tham Chiếu Chi Tiết

Xem hướng dẫn toán học, thuật toán và mã nguồn mẫu đầy đủ tại:
* [`../game-studio/references/canvas-procedural-art.md`](../game-studio/references/canvas-procedural-art.md)

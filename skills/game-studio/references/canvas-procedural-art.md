# Procedural Canvas Game Art & Animation Guide
## Kỹ Thuật Dựng Đồ Họa & Chuyển Động Pixel Art Bằng HTML5 Canvas 2D

> Đúc kết từ kiến trúc game web Canvas 2D (như tựa game "Tiệm Nét Cỏ" và các game Chibi Retro mượt mà 60 FPS). Không cần load hàng megabyte sprite sheet PNG, toàn bộ nhân vật, vật phẩm và hoạt ảnh được sinh động hóa bằng mã nguồn thuần (Code-generated Procedural Art).

---

## 1. Triết Lý Cốt Lõi (Procedural vs Static Sprites)

| Tiêu chí | Dùng Sprite Sheet PNG truyền thống | Procedural Canvas 2D (Vẽ bằng Code) |
|---|---|---|
| **Dung lượng mạng** | Tốn hàng chục MB ảnh PNG, lâu tải | **0 KB ảnh** — mã nguồn vài chục KB chạy tức thì |
| **Tùy biến nhân vật** | Cố định, khó đổi màu da/áo/tóc | **Vô hạn** (hàng ngàn biến thể màu, trang phục, phụ kiện) |
| **Độ sắc nét** | Dễ vỡ nét hoặc mờ khi zoom | **Pixel-perfect** ở mọi độ phân giải màn hình |
| **Hiệu năng** | Quản lý bộ nhớ texture lớn | Dùng **LRU Offscreen Canvas Cache** đạt chuẩn 60 FPS |

---

## 2. Hệ Thống Khối Vẽ Nguyên Tử (Pixel Primitives)

Mọi đối tượng pixel đều được dựng trên hàm nguyên tử `px`:

```javascript
// Hàm vẽ khối pixel chuẩn (Snap tọa độ về số nguyên để không bị nhòe)
function px(ctx, x, y, w = 1, h = 1, color = '#2a1c1c') {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

// Bảng màu chuẩn phong cách Chibi Retro hoài niệm
export const PALETTE = {
  ink: '#2a1c1c',        // Viền nét truyện tranh tối
  skinLight: '#ffd6b0',  // Da sáng
  skinShadow: '#e2ab7f', // Da bóng đổ
  hairBlack: '#2b2323',  // Tóc đen
  hairBrown: '#6b4423',  // Tóc nâu hạt dẻ
  hoodieRed: '#e53935',  // Áo hoodie đỏ
  jeanBlue: '#1e88e5',   // Quần jean xanh
  gold: '#ffcf33',       // Vàng tiền tệ / ánh sáng
  shadowFloor: 'rgba(0, 0, 0, 0.25)', // Bóng đổ sàn nhà
};
```

---

## 3. Chibi Character Generator (Dựng Nhân Vật Đa Tầng)

Nhân vật được chia làm các tầng xếp chồng từ sau ra trước (Layered Stacking):
1. **Bóng đổ sàn (Floor Shadow):** Hình elip mờ dưới chân.
2. **Chân & Quần (Legs & Pants):** Thay đổi vị trí theo frame bước đi.
3. **Thân & Áo (Torso & Apparel):** Khối áo chính kèm đường kẻ viền nếp nhăn.
4. **Đầu & Khuôn mặt (Head & Face):** Mắt chớp, má hồng, biểu cảm.
5. **Mái tóc & Phụ kiện (Hair, Glasses, Hats):** Nón, kính râm, tai nghe chụp tai.

### Mẫu Code Bộ Sinh Nhân Vật Chibi:

```javascript
export function drawChibiCharacter(ctx, x, y, options = {}) {
  const {
    walkFrame = 0,      // 0: đứng, 1: chân trái, 2: đứng, 3: chân phải
    dir = 1,            // 1: nhìn phải, -1: nhìn trái
    hairColor = PALETTE.hairBrown,
    shirtColor = PALETTE.hoodieRed,
    pantsColor = PALETTE.jeanBlue,
    isSitting = false,
    hasHeadphone = false
  } = options;

  ctx.save();
  ctx.translate(Math.floor(x), Math.floor(y));
  if (dir === -1) {
    ctx.scale(-1, 1); // Lật ngang không cần vẽ lại sprite
  }

  // 1. Bóng đổ sàn
  ctx.fillStyle = PALETTE.shadowFloor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Độ nhún khi bước đi (Bobbing Y)
  const bobY = isSitting ? 2 : (walkFrame === 1 || walkFrame === 3 ? -2 : 0);

  // 3. Chân & Giày
  if (!isSitting) {
    const legOffset = walkFrame === 1 ? -2 : (walkFrame === 3 ? 2 : 0);
    // Chân trái
    px(ctx, -5 + legOffset, -6, 3, 6, pantsColor);
    px(ctx, -6 + legOffset, -1, 4, 2, '#ffffff'); // Dép / giày trắng
    // Chân phải
    px(ctx, 2 - legOffset, -6, 3, 6, pantsColor);
    px(ctx, 1 - legOffset, -1, 4, 2, '#ffffff');
  } else {
    // Ngồi gác chân
    px(ctx, -4, -4, 8, 4, pantsColor);
  }

  // 4. Thân & Áo
  px(ctx, -6, -14 + bobY, 12, 9, shirtColor);
  px(ctx, -5, -14 + bobY, 10, 2, '#ffffff33'); // Nếp highlight áo

  // 5. Đầu & Da mặt (Chibi đầu to tỉ lệ 1:1 với thân)
  px(ctx, -7, -26 + bobY, 14, 12, PALETTE.skinLight);
  px(ctx, -7, -16 + bobY, 14, 2, PALETTE.skinShadow); // Bóng cằm

  // Mắt Chibi 2 chấm đen + má hồng
  px(ctx, 1, -22 + bobY, 2, 3, PALETTE.ink);   // Mắt trước
  px(ctx, -4, -22 + bobY, 2, 3, PALETTE.ink);  // Mắt sau
  px(ctx, 2, -19 + bobY, 2, 1, '#ff8a80');    // Má hồng trước
  px(ctx, -5, -19 + bobY, 2, 1, '#ff8a80');   // Má hồng sau

  // 6. Tóc
  px(ctx, -8, -28 + bobY, 16, 5, hairColor); // Đỉnh đầu
  px(ctx, -8, -24 + bobY, 3, 8, hairColor);  // Tóc sau gáy
  px(ctx, -2, -24 + bobY, 3, 4, hairColor);  // Mái tóc

  // 7. Phụ kiện (Tai nghe Gaming RGB / Kính)
  if (hasHeadphone) {
    px(ctx, -8, -25 + bobY, 2, 6, '#271f30');
    px(ctx, -8, -28 + bobY, 16, 2, '#271f30');
    px(ctx, -9, -23 + bobY, 2, 3, '#00e5ff'); // Đèn LED tai nghe
  }

  ctx.restore();
}
```

---

## 4. Kỹ Thuật Viền Truyện Tranh Tự Động (Cartoon Outline Post-Processing)

Để các nhân vật và đồ vật nổi bật trên nền nhà phức tạp, áp dụng thuật toán **Outline Dilation**:
* Sau khi render nhân vật lên Canvas tạm (`OffscreenCanvas`), quét dữ liệu alpha 4 hướng (trên, dưới, trái, phải).
* Bất kỳ pixel trong suốt nào nằm cạnh pixel có nội dung sẽ được tô màu viền mực đen (`#2a1c1c`).

```javascript
export function applyCartoonOutline(offscreenCtx, width, height, outlineColor = '#2a1c1c') {
  const imgData = offscreenCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const edgeCanvas = document.createElement('canvas');
  edgeCanvas.width = width;
  edgeCanvas.height = height;
  const edgeCtx = edgeCanvas.getContext('2d');
  const edgeImgData = edgeCtx.createImageData(width, height);
  const edgeData = edgeImgData.data;

  const [r, g, b] = hexToRgb(outlineColor);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] === 0) { // Pixel hiện tại trong suốt
        // Kiểm tra 4 láng giềng
        const up = ((y - 1) * width + x) * 4 + 3;
        const down = ((y + 1) * width + x) * 4 + 3;
        const left = (y * width + (x - 1)) * 4 + 3;
        const right = (y * width + (x + 1)) * 4 + 3;

        if (data[up] > 0 || data[down] > 0 || data[left] > 0 || data[right] > 0) {
          edgeData[idx] = r;
          edgeData[idx + 1] = g;
          edgeData[idx + 2] = b;
          edgeData[idx + 3] = 255; // Tô viền
        }
      }
    }
  }

  edgeCtx.putImageData(edgeImgData, 0, 0);
  // Vẽ đè viền ra sau ảnh gốc
  edgeCtx.drawImage(offscreenCtx.canvas, 0, 0);
  return edgeCanvas;
}
```

---

## 5. Chu Kỳ Hoạt Ảnh 4 Frame Nhún Nhảy (Walking & Idle Bobbing)

Nhân vật không lướt đi trơn tuột mà có nhịp chân và nhún nhảy theo hàm sin:

```javascript
export class CharacterAnimator {
  constructor(speed = 8) {
    this.speed = speed;
    this.timer = 0;
  }

  update(dt, isMoving) {
    if (!isMoving) {
      // Idle breathing: chu kỳ nhấp nhô chậm rãi
      this.timer += dt * 3;
      return {
        walkFrame: 0,
        bobY: Math.sin(this.timer) * 1.5,
        tiltAngle: Math.cos(this.timer) * 0.02
      };
    }

    // Walking: 4 frames (0: Neutral, 1: Left step, 2: Neutral, 3: Right step)
    this.timer += dt * this.speed;
    const step = Math.floor(this.timer) % 4;
    return {
      walkFrame: step,
      bobY: (step === 1 || step === 3) ? -2 : 0,
      tiltAngle: (step === 1 ? -0.05 : (step === 3 ? 0.05 : 0))
    };
  }
}
```

---

## 6. Hiệu Ứng Game Feel / "The Juice" Bằng Canvas

1. **Floating Money & Emotes (+22.000đ, 💖, 💢):**
   * Tọa độ Y dịch chuyển lên trên với gia tốc giảm dần: `y -= vy * dt`.
   * Độ trong suốt `alpha` giảm từ 1 về 0 trong 1.2s.
   * Chữ được stroke viền mực đen 2px trước khi fill màu vàng/xanh để dễ đọc trên mọi nền.

2. **Khói Bếp & Hơi Nước Mì Tôm:**
   * Sinh các hình tròn bán kính 2-4px tại miệng tô mì.
   * Tọa độ X dao động hình sin: `x += Math.sin(time * 5 + particle.id) * 0.5`.
   * Tọa độ Y bay lên: `y -= 20 * dt`.

3. **Cổng Xuyên Không (Interdimensional Rift):**
   * Quầng sáng hình elip xoay tròn dùng `ctx.rotate(time * 2)`.
   * Gradient tỏa tròn động: `ctx.createRadialGradient(0, 0, 4, 0, 0, 24)`.
   * Màu chuyển đổi tuần hoàn tím hư không (`#7b1fa2`) sang lam ngọc (`#00e5ff`).

---

## 7. Bộ Đệm Tăng Tốc LRU Sprite Cache (Bảo Đảm 60 FPS)

Nếu mỗi frame vẽ lại hàng chục nhân vật và đồ nội thất bằng `ctx.fillRect`, CPU sẽ quá tải.
**Giải pháp:** Nướng (Bake) hình ảnh nhân vật ra Canvas bộ nhớ một lần duy nhất, các frame sau chỉ việc copy ảnh (`ctx.drawImage`):

```javascript
export class SpriteCache {
  constructor(maxSize = 256) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getOrCreate(key, width, height, renderFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    
    // Tắt khử răng cưa để pixel sắc nét
    ctx.imageSmoothingEnabled = false;

    renderFn(ctx);

    // Quản lý bộ nhớ LRU
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, offscreen);
    return offscreen;
  }
}
```

---

## 8. Checklist Kiểm Tra Khi Triển Khai

- [ ] Canvas bật thuộc tính CSS `image-rendering: pixelated; image-rendering: crisp-edges;`.
- [ ] Mọi tọa độ vẽ đều được làm tròn số nguyên `Math.floor()` để tránh hiện tượng sub-pixel mờ nét.
- [ ] Luôn có bóng đổ sàn nhà bán trong suốt dưới chân nhân vật/đồ nội thất để tạo độ bám sàn 2.5D.
- [ ] Tách biệt Fixed Update 60 logic ticks/giây và Render RequestAnimationFrame.
- [ ] Dùng `ctx.scale(-1, 1)` cho hướng quay mặt sang trái, tiết kiệm 50% tài nguyên vẽ.

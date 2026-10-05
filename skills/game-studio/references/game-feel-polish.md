# Game Feel & Polish — Nghệ Thuật Tạo "The Juice"

> Sự khác biệt giữa một game "chơi được" và một game "chơi cực đã" nằm ở độ nảy, độ đầm và độ thỏa mãn của các phản hồi giác quan (The Juice).

---

## 1. Bộ Công Cụ "Juice" Thiết Yếu

### A. Hitstop / Freeze Frame (Dừng Khung Hình Khi Va Chạm)
* **Khái niệm:** Khi đòn đánh trúng mục tiêu, tạm ngưng animation của cả người tấn công và nạn nhân trong $0.04 - 0.08$ giây (khoảng 2 đến 5 frames ở 60fps).
* **Hiệu ứng:** Tạo cảm giác nhát kiếm chém vào vật thể có sức nặng và độ đặc, giống như phim hành động quay chậm.
* **Cách code (Godot / Unity / Web):**
  ```javascript
  // Freeze frame tạm thời không làm ảnh hưởng tới nhạc nền
  function triggerHitstop(durationSeconds = 0.05) {
    engine.timeScale = 0.05; // Làm chậm hoặc pause game loop
    setTimeout(() => {
      engine.timeScale = 1.0;
    }, durationSeconds * 1000);
  }
  ```

### B. Screen Shake (Rung Màn Hình Có Trọng Lượng)
* **Quy tắc:**
  * Dùng **Perlin Noise** hoặc dao động điều hòa suy giảm (Decaying Sine Wave), **không** dùng số ngẫu nhiên giật cục (`Math.random() * 10`).
  * Shake phải có chiều lực: Bị đánh từ trái sang thì màn hình rung lệch sang phải rồi hồi phục dần.
  * Luôn cung cấp cài đặt **Tắt Screen Shake** trong Option (Accessibility).

### C. Squash & Stretch (Biến Dạng Tự Nhiên)
* Khi nhân vật nhảy lên: Kéo dài trục Y ($1.2\times$), bóp hẹp trục X ($0.8\times$).
* Khi nhân vật tiếp đất: Bẹp trục Y ($0.7\times$), bè rộng trục X ($1.3\times$), sau đó đàn hồi về $(1.0, 1.0)$ trong $0.15$s.

---

## 2. Tha Thứ Lệnh Điều Khiển (Input Forgiveness)

Người chơi con người không phải máy móc, nếu yêu cầu bấm phím chính xác tới từng miligiây họ sẽ cảm thấy điều khiển bị "khựng / liệt phím":

```text
    Platform ─────────┐
                      │  <-- Player đi ra ngoài mép
                      ▼
               [Coyote Time: 100ms] -> Vẫn cho phép nhảy dù chân không còn chạm đất!
```

### 1. Coyote Time (Bước hụt vẫn nhảy được)
* Cho phép người chơi bấm nút Nhảy trong vòng **$100 - 150\text{ms}$** sau khi đã bước hụt ra khỏi bờ vực.
* Giúp người chơi cảm thấy nhân vật rất nhạy bén, không bị chết oan do mép va chạm.

### 2. Input Buffering (Bấm sớm vẫn nhận)
* Nếu người chơi bấm nút Đánh hoặc Nhảy trong khi nhân vật còn đang bay trên không (trước khi tiếp đất $100\text{ms}$), lưu lệnh này vào Buffer.
* Ngay frame đầu tiên khi chạm đất, lệnh nhảy/đánh sẽ tự động kích hoạt lập tức.

### 3. Corner Slipping (Trượt góc trần)
* Khi nhân vật nhảy lên và va đầu vào mép trần nhà 1-2 pixel, thay vì bị khựng lại rơi xuống, engine tự động đẩy nhẹ nhân vật sang ngang để trượt qua góc mép.

---

## 3. Âm Thanh Phản Hồi (Audio Feedback)

* **Pitch Variation (Thay đổi cao độ ngẫu nhiên):**
  * Với các âm thanh lặp lại liên tục (bước chân, bắn súng, chém kiếm), luôn biến thiên nhẹ Pitch từ $\pm 5\%$ đến $\pm 10\%$. Điều này xóa bỏ hoàn toàn cảm giác âm thanh máy móc lặp lại gây mệt tai.
* **Audio Ducking:**
  * Khi có vụ nổ lớn hoặc nhân vật rơi vào trạng thái nguy kịch, tự động giảm âm lượng nhạc nền (BGM) xuống 30-50% trong 1 giây để tiếng nổ/tim đập nổi bật lên.
* **Spatial Audio (Âm thanh 2D/3D định hướng):**
  * Tiếng quái bên trái phải phát ra từ loa trái; tiếng quái chạy xa dần phải nhỏ dần theo hàm nghịch đảo khoảng cách.

---

## 4. Ngân Sách Khung Hình (Performance Budget)

* Để đạt chuẩn **60 FPS**, toàn bộ logic + render phải hoàn thành trong **16.6 ms**:
  * Physics & Gameplay Logic: $\le 4\text{ms}$
  * AI & Pathfinding: $\le 2\text{ms}$
  * UI & Audio: $\le 1\text{ms}$
  * Rendering & Shaders: $\le 8\text{ms}$
  * Buffer dự phòng: $1.6\text{ms}$

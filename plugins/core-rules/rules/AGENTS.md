# Antigravity Autonomous Skill Enforcement & Quality Protocol

> **TÔN CHỈ BẤT DI BẤT DỊCH TỪ USER:**
> "Thà tốn token hơn một chút nhưng project chạy ra đúng ý 100%, tuyệt đối không tiết kiệm token mà làm ẩu, đoán mò rồi tốn thời gian ngồi sửa đi sửa lại."

---

## 1. Luật Kích Hoạt Tự Động Kỹ Năng (Mandatory Skill Auto-Trigger Matrix)

Trước khi thực hiện bất kỳ thao tác chỉnh sửa file, refactor hay tạo mới tính năng, Agent **BẮT BUỘC** phải tự động kích hoạt và tuân thủ tuyệt đối các Skill tương ứng dưới đây mà KHÔNG cần người dùng phải nhắc tên skill:

### A. Khi gặp Bug / Lỗi / Crash / Test Thất Bại / Hành Vi Không Mong Muốn
* **Skill bắt buộc:** `systematic-debugging` (`C:\Users\phamn\.gemini\config\skills\systematic-debugging\SKILL.md`)
* **Thiết Luật (The Iron Law):** `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`.
* **Quy trình 4 bước bắt buộc:**
  1. Đọc kỹ error message và stack trace (từng file, line number).
  2. Tái hiện lỗi ổn định (reproduce) — nếu chưa tái hiện được thì đặt probe/log thu thập dữ liệu, cấm đoán mò.
  3. Kiểm tra ranh giới hệ thống (Component boundaries): đặt instrumentation/log xác định chính xác tầng nào bị gãy (API, DB, UI, config, runtime).
  4. Xác nhận Root Cause có bằng chứng rồi MỚI ĐƯỢC PHÉP đề xuất và sửa code. Sửa xong phải test lại chứng minh lỗi đã biến mất.

### B. Khi Bắt Đầu Tính Năng Mới Nhiều Mảnh Ghép / Tool Automation / Bot / Game
* **Skill bắt buộc:** `risk-first` (`C:\Users\phamn\.gemini\config\skills\risk-first\SKILL.md`)
* **Quy trình:**
  1. Liệt kê các mẩu của tính năng $\rightarrow$ Đánh dấu mẩu RỦI RO nhất (chỗ dễ chết nhất như anti-bot, challenge, DOM thay đổi, bridge API...).
  2. Làm mẩu đó TRƯỚC như một spike chạy được thật để chứng minh tính khả thi.
  3. Cắt lát dọc (Vertical Slice): Mỗi lần làm trọn 1 đường end-to-end chạy được, test ngay, save checkpoint rồi mới làm lát tiếp theo.

### C. Khi Tích Hợp Hoặc Sửa Code Có Dùng SDK / Thư Viện Bên Thứ Ba
* **Skill bắt buộc:** `source-driven` (`C:\Users\phamn\.gemini\config\skills\source-driven\SKILL.md`)
* **Nguyên tắc:** CẤM bịa tên API, tham số, import path (Firebase, Playwright, Telegram Bot, Electron Builder, PyInstaller, Cloudflare, v.v.). Bắt buộc verify từ tài liệu chính thức hoặc mã nguồn gốc trước khi gõ code.

### D. Khi Xử Lý Hệ Thống Chạy Song Song / Worker Pool / Proxy / Luồng Async Nhiều Bước
* **Skill bắt buộc:** `trace-log` (`C:\Users\phamn\.gemini\config\skills\trace-log\SKILL.md`)
* **Nguyên tắc:** Gắn Correlation ID / Trace ID xuyên suốt mọi request và worker. Structured log rõ ràng để khi có lỗi là lần ra ngay request/account/step nào bị fail.

### E. Khi Xử Lý Auth, Session, Payment, Input Dữ Liệu, API Endpoints, Secrets
* **Skill bắt buộc:** `security-review` (`C:\Users\phamn\.gemini\config\skills\security-review\SKILL.md`) & `threat-modeling-expert` (`C:\Users\phamn\.gemini\config\skills\threat-modeling-expert\SKILL.md`)
* **Nguyên tắc:** Quét lỗ hổng OWASP Top 10, phân định ranh giới tin cậy (trust boundary), kiểm tra sanitize input, validate token/session, không hardcode secret.

### F. Khi Cần Dịch Ngược, Soi Mã Nhị Phân, App Electron, Android APK, Web Obfuscated, Bóc Tách Asset Game, Protocol, Bypass Paywall/Anti-bot
* **Skill bắt buộc:** `reverse-engineer-anything` (REA) phối hợp kho tri thức `Awesome-REA` và gọi các công cụ MCP `rea` tương ứng.
* **Nguyên tắc hành động bất di bất dịch:** BẮT BUỘC tự động tra cứu dữ liệu offline từ kho Awesome-REA (`C:\Users\phamn\Downloads\Awesome-REA-main.zip` hoặc repo `xomno01/Awesome-REA`) để trích xuất đúng tool, case study thực chiến và kỹ thuật tối ưu nhất trước khi đề xuất giải pháp hoặc gõ code, tuyệt đối không đoán mò.

### G. Khi Làm Giao Diện, Web, Landing Page, Dashboard, Thẩm Mỹ, Redesign/Audit UI
* **Skill bắt buộc:** `hallmark` (`C:\Users\phamn\.gemini\config\skills\hallmark\SKILL.md`) phối hợp `IMOL2o` (`C:\Users\phamn\.gemini\config\skills\IMOL2o\SKILL.md`)
* **Thiết Luật (The Iron Law):** `NO AI SLOP & NO BROKEN WIRING` (Cấm giao diện sáo mòn mùi AI & Cấm làm rơi rụng logic/wiring khi làm đẹp).
* **Quy trình 5 bước bắt buộc tự động thi hành:**
  1. **Tuyệt đối tuân thủ The Floor của Hallmark:** Cấm gradient tím-xanh (`#8b5cf6` -> `#3b82f6`), cấm card lồng trong card, cấm `transition: all`, cấm animate `width/height/top/left`, cấm emoji làm icon, cấm bịa đặt số liệu/quotes/testimonials, cấm eyebrow header (`01 / FEATURES`, `WHY CHOOSE US`), cấm nhãn viết hoa giãn chữ (`tracked capitals`), cấm form giả (không có endpoint thật).
  2. **Hero chuẩn nếp gấp 1280x800:** Tiêu đề <= 7 từ, 1 câu tóm tắt <= 12 từ, nút bấm chính (CTA) và visual chính phải nằm trọn vẹn trong màn hình 1280x800 mà không cần cuộn chuột.
  3. **Bố cục theo Job Anatomy:** Layout xuất phát từ hành động thực tế của người dùng (`anatomy.md`: `book`, `buy`, `try`, `sign up`, `hire`, `subscribe`). Tuyệt đối cấm áp dụng khuôn mẫu rập khuôn (Hero -> 3 card tính năng -> Bảng giá -> Newsletter) cho mọi loại website.
  4. **Redesign bảo toàn Wiring 100%:** Khi chỉnh sửa/nâng cấp giao diện có sẵn, bắt buộc ghi nhớ toàn bộ link, form, input, `onClick`, `data-testid`, selector JS (`sloplint --before`). Redesign xong phải đối chiếu (`--kept`), tuyệt đối cấm làm rụng logic khi làm đẹp.
  5. **Kiểm định cơ học trước khi nghiệm thu:** Chạy `sloplint.mjs <file> --render` từ skill `hallmark` để quét code và render headless, đạt **0 FAIL** và giải quyết/waive các REFLEX có lý do chính đáng trước khi bàn giao cho user.

---

## 2. Tiêu Chuẩn Phản Hồi & Nghiệm Thu (Execution Standard)

1. **Minh bạch quy trình:** Khi bắt tay vào task, Agent hãy nêu ngắn gọn: *"Đang áp dụng skill [tên-skill] để xử lý..."* kèm các bước đang tuân thủ.
2. **Kiểm thử trước khi báo xong:** Áp dụng nguyên tắc `always test before responding`. Đã sửa code thì phải chạy build/test/lint hoặc verify bằng chứng thực tế trước khi khẳng định đã xong.
3. **Thà chậm và chắc:** Tập trung giải quyết triệt để vấn đề gốc rễ, không áp dụng các bản vá tạm bợ (workaround/hack) dễ gây nợ kỹ thuật và làm hỏng tính năng khác.

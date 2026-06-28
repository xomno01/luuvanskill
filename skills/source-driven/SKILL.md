---
name: source-driven
description: >-
  Chống AI bịa API/SDK bên thứ ba — verify từ tài liệu chính thức trước khi code.
  Gọi (hoặc tự kích hoạt) khi tích hợp/sửa code dùng SDK ngoài: Firebase (v8 vs v9
  modular), Playwright/Selenium, Telegram Bot API, mail.tm, ProSMM/SMM, Electron
  Builder, PyInstaller, OpenAI/Anthropic SDK, cloudflared. Mục tiêu: hết cảnh
  "fix rồi lại hỏng" do nhớ nhầm tên method/tham số.
---

# Source-Driven Development — Verify thay vì bịa

**Vấn đề cốt lõi:** Nguyên nhân số 1 của "fix rồi lại hỏng" trong các project của anh là AI tự tin viết ra tên method / tham số / signature **không tồn tại ở version đang dùng**. Firebase đổi hẳn API giữa v8 (namespaced) và v9 (modular). Playwright đổi selector/locator API qua các bản. Telegram, mail.tm, SMM mỗi cái một schema. Trí nhớ của model là ảnh chụp cũ + đôi khi bịa.

## Quy trình bắt buộc khi đụng SDK/API ngoài

1. **Chốt VERSION trước.** Đọc `package.json` / `requirements.txt` / `package-lock.json` để biết đúng version đang cài. Firebase `^9.x` ≠ `^8.x` — khác cả cách import.
2. **Tra doc của ĐÚNG version đó** (WebFetch trang chính thức / changelog / migration guide). Không dựa vào trí nhớ cho: tên method, thứ tự tham số, kiểu trả về, tên field trong response.
3. **Trích signature thật** vào câu trả lời/hội thoại trước khi viết code dựa trên nó. Citation để TRONG hội thoại, KHÔNG nhồi URL vào comment code (làm bẩn code).
4. **Không chắc → nói "cần verify".** Thà báo "chỗ này tôi chưa chắc API, để tra doc" còn hơn viết code chạy thử rồi hỏng. Đây là điểm khớp với memory `always test before responding`.
5. **Sau khi code, đối chiếu lại** input/output thực tế với doc — nhất là tên field trong JSON response (bot/scrape hay sai chỗ này).

## Cờ đỏ — DỪNG và verify ngay

- Viết `firebase.auth()` / `db.collection().get()` kiểu cũ trong khi project là v9 modular (`getAuth()`, `getDocs(collection(...))`).
- Gọi method Playwright mà không chắc còn tồn tại (`page.waitForTimeout` vs locator auto-wait, `$$eval`, `page.fill` vs `locator.fill`).
- Đoán field response của Telegram / mail.tm / SMM (`result[0].text`? `message.message_id`? — tra, đừng đoán).
- Config Electron Builder / PyInstaller theo "thường thì là..." — các key này rất hay đổi và sai 1 ký tự là build fail.
- Endpoint/param OpenAI vs Anthropic (AM Proxy): `/v1/chat/completions` vs `/v1/messages`, `max_tokens` bắt buộc ở Anthropic, header `anthropic-version`.

## Không áp dụng cho

Logic thuần của anh (parse, tính toán, control flow nội bộ) — chỗ đó cứ code thẳng. Skill này chỉ cho **ranh giới với thư viện/API bên ngoài**.

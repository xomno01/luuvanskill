---
name: risk-first
description: >-
  Build feature/tool mới theo lối Risk-First + vertical slice cho dev solo. Gọi
  khi bắt đầu một tính năng nhiều mảnh ghép mà có mẩu chưa chắc khả thi: bridge
  AM Proxy, relogin Hotmail bị security-challenge, anti-bot, worker pool song song,
  gameplay tu tiên mới, data model Firebase. Mục tiêu: phát hiện sớm chỗ chết,
  không dồn cả ngày build xong mới biết lõi không chạy.
---

# Risk-First Incremental — Làm mẩu khó nhất trước

**Tư duy nền:** Tool automation/proxy/game của anh thường chết ở **một mẩu lõi không lường trước** (site đổi DOM, Microsoft challenge, passthrough trả body giả, race condition worker). Nếu để mẩu đó tới cuối mới làm, anh đã đổ công build phần dễ xung quanh rồi mới phát hiện cả hướng đi sai. Risk-First lật ngược: **đâm thẳng vào chỗ rủi ro nhất trước**.

## Quy trình

1. **Liệt kê các mẩu** của tính năng (login, lấy OTP, lưu state, forward request...).
2. **Đánh dấu mẩu RỦI RO nhất** — cái mà nếu nó không chạy được thì cả hướng đi vô nghĩa, hoặc cái anh ít chắc nhất về tính khả thi.
3. **Làm mẩu đó TRƯỚC như một spike chạy được thật** (không phải code đẹp, chỉ cần chứng minh khả thi). Ví dụ: trước khi build cả AM Proxy bridge `/v1/messages`, dựng 1 request thật xuyên qua xem có bị trả 200/0-token không.
4. **Cắt lát dọc (vertical slice):** mỗi lần làm trọn 1 đường end-to-end chạy được, KHÔNG làm hết tầng này rồi mới tầng kia. Lát "login Hotmail chạy được" trước, rồi mới lát "lấy OTP".
5. **Test ngay từng lát** (đúng memory `always test before responding`). Lát chưa chạy thì chưa qua lát sau.
6. **Save Point sau mỗi lát chạy được:** commit nhỏ làm điểm cứu hộ. AI làm hỏng lát sau → `git reset --hard` về đây, mất tối đa 1 lát.
7. **Scope discipline:** mỗi lát chỉ đụng đúng file cần. Không refactor lan man giữa chừng.

## Khi nào KHÔNG dùng

- Fix bug nhỏ, task cơ học rõ ràng → làm thẳng, đừng nghi thức hóa.
- Tính năng đã làm quen tay nhiều lần (không còn mẩu rủi ro) → bỏ qua bước spike.

## Liên quan

- `/source-driven` — verify API trước khi dựng spike để spike không chết oan vì nhớ nhầm SDK.
- `/trace-log` — gắn log có cấu trúc ngay từ spike để thấy nó hỏng ở đâu.

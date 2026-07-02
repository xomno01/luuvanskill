---
name: risk-first
description: >-
  Build feature/tool mới theo lối Risk-First + vertical slice. Gọi khi bắt đầu một
  tính năng nhiều mảnh ghép mà có mẩu chưa chắc khả thi: bot mới, bridge API, anti-bot,
  worker pool song song, data model mới. Mục tiêu: phát hiện sớm chỗ chết, không dồn
  cả ngày build xong mới biết lõi không chạy.
---

# Risk-First Incremental — Làm mẩu khó nhất trước

**Tư duy nền:** Tool automation/proxy thường chết ở **một mẩu lõi không lường trước** (site đổi DOM, security challenge, passthrough trả body giả, race condition worker). Nếu để mẩu đó tới cuối mới làm, đã đổ công build phần dễ xung quanh rồi mới phát hiện cả hướng đi sai. Risk-First lật ngược: **đâm thẳng vào chỗ rủi ro nhất trước**.

## Quy trình

1. **Liệt kê các mẩu** của tính năng (login, lấy OTP, lưu state, forward request...).
2. **Đánh dấu mẩu RỦI RO nhất** — cái mà nếu nó không chạy được thì cả hướng đi vô nghĩa, hoặc cái ít chắc nhất về tính khả thi.
3. **Làm mẩu đó TRƯỚC như một spike chạy được thật** (không phải code đẹp, chỉ cần chứng minh khả thi).
4. **Cắt lát dọc (vertical slice):** mỗi lần làm trọn 1 đường end-to-end chạy được, KHÔNG làm hết tầng này rồi mới tầng kia.
5. **Test ngay từng lát.** Lát chưa chạy thì chưa qua lát sau.
6. **Save Point sau mỗi lát chạy được:** commit nhỏ làm điểm cứu hộ. AI làm hỏng lát sau → `git reset --hard` về đây, mất tối đa 1 lát.
7. **Scope discipline:** mỗi lát chỉ đụng đúng file cần. Không refactor lan man giữa chừng.

## Khi nào KHÔNG dùng

- Fix bug nhỏ, task cơ học rõ ràng → làm thẳng, đừng nghi thức hóa.
- Tính năng đã làm quen tay nhiều lần (không còn mẩu rủi ro) → bỏ qua bước spike.

## Liên quan

- `$source-driven` — verify API trước khi dựng spike để spike không chết oan vì nhớ nhầm SDK.
- `$trace-log` — gắn log có cấu trúc ngay từ spike để thấy nó hỏng ở đâu.

---
name: trace-log
description: >-
  Structured logging + correlation ID cho hệ chạy song song/nhiều bước async.
  Gọi khi viết hoặc debug bot worker pool nhiều account chạy song song, luồng
  login+OTP nhiều bước, API proxy forward, hoặc bất cứ chỗ nào log đang lẫn lộn
  không lần ra request/account nào fail. Bản rút gọn thực dụng của observability.
---

# Trace-Log — Log có cấu trúc + Correlation ID

**Vấn đề:** Khi bot chạy worker pool song song nhiều account, log dạng `console.log("login ok")` trộn vào nhau → không lần ra **account nào / request nào** vừa fail. Sửa tốn gần như 0 công.

## 2 thứ phải có (chỉ 2 thôi)

### 1. Structured log (JSON, event name ổn định)
Thay `console.log("login fail " + email)` bằng:
```js
log({ event: "hotmail.login.fail", account_id, reason: err.code, step: "password" })
```
- `event` là tên **ổn định, có namespace** (`proxy.forward.start`, `otp.fetch.timeout`) → grep/filter 1 phát ra hết cùng loại.
- Level nhất quán: `debug | info | warn | error`.
- **KHÔNG log secret:** mask token/cookie/key (`amp-***`, `cookie: <redacted>`).

### 2. Correlation ID — sợi chỉ xuyên suốt
- Sinh 1 id ở **điểm vào** (mỗi request, mỗi account trong worker pool): `request_id` / `account_id`.
- **Đính kèm id đó vào MỌI dòng log** trong cả luồng — qua mọi bước async, mọi hàm con.
- Truy 1 ca lỗi = `grep <id>` ra toàn bộ hành trình của đúng request/account đó, không bị nhiễu bởi các account còn lại.

## Heuristic chọn log đúng chỗ
Trước khi log, hỏi: **"Khi cái này hỏng lúc 2h sáng, mình cần biết GÌ để chẩn đoán?"** — log đúng cái đó (input then chốt, status code provider trả về, bước nào timeout), bỏ log rác.

## Cố tình BỎ (đừng dựng cho tool solo)
Metrics/Prometheus, OpenTelemetry distributed tracing, alerting, runbook, percentile dashboard — đó là đồ cho hệ có on-call + SLA. Dựng cả bộ này là tự hành.

## Áp cho project nào
Bot automation (worker pool) · luồng login+OTP nhiều bước · Electron app (log ra file + correlation theo phiên).

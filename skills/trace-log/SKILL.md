---
name: trace-log
description: >-
  Structured logging + correlation ID cho hệ chạy song song/nhiều bước async.
  Gọi khi viết hoặc debug AM Proxy (forward nhiều provider), bot Playwright worker
  pool nhiều account chạy song song, luồng login+OTP nhiều bước, hoặc bất cứ chỗ
  nào log đang lẫn lộn không lần ra request/account nào fail. Bản rút gọn thực dụng
  của observability — BỎ metrics/Prometheus/OpenTelemetry/alerting.
---

# Trace-Log — Log có cấu trúc + Correlation ID

**Vấn đề:** Khi AM Proxy forward nhiều provider, hoặc bot Hotmail chạy worker pool song song nhiều account, log dạng `console.log("login ok")` trộn vào nhau → không lần ra **account nào / request nào** vừa fail. Đây là điểm đau debug lớn nhất, và sửa nó tốn gần như 0 công.

## 2 thứ phải có (chỉ 2 thôi)

### 1. Structured log (JSON, event name ổn định)
Thay `console.log("login fail " + email)` bằng:
```js
log({ event: "hotmail.login.fail", account_id, reason: err.code, step: "password" })
```
- `event` là tên **ổn định, có namespace** (`proxy.forward.start`, `otp.fetch.timeout`) → grep/filter 1 phát ra hết cùng loại.
- Level nhất quán: `debug | info | warn | error`.
- **KHÔNG log secret:** mask token/cookie/key (`amp-***`, `cookie: <redacted>`). Trùng nguyên tắc Secrets trong CLAUDE.md.

### 2. Correlation ID — sợi chỉ xuyên suốt
- Sinh 1 id ở **điểm vào** (mỗi request proxy, mỗi account trong worker pool): `request_id` / `account_id`.
- **Đính kèm id đó vào MỌI dòng log** trong cả luồng — qua mọi bước async, mọi hàm con.
- Truy 1 ca lỗi = `grep <id>` ra toàn bộ hành trình của đúng request/account đó, không bị nhiễu bởi 49 account còn lại chạy song song.

## Heuristic chọn log đúng chỗ
Trước khi log, hỏi: **"Khi cái này hỏng lúc 2h sáng, mình cần biết GÌ để chẩn đoán?"** — log đúng cái đó (input then chốt, status code provider trả về, bước nào timeout), bỏ log rác.

## Cố tình BỎ (đừng dựng cho tool solo)
Metrics/Prometheus, OpenTelemetry distributed tracing, alerting page/ticket, runbook, percentile, RED dashboard — đó là đồ cho hệ có on-call + SLA. Anh chạy máy cá nhân, không ai bị page. Dựng cả bộ này là tự hành.

## Áp cho project nào
AM Proxy (Node) · bot Hotmail/automation (worker pool) · luồng login+OTP nhiều bước · game tu tiên (lần state người chơi). Electron app thì log ra file + correlation theo phiên thao tác.
